
-- Government reviews
CREATE TABLE public.government_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  permit_id UUID,
  reviewer_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  code_concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
  corrections_requested JSONB NOT NULL DEFAULT '[]'::jsonb,
  inspection_notes TEXT,
  ai_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_approval BOOLEAN NOT NULL DEFAULT false,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.government_reviews TO authenticated;
GRANT ALL ON public.government_reviews TO service_role;
ALTER TABLE public.government_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Property owners view gov reviews" ON public.government_reviews FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR reviewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated insert gov reviews" ON public.government_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Reviewers update gov reviews" ON public.government_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (reviewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_gov_reviews_upd BEFORE UPDATE ON public.government_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Neighborhood data overrides
CREATE TABLE public.neighborhood_data_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT,
  last_updated DATE,
  confidence TEXT,
  notes TEXT,
  source_link TEXT,
  saved_to_report BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.neighborhood_data_overrides TO authenticated;
GRANT ALL ON public.neighborhood_data_overrides TO service_role;
ALTER TABLE public.neighborhood_data_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage neighborhood overrides" ON public.neighborhood_data_overrides FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_neighborhood_upd BEFORE UPDATE ON public.neighborhood_data_overrides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Marketplace recommendations
CREATE TABLE public.marketplace_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium',
  estimated_cost_low NUMERIC,
  estimated_cost_high NUMERIC,
  provider_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_recommendations TO authenticated;
GRANT ALL ON public.marketplace_recommendations TO service_role;
ALTER TABLE public.marketplace_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage marketplace recs" ON public.marketplace_recommendations FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_marketplace_upd BEFORE UPDATE ON public.marketplace_recommendations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Investor portfolios
CREATE TABLE public.investor_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_portfolios TO authenticated;
GRANT ALL ON public.investor_portfolios TO service_role;
ALTER TABLE public.investor_portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own portfolios" ON public.investor_portfolios FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_portfolios_upd BEFORE UPDATE ON public.investor_portfolios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.portfolio_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.investor_portfolios(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  rent_estimate NUMERIC,
  cash_flow_notes TEXT,
  target_roi NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (portfolio_id, property_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_properties TO authenticated;
GRANT ALL ON public.portfolio_properties TO service_role;
ALTER TABLE public.portfolio_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage portfolio props" ON public.portfolio_properties FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.investor_portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.investor_portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_portfolio_props_upd BEFORE UPDATE ON public.portfolio_properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Emergency events
CREATE TABLE public.emergency_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT,
  weather_reference TEXT,
  total_expense NUMERIC,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  contractor_notes TEXT,
  insurance_policy_ref TEXT,
  claim_status TEXT,
  owner_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_events TO authenticated;
GRANT ALL ON public.emergency_events TO service_role;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage emergency events" ON public.emergency_events FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_emergency_upd BEFORE UPDATE ON public.emergency_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Disaster vault documents
CREATE TABLE public.disaster_vault_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  title TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  value_estimate NUMERIC,
  serial_number TEXT,
  quantity INTEGER,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disaster_vault_documents TO authenticated;
GRANT ALL ON public.disaster_vault_documents TO service_role;
ALTER TABLE public.disaster_vault_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage vault docs" ON public.disaster_vault_documents FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_vault_upd BEFORE UPDATE ON public.disaster_vault_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Estate contacts
CREATE TABLE public.estate_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relationship TEXT,
  access_level TEXT NOT NULL DEFAULT 'emergency_only',
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estate_contacts TO authenticated;
GRANT ALL ON public.estate_contacts TO service_role;
ALTER TABLE public.estate_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage estate contacts" ON public.estate_contacts FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_estate_upd BEFORE UPDATE ON public.estate_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Negotiation reports
CREATE TABLE public.negotiation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title TEXT,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  repair_concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
  negotiation_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggested_concession_low NUMERIC,
  suggested_concession_high NUMERIC,
  safety_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  code_concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
  insurance_concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
  future_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  buyer_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  realtor_talking_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negotiation_reports TO authenticated;
GRANT ALL ON public.negotiation_reports TO service_role;
ALTER TABLE public.negotiation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own negotiation reports" ON public.negotiation_reports FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_negotiation_upd BEFORE UPDATE ON public.negotiation_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ownership passports
CREATE TABLE public.ownership_passports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  current_owner_id UUID,
  transfer_status TEXT NOT NULL DEFAULT 'inactive',
  transfer_to_email TEXT,
  full_access BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  last_transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ownership_passports TO authenticated;
GRANT SELECT ON public.ownership_passports TO anon;
GRANT ALL ON public.ownership_passports TO service_role;
ALTER TABLE public.ownership_passports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage passports" ON public.ownership_passports FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read with share token" ON public.ownership_passports FOR SELECT TO anon
  USING (share_token IS NOT NULL AND (expires_at IS NULL OR expires_at > now()));
CREATE TRIGGER trg_passport_upd BEFORE UPDATE ON public.ownership_passports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
