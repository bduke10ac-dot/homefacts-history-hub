CREATE TABLE public.gov_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  key text NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, key)
);

CREATE INDEX idx_gov_data_cache_lookup ON public.gov_data_cache(source, key);
CREATE INDEX idx_gov_data_cache_expires ON public.gov_data_cache(expires_at);

GRANT SELECT ON public.gov_data_cache TO authenticated;
GRANT ALL ON public.gov_data_cache TO service_role;

ALTER TABLE public.gov_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read gov cache"
  ON public.gov_data_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages gov cache"
  ON public.gov_data_cache FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER gov_data_cache_set_updated_at
  BEFORE UPDATE ON public.gov_data_cache
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();