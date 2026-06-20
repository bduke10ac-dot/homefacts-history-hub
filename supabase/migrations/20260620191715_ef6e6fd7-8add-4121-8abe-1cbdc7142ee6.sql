
-- Reports table
CREATE TABLE public.address_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_token text,
  address text NOT NULL,
  formatted_address text,
  place_id text,
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'pending',
  living_outlook_score int,
  living_outlook_grade text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.address_reports TO authenticated;
GRANT SELECT, INSERT ON public.address_reports TO anon;
GRANT ALL ON public.address_reports TO service_role;

ALTER TABLE public.address_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports are publicly readable" ON public.address_reports
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create a report" ON public.address_reports
  FOR INSERT WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Owner can update their report" ON public.address_reports
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete their report" ON public.address_reports
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX address_reports_user_idx ON public.address_reports(user_id, created_at DESC);
CREATE INDEX address_reports_anon_idx ON public.address_reports(anon_token);

CREATE TRIGGER address_reports_updated
  BEFORE UPDATE ON public.address_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sections table
CREATE TABLE public.address_report_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.address_reports(id) ON DELETE CASCADE,
  section text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  data jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id, section)
);

GRANT SELECT ON public.address_report_sections TO authenticated, anon;
GRANT ALL ON public.address_report_sections TO service_role;

ALTER TABLE public.address_report_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sections are publicly readable" ON public.address_report_sections
  FOR SELECT USING (true);

CREATE INDEX address_report_sections_report_idx ON public.address_report_sections(report_id);

CREATE TRIGGER address_report_sections_updated
  BEFORE UPDATE ON public.address_report_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
