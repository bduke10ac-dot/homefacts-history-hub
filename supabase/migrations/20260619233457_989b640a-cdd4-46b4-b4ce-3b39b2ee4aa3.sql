create table public.property_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  report_type text not null check (report_type in ('buyer','seller','insurance','roof','maintenance')),
  payload jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index property_reports_property_idx on public.property_reports(property_id, created_at desc);

grant select, insert on public.property_reports to authenticated;
grant all on public.property_reports to service_role;

alter table public.property_reports enable row level security;

create policy "Authed users can read reports"
  on public.property_reports for select
  to authenticated using (true);

create policy "Users insert their own reports"
  on public.property_reports for insert
  to authenticated with check (auth.uid() = created_by);

create policy "Admins delete reports"
  on public.property_reports for delete
  to authenticated using (public.has_role(auth.uid(), 'admin'));