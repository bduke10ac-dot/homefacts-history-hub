
-- ===== 1. share_links: replace open SELECT with token-scoped RPC =====
DROP POLICY IF EXISTS "Anyone can read share links" ON public.share_links;

CREATE OR REPLACE FUNCTION public.get_share_link_property(p_token text)
RETURNS TABLE(property_id uuid, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT property_id, expires_at
  FROM public.share_links
  WHERE token = p_token
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_share_link_property(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_share_link_property(text) TO anon, authenticated;

-- ===== 2. property_records: prevent self-verify =====
CREATE OR REPLACE FUNCTION public.prevent_self_verify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.verified IS DISTINCT FROM OLD.verified
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at)
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins may change verification fields';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.prevent_self_verify() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_self_verify ON public.property_records;
CREATE TRIGGER trg_prevent_self_verify
  BEFORE UPDATE ON public.property_records
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_verify();

-- ===== 3. storage: remove broad listing policy on property-files =====
DROP POLICY IF EXISTS "Anon read property files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read property files" ON storage.objects;
-- Bucket is public, so objects remain accessible by direct URL via getPublicUrl();
-- removing these SELECT policies only blocks bucket-wide listing.

-- ===== 4. Revoke EXECUTE on internal functions from PUBLIC =====
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lock_template_on_first_clone() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_fraud_flag_to_badge() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compute_professional_badge() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_professional_badge_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_regional_risk_from_env() FROM PUBLIC;

-- RLS helpers: revoke from PUBLIC, re-grant to authenticated (anon does not need to call these directly)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_property_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_property_owner(uuid, uuid) TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_clone_homeowner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_clone_homeowner(uuid, uuid) TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_builder_company_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_builder_company_member(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_builder_company_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_builder_company_admin(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.nb_clone_template(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nb_clone_template(uuid, jsonb) TO authenticated;

-- ===== 5. Revoke SELECT from anon on user-scoped / admin-only tables =====
REVOKE SELECT ON public.subscriptions FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.api_keys FROM anon;
REVOKE SELECT ON public.fraud_flags FROM anon;
REVOKE SELECT ON public.share_links FROM anon;
REVOKE SELECT ON public.property_chat_messages FROM anon;
REVOKE SELECT ON public.property_reports FROM anon;
REVOKE SELECT ON public.regional_home_coach_query_log FROM anon;
REVOKE SELECT ON public.platform_audit_log FROM anon;
REVOKE SELECT ON public.builder_company_members FROM anon;
REVOKE SELECT ON public.nb_handoff_log FROM anon;
REVOKE SELECT ON public.nb_clone_documents FROM anon;
REVOKE SELECT ON public.nb_clone_inspections FROM anon;
REVOKE SELECT ON public.nb_clone_guide_overrides FROM anon;
REVOKE SELECT ON public.nb_template_documents FROM anon;
REVOKE SELECT ON public.professional_badge_history FROM anon;
REVOKE SELECT ON public.record_attachments FROM anon;
REVOKE SELECT ON public.report_exports FROM anon;
REVOKE SELECT ON public.platform_customer_acknowledgments FROM anon;
REVOKE SELECT ON public.platform_ai_observations FROM anon;
REVOKE SELECT ON public.data_source_log FROM anon;

-- ===== 6. Revoke SELECT from authenticated on strictly admin-only tables =====
REVOKE SELECT ON public.api_keys FROM authenticated;
REVOKE SELECT ON public.fraud_flags FROM authenticated;
REVOKE SELECT ON public.platform_audit_log FROM authenticated;
