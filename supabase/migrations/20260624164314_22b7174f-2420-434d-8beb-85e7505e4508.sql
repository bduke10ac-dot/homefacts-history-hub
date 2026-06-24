
-- Phase 3: link partner_subscriptions to Stripe
ALTER TABLE public.partner_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_subscriptions_external
  ON public.partner_subscriptions(external_subscription_id)
  WHERE external_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_user
  ON public.partner_subscriptions(partner_user_id);
