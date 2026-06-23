
-- Enums
DO $$ BEGIN
  CREATE TYPE public.orivaz_cert_level AS ENUM ('none','bronze','silver','gold','platinum');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.orivaz_cert_status AS ENUM ('not_started','in_review','active','expired','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.orivaz_doc_type AS ENUM ('license','insurance','bond','workers_comp','w9','identity','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.orivaz_ce_status AS ENUM ('enrolled','in_progress','completed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) Certifications (one row per user)
CREATE TABLE public.orivaz_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  level public.orivaz_cert_level NOT NULL DEFAULT 'none',
  status public.orivaz_cert_status NOT NULL DEFAULT 'not_started',
  trust_score int NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  issued_at date,
  expires_at date,
  next_recert_at date,
  total_ce_hours numeric NOT NULL DEFAULT 0,
  badge_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orivaz_certifications TO authenticated;
GRANT ALL ON public.orivaz_certifications TO service_role;
ALTER TABLE public.orivaz_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own certification" ON public.orivaz_certifications
  FOR ALL USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- 2) CE Course catalog
CREATE TABLE public.orivaz_ce_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  hours numeric NOT NULL DEFAULT 1,
  level_required public.orivaz_cert_level NOT NULL DEFAULT 'bronze',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orivaz_ce_courses TO authenticated, anon;
GRANT ALL ON public.orivaz_ce_courses TO service_role;
ALTER TABLE public.orivaz_ce_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catalog readable by all" ON public.orivaz_ce_courses FOR SELECT USING (true);
CREATE POLICY "Admins manage courses" ON public.orivaz_ce_courses FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3) CE enrollments
CREATE TABLE public.orivaz_ce_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.orivaz_ce_courses(id) ON DELETE CASCADE,
  status public.orivaz_ce_status NOT NULL DEFAULT 'enrolled',
  score int CHECK (score BETWEEN 0 AND 100),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orivaz_ce_enrollments TO authenticated;
GRANT ALL ON public.orivaz_ce_enrollments TO service_role;
ALTER TABLE public.orivaz_ce_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own enrollments" ON public.orivaz_ce_enrollments FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- 4) Compliance docs
CREATE TABLE public.orivaz_compliance_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type public.orivaz_doc_type NOT NULL,
  issuer text,
  number text,
  file_url text,
  issued_at date,
  expires_at date,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orivaz_compliance_docs TO authenticated;
GRANT ALL ON public.orivaz_compliance_docs TO service_role;
ALTER TABLE public.orivaz_compliance_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own compliance docs" ON public.orivaz_compliance_docs FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- 5) Verification events
CREATE TABLE public.orivaz_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  source text,
  result text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orivaz_verification_events TO authenticated;
GRANT ALL ON public.orivaz_verification_events TO service_role;
ALTER TABLE public.orivaz_verification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own verification events" ON public.orivaz_verification_events FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- 6) Recertifications
CREATE TABLE public.orivaz_recertifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_start date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orivaz_recertifications TO authenticated;
GRANT ALL ON public.orivaz_recertifications TO service_role;
ALTER TABLE public.orivaz_recertifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own recertifications" ON public.orivaz_recertifications FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- 7) Partner benefits catalog
CREATE TABLE public.orivaz_partner_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  level_required public.orivaz_cert_level NOT NULL DEFAULT 'bronze',
  icon text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orivaz_partner_benefits TO authenticated, anon;
GRANT ALL ON public.orivaz_partner_benefits TO service_role;
ALTER TABLE public.orivaz_partner_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benefits readable by all" ON public.orivaz_partner_benefits FOR SELECT USING (true);
CREATE POLICY "Admins manage benefits" ON public.orivaz_partner_benefits FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- updated_at triggers
CREATE TRIGGER trg_orivaz_cert_updated BEFORE UPDATE ON public.orivaz_certifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orivaz_ce_enroll_updated BEFORE UPDATE ON public.orivaz_ce_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orivaz_compliance_updated BEFORE UPDATE ON public.orivaz_compliance_docs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orivaz_recert_updated BEFORE UPDATE ON public.orivaz_recertifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed CE courses
INSERT INTO public.orivaz_ce_courses (title, description, category, hours, level_required) VALUES
  ('Orivaz Foundations: The Property Identity Standard', 'How Orivaz creates a permanent digital identity for every property and your role in it.', 'Foundations', 1.0, 'bronze'),
  ('Verified Workmanship 101', 'How to upload, tag, and verify your completed work to a property record.', 'Workmanship', 1.5, 'bronze'),
  ('Insurance & Liability Essentials', 'COIs, additional insured, bonds, and workers'' comp explained for trades.', 'Compliance', 2.0, 'bronze'),
  ('Builder Handoff Excellence', 'Run a flawless handoff with full Orivaz digital identity transfer.', 'Builder', 2.0, 'silver'),
  ('Warranty Transfer & Estate Readiness', 'Transferable warranties, estate-ready documentation, and probate readiness.', 'Warranties', 1.5, 'silver'),
  ('Storm & Hail Response Playbook', 'Document, claim, and remediate weather damage the Orivaz way.', 'Field Practice', 2.0, 'silver'),
  ('Fraud Prevention & Identity Verification', 'Spotting permit fraud, unlicensed work, and protecting your reputation.', 'Compliance', 1.5, 'gold'),
  ('Advanced Forensic Documentation', 'Photo provenance, geo-stamping, and chain-of-custody for high-stakes claims.', 'Advanced', 2.5, 'gold'),
  ('Platinum Mentor Program', 'Train and verify other professionals in the Orivaz Verified Network.', 'Leadership', 4.0, 'platinum');

-- Seed partner benefits
INSERT INTO public.orivaz_partner_benefits (title, description, level_required, icon, sort_order) VALUES
  ('Verified Badge on Reports', 'Your verified badge appears on every Orivaz property report you''ve touched.', 'bronze', 'BadgeCheck', 1),
  ('Direct Homeowner Quote Requests', 'Receive quote requests directly from Orivaz homeowners in your service area.', 'bronze', 'Send', 2),
  ('Workmanship on Permanent Record', 'Your completed work is attached to the property''s lifelong digital identity.', 'bronze', 'FileText', 3),
  ('Preferred Provider Placement', 'Featured listing in Property Command Centers near your service area.', 'silver', 'Star', 4),
  ('Builder-Approved Status', 'Eligible to be tagged as Builder-Approved for Orivaz builder partners.', 'silver', 'Building2', 5),
  ('Co-Marketing with Orivaz', 'Joint case studies, social features, and homeowner education content.', 'gold', 'Megaphone', 6),
  ('Priority Dispute Mediation', 'Fast-track mediation and Orivaz-backed documentation in homeowner disputes.', 'gold', 'Scale', 7),
  ('Mentor & Network Leadership', 'Train, verify, and lead other pros in the Orivaz Verified Network.', 'platinum', 'Crown', 8),
  ('Early Access to New Markets', 'First-look access to new Orivaz cities, builder partners, and product features.', 'platinum', 'Sparkles', 9);
