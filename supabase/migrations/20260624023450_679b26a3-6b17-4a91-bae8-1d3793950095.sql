
-- Daily AI usage quota (per user, per day, per function)
CREATE TABLE IF NOT EXISTS public.ai_usage_quota (
  user_id uuid NOT NULL,
  day date NOT NULL,
  function_name text NOT NULL DEFAULT '_total',
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day, function_name)
);
GRANT ALL ON public.ai_usage_quota TO service_role;
ALTER TABLE public.ai_usage_quota ENABLE ROW LEVEL SECURITY;
-- service_role only — no client policies

CREATE OR REPLACE FUNCTION public.claim_ai_credit(_user_id uuid, _function_name text, _limit integer DEFAULT 50)
RETURNS TABLE(allowed boolean, remaining integer, used integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
BEGIN
  -- Increment per-function counter for analytics
  INSERT INTO public.ai_usage_quota (user_id, day, function_name, count)
  VALUES (_user_id, current_date, _function_name, 1)
  ON CONFLICT (user_id, day, function_name) DO UPDATE
    SET count = public.ai_usage_quota.count + 1, updated_at = now();

  -- Increment the rolled-up daily total (function_name = '_total') and check it
  INSERT INTO public.ai_usage_quota (user_id, day, function_name, count)
  VALUES (_user_id, current_date, '_total', 1)
  ON CONFLICT (user_id, day, function_name) DO UPDATE
    SET count = public.ai_usage_quota.count + 1, updated_at = now()
  RETURNING count INTO v_total;

  IF v_total > _limit THEN
    UPDATE public.ai_usage_quota
      SET count = _limit, updated_at = now()
      WHERE user_id = _user_id AND day = current_date AND function_name = '_total';
    RETURN QUERY SELECT false, 0, _limit;
  ELSE
    RETURN QUERY SELECT true, (_limit - v_total), v_total;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.claim_ai_credit(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_credit(uuid, text, integer) TO service_role;

-- Audit/fulfillment log for Stripe one-time + invoice events
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  stripe_event_id text UNIQUE,
  stripe_object_id text,
  amount_cents integer,
  currency text,
  status text,
  environment text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_events_user ON public.payment_events(user_id, created_at DESC);
GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payment events" ON public.payment_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all payment events" ON public.payment_events
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
