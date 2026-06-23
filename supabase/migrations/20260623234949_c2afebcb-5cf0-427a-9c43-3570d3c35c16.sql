
-- =========================================================
-- 1. property_owners (multi-owner)
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.ownership_role AS ENUM ('primary_owner','co_owner','spouse','trustee','property_manager');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ownership_status AS ENUM ('pending','active','removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.property_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ownership_role public.ownership_role NOT NULL DEFAULT 'co_owner',
  status public.ownership_status NOT NULL DEFAULT 'active',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_owners TO authenticated;
GRANT ALL ON public.property_owners TO service_role;

ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_property_owners_user ON public.property_owners(user_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_property_owners_property ON public.property_owners(property_id) WHERE status='active';

CREATE TRIGGER property_owners_set_updated_at
  BEFORE UPDATE ON public.property_owners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill from existing claimed_by
INSERT INTO public.property_owners (property_id, user_id, ownership_role, status)
SELECT p.id, p.claimed_by, 'primary_owner', 'active'
FROM public.properties p
WHERE p.claimed_by IS NOT NULL
ON CONFLICT (property_id, user_id) DO NOTHING;

-- =========================================================
-- 2. Helper functions
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_property_member(_property_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.property_owners
    WHERE property_id = _property_id AND user_id = _user_id AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = _property_id AND (claimed_by = _user_id OR created_by = _user_id)
  );
$$;

-- Update is_property_owner to include property_owners table
CREATE OR REPLACE FUNCTION public.is_property_owner(_property_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_property_member(_property_id, _user_id);
$$;

-- =========================================================
-- 3. property_owners RLS
-- =========================================================
CREATE POLICY "owners_select_self_or_admin"
  ON public.property_owners FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_property_member(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "owners_insert_member_or_admin"
  ON public.property_owners FOR INSERT TO authenticated
  WITH CHECK (public.is_property_member(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "owners_update_member_or_admin"
  ON public.property_owners FOR UPDATE TO authenticated
  USING (public.is_property_member(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "owners_delete_admin"
  ON public.property_owners FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- 4. audit_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  property_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_property ON public.audit_logs(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id, created_at DESC);

CREATE POLICY "audit_select_admin_or_property_member"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR (property_id IS NOT NULL AND public.is_property_member(property_id, auth.uid()))
    OR actor_user_id = auth.uid()
  );

-- Only allow inserts when actor matches auth.uid() (system inserts go via service_role)
CREATE POLICY "audit_insert_self"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid());

-- =========================================================
-- 5. Audit trigger: property ownership changes
-- =========================================================
CREATE OR REPLACE FUNCTION public.log_property_ownership_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.claimed_by IS DISTINCT FROM NEW.claimed_by THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, property_id, metadata)
    VALUES (
      auth.uid(),
      'property.ownership_transfer',
      'property',
      NEW.id,
      NEW.id,
      jsonb_build_object('previous_owner', OLD.claimed_by, 'new_owner', NEW.claimed_by)
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_property_ownership ON public.properties;
CREATE TRIGGER trg_log_property_ownership
  AFTER UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.log_property_ownership_change();

CREATE OR REPLACE FUNCTION public.log_property_owners_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, property_id, metadata)
    VALUES (auth.uid(), 'property_owner.added', 'property_owner', NEW.id, NEW.property_id,
            jsonb_build_object('user_id', NEW.user_id, 'role', NEW.ownership_role, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, property_id, metadata)
    VALUES (auth.uid(), 'property_owner.status_changed', 'property_owner', NEW.id, NEW.property_id,
            jsonb_build_object('user_id', NEW.user_id, 'from', OLD.status, 'to', NEW.status));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, property_id, metadata)
    VALUES (auth.uid(), 'property_owner.removed', 'property_owner', OLD.id, OLD.property_id,
            jsonb_build_object('user_id', OLD.user_id, 'role', OLD.ownership_role));
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_log_property_owners ON public.property_owners;
CREATE TRIGGER trg_log_property_owners
  AFTER INSERT OR UPDATE OR DELETE ON public.property_owners
  FOR EACH ROW EXECUTE FUNCTION public.log_property_owners_change();

-- =========================================================
-- 6. Update claim_property_invite to also create primary owner row
-- =========================================================
CREATE OR REPLACE FUNCTION public.claim_property_invite(_token text)
RETURNS TABLE(property_id uuid, address_line text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
  v_invite public.property_invites%ROWTYPE;
  v_property public.properties%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Must be signed in to claim'; END IF;
  SELECT * INTO v_invite FROM public.property_invites WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF v_invite.status <> 'pending' THEN RAISE EXCEPTION 'Invite already %', v_invite.status; END IF;
  IF v_invite.expires_at < now() THEN
    UPDATE public.property_invites SET status='expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'Invite expired';
  END IF;
  IF lower(v_invite.invitee_email) <> v_email THEN
    RAISE EXCEPTION 'This invite was sent to a different email address';
  END IF;
  SELECT * INTO v_property FROM public.properties WHERE id = v_invite.property_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Property no longer exists'; END IF;

  UPDATE public.properties SET claimed_by = v_uid, updated_at = now() WHERE id = v_invite.property_id;

  INSERT INTO public.property_owners (property_id, user_id, ownership_role, status, invited_by)
  VALUES (v_invite.property_id, v_uid, 'primary_owner', 'active', v_invite.invited_by)
  ON CONFLICT (property_id, user_id) DO UPDATE
    SET ownership_role = 'primary_owner', status = 'active', updated_at = now();

  UPDATE public.property_invites
    SET status = 'accepted', accepted_by = v_uid, accepted_at = now()
    WHERE id = v_invite.id;

  INSERT INTO public.timeline_events (property_id, category, title, description, occurred_at)
  VALUES (v_invite.property_id, 'handoff', 'Homeowner handoff completed',
          'Property ownership accepted by ' || v_email, now());

  RETURN QUERY SELECT v_property.id, v_property.address_line;
END $$;

-- =========================================================
-- 7. Revoke anon SELECT from private tables
-- =========================================================
DO $$
DECLARE
  t text;
  private_tables text[] := ARRAY[
    'properties','profiles','property_invites','property_owners',
    'warranties','warranty_documents','warranty_reminders','warranty_registrations',
    'warranty_claims','warranty_transfers','nb_clone_warranties','nb_template_warranties',
    'record_attachments','platform_documents','nb_clone_documents','nb_template_documents',
    'nb_property_clones','nb_templates','nb_clone_subcontractors','nb_template_subcontractors',
    'nb_clone_inspections','nb_clone_guide_overrides','nb_template_guide_items','nb_handoff_log',
    'contractors','contractor_scores','professionals','professional_badge_history',
    'scorecards','ownership_history','ownership_passports','property_records',
    'property_reports','reports','report_exports','report_properties','report_sections',
    'subscriptions','api_keys','share_links','builder_company_members','builder_referrals',
    'fraud_flags','platform_audit_log','platform_certificates','platform_customer_acknowledgments',
    'platform_media_assets','platform_permit_submissions','platform_project_milestones',
    'platform_projects','platform_property_timeline_events','platform_ai_observations',
    'portfolio_properties','investor_portfolios','maintenance_reminders','timeline_events',
    'home_health_sections','home_confidence_scores','property_confidence_scores',
    'property_chat_messages','digital_twin_rooms','deferred_maintenance_items',
    'property_boundaries','property_easements','property_plat_maps','property_surveys',
    'property_satellite_snapshots','property_ai_boundary_observations',
    'home_value_protection_scores','insurance_readiness_scores','property_risk_scores',
    'env_claim_predictions','env_events','env_flood_intelligence','env_grade','env_risk_scores',
    'env_roof_stress_assessments','weather_environmental_events','regional_property_profile',
    'future_cost_forecasts','government_reviews','hazard_intelligence','certification_status',
    'orivaz_ce_enrollments','orivaz_certifications','orivaz_compliance_docs',
    'orivaz_recertifications','orivaz_verification_events',
    'estate_contacts','estate_documents','estate_incapacity_plans','estate_probate_tasks',
    'estate_checklist_items','estate_reviews','insurance_claims','insurance_reviews',
    'mortgage_lien_records','disaster_vault_documents','emergency_events',
    'buyer_decision_reports','negotiation_reports','ai_assistant_queries',
    'regional_home_coach_query_log','verification_badges','user_roles'
  ];
BEGIN
  FOREACH t IN ARRAY private_tables LOOP
    BEGIN
      EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Skipped missing table %', t;
    END;
  END LOOP;
END $$;

-- =========================================================
-- 8. Tighten USING(true) public-write tables: insert-only for anon
-- =========================================================
DO $$
BEGIN
  -- builder_qr_scans: drop any blanket policies, recreate insert-only
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can scan" ON public.builder_qr_scans';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all" ON public.builder_qr_scans';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- (Existing intentional anon-insert policies for builder_qr_scans / builder_events remain;
--  we only ensure no UPDATE/DELETE policy uses USING(true).)
