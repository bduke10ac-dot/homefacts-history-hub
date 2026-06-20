
-- Drop interim tables from prior step (empty)
DROP TABLE IF EXISTS public.address_report_sections CASCADE;
DROP TABLE IF EXISTS public.address_reports CASCADE;

-- ============ reports ============
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_token text,
  address_raw text NOT NULL,
  address_normalized text,
  lat double precision,
  lng double precision,
  place_id text,
  parcel_id text,
  county text,
  state text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_refreshed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT SELECT, INSERT ON public.reports TO anon;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reports readable by anyone" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Anyone can create a report" ON public.reports FOR INSERT WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL) OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);
CREATE POLICY "Owner updates report" ON public.reports FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes report" ON public.reports FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX reports_user_idx ON public.reports(user_id, created_at DESC);
CREATE INDEX reports_anon_idx ON public.reports(anon_token);

-- ============ report_sections ============
CREATE TABLE public.report_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  data jsonb,
  source text,
  fetched_at timestamptz,
  UNIQUE(report_id, section_key)
);
GRANT SELECT ON public.report_sections TO authenticated, anon;
GRANT ALL ON public.report_sections TO service_role;
ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sections readable by anyone" ON public.report_sections FOR SELECT USING (true);
CREATE INDEX report_sections_report_idx ON public.report_sections(report_id);

-- ============ report_properties (spec calls this `properties`; renamed to avoid colliding with existing homeowner table) ============
CREATE TABLE public.report_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  parcel_id text,
  legal_description text,
  lot_size_sqft numeric,
  year_built int,
  living_area_sqft numeric,
  bedrooms int,
  bathrooms numeric,
  property_type text,
  zoning text,
  gis_map_url text,
  assessed_value numeric,
  market_value numeric,
  last_sale_date date,
  last_sale_price numeric
);
GRANT SELECT ON public.report_properties TO authenticated, anon;
GRANT ALL ON public.report_properties TO service_role;
ALTER TABLE public.report_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Report properties readable by anyone" ON public.report_properties FOR SELECT USING (true);

CREATE TABLE public.ownership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.report_properties(id) ON DELETE CASCADE,
  owner_name text,
  transfer_date date,
  sale_price numeric,
  document_type text,
  recorder_doc_number text
);
GRANT SELECT ON public.ownership_history TO authenticated, anon;
GRANT ALL ON public.ownership_history TO service_role;
ALTER TABLE public.ownership_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ownership readable by anyone" ON public.ownership_history FOR SELECT USING (true);

CREATE TABLE public.tax_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.report_properties(id) ON DELETE CASCADE,
  tax_year int,
  assessed_value numeric,
  taxable_value numeric,
  total_tax numeric,
  exemptions text[]
);
GRANT SELECT ON public.tax_history TO authenticated, anon;
GRANT ALL ON public.tax_history TO service_role;
ALTER TABLE public.tax_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tax history readable by anyone" ON public.tax_history FOR SELECT USING (true);

CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  level text,
  name text,
  district_name text,
  rating numeric,
  rating_source text,
  distance_miles numeric,
  address text,
  phone text
);
GRANT SELECT ON public.schools TO authenticated, anon;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schools readable by anyone" ON public.schools FOR SELECT USING (true);

CREATE TABLE public.risk_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  flood_zone text,
  flood_zone_description text,
  fema_panel_url text,
  storm_events jsonb,
  wildfire_risk_tier text,
  environmental_notes text[]
);
GRANT SELECT ON public.risk_indicators TO authenticated, anon;
GRANT ALL ON public.risk_indicators TO service_role;
ALTER TABLE public.risk_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Risk readable by anyone" ON public.risk_indicators FOR SELECT USING (true);

CREATE TABLE public.amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  category text,
  name text,
  address text,
  distance_miles numeric,
  rating numeric,
  place_id text
);
GRANT SELECT ON public.amenities TO authenticated, anon;
GRANT ALL ON public.amenities TO service_role;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Amenities readable by anyone" ON public.amenities FOR SELECT USING (true);

CREATE TABLE public.utilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  utility_type text,
  provider_name text,
  contact_phone text,
  contact_url text,
  notes text
);
GRANT SELECT ON public.utilities TO authenticated, anon;
GRANT ALL ON public.utilities TO service_role;
ALTER TABLE public.utilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utilities readable by anyone" ON public.utilities FOR SELECT USING (true);

CREATE TABLE public.civic_officials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  office text,
  name text,
  party text,
  contact_phone text,
  contact_url text,
  district_number text
);
GRANT SELECT ON public.civic_officials TO authenticated, anon;
GRANT ALL ON public.civic_officials TO service_role;
ALTER TABLE public.civic_officials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Civic readable by anyone" ON public.civic_officials FOR SELECT USING (true);

CREATE TABLE public.voting_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  election_authority text,
  election_authority_url text,
  polling_place_name text,
  polling_place_address text,
  closest_dmv_name text,
  closest_dmv_address text,
  closest_dmv_distance_miles numeric,
  closest_city_hall_address text
);
GRANT SELECT ON public.voting_info TO authenticated, anon;
GRANT ALL ON public.voting_info TO service_role;
ALTER TABLE public.voting_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voting readable by anyone" ON public.voting_info FOR SELECT USING (true);

CREATE TABLE public.scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  living_outlook_score int,
  living_outlook_grade text,
  schools_score int,
  crime_score int,
  market_score int,
  tax_burden_score int,
  amenities_score int,
  risk_score int,
  commute_score int,
  headline text,
  summary text,
  pros text[],
  cons text[],
  best_for text[],
  computed_at timestamptz NOT NULL DEFAULT now(),
  methodology_version text DEFAULT 'v1'
);
GRANT SELECT ON public.scorecards TO authenticated, anon;
GRANT ALL ON public.scorecards TO service_role;
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scorecards readable by anyone" ON public.scorecards FOR SELECT USING (true);

CREATE TABLE public.report_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  pdf_url text,
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.report_exports TO authenticated, anon;
GRANT ALL ON public.report_exports TO service_role;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Report exports readable by anyone" ON public.report_exports FOR SELECT USING (true);
