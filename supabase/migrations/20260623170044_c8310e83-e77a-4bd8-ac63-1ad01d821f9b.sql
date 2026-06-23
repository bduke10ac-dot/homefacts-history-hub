
-- Estate & Legacy Planning module tables

CREATE TABLE IF NOT EXISTS public.estate_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_url text,
  file_path text,
  notes text,
  review_date date,
  permission_level text NOT NULL DEFAULT 'private',
  shared_contact_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estate_documents TO authenticated;
GRANT ALL ON public.estate_documents TO service_role;
ALTER TABLE public.estate_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage estate documents" ON public.estate_documents FOR ALL
  USING (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.estate_checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  item_key text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, item_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estate_checklist_items TO authenticated;
GRANT ALL ON public.estate_checklist_items TO service_role;
ALTER TABLE public.estate_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage estate checklist" ON public.estate_checklist_items FOR ALL
  USING (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.estate_probate_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  task_key text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, task_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estate_probate_tasks TO authenticated;
GRANT ALL ON public.estate_probate_tasks TO service_role;
ALTER TABLE public.estate_probate_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage probate tasks" ON public.estate_probate_tasks FOR ALL
  USING (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.estate_incapacity_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  medical_poa text,
  financial_poa text,
  property_manager text,
  attorney text,
  insurance_agent text,
  mortgage_company text,
  hoa_contact text,
  utility_contacts text,
  maintenance_instructions text,
  emergency_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estate_incapacity_plans TO authenticated;
GRANT ALL ON public.estate_incapacity_plans TO service_role;
ALTER TABLE public.estate_incapacity_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage incapacity plan" ON public.estate_incapacity_plans FOR ALL
  USING (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.estate_legal_professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  company text,
  profession_type text NOT NULL,
  service_area text,
  phone text,
  email text,
  website text,
  license_status text DEFAULT 'unknown',
  verified boolean NOT NULL DEFAULT false,
  notes text,
  revenue_category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.estate_legal_professionals TO anon, authenticated;
GRANT ALL ON public.estate_legal_professionals TO service_role;
ALTER TABLE public.estate_legal_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read legal pros" ON public.estate_legal_professionals FOR SELECT USING (true);
CREATE POLICY "Admins manage legal pros" ON public.estate_legal_professionals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.estate_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  review_type text NOT NULL,
  due_date date,
  reminder_enabled boolean NOT NULL DEFAULT true,
  last_reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estate_reviews TO authenticated;
GRANT ALL ON public.estate_reviews TO service_role;
ALTER TABLE public.estate_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage estate reviews" ON public.estate_reviews FOR ALL
  USING (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR created_by = auth.uid());

CREATE TRIGGER estate_documents_updated BEFORE UPDATE ON public.estate_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER estate_checklist_updated BEFORE UPDATE ON public.estate_checklist_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER estate_probate_updated BEFORE UPDATE ON public.estate_probate_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER estate_incapacity_updated BEFORE UPDATE ON public.estate_incapacity_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER estate_legal_pros_updated BEFORE UPDATE ON public.estate_legal_professionals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER estate_reviews_updated BEFORE UPDATE ON public.estate_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed sample legal professionals
INSERT INTO public.estate_legal_professionals (name, company, profession_type, service_area, phone, email, verified, license_status, revenue_category) VALUES
('Sarah Mitchell, Esq.', 'Mitchell Estate Law', 'estate_attorney', 'Nationwide (Remote)', '555-0101', 'info@mitchell-estate.example', true, 'active', 'attorney_referral'),
('James Park, Esq.', 'Park Probate Group', 'probate_attorney', 'Texas', '555-0102', 'james@parkprobate.example', true, 'active', 'probate_partnership'),
('Linda Chen, CPA', 'Chen Tax Advisors', 'tax_professional', 'Nationwide', '555-0103', 'linda@chen-tax.example', true, 'active', 'tax_partnership'),
('Marcus Reed, CFP', 'Reed Wealth', 'financial_advisor', 'Nationwide (Remote)', '555-0104', 'marcus@reedwealth.example', true, 'active', 'financial_referral'),
('Estate Planning Pros', 'Estate Planning Pros LLC', 'estate_planner', 'Nationwide', '555-0105', 'hello@epp.example', true, 'active', 'estate_package'),
('QuickNotary Services', 'QuickNotary', 'notary', 'Nationwide (Mobile)', '555-0106', 'book@quicknotary.example', true, 'active', 'notary_referral')
ON CONFLICT DO NOTHING;
