
DROP POLICY IF EXISTS "Anyone can view attachments" ON public.record_attachments;
CREATE POLICY "Owners or admin can view attachments" ON public.record_attachments
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.property_records pr
    WHERE pr.id = record_attachments.record_id
      AND public.is_property_owner(pr.property_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "insurance_claims auth read" ON public.insurance_claims;
CREATE POLICY "Owners or admin view insurance claims" ON public.insurance_claims
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.is_property_owner(property_id, auth.uid())
);

DROP POLICY IF EXISTS "Authed view surveys" ON public.property_surveys;
CREATE POLICY "Owners or admin view surveys" ON public.property_surveys
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR uploaded_by = auth.uid()
  OR public.is_property_owner(property_id, auth.uid())
);
