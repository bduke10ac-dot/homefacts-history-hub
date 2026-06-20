
CREATE OR REPLACE FUNCTION public.is_property_owner(_property_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = _property_id
      AND (p.claimed_by = _user_id OR p.created_by = _user_id)
  );
$$;

CREATE TABLE public.platform_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  doc_type text NOT NULL,
  title text NOT NULL,
  description text,
  storage_path text NOT NULL,
  mime_type text,
  file_size_bytes bigint,
  source text NOT NULL DEFAULT 'user_upload',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_documents TO authenticated;
GRANT ALL ON public.platform_documents TO service_role;
ALTER TABLE public.platform_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_owner_all" ON public.platform_documents FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_platform_documents_updated BEFORE UPDATE ON public.platform_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.platform_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  asset_type text NOT NULL,
  storage_path text NOT NULL,
  caption text,
  taken_at date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_media_assets TO authenticated;
GRANT ALL ON public.platform_media_assets TO service_role;
ALTER TABLE public.platform_media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_owner_all" ON public.platform_media_assets FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_platform_media_updated BEFORE UPDATE ON public.platform_media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.platform_audit_log TO authenticated;
GRANT ALL ON public.platform_audit_log TO service_role;
ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_read" ON public.platform_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin')
         OR (property_id IS NOT NULL AND public.is_property_owner(property_id, auth.uid())));
CREATE POLICY "audit_insert_self" ON public.platform_audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.platform_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contractor_professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  project_type text NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  start_date date,
  target_completion_date date,
  actual_completion_date date,
  budget_cents bigint,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_projects TO authenticated;
GRANT ALL ON public.platform_projects TO service_role;
ALTER TABLE public.platform_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proj_owner_all" ON public.platform_projects FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_platform_projects_updated BEFORE UPDATE ON public.platform_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.platform_project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.platform_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  completed_at timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_project_milestones TO authenticated;
GRANT ALL ON public.platform_project_milestones TO service_role;
ALTER TABLE public.platform_project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mil_via_project" ON public.platform_project_milestones FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM public.platform_projects p
    WHERE public.is_property_owner(p.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
  ))
  WITH CHECK (project_id IN (
    SELECT id FROM public.platform_projects p
    WHERE public.is_property_owner(p.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
  ));
CREATE TRIGGER trg_platform_milestones_updated BEFORE UPDATE ON public.platform_project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.platform_customer_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ack_type text NOT NULL,
  document_id uuid REFERENCES public.platform_documents(id) ON DELETE SET NULL,
  signed_name text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.platform_customer_acknowledgments TO authenticated;
GRANT ALL ON public.platform_customer_acknowledgments TO service_role;
ALTER TABLE public.platform_customer_acknowledgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ack_owner_read" ON public.platform_customer_acknowledgments FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ack_self_insert" ON public.platform_customer_acknowledgments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.platform_permit_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.platform_projects(id) ON DELETE SET NULL,
  jurisdiction text,
  permit_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  external_reference text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_permit_submissions TO authenticated;
GRANT ALL ON public.platform_permit_submissions TO service_role;
ALTER TABLE public.platform_permit_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permitsub_owner_all" ON public.platform_permit_submissions FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_platform_permitsub_updated BEFORE UPDATE ON public.platform_permit_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.platform_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.platform_projects(id) ON DELETE SET NULL,
  cert_type text NOT NULL,
  issued_by text,
  issued_at date,
  expires_at date,
  document_id uuid REFERENCES public.platform_documents(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_certificates TO authenticated;
GRANT ALL ON public.platform_certificates TO service_role;
ALTER TABLE public.platform_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert_owner_all" ON public.platform_certificates FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_platform_cert_updated BEFORE UPDATE ON public.platform_certificates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.platform_ai_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  observation_type text NOT NULL,
  model text NOT NULL,
  prompt text,
  response_text text,
  response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  disclaimer text NOT NULL,
  is_certified boolean NOT NULL DEFAULT false,
  confidence_score numeric(5,2),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_obs_never_certified CHECK (is_certified = false)
);
GRANT SELECT, INSERT ON public.platform_ai_observations TO authenticated;
GRANT ALL ON public.platform_ai_observations TO service_role;
ALTER TABLE public.platform_ai_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_obs_owner_read" ON public.platform_ai_observations FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ai_obs_owner_insert" ON public.platform_ai_observations FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.platform_property_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL,
  title text NOT NULL,
  description text,
  source text,
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_property_timeline_events TO authenticated;
GRANT ALL ON public.platform_property_timeline_events TO service_role;
ALTER TABLE public.platform_property_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tl_owner_all" ON public.platform_property_timeline_events FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
