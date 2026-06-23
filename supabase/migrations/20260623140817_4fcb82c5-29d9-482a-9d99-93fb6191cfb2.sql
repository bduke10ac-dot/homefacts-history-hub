
-- ============================================================================
-- HomeFacts Upgrade: Batch 1 data foundation
-- ============================================================================

-- Reusable enums
DO $$ BEGIN
  CREATE TYPE public.risk_level AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.certification_tier AS ENUM ('none','bronze','silver','gold','platinum');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 1. Property Risk Scores
-- ----------------------------------------------------------------------------
CREATE TABLE public.property_risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  overall_score int NOT NULL DEFAULT 0,
  overall_summary text,
  structural_score int, structural_level public.risk_level, structural_ai text, structural_action text,
  weather_score int, weather_level public.risk_level, weather_ai text, weather_action text,
  insurance_score int, insurance_level public.risk_level, insurance_ai text, insurance_action text,
  environmental_score int, environmental_level public.risk_level, environmental_ai text, environmental_action text,
  maintenance_score int, maintenance_level public.risk_level, maintenance_ai text, maintenance_action text,
  neighborhood_score int, neighborhood_level public.risk_level, neighborhood_ai text, neighborhood_action text,
  appreciation_score int, appreciation_level public.risk_level, appreciation_ai text, appreciation_action text,
  supporting_docs jsonb DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_prs_property ON public.property_risk_scores(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_risk_scores TO authenticated;
GRANT ALL ON public.property_risk_scores TO service_role;
ALTER TABLE public.property_risk_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prs owners and admins read" ON public.property_risk_scores FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "prs owners and admins write" ON public.property_risk_scores FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER prs_updated_at BEFORE UPDATE ON public.property_risk_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Hazard Intelligence
-- ----------------------------------------------------------------------------
CREATE TABLE public.hazard_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  hazard_type text NOT NULL,
  label text NOT NULL,
  distance_m numeric,
  risk_level public.risk_level NOT NULL DEFAULT 'low',
  historical_events jsonb DEFAULT '[]'::jsonb,
  insurance_impact text,
  homeowner_explanation text,
  recommended_action text,
  latitude numeric,
  longitude numeric,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hi_property ON public.hazard_intelligence(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hazard_intelligence TO authenticated;
GRANT ALL ON public.hazard_intelligence TO service_role;
ALTER TABLE public.hazard_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hi owners read" ON public.hazard_intelligence FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "hi owners write" ON public.hazard_intelligence FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER hi_updated_at BEFORE UPDATE ON public.hazard_intelligence FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Crime Timeline
-- ----------------------------------------------------------------------------
CREATE TABLE public.crime_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  period text NOT NULL,
  category text NOT NULL,
  count int NOT NULL DEFAULT 0,
  trend text,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ct_property ON public.crime_timeline(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crime_timeline TO authenticated;
GRANT ALL ON public.crime_timeline TO service_role;
ALTER TABLE public.crime_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ct owners read" ON public.crime_timeline FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ct owners write" ON public.crime_timeline FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER ct_updated_at BEFORE UPDATE ON public.crime_timeline FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Weather / Environmental Events
-- ----------------------------------------------------------------------------
CREATE TABLE public.weather_environmental_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  event_type text NOT NULL,
  severity text,
  distance_m numeric,
  property_impact text,
  insurance_impact text,
  recommended_action text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wee_property ON public.weather_environmental_events(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weather_environmental_events TO authenticated;
GRANT ALL ON public.weather_environmental_events TO service_role;
ALTER TABLE public.weather_environmental_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wee owners read" ON public.weather_environmental_events FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "wee owners write" ON public.weather_environmental_events FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER wee_updated_at BEFORE UPDATE ON public.weather_environmental_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Home Value Protection Scores
-- ----------------------------------------------------------------------------
CREATE TABLE public.home_value_protection_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  overall_score int NOT NULL DEFAULT 0,
  summary text,
  maintenance_consistency int,
  documented_repairs int,
  verified_contractors int,
  permitted_work int,
  warranty_tracking int,
  energy_improvements int,
  safety_upgrades int,
  insurance_readiness int,
  neighborhood_trends int,
  market_comparison int,
  resale_documentation int,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hvp_property ON public.home_value_protection_scores(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_value_protection_scores TO authenticated;
GRANT ALL ON public.home_value_protection_scores TO service_role;
ALTER TABLE public.home_value_protection_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hvp owners read" ON public.home_value_protection_scores FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "hvp owners write" ON public.home_value_protection_scores FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER hvp_updated_at BEFORE UPDATE ON public.home_value_protection_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Insurance Readiness Scores
-- ----------------------------------------------------------------------------
CREATE TABLE public.insurance_readiness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  overall_score int NOT NULL DEFAULT 0,
  summary text,
  factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  premium_savings_estimate_cents int,
  documentation_checklist jsonb DEFAULT '[]'::jsonb,
  claim_readiness_checklist jsonb DEFAULT '[]'::jsonb,
  recommended_coverage_questions jsonb DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_irs_property ON public.insurance_readiness_scores(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_readiness_scores TO authenticated;
GRANT ALL ON public.insurance_readiness_scores TO service_role;
ALTER TABLE public.insurance_readiness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "irs owners read" ON public.insurance_readiness_scores FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "irs owners write" ON public.insurance_readiness_scores FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER irs_updated_at BEFORE UPDATE ON public.insurance_readiness_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Future Cost Forecasts
-- ----------------------------------------------------------------------------
CREATE TABLE public.future_cost_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  item text NOT NULL,
  category text,
  horizon_years int NOT NULL,
  low_cost_cents int,
  high_cost_cents int,
  urgency text,
  recommended_timing text,
  notes text,
  reminder_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fcf_property ON public.future_cost_forecasts(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.future_cost_forecasts TO authenticated;
GRANT ALL ON public.future_cost_forecasts TO service_role;
ALTER TABLE public.future_cost_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fcf owners read" ON public.future_cost_forecasts FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "fcf owners write" ON public.future_cost_forecasts FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER fcf_updated_at BEFORE UPDATE ON public.future_cost_forecasts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. Maintenance Reminders
-- ----------------------------------------------------------------------------
CREATE TABLE public.maintenance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  cadence text,
  next_due date,
  recurrence_rule text,
  region_specific text,
  last_completed_at timestamptz,
  is_done boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mr_property ON public.maintenance_reminders(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_reminders TO authenticated;
GRANT ALL ON public.maintenance_reminders TO service_role;
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr owners read" ON public.maintenance_reminders FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "mr owners write" ON public.maintenance_reminders FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER mr_updated_at BEFORE UPDATE ON public.maintenance_reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. Regional Education Topics (shared catalog, read-only for users)
-- ----------------------------------------------------------------------------
CREATE TABLE public.regional_education_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL,
  topic text NOT NULL,
  recommended_inspection text,
  insurance_note text,
  education_md text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.regional_education_topics TO authenticated, anon;
GRANT ALL ON public.regional_education_topics TO service_role;
ALTER TABLE public.regional_education_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ret public read" ON public.regional_education_topics FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "ret admin write" ON public.regional_education_topics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER ret_updated_at BEFORE UPDATE ON public.regional_education_topics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 10. Buyer Decision Reports
-- ----------------------------------------------------------------------------
CREATE TABLE public.buyer_decision_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  hidden_risks jsonb DEFAULT '[]'::jsonb,
  expected_maintenance jsonb DEFAULT '[]'::jsonb,
  insurance_outlook text,
  estimated_annual_cost_cents int,
  negotiation_items jsonb DEFAULT '[]'::jsonb,
  upgrade_opportunities jsonb DEFAULT '[]'::jsonb,
  long_term_outlook text,
  neighborhood_overview text,
  safety_concerns jsonb DEFAULT '[]'::jsonb,
  weather_risks jsonb DEFAULT '[]'::jsonb,
  permit_concerns jsonb DEFAULT '[]'::jsonb,
  warranty_status text,
  contractor_history text,
  ai_recommendation text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bdr_property ON public.buyer_decision_reports(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_decision_reports TO authenticated;
GRANT ALL ON public.buyer_decision_reports TO service_role;
ALTER TABLE public.buyer_decision_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bdr owners or creator read" ON public.buyer_decision_reports FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bdr owners or creator write" ON public.buyer_decision_reports FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER bdr_updated_at BEFORE UPDATE ON public.buyer_decision_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 11. Certification Status
-- ----------------------------------------------------------------------------
CREATE TABLE public.certification_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tier public.certification_tier NOT NULL DEFAULT 'none',
  criteria_met jsonb DEFAULT '{}'::jsonb,
  issued_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_cs_property ON public.certification_status(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certification_status TO authenticated;
GRANT ALL ON public.certification_status TO service_role;
ALTER TABLE public.certification_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs owners read" ON public.certification_status FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cs owners write" ON public.certification_status FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER cs_updated_at BEFORE UPDATE ON public.certification_status FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
