
-- =====================
-- Warranty Hub schema
-- =====================

CREATE TYPE public.warranty_category AS ENUM (
  'roof','hvac','appliance','windows','doors','flooring','foundation',
  'water_heater','electrical','plumbing','solar','smart_home','garage_door',
  'septic','pool','builder','home_warranty','extended_service','other'
);

CREATE TYPE public.warranty_status AS ENUM (
  'active','expiring_soon','needs_registration','transfer_required','expired'
);

CREATE TYPE public.warranty_transfer_status AS ENUM (
  'draft','in_progress','submitted','confirmed','completed','cancelled'
);

CREATE TYPE public.warranty_registration_status AS ENUM (
  'unregistered','in_progress','submitted','registered','rejected'
);

CREATE TYPE public.warranty_document_kind AS ENUM (
  'warranty','invoice','photo','permit','maintenance','manual','registration_confirmation','transfer_confirmation','other'
);

-- ---------- warranties ----------
CREATE TABLE public.warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category public.warranty_category NOT NULL,
  provider TEXT,
  product_name TEXT,
  model_number TEXT,
  serial_number TEXT,
  install_date DATE,
  purchase_date DATE,
  warranty_start_date DATE,
  expiration_date DATE,
  is_registered BOOLEAN NOT NULL DEFAULT false,
  is_transferable BOOLEAN NOT NULL DEFAULT false,
  transfer_deadline_days INTEGER,
  transfer_fee NUMERIC(10,2),
  required_documents TEXT[],
  claim_instructions TEXT,
  transfer_instructions TEXT,
  provider_phone TEXT,
  provider_email TEXT,
  provider_website TEXT,
  claim_phone TEXT,
  claim_website TEXT,
  installer_name TEXT,
  installer_phone TEXT,
  installer_license TEXT,
  notes TEXT,
  status public.warranty_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranties TO authenticated;
GRANT ALL ON public.warranties TO service_role;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view warranties on their property"
  ON public.warranties FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners can insert warranties on their property"
  ON public.warranties FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'builder'));
CREATE POLICY "Owners can update warranties on their property"
  ON public.warranties FOR UPDATE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'builder'));
CREATE POLICY "Owners can delete warranties on their property"
  ON public.warranties FOR DELETE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE INDEX warranties_property_idx ON public.warranties(property_id);
CREATE INDEX warranties_status_idx ON public.warranties(status);

-- ---------- warranty_documents ----------
CREATE TABLE public.warranty_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind public.warranty_document_kind NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_documents TO authenticated;
GRANT ALL ON public.warranty_documents TO service_role;
ALTER TABLE public.warranty_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage docs on accessible warranties"
  ON public.warranty_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.warranties w WHERE w.id = warranty_id AND (public.is_property_owner(w.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'builder'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.warranties w WHERE w.id = warranty_id AND (public.is_property_owner(w.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'builder'))));

CREATE INDEX warranty_documents_warranty_idx ON public.warranty_documents(warranty_id);

-- ---------- warranty_transfers ----------
CREATE TABLE public.warranty_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_name TEXT,
  seller_email TEXT,
  buyer_name TEXT,
  buyer_email TEXT,
  closing_date DATE,
  property_address TEXT,
  status public.warranty_transfer_status NOT NULL DEFAULT 'draft',
  warranty_ids UUID[] NOT NULL DEFAULT '{}',
  package_url TEXT,
  checklist JSONB NOT NULL DEFAULT '{"submitted":false,"fee_paid":false,"buyer_registered":false,"confirmation_received":false,"updated_in_homefacts":false,"reminder_scheduled":false}'::jsonb,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_transfers TO authenticated;
GRANT ALL ON public.warranty_transfers TO service_role;
ALTER TABLE public.warranty_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage transfers on accessible properties"
  ON public.warranty_transfers FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE INDEX warranty_transfers_property_idx ON public.warranty_transfers(property_id);

-- ---------- warranty_registrations ----------
CREATE TABLE public.warranty_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.warranty_registration_status NOT NULL DEFAULT 'unregistered',
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  confirmation_number TEXT,
  confirmation_file_url TEXT,
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_registrations TO authenticated;
GRANT ALL ON public.warranty_registrations TO service_role;
ALTER TABLE public.warranty_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage registrations on accessible warranties"
  ON public.warranty_registrations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.warranties w WHERE w.id = warranty_id AND (public.is_property_owner(w.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'builder'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.warranties w WHERE w.id = warranty_id AND (public.is_property_owner(w.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'builder'))));

-- ---------- warranty_reminders ----------
CREATE TABLE public.warranty_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  message TEXT,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_reminders TO authenticated;
GRANT ALL ON public.warranty_reminders TO service_role;
ALTER TABLE public.warranty_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage reminders on accessible warranties"
  ON public.warranty_reminders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.warranties w WHERE w.id = warranty_id AND (public.is_property_owner(w.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.warranties w WHERE w.id = warranty_id AND (public.is_property_owner(w.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

CREATE INDEX warranty_reminders_remind_at_idx ON public.warranty_reminders(remind_at);

-- ---------- warranty_claims ----------
CREATE TABLE public.warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  filed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claim_number TEXT,
  issue_description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  filed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  attachment_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_claims TO authenticated;
GRANT ALL ON public.warranty_claims TO service_role;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage claims on accessible warranties"
  ON public.warranty_claims FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.warranties w WHERE w.id = warranty_id AND (public.is_property_owner(w.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.warranties w WHERE w.id = warranty_id AND (public.is_property_owner(w.property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));

-- ---------- triggers ----------
CREATE TRIGGER warranties_set_updated_at BEFORE UPDATE ON public.warranties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER warranty_transfers_set_updated_at BEFORE UPDATE ON public.warranty_transfers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER warranty_registrations_set_updated_at BEFORE UPDATE ON public.warranty_registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER warranty_claims_set_updated_at BEFORE UPDATE ON public.warranty_claims FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
