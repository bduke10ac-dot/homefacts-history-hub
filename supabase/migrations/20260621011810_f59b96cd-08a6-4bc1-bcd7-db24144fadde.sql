
-- =====================================================
-- BUILDER COMPANIES
-- =====================================================
CREATE TABLE public.builder_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text,
  insurance_carrier text,
  insurance_policy text,
  phone text,
  email text,
  website text,
  logo_url text,
  address_line text,
  city text,
  state text,
  zip text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_companies TO authenticated;
GRANT ALL ON public.builder_companies TO service_role;
ALTER TABLE public.builder_companies ENABLE ROW LEVEL SECURITY;

CREATE TYPE public.builder_member_role AS ENUM ('owner','admin','staff');

CREATE TABLE public.builder_company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.builder_companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.builder_member_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_company_members TO authenticated;
GRANT ALL ON public.builder_company_members TO service_role;
ALTER TABLE public.builder_company_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_builder_company_member(_company_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.builder_company_members WHERE company_id = _company_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_builder_company_admin(_company_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.builder_company_members WHERE company_id = _company_id AND user_id = _user_id AND role IN ('owner','admin'));
$$;

CREATE POLICY "Members can read their companies" ON public.builder_companies
  FOR SELECT TO authenticated USING (public.is_builder_company_member(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can create companies" ON public.builder_companies
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins of company can update" ON public.builder_companies
  FOR UPDATE TO authenticated USING (public.is_builder_company_admin(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins of company can delete" ON public.builder_companies
  FOR DELETE TO authenticated USING (public.is_builder_company_admin(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members read company members" ON public.builder_company_members
  FOR SELECT TO authenticated USING (public.is_builder_company_member(company_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage members" ON public.builder_company_members
  FOR ALL TO authenticated
  USING (public.is_builder_company_admin(company_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_builder_company_admin(company_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_builder_companies_updated_at BEFORE UPDATE ON public.builder_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- TEMPLATES
-- =====================================================
CREATE TYPE public.nb_template_kind AS ENUM ('subdivision','model','series','custom');

CREATE TABLE public.nb_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.builder_companies(id) ON DELETE CASCADE,
  parent_template_id uuid REFERENCES public.nb_templates(id) ON DELETE SET NULL,
  kind public.nb_template_kind NOT NULL,
  name text NOT NULL,
  description text,
  subdivision text,
  elevation text,
  square_feet integer,
  bedrooms integer,
  bathrooms numeric(3,1),
  version integer NOT NULL DEFAULT 1,
  is_locked boolean NOT NULL DEFAULT false,
  hoa_info jsonb DEFAULT '{}'::jsonb,
  utility_info jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_templates TO authenticated;
GRANT ALL ON public.nb_templates TO service_role;
ALTER TABLE public.nb_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members read templates" ON public.nb_templates
  FOR SELECT TO authenticated USING (public.is_builder_company_member(company_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Company members create templates" ON public.nb_templates
  FOR INSERT TO authenticated WITH CHECK (public.is_builder_company_member(company_id, auth.uid()));
CREATE POLICY "Admins update templates (locked-aware)" ON public.nb_templates
  FOR UPDATE TO authenticated
  USING (
    (public.is_builder_company_admin(company_id, auth.uid()) AND (is_locked = false OR public.is_builder_company_admin(company_id, auth.uid())))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins delete templates" ON public.nb_templates
  FOR DELETE TO authenticated USING (public.is_builder_company_admin(company_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_nb_templates_updated_at BEFORE UPDATE ON public.nb_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Template children
CREATE TABLE public.nb_template_subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.nb_templates(id) ON DELETE CASCADE,
  trade text NOT NULL,
  company_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  license_number text,
  insurance_carrier text,
  scope_of_work text,
  warranty_months integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_template_subcontractors TO authenticated;
GRANT ALL ON public.nb_template_subcontractors TO service_role;
ALTER TABLE public.nb_template_subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent template" ON public.nb_template_subcontractors FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Write via parent template" ON public.nb_template_subcontractors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.nb_template_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.nb_templates(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  storage_path text,
  file_url text,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_template_documents TO authenticated;
GRANT ALL ON public.nb_template_documents TO service_role;
ALTER TABLE public.nb_template_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent template" ON public.nb_template_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Write via parent template" ON public.nb_template_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

CREATE TYPE public.nb_warranty_type AS ENUM (
  'builder','structural','roof','hvac','appliance','plumbing','electrical','windows_doors','flooring','siding_exterior','manufacturer','other'
);

CREATE TABLE public.nb_template_warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.nb_templates(id) ON DELETE CASCADE,
  warranty_type public.nb_warranty_type NOT NULL,
  title text NOT NULL,
  coverage_description text,
  term_months integer NOT NULL,
  issuer text,
  issuer_phone text,
  issuer_email text,
  claim_instructions text,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_template_warranties TO authenticated;
GRANT ALL ON public.nb_template_warranties TO service_role;
ALTER TABLE public.nb_template_warranties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent template" ON public.nb_template_warranties FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Write via parent template" ON public.nb_template_warranties FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.nb_template_guide_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.nb_templates(id) ON DELETE CASCADE,
  section text NOT NULL,
  title text NOT NULL,
  body text,
  responsibility text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_template_guide_items TO authenticated;
GRANT ALL ON public.nb_template_guide_items TO service_role;
ALTER TABLE public.nb_template_guide_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent template" ON public.nb_template_guide_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Write via parent template" ON public.nb_template_guide_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_templates t WHERE t.id = template_id AND (public.is_builder_company_member(t.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

-- =====================================================
-- PROPERTY CLONES
-- =====================================================
CREATE TYPE public.nb_clone_status AS ENUM ('draft','under_construction','ready_for_handoff','handed_off','transferred');

CREATE TABLE public.nb_property_clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.builder_companies(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.nb_templates(id) ON DELETE RESTRICT,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  lot_number text,
  parcel_id text,
  address_line text,
  city text,
  state text,
  zip text,
  build_start_date date,
  completion_date date,
  co_date date,
  status public.nb_clone_status NOT NULL DEFAULT 'draft',
  handoff_token uuid NOT NULL DEFAULT gen_random_uuid(),
  handed_off_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (handoff_token)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_property_clones TO authenticated;
GRANT SELECT ON public.nb_property_clones TO anon;
GRANT ALL ON public.nb_property_clones TO service_role;
ALTER TABLE public.nb_property_clones ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_clone_homeowner(_clone_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.nb_property_clones c
    JOIN public.properties p ON p.id = c.property_id
    WHERE c.id = _clone_id AND p.claimed_by = _user_id AND c.status IN ('handed_off','transferred')
  );
$$;

CREATE POLICY "Members read clones" ON public.nb_property_clones FOR SELECT TO authenticated
  USING (public.is_builder_company_member(company_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
         OR (property_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.claimed_by = auth.uid())));
CREATE POLICY "Anon can read clone by handoff token" ON public.nb_property_clones FOR SELECT TO anon USING (true);
CREATE POLICY "Members create clones" ON public.nb_property_clones FOR INSERT TO authenticated
  WITH CHECK (public.is_builder_company_member(company_id, auth.uid()));
CREATE POLICY "Members update clones (pre-handoff)" ON public.nb_property_clones FOR UPDATE TO authenticated
  USING (public.is_builder_company_member(company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete clones" ON public.nb_property_clones FOR DELETE TO authenticated
  USING (public.is_builder_company_admin(company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_nb_property_clones_updated_at BEFORE UPDATE ON public.nb_property_clones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Lock parent template after first clone
CREATE OR REPLACE FUNCTION public.lock_template_on_first_clone()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.nb_templates SET is_locked = true WHERE id = NEW.template_id AND is_locked = false;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_lock_template_on_first_clone AFTER INSERT ON public.nb_property_clones
  FOR EACH ROW EXECUTE FUNCTION public.lock_template_on_first_clone();

-- Clone children
CREATE TABLE public.nb_clone_subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid NOT NULL REFERENCES public.nb_property_clones(id) ON DELETE CASCADE,
  trade text NOT NULL,
  company_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  license_number text,
  insurance_carrier text,
  scope_of_work text,
  warranty_months integer,
  source_template_sub_id uuid REFERENCES public.nb_template_subcontractors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_clone_subcontractors TO authenticated;
GRANT SELECT ON public.nb_clone_subcontractors TO anon;
GRANT ALL ON public.nb_clone_subcontractors TO service_role;
ALTER TABLE public.nb_clone_subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent clone" ON public.nb_clone_subcontractors FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.is_clone_homeowner(c.id, auth.uid()))));
CREATE POLICY "Anon read via parent clone" ON public.nb_clone_subcontractors FOR SELECT TO anon USING (true);
CREATE POLICY "Write via parent clone" ON public.nb_clone_subcontractors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.nb_clone_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid NOT NULL REFERENCES public.nb_property_clones(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  storage_path text,
  file_url text,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_role text NOT NULL DEFAULT 'builder',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_clone_documents TO authenticated;
GRANT SELECT ON public.nb_clone_documents TO anon;
GRANT ALL ON public.nb_clone_documents TO service_role;
ALTER TABLE public.nb_clone_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent clone" ON public.nb_clone_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.is_clone_homeowner(c.id, auth.uid()))));
CREATE POLICY "Anon read via parent clone" ON public.nb_clone_documents FOR SELECT TO anon USING (true);
CREATE POLICY "Builder write via parent clone" ON public.nb_clone_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Homeowner append-only docs after handoff" ON public.nb_clone_documents FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND uploaded_by_role = 'homeowner' AND public.is_clone_homeowner(clone_id, auth.uid()));

CREATE TABLE public.nb_clone_warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid NOT NULL REFERENCES public.nb_property_clones(id) ON DELETE CASCADE,
  source_template_warranty_id uuid REFERENCES public.nb_template_warranties(id) ON DELETE SET NULL,
  warranty_type public.nb_warranty_type NOT NULL,
  title text NOT NULL,
  coverage_description text,
  start_date date,
  expiration_date date,
  issuer text,
  issuer_phone text,
  issuer_email text,
  claim_instructions text,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_clone_warranties TO authenticated;
GRANT SELECT ON public.nb_clone_warranties TO anon;
GRANT ALL ON public.nb_clone_warranties TO service_role;
ALTER TABLE public.nb_clone_warranties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent clone" ON public.nb_clone_warranties FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.is_clone_homeowner(c.id, auth.uid()))));
CREATE POLICY "Anon read via parent clone" ON public.nb_clone_warranties FOR SELECT TO anon USING (true);
CREATE POLICY "Write via parent clone" ON public.nb_clone_warranties FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.nb_clone_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid NOT NULL REFERENCES public.nb_property_clones(id) ON DELETE CASCADE,
  milestone text NOT NULL,
  result text,
  inspection_date date,
  inspector_name text,
  notes text,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_clone_inspections TO authenticated;
GRANT SELECT ON public.nb_clone_inspections TO anon;
GRANT ALL ON public.nb_clone_inspections TO service_role;
ALTER TABLE public.nb_clone_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent clone" ON public.nb_clone_inspections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.is_clone_homeowner(c.id, auth.uid()))));
CREATE POLICY "Anon read via parent clone" ON public.nb_clone_inspections FOR SELECT TO anon USING (true);
CREATE POLICY "Write via parent clone" ON public.nb_clone_inspections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.nb_clone_guide_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid NOT NULL REFERENCES public.nb_property_clones(id) ON DELETE CASCADE,
  section text NOT NULL,
  title text NOT NULL,
  body text,
  responsibility text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nb_clone_guide_overrides TO authenticated;
GRANT SELECT ON public.nb_clone_guide_overrides TO anon;
GRANT ALL ON public.nb_clone_guide_overrides TO service_role;
ALTER TABLE public.nb_clone_guide_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent clone" ON public.nb_clone_guide_overrides FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.is_clone_homeowner(c.id, auth.uid()))));
CREATE POLICY "Anon read via parent clone" ON public.nb_clone_guide_overrides FOR SELECT TO anon USING (true);
CREATE POLICY "Write via parent clone" ON public.nb_clone_guide_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.nb_handoff_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid NOT NULL REFERENCES public.nb_property_clones(id) ON DELETE CASCADE,
  event text NOT NULL,
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.nb_handoff_log TO authenticated;
GRANT ALL ON public.nb_handoff_log TO service_role;
ALTER TABLE public.nb_handoff_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read via parent clone" ON public.nb_handoff_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.is_clone_homeowner(c.id, auth.uid()))));
CREATE POLICY "Insert via parent clone" ON public.nb_handoff_log FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND (public.is_builder_company_member(c.company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

-- =====================================================
-- WARRANTY STATUS VIEW
-- =====================================================
CREATE OR REPLACE VIEW public.v_nb_clone_warranty_status AS
SELECT
  w.*,
  CASE
    WHEN w.expiration_date IS NULL THEN 'unknown'
    WHEN w.expiration_date < CURRENT_DATE THEN 'expired'
    WHEN w.expiration_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_soon'
    ELSE 'active'
  END AS status
FROM public.nb_clone_warranties w;
GRANT SELECT ON public.v_nb_clone_warranty_status TO authenticated, anon, service_role;

-- =====================================================
-- BULK CLONE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.nb_clone_template(_template_id uuid, _lot_specs jsonb)
RETURNS SETOF uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_template public.nb_templates%ROWTYPE;
  v_spec jsonb;
  v_new_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_template FROM public.nb_templates WHERE id = _template_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Template not found'; END IF;
  IF NOT (public.is_builder_company_member(v_template.company_id, v_uid) OR public.has_role(v_uid,'admin')) THEN
    RAISE EXCEPTION 'Not authorized to clone this template';
  END IF;

  FOR v_spec IN SELECT * FROM jsonb_array_elements(_lot_specs) LOOP
    INSERT INTO public.nb_property_clones (
      company_id, template_id, lot_number, address_line, city, state, zip, status, created_by
    ) VALUES (
      v_template.company_id, _template_id,
      v_spec->>'lot_number', v_spec->>'address_line', v_spec->>'city', v_spec->>'state', v_spec->>'zip',
      COALESCE((v_spec->>'status')::public.nb_clone_status, 'draft'), v_uid
    ) RETURNING id INTO v_new_id;

    INSERT INTO public.nb_clone_subcontractors (clone_id, trade, company_name, contact_name, phone, email, license_number, insurance_carrier, scope_of_work, warranty_months, source_template_sub_id)
    SELECT v_new_id, trade, company_name, contact_name, phone, email, license_number, insurance_carrier, scope_of_work, warranty_months, id
    FROM public.nb_template_subcontractors WHERE template_id = _template_id;

    INSERT INTO public.nb_clone_warranties (clone_id, source_template_warranty_id, warranty_type, title, coverage_description, start_date, expiration_date, issuer, issuer_phone, issuer_email, claim_instructions, document_url)
    SELECT v_new_id, id, warranty_type, title, coverage_description,
           CURRENT_DATE,
           CURRENT_DATE + (term_months || ' months')::interval,
           issuer, issuer_phone, issuer_email, claim_instructions, document_url
    FROM public.nb_template_warranties WHERE template_id = _template_id;

    RETURN NEXT v_new_id;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.nb_clone_template(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nb_clone_template(uuid, jsonb) TO authenticated;
