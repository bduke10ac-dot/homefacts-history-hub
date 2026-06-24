
CREATE TABLE IF NOT EXISTS public.free_report_quota (
  ip_hash text NOT NULL,
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ip_hash, day)
);

GRANT ALL ON public.free_report_quota TO service_role;
ALTER TABLE public.free_report_quota ENABLE ROW LEVEL SECURITY;
-- No policies = no client access. Only service_role (edge functions) can read/write.

CREATE OR REPLACE FUNCTION public.claim_free_report(_ip_hash text, _limit integer DEFAULT 3)
RETURNS TABLE(allowed boolean, remaining integer, used integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.free_report_quota (ip_hash, day, count)
  VALUES (_ip_hash, current_date, 1)
  ON CONFLICT (ip_hash, day) DO UPDATE
    SET count = public.free_report_quota.count + 1,
        updated_at = now()
  RETURNING count INTO v_count;

  IF v_count > _limit THEN
    -- Roll back the increment so we don't keep inflating against an over-limit IP
    UPDATE public.free_report_quota
      SET count = _limit, updated_at = now()
      WHERE ip_hash = _ip_hash AND day = current_date;
    RETURN QUERY SELECT false, 0, _limit;
  ELSE
    RETURN QUERY SELECT true, (_limit - v_count), v_count;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.claim_free_report(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_free_report(text, integer) TO service_role;
