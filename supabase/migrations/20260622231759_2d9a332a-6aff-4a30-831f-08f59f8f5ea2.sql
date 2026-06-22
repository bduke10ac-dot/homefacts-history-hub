
-- fraud_flags: admin-only select
DROP POLICY IF EXISTS fraud_flags_public_read ON public.fraud_flags;
CREATE POLICY fraud_flags_admin_read ON public.fraud_flags FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- home_confidence_scores: owner/admin only
DROP POLICY IF EXISTS confidence_read_all ON public.home_confidence_scores;
CREATE POLICY confidence_owner_read ON public.home_confidence_scores FOR SELECT TO authenticated USING (is_property_owner(property_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- home_health_sections: owner/admin only
DROP POLICY IF EXISTS health_read_all ON public.home_health_sections;
CREATE POLICY health_owner_read ON public.home_health_sections FOR SELECT TO authenticated USING (is_property_owner(property_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- nb_clone_documents: drop open anon
DROP POLICY IF EXISTS "Anon read via parent clone" ON public.nb_clone_documents;

-- nb_clone_guide_overrides: drop open anon, add handoff-scoped
DROP POLICY IF EXISTS "Anon read via parent clone" ON public.nb_clone_guide_overrides;
CREATE POLICY "Public read guide overrides via handoff" ON public.nb_clone_guide_overrides FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM nb_property_clones c WHERE c.id = nb_clone_guide_overrides.clone_id AND c.status = ANY (ARRAY['handed_off'::nb_clone_status, 'transferred'::nb_clone_status])));

-- nb_clone_inspections
DROP POLICY IF EXISTS "Anon read via parent clone" ON public.nb_clone_inspections;
CREATE POLICY "Public read inspections via handoff" ON public.nb_clone_inspections FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM nb_property_clones c WHERE c.id = nb_clone_inspections.clone_id AND c.status = ANY (ARRAY['handed_off'::nb_clone_status, 'transferred'::nb_clone_status])));

-- nb_clone_subcontractors
DROP POLICY IF EXISTS "Anon read via parent clone" ON public.nb_clone_subcontractors;
CREATE POLICY "Public read subcontractors via handoff" ON public.nb_clone_subcontractors FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM nb_property_clones c WHERE c.id = nb_clone_subcontractors.clone_id AND c.status = ANY (ARRAY['handed_off'::nb_clone_status, 'transferred'::nb_clone_status])));

-- nb_clone_warranties: drop open anon
DROP POLICY IF EXISTS "Anon read via parent clone" ON public.nb_clone_warranties;

-- nb_property_clones: drop open anon
DROP POLICY IF EXISTS "Anon can read clone by handoff token" ON public.nb_property_clones;

-- professional_badge_history: admin-only
DROP POLICY IF EXISTS badge_history_public_read ON public.professional_badge_history;
CREATE POLICY badge_history_admin_read ON public.professional_badge_history FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- property_chat_messages: scope to property owner / admin
DROP POLICY IF EXISTS "Authenticated can read property chat" ON public.property_chat_messages;
CREATE POLICY "Owner reads property chat" ON public.property_chat_messages FOR SELECT TO authenticated USING (is_property_owner(property_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- property_reports: scope to owner / admin
DROP POLICY IF EXISTS "Authed users can read reports" ON public.property_reports;
CREATE POLICY "Owner reads property reports" ON public.property_reports FOR SELECT TO authenticated USING (is_property_owner(property_id, auth.uid()) OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- report_exports: scope to owner via reports.user_id
DROP POLICY IF EXISTS "Report exports readable by anyone" ON public.report_exports;
CREATE POLICY "Owner reads report exports" ON public.report_exports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_exports.report_id AND (r.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- timeline_events: owner/admin
DROP POLICY IF EXISTS timeline_read_all ON public.timeline_events;
CREATE POLICY timeline_owner_read ON public.timeline_events FOR SELECT TO authenticated USING (is_property_owner(property_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Revoke anon SELECT to remove from GraphQL anon schema for sensitive tables
REVOKE SELECT ON public.fraud_flags FROM anon;
REVOKE SELECT ON public.home_confidence_scores FROM anon;
REVOKE SELECT ON public.home_health_sections FROM anon;
REVOKE SELECT ON public.professional_badge_history FROM anon;
REVOKE SELECT ON public.property_chat_messages FROM anon;
REVOKE SELECT ON public.property_reports FROM anon;
REVOKE SELECT ON public.report_exports FROM anon;
REVOKE SELECT ON public.timeline_events FROM anon;
