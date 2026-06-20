
-- Extend subscriptions table with Stripe columns (kept backward-compatible with trial flow)
alter table public.subscriptions
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists product_id text,
  add column if not exists price_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean default false,
  add column if not exists environment text not null default 'sandbox';

create unique index if not exists subscriptions_stripe_sub_unique
  on public.subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;

create index if not exists subscriptions_user_env_idx
  on public.subscriptions(user_id, environment, created_at desc);

-- Service role full access (for webhook upserts)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and policyname='service role full access') then
    create policy "service role full access" on public.subscriptions
      for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end $$;

-- Server-side check for active subscription
create or replace function public.has_active_subscription(
  user_uuid uuid,
  check_env text default 'sandbox'
) returns boolean
language sql security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and environment = check_env
      and (
        (status in ('active','trialing') and (current_period_end is null or current_period_end > now()) and (renews_at is null or renews_at > now()))
        or (status = 'canceled' and current_period_end > now())
      )
  );
$$;

grant execute on function public.has_active_subscription(uuid, text) to authenticated, anon;
