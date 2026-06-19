create table public.property_chat_messages (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
create index idx_property_chat_messages_property on public.property_chat_messages (property_id, created_at);

grant select, insert on public.property_chat_messages to authenticated;
grant all on public.property_chat_messages to service_role;

alter table public.property_chat_messages enable row level security;

create policy "Authenticated can read property chat"
  on public.property_chat_messages for select
  to authenticated using (true);

create policy "Users insert own chat messages"
  on public.property_chat_messages for insert
  to authenticated with check (auth.uid() = user_id and role = 'user');

create policy "Admins can delete chat"
  on public.property_chat_messages for delete
  to authenticated using (public.has_role(auth.uid(), 'admin'));