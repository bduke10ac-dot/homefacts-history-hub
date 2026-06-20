
CREATE TABLE public.env_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('hail','wind','tornado','winter','hurricane','flood','wildfire','earthquake','other')),
  event_date date NOT NULL,
  severity text,
  magnitude numeric,
  magnitude_unit text,
  source text NOT NULL DEFAULT 'NOAA',
  external_id text,
  distance_miles numeric,
  description text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX env_events_property_idx ON public.env_events(property_id, event_date DESC);
CREATE INDEX env_events_type_idx ON public.env_events(event_type, event_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.env_events TO authenticated;
GRANT ALL ON public.env_events TO service_role;
ALTER TABLE public.env_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "env_events_read" ON public.env_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "env_events_admin_write" ON public.env_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE VIEW public.v_env_hail_events AS SELECT * FROM public.env_events WHERE event_type='hail';
CREATE OR REPLACE VIEW public.v_env_wind_events AS SELECT * FROM public.env_events WHERE event_type='wind';
CREATE OR REPLACE VIEW public.v_env_tornado_events AS SELECT * FROM public.env_events WHERE event_type='tornado';
CREATE OR REPLACE VIEW public.v_env_winter_events AS SELECT * FROM public.env_events WHERE event_type='winter';
GRANT SELECT ON public.v_env_hail_events, public.v_env_wind_events, public.v_env_tornado_events, public.v_env_winter_events TO authenticated, service_role;

CREATE TABLE public.env_risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  hail_risk_level text,
  wind_risk_level text,
  tornado_risk_level text,
  winter_risk_level text,
  flood_risk_level text,
  wildfire_risk_level text,
  earthquake_risk_level text,
  overall_risk_score numeric(5,2),
  computed_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'computed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.env_risk_scores TO authenticated;
GRANT ALL ON public.env_risk_scores TO service_role;
ALTER TABLE public.env_risk_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "env_risk_read" ON public.env_risk_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "env_risk_admin_write" ON public.env_risk_scores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_env_risk_updated BEFORE UPDATE ON public.env_risk_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.env_flood_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  fema_zone text,
  elevation_ft numeric,
  base_flood_elevation_ft numeric,
  in_floodway boolean,
  flood_insurance_required boolean,
  last_flood_event_date date,
  source text NOT NULL DEFAULT 'FEMA',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.env_flood_intelligence TO authenticated;
GRANT ALL ON public.env_flood_intelligence TO service_role;
ALTER TABLE public.env_flood_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "env_flood_read" ON public.env_flood_intelligence FOR SELECT TO authenticated USING (true);
CREATE POLICY "env_flood_admin_write" ON public.env_flood_intelligence FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_env_flood_updated BEFORE UPDATE ON public.env_flood_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.env_grade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  grade text NOT NULL CHECK (grade IN ('A','B','C','D','F')),
  score numeric(5,2),
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.env_grade TO authenticated;
GRANT ALL ON public.env_grade TO service_role;
ALTER TABLE public.env_grade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "env_grade_read" ON public.env_grade FOR SELECT TO authenticated USING (true);
CREATE POLICY "env_grade_admin_write" ON public.env_grade FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_env_grade_updated BEFORE UPDATE ON public.env_grade
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.env_roof_stress_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  model text NOT NULL,
  prompt text,
  response_text text,
  response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  stress_level text,
  estimated_remaining_life_years numeric,
  disclaimer text NOT NULL,
  is_certified boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roof_stress_never_certified CHECK (is_certified = false)
);
GRANT SELECT, INSERT ON public.env_roof_stress_assessments TO authenticated;
GRANT ALL ON public.env_roof_stress_assessments TO service_role;
ALTER TABLE public.env_roof_stress_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roof_owner_read" ON public.env_roof_stress_assessments FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roof_owner_insert" ON public.env_roof_stress_assessments FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.env_claim_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  model text NOT NULL,
  prompt text,
  response_text text,
  response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  predicted_claim_type text,
  predicted_probability numeric(5,2),
  horizon_months int,
  disclaimer text NOT NULL,
  is_certified boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT claim_pred_never_certified CHECK (is_certified = false)
);
GRANT SELECT, INSERT ON public.env_claim_predictions TO authenticated;
GRANT ALL ON public.env_claim_predictions TO service_role;
ALTER TABLE public.env_claim_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "claim_pred_owner_read" ON public.env_claim_predictions FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "claim_pred_owner_insert" ON public.env_claim_predictions FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
