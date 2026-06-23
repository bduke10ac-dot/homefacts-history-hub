
ALTER TABLE public.builder_companies
  ADD COLUMN IF NOT EXISTS brand_primary_color text,
  ADD COLUMN IF NOT EXISTS brand_secondary_color text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS social_facebook text,
  ADD COLUMN IF NOT EXISTS social_instagram text,
  ADD COLUMN IF NOT EXISTS social_youtube text,
  ADD COLUMN IF NOT EXISTS social_linkedin text,
  ADD COLUMN IF NOT EXISTS social_tiktok text,
  ADD COLUMN IF NOT EXISTS schedule_tour_url text,
  ADD COLUMN IF NOT EXISTS available_homes_url text,
  ADD COLUMN IF NOT EXISTS contact_url text,
  ADD COLUMN IF NOT EXISTS story text,
  ADD COLUMN IF NOT EXISTS awards text[],
  ADD COLUMN IF NOT EXISTS certifications text[],
  ADD COLUMN IF NOT EXISTS preferred_lenders jsonb,
  ADD COLUMN IF NOT EXISTS warranty_portal_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS promo_banner_text text,
  ADD COLUMN IF NOT EXISTS promo_banner_url text;

CREATE TABLE IF NOT EXISTS public.builder_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referring_company_id uuid REFERENCES public.builder_companies(id) ON DELETE CASCADE,
  referred_builder_name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_referrals TO authenticated;
GRANT ALL ON public.builder_referrals TO service_role;
ALTER TABLE public.builder_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builder members can view their referrals" ON public.builder_referrals
  FOR SELECT TO authenticated
  USING (public.is_builder_company_member(referring_company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Builder members can submit referrals" ON public.builder_referrals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_builder_company_member(referring_company_id, auth.uid()));
CREATE POLICY "Admins manage referrals" ON public.builder_referrals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER set_builder_referrals_updated_at BEFORE UPDATE ON public.builder_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.builder_qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.builder_companies(id) ON DELETE CASCADE,
  clone_id uuid REFERENCES public.nb_property_clones(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  user_agent text
);
GRANT SELECT, INSERT ON public.builder_qr_scans TO authenticated;
GRANT SELECT, INSERT ON public.builder_qr_scans TO anon;
GRANT ALL ON public.builder_qr_scans TO service_role;
ALTER TABLE public.builder_qr_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log QR scan" ON public.builder_qr_scans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Builder members can view scans" ON public.builder_qr_scans FOR SELECT TO authenticated
  USING (public.is_builder_company_member(company_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

UPDATE public.builder_companies
SET website = COALESCE(website, 'https://www.creeksidenewhomes.com'),
    schedule_tour_url = COALESCE(schedule_tour_url, 'https://www.creeksidenewhomes.com/contact'),
    available_homes_url = COALESCE(available_homes_url, 'https://www.creeksidenewhomes.com/homes'),
    contact_url = COALESCE(contact_url, 'https://www.creeksidenewhomes.com/contact'),
    brand_primary_color = COALESCE(brand_primary_color, '#1f4e2e'),
    brand_secondary_color = COALESCE(brand_secondary_color, '#c9a55a'),
    story = COALESCE(story, 'Creekside Homes builds quality, modern homes across Middle Tennessee with a focus on craftsmanship, energy efficiency, and a smooth homeowner experience from first showing to final handoff.'),
    awards = COALESCE(awards, ARRAY['Founding Builder of the HomeFacts Builder Program']),
    certifications = COALESCE(certifications, ARRAY['HomeFacts Certified Builder','Energy Star Partner']),
    warranty_portal_url = COALESCE(warranty_portal_url, 'https://www.creeksidenewhomes.com/warranty')
WHERE slug = 'creekside-homes';
