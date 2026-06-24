
CREATE TABLE IF NOT EXISTS public.estate_vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_email text,
  preferred_attorney text,
  has_estate_documents boolean NOT NULL DEFAULT false,
  beneficiary_notes text,
  transfer_instructions text,
  medical_emergency_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estate_vaults TO authenticated;
GRANT ALL ON public.estate_vaults TO service_role;

ALTER TABLE public.estate_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view estate vault"
  ON public.estate_vaults FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners insert estate vault"
  ON public.estate_vaults FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners update estate vault"
  ON public.estate_vaults FOR UPDATE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners delete estate vault"
  ON public.estate_vaults FOR DELETE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER estate_vaults_set_updated_at
  BEFORE UPDATE ON public.estate_vaults
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
