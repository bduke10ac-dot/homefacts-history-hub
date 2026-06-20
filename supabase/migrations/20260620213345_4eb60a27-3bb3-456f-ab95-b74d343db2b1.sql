
CREATE TABLE public.regional_property_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  climate_zone text,
  region_classification text,
  state_code text,
  county_fips text,
  hail_risk_level text,
  wind_risk_level text,
  flood_risk_level text,
  wildfire_risk_level text,
  classified_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regional_property_profile TO authenticated;
GRANT ALL ON public.regional_property_profile TO service_role;
ALTER TABLE public.regional_property_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regprof_read" ON public.regional_property_profile FOR SELECT TO authenticated USING (true);
CREATE POLICY "regprof_admin_write" ON public.regional_property_profile FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_regprof_updated BEFORE UPDATE ON public.regional_property_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.regional_home_system_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_key text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  summary text,
  body_markdown text,
  region_scope text NOT NULL DEFAULT 'national',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.regional_home_system_topics TO authenticated;
GRANT ALL ON public.regional_home_system_topics TO service_role;
ALTER TABLE public.regional_home_system_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics_read" ON public.regional_home_system_topics FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_topics_updated BEFORE UPDATE ON public.regional_home_system_topics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.regional_property_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  system_type text NOT NULL,
  manufacturer text,
  model text,
  install_date date,
  warranty_expires date,
  contractor_professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  permit_id uuid REFERENCES public.permits(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regional_property_systems TO authenticated;
GRANT ALL ON public.regional_property_systems TO service_role;
ALTER TABLE public.regional_property_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psys_owner_all" ON public.regional_property_systems FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_psys_updated BEFORE UPDATE ON public.regional_property_systems
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.regional_solar_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_system_id uuid NOT NULL UNIQUE REFERENCES public.regional_property_systems(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  panel_count int,
  system_capacity_kw numeric,
  inverter_type text,
  battery_capacity_kwh numeric,
  ownership_type text,
  financing_provider text,
  ppa_term_years int,
  estimated_annual_kwh numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regional_solar_systems TO authenticated;
GRANT ALL ON public.regional_solar_systems TO service_role;
ALTER TABLE public.regional_solar_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solar_owner_all" ON public.regional_solar_systems FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_solar_updated BEFORE UPDATE ON public.regional_solar_systems
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.regional_incentives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_key text NOT NULL UNIQUE,
  title text NOT NULL,
  authority_level text NOT NULL,
  jurisdiction text,
  state_code text,
  category text NOT NULL,
  amount_text text,
  eligibility_summary text,
  url text,
  starts_on date,
  ends_on date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.regional_incentives TO authenticated;
GRANT ALL ON public.regional_incentives TO service_role;
ALTER TABLE public.regional_incentives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incentives_read" ON public.regional_incentives FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_incentives_updated BEFORE UPDATE ON public.regional_incentives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.regional_insurance_guidance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  topic text NOT NULL,
  summary text,
  body_markdown text,
  authority text,
  last_reviewed date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(state_code, topic)
);
GRANT SELECT ON public.regional_insurance_guidance TO authenticated;
GRANT ALL ON public.regional_insurance_guidance TO service_role;
ALTER TABLE public.regional_insurance_guidance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ins_guide_read" ON public.regional_insurance_guidance FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_insguide_updated BEFORE UPDATE ON public.regional_insurance_guidance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.regional_home_coach_query_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  model text NOT NULL,
  prompt text NOT NULL,
  response_text text,
  response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  disclaimer text NOT NULL,
  is_certified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coach_never_certified CHECK (is_certified = false)
);
GRANT SELECT, INSERT ON public.regional_home_coach_query_log TO authenticated;
GRANT ALL ON public.regional_home_coach_query_log TO service_role;
ALTER TABLE public.regional_home_coach_query_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_self_read" ON public.regional_home_coach_query_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "coach_self_insert" ON public.regional_home_coach_query_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Sync trigger: when env_risk_scores changes, mirror into regional_property_profile
CREATE OR REPLACE FUNCTION public.sync_regional_risk_from_env()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.regional_property_profile (property_id, hail_risk_level, wind_risk_level, flood_risk_level, wildfire_risk_level)
  VALUES (NEW.property_id, NEW.hail_risk_level, NEW.wind_risk_level, NEW.flood_risk_level, NEW.wildfire_risk_level)
  ON CONFLICT (property_id) DO UPDATE
    SET hail_risk_level = EXCLUDED.hail_risk_level,
        wind_risk_level = EXCLUDED.wind_risk_level,
        flood_risk_level = EXCLUDED.flood_risk_level,
        wildfire_risk_level = EXCLUDED.wildfire_risk_level,
        updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_sync_regional_from_env
AFTER INSERT OR UPDATE ON public.env_risk_scores
FOR EACH ROW EXECUTE FUNCTION public.sync_regional_risk_from_env();
