
-- =================== PROFESSIONALS ===================
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  professional_name text,
  company_name text,
  professional_category text check (professional_category in (
    'general_contractor','roofer','plumber','electrician','hvac',
    'home_inspector','public_adjuster','realtor','mortgage_lender',
    'insurance_agent','appraiser','other'
  )),
  trade_type text,
  license_number text,
  license_type text,
  license_status text check (license_status in ('active','expired','revoked','suspended','unknown')),
  issuing_state_agency text,
  issuing_state text,
  expiration_date date,

  nmls_id text,
  business_registration_number text,
  business_registration_status text check (business_registration_status in ('active','inactive','dissolved','not_found','unknown')),
  bbb_rating text,
  bbb_accredited boolean,

  insurance_status text check (insurance_status in ('verified','unverified','lapsed','none','unknown')),
  bond_status text check (bond_status in ('verified','unverified','none','unknown')),
  workers_comp_status text check (workers_comp_status in ('verified','unverified','exempt','unknown')),

  complaints_count int default 0,
  complaints_detail jsonb,
  major_complaint boolean default false,
  identity_mismatch boolean default false,

  verification_score numeric(4,1),
  verification_badge text check (verification_badge in ('green','yellow','red','gray')),
  verified_date date,
  source_link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.professionals (professional_category);
create index on public.professionals (license_number);

grant select on public.professionals to anon, authenticated;
grant all on public.professionals to service_role;
alter table public.professionals enable row level security;
create policy "professionals_public_read" on public.professionals for select using (true);

-- =================== BADGE COMPUTE TRIGGER ===================
create or replace function public.compute_professional_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_trade boolean;
begin
  is_trade := new.professional_category in ('general_contractor','roofer','plumber','electrician','hvac');

  if new.license_status is null or new.license_status = 'unknown' then
    new.verification_badge := 'gray';
  elsif new.license_status in ('expired','suspended','revoked')
     or new.insurance_status in ('lapsed','none')
     or new.business_registration_status in ('inactive','dissolved','not_found')
     or new.identity_mismatch is true
     or new.major_complaint is true
     or new.complaints_count >= 3 then
    new.verification_badge := 'red';
  elsif new.insurance_status in ('unverified','unknown')
     or (is_trade and new.bond_status in ('unverified','unknown'))
     or (is_trade and new.workers_comp_status in ('unverified','unknown'))
     or new.business_registration_status in ('unknown')
     or (new.expiration_date is not null and new.expiration_date <= (current_date + interval '60 days'))
     or new.complaints_count between 1 and 2 then
    new.verification_badge := 'yellow';
  elsif new.license_status = 'active'
    and new.insurance_status = 'verified'
    and (not is_trade or (new.bond_status = 'verified' and new.workers_comp_status in ('verified','exempt')))
    and coalesce(new.complaints_count, 0) = 0 then
    new.verification_badge := 'green';
  else
    new.verification_badge := 'gray';
  end if;

  new.verified_date := current_date;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_professional_badge
before insert or update on public.professionals
for each row execute function public.compute_professional_badge();

-- =================== FRAUD FLAGS ===================
-- (permits table already exists from prior migration)
create table public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references public.professionals(id) on delete cascade,
  permit_id uuid references public.permits(id) on delete set null,
  flag_type text check (flag_type in (
    'name_mismatch','license_number_mismatch','expired_license','wrong_trade_license',
    'business_not_registered','insurance_missing','repeat_complaints','permit_pulled_by_other'
  )),
  severity text check (severity in ('low','medium','high')) default 'medium',
  detail text,
  detected_at timestamptz default now(),
  resolved boolean default false,
  resolved_at timestamptz,
  resolved_note text
);
create index on public.fraud_flags (professional_id);
create index on public.fraud_flags (resolved, severity);

grant select on public.fraud_flags to anon, authenticated;
grant all on public.fraud_flags to service_role;
alter table public.fraud_flags enable row level security;
create policy "fraud_flags_public_read" on public.fraud_flags for select using (true);

create or replace function public.apply_fraud_flag_to_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.severity = 'high' and new.resolved is false and new.professional_id is not null then
    update public.professionals
    set verification_badge = 'red'
    where id = new.professional_id;
  end if;
  return new;
end;
$$;

create trigger trg_fraud_flag_badge
after insert on public.fraud_flags
for each row execute function public.apply_fraud_flag_to_badge();

-- =================== BADGE HISTORY ===================
create table public.professional_badge_history (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references public.professionals(id) on delete cascade,
  previous_badge text,
  new_badge text,
  changed_at timestamptz default now(),
  reason text
);
create index on public.professional_badge_history (professional_id, changed_at desc);

grant select on public.professional_badge_history to anon, authenticated;
grant all on public.professional_badge_history to service_role;
alter table public.professional_badge_history enable row level security;
create policy "badge_history_public_read" on public.professional_badge_history for select using (true);

create or replace function public.log_professional_badge_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.verification_badge is distinct from new.verification_badge then
    insert into public.professional_badge_history (professional_id, previous_badge, new_badge, changed_at)
    values (new.id, old.verification_badge, new.verification_badge, now());
  end if;
  return new;
end;
$$;

create trigger trg_professional_badge_history
after update on public.professionals
for each row execute function public.log_professional_badge_change();

-- =================== WORK HISTORY ===================
create table public.work_history_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  permit_id uuid references public.permits(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  work_performed text not null,
  work_date date,
  license_verified boolean,
  license_status_at_time text,
  insurance_verified_at_time boolean,
  source_url text,
  risk_note_override text,
  created_at timestamptz default now()
);
create index on public.work_history_records (property_id, work_date desc);

grant select on public.work_history_records to anon, authenticated;
grant all on public.work_history_records to service_role;
alter table public.work_history_records enable row level security;
create policy "work_history_public_read" on public.work_history_records for select using (true);

-- =================== VIEW: then-vs-now ===================
create or replace view public.work_history_with_current_status as
select
  w.id,
  w.property_id,
  w.permit_id,
  p.permit_number,
  w.professional_id,
  c.professional_name,
  c.company_name,
  w.work_performed,
  w.work_date,
  w.license_verified,
  w.license_status_at_time,
  c.license_status as license_status_today,
  c.verification_badge as professional_badge_today,
  w.insurance_verified_at_time,
  c.insurance_status as insurance_status_today,
  w.source_url,
  coalesce(
    w.risk_note_override,
    case
      when w.license_verified is false then 'Not verified at time of work'
      when w.license_status_at_time = 'active' and c.license_status in ('expired','revoked','suspended')
        then 'Was active at time of work — license has since lapsed or been revoked'
      when w.license_status_at_time in ('expired','revoked','suspended')
        then 'Contractor was unlicensed at the time this work was performed'
      when w.insurance_verified_at_time is false then 'Insurance not verified at time of work'
      else null
    end
  ) as risk_note
from public.work_history_records w
left join public.permits p on p.id = w.permit_id
left join public.professionals c on c.id = w.professional_id;

grant select on public.work_history_with_current_status to anon, authenticated, service_role;
