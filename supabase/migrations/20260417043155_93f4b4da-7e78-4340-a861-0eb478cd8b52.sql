-- Roles enum + table
create type public.app_role as enum ('homeowner', 'realtor', 'contractor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Security definer role check (avoids RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Properties
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  address_line text not null,
  city text not null,
  state text not null,
  zip text not null,
  year_built int,
  square_feet int,
  bedrooms int,
  bathrooms numeric(3,1),
  property_type text,
  claimed_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_properties_address on public.properties (lower(address_line), lower(city), lower(state), zip);
alter table public.properties enable row level security;

-- Property records
create table public.property_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category text not null, -- repair | maintenance | warranty | inspection | renovation | other
  title text not null,
  description text,
  performed_by text,
  cost numeric(12,2),
  performed_at date,
  verified boolean not null default false,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  submitted_by uuid references auth.users(id) on delete set null,
  submitter_role public.app_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_records_property on public.property_records(property_id);
alter table public.property_records enable row level security;

-- Attachments
create table public.record_attachments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.property_records(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.record_attachments enable row level security;

-- Share links (realtors)
create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  token text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.share_links enable row level security;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_properties_updated before update on public.properties
  for each row execute function public.set_updated_at();
create trigger trg_records_updated before update on public.property_records
  for each row execute function public.set_updated_at();

-- Auto-create profile + assign role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  selected_role public.app_role;
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');

  selected_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.app_role,
    'homeowner'::public.app_role
  );
  -- Never let signup self-assign admin
  if selected_role = 'admin' then selected_role := 'homeowner'; end if;

  insert into public.user_roles (user_id, role) values (new.id, selected_role);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== RLS POLICIES =====

-- Profiles
create policy "Profiles viewable by self or admin" on public.profiles for select
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "Profiles updatable by self" on public.profiles for update
  using (auth.uid() = id);
create policy "Admins can update any profile" on public.profiles for update
  using (public.has_role(auth.uid(), 'admin'));

-- User roles
create policy "Users see own roles" on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Properties — open Carfax model: any signed-in user can view & add
create policy "Anyone signed in can view properties" on public.properties for select
  to authenticated using (true);
create policy "Public can view properties" on public.properties for select
  to anon using (true);
create policy "Signed-in users can add properties" on public.properties for insert
  to authenticated with check (auth.uid() = created_by);
create policy "Claimer or admin can update property" on public.properties for update
  to authenticated using (
    auth.uid() = claimed_by or public.has_role(auth.uid(), 'admin') or
    (claimed_by is null and auth.uid() = created_by)
  );
create policy "Admin can delete property" on public.properties for delete
  to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Property records — open contributions, owner/admin manage
create policy "Anyone can view records" on public.property_records for select
  using (true);
create policy "Signed-in users can submit records" on public.property_records for insert
  to authenticated with check (auth.uid() = submitted_by);
create policy "Submitter can update own record" on public.property_records for update
  to authenticated using (auth.uid() = submitted_by);
create policy "Admin can update any record" on public.property_records for update
  to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Submitter or admin can delete record" on public.property_records for delete
  to authenticated using (auth.uid() = submitted_by or public.has_role(auth.uid(), 'admin'));

-- Attachments
create policy "Anyone can view attachments" on public.record_attachments for select using (true);
create policy "Signed-in can add attachments" on public.record_attachments for insert
  to authenticated with check (auth.uid() = uploaded_by);
create policy "Uploader or admin can delete attachments" on public.record_attachments for delete
  to authenticated using (auth.uid() = uploaded_by or public.has_role(auth.uid(), 'admin'));

-- Share links
create policy "Anyone can read share links" on public.share_links for select using (true);
create policy "Realtors/admins create share links" on public.share_links for insert
  to authenticated with check (
    auth.uid() = created_by and (
      public.has_role(auth.uid(), 'realtor') or public.has_role(auth.uid(), 'admin')
    )
  );
create policy "Creator or admin delete share link" on public.share_links for delete
  to authenticated using (auth.uid() = created_by or public.has_role(auth.uid(), 'admin'));

-- Storage bucket for property files (public read)
insert into storage.buckets (id, name, public) values ('property-files', 'property-files', true)
on conflict (id) do nothing;

create policy "Public read property files" on storage.objects for select
  using (bucket_id = 'property-files');
create policy "Signed-in users can upload property files" on storage.objects for insert
  to authenticated with check (bucket_id = 'property-files' and auth.uid() = owner);
create policy "Owner or admin can delete property files" on storage.objects for delete
  to authenticated using (
    bucket_id = 'property-files' and (auth.uid() = owner or public.has_role(auth.uid(), 'admin'))
  );