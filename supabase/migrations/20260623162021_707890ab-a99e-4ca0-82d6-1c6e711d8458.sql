
ALTER TABLE public.builder_referrals ADD COLUMN IF NOT EXISTS region text;

CREATE TABLE IF NOT EXISTS public.builder_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.builder_companies(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  context text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.builder_events TO authenticated;
GRANT SELECT, INSERT ON public.builder_events TO anon;
GRANT ALL ON public.builder_events TO service_role;
ALTER TABLE public.builder_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log builder events" ON public.builder_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Builder members can view events" ON public.builder_events FOR SELECT TO authenticated
  USING (public.is_builder_company_member(company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_builder_events_company_type ON public.builder_events (company_id, event_type);
