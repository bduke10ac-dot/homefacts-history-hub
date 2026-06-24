
-- ============ 1. property_intelligence ============
CREATE TABLE public.property_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  square_feet INTEGER,
  lot_size_sqft INTEGER,
  stories INTEGER,
  bedrooms INTEGER,
  bathrooms NUMERIC(4,1),
  roof_install_year INTEGER,
  roof_material TEXT,
  hvac_install_year INTEGER,
  hvac_type TEXT,
  water_heater_install_year INTEGER,
  water_heater_type TEXT,
  electrical_panel_year INTEGER,
  plumbing_material TEXT,
  exterior_material TEXT,
  foundation_type TEXT,
  -- snapshot risk fields (populated from hazard_intelligence/regional_property_profile by edge function)
  storm_risk_level TEXT,
  hail_risk_level TEXT,
  wind_risk_level TEXT,
  flood_risk_level TEXT,
  wildfire_risk_level TEXT,
  last_recomputed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_intelligence TO authenticated;
GRANT ALL ON public.property_intelligence TO service_role;
ALTER TABLE public.property_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_or_admin_select_intel" ON public.property_intelligence
  FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners_or_admin_insert_intel" ON public.property_intelligence
  FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners_or_admin_update_intel" ON public.property_intelligence
  FOR UPDATE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners_or_admin_delete_intel" ON public.property_intelligence
  FOR DELETE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_property_intelligence_updated
  BEFORE UPDATE ON public.property_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 2. property_health_scores ============
CREATE TABLE public.property_health_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  roof_score INTEGER,
  hvac_score INTEGER,
  plumbing_score INTEGER,
  electrical_score INTEGER,
  water_heater_score INTEGER,
  exterior_score INTEGER,
  foundation_score INTEGER,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  risks TEXT[] NOT NULL DEFAULT '{}',
  next_actions TEXT[] NOT NULL DEFAULT '{}',
  computation_source TEXT NOT NULL DEFAULT 'heuristic',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_health_scores_property ON public.property_health_scores(property_id, computed_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_health_scores TO authenticated;
GRANT ALL ON public.property_health_scores TO service_role;
ALTER TABLE public.property_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_or_admin_select_health" ON public.property_health_scores
  FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners_or_admin_insert_health" ON public.property_health_scores
  FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners_or_admin_update_health" ON public.property_health_scores
  FOR UPDATE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners_or_admin_delete_health" ON public.property_health_scores
  FOR DELETE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_property_health_scores_updated
  BEFORE UPDATE ON public.property_health_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 3. property_data_consent ============
CREATE TABLE public.property_data_consent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  allow_anonymized_data BOOLEAN NOT NULL DEFAULT false,
  allow_partner_outreach BOOLEAN NOT NULL DEFAULT false,
  allow_offer_matching BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
CREATE INDEX idx_property_data_consent_property ON public.property_data_consent(property_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_data_consent TO authenticated;
GRANT ALL ON public.property_data_consent TO service_role;
ALTER TABLE public.property_data_consent ENABLE ROW LEVEL SECURITY;

-- Owners see their own row; admins see all (for aggregate dashboard).
CREATE POLICY "self_or_admin_select_consent" ON public.property_data_consent
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "self_insert_consent" ON public.property_data_consent
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_property_owner(property_id, auth.uid()));
CREATE POLICY "self_update_consent" ON public.property_data_consent
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "self_delete_consent" ON public.property_data_consent
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_property_data_consent_updated
  BEFORE UPDATE ON public.property_data_consent
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 4. property_opportunities ============
CREATE TABLE public.property_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  system TEXT NOT NULL,
  opportunity_type TEXT NOT NULL,
  urgency TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  estimated_cost_low INTEGER,
  estimated_cost_high INTEGER,
  recommended_action TEXT NOT NULL,
  rationale TEXT,
  source TEXT NOT NULL DEFAULT 'heuristic',
  expires_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_opportunities_property ON public.property_opportunities(property_id, urgency, computed_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_opportunities TO authenticated;
GRANT ALL ON public.property_opportunities TO service_role;
ALTER TABLE public.property_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_or_admin_select_opp" ON public.property_opportunities
  FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners_or_admin_insert_opp" ON public.property_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners_or_admin_update_opp" ON public.property_opportunities
  FOR UPDATE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners_or_admin_delete_opp" ON public.property_opportunities
  FOR DELETE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_property_opportunities_updated
  BEFORE UPDATE ON public.property_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Helper: AND-gated consent check ============
-- Returns true only if EVERY active owner of the property has the given consent flag set.
-- flag must be one of: 'allow_anonymized_data', 'allow_partner_outreach', 'allow_offer_matching'.
CREATE OR REPLACE FUNCTION public.property_consent_all_owners_opted_in(_property_id uuid, _flag text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_opted int;
BEGIN
  IF _flag NOT IN ('allow_anonymized_data','allow_partner_outreach','allow_offer_matching') THEN
    RAISE EXCEPTION 'invalid consent flag: %', _flag;
  END IF;

  SELECT count(*) INTO v_total
  FROM public.property_owners
  WHERE property_id = _property_id AND status = 'active';

  IF v_total = 0 THEN RETURN false; END IF;

  EXECUTE format(
    'SELECT count(*) FROM public.property_data_consent c
       JOIN public.property_owners o
         ON o.property_id = c.property_id AND o.user_id = c.user_id AND o.status = ''active''
      WHERE c.property_id = $1 AND c.%I = true', _flag
  ) INTO v_opted USING _property_id;

  RETURN v_opted = v_total;
END;
$$;
