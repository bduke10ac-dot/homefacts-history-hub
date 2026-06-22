
CREATE TABLE public.contractor_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  contractor_name TEXT NOT NULL,
  trade TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  jobs_completed INTEGER NOT NULL DEFAULT 0,
  on_time_rate NUMERIC,
  quality_rating NUMERIC,
  complaint_count INTEGER NOT NULL DEFAULT 0,
  badge TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contractor_scores TO authenticated;
GRANT ALL ON public.contractor_scores TO service_role;
ALTER TABLE public.contractor_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage contractor scores" ON public.contractor_scores FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_contractor_scores_updated BEFORE UPDATE ON public.contractor_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.insurance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  carrier TEXT,
  policy_number TEXT,
  premium NUMERIC,
  deductible NUMERIC,
  coverage_amount NUMERIC,
  effective_date DATE,
  renewal_date DATE,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_reviews TO authenticated;
GRANT ALL ON public.insurance_reviews TO service_role;
ALTER TABLE public.insurance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage insurance reviews" ON public.insurance_reviews FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_insurance_reviews_updated BEFORE UPDATE ON public.insurance_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.deferred_maintenance_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  system TEXT NOT NULL,
  issue TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  estimated_cost_low NUMERIC,
  estimated_cost_high NUMERIC,
  urgency_months INTEGER,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deferred_maintenance_items TO authenticated;
GRANT ALL ON public.deferred_maintenance_items TO service_role;
ALTER TABLE public.deferred_maintenance_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage deferred items" ON public.deferred_maintenance_items FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_deferred_items_updated BEFORE UPDATE ON public.deferred_maintenance_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.digital_twin_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_type TEXT,
  floor TEXT,
  square_feet NUMERIC,
  condition TEXT,
  notes TEXT,
  photo_url TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_twin_rooms TO authenticated;
GRANT ALL ON public.digital_twin_rooms TO service_role;
ALTER TABLE public.digital_twin_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage digital twin rooms" ON public.digital_twin_rooms FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_digital_twin_updated BEFORE UPDATE ON public.digital_twin_rooms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
