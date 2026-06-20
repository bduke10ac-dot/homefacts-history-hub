
create table if not exists public.permit_professionals (
  permit_id uuid references public.permits(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete cascade,
  role text,
  primary key (permit_id, professional_id)
);
grant select on public.permit_professionals to anon, authenticated;
grant all on public.permit_professionals to service_role;
alter table public.permit_professionals enable row level security;
create policy "permit_professionals_public_read" on public.permit_professionals for select using (true);
