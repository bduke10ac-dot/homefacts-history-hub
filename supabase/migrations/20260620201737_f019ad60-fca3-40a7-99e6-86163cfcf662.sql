
-- Allow admins to update/resolve fraud flags and edit professional verification
CREATE POLICY "fraud_flags_admin_update" ON public.fraud_flags
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "professionals_admin_update" ON public.professionals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT UPDATE ON public.fraud_flags TO authenticated;
GRANT UPDATE ON public.professionals TO authenticated;
