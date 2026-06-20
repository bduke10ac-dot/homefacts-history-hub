
-- =================== EXTEND EXISTING TABLES ===================
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS full_address text,
  ADD COLUMN IF NOT EXISTS street_address text,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS parcel_number text,
  ADD COLUMN IF NOT EXISTS legal_description text,
  ADD COLUMN IF NOT EXISTS lot_size_sqft numeric,
  ADD COLUMN IF NOT EXISTS lot_size_acres numeric,
  ADD COLUMN IF NOT EXISTS square_footage int,
  ADD COLUMN IF NOT EXISTS zoning_code text,
  ADD COLUMN IF NOT EXISTS zoning_description text,
  ADD COLUMN IF NOT EXISTS gis_map_url text,
  ADD COLUMN IF NOT EXISTS fema_flood_zone text,
  ADD COLUMN IF NOT EXISTS historic_district_status text,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
CREATE INDEX IF NOT EXISTS properties_zip_idx ON public.properties (zip);
CREATE INDEX IF NOT EXISTS properties_parcel_idx ON public.properties (parcel_number);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE public.ownership_history
  ADD COLUMN IF NOT EXISTS owner_type text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS data_license_status text DEFAULT 'public_record';

-- =================== NEW PUBLIC-RECORD TABLES ===================
-- Helper: most of these are public records — readable by anyone, writes via service_role only.

CREATE TABLE IF NOT EXISTS public.mortgage_lien_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  record_type text CHECK (record_type IN ('mortgage','lien','judgment','release')),
  lender_or_claimant text,
  amount numeric,
  recorded_date date,
  released_date date,
  recording_number text,
  status text CHECK (status IN ('active','released','satisfied','unknown')),
  source_url text,
  data_license_status text DEFAULT 'public_record',
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.mortgage_lien_records TO anon, authenticated;
GRANT ALL ON public.mortgage_lien_records TO service_role;
ALTER TABLE public.mortgage_lien_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mortgage_lien public read" ON public.mortgage_lien_records FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.property_tax_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  tax_year int NOT NULL,
  assessed_value numeric,
  market_value numeric,
  taxable_value numeric,
  tax_amount numeric,
  millage_rate numeric,
  due_date date,
  paid_status text CHECK (paid_status IN ('paid','unpaid','partial','unknown')),
  source_url text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.property_tax_records TO anon, authenticated;
GRANT ALL ON public.property_tax_records TO service_role;
ALTER TABLE public.property_tax_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_tax public read" ON public.property_tax_records FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.tax_exemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  exemption_type text,
  amount numeric,
  tax_year int
);
GRANT SELECT ON public.tax_exemptions TO anon, authenticated;
GRANT ALL ON public.tax_exemptions TO service_role;
ALTER TABLE public.tax_exemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_exemptions public read" ON public.tax_exemptions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.special_taxing_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  district_name text,
  district_type text,
  annual_fee numeric
);
GRANT SELECT ON public.special_taxing_districts TO anon, authenticated;
GRANT ALL ON public.special_taxing_districts TO service_role;
ALTER TABLE public.special_taxing_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "special_taxing public read" ON public.special_taxing_districts FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  permit_number text,
  permit_type text CHECK (permit_type IN ('building','electrical','plumbing','hvac','roofing','renovation','demolition','solar','pool','other')),
  description text,
  status text CHECK (status IN ('issued','finaled','expired','pending','denied')),
  issued_date date,
  finaled_date date,
  valuation numeric,
  source_url text
);
GRANT SELECT ON public.permits TO anon, authenticated;
GRANT ALL ON public.permits TO service_role;
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permits public read" ON public.permits FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.code_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  violation_number text,
  violation_type text,
  description text,
  status text CHECK (status IN ('open','closed','appealed')),
  opened_date date,
  closed_date date,
  fine_amount numeric,
  source_url text
);
GRANT SELECT ON public.code_violations TO anon, authenticated;
GRANT ALL ON public.code_violations TO service_role;
ALTER TABLE public.code_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "code_violations public read" ON public.code_violations FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.weather_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type text CHECK (event_type IN ('hail','wind','tornado','flood','fire','hurricane','snow_ice','other')),
  event_date date,
  severity text,
  source text DEFAULT 'NOAA',
  source_url text
);
GRANT SELECT ON public.weather_events TO anon, authenticated;
GRANT ALL ON public.weather_events TO service_role;
ALTER TABLE public.weather_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weather_events public read" ON public.weather_events FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.environmental_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  risk_type text CHECK (risk_type IN ('radon','lead_paint','asbestos','superfund_proximity','wildfire','sinkhole','soil','other')),
  risk_level text CHECK (risk_level IN ('low','moderate','high','unknown')),
  source_url text
);
GRANT SELECT ON public.environmental_risks TO anon, authenticated;
GRANT ALL ON public.environmental_risks TO service_role;
ALTER TABLE public.environmental_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "environmental_risks public read" ON public.environmental_risks FOR SELECT USING (true);

-- Gated: insurance claims (signed-in users only)
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  claim_type text,
  peril text,
  claim_date date,
  status text,
  data_license_status text DEFAULT 'requires_partnership',
  source_url text
);
GRANT SELECT ON public.insurance_claims TO authenticated;
GRANT ALL ON public.insurance_claims TO service_role;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insurance_claims auth read" ON public.insurance_claims FOR SELECT TO authenticated USING (true);

-- Contractors
CREATE TABLE IF NOT EXISTS public.contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_name text,
  company_name text,
  trade_type text,
  license_number text,
  license_type text,
  license_status text CHECK (license_status IN ('active','expired','revoked','suspended','unknown')),
  issuing_state_agency text,
  expiration_date date,
  insurance_status text CHECK (insurance_status IN ('verified','unverified','lapsed','unknown')),
  bond_status text CHECK (bond_status IN ('verified','unverified','none','unknown')),
  workers_comp_status text CHECK (workers_comp_status IN ('verified','unverified','exempt','unknown')),
  complaints_count int DEFAULT 0,
  complaints_detail jsonb,
  verification_score numeric(4,1),
  verified_date date,
  source_link text
);
GRANT SELECT ON public.contractors TO anon, authenticated;
GRANT ALL ON public.contractors TO service_role;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contractors public read" ON public.contractors FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.permit_contractors (
  permit_id uuid REFERENCES public.permits(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES public.contractors(id) ON DELETE CASCADE,
  role text,
  PRIMARY KEY (permit_id, contractor_id)
);
GRANT SELECT ON public.permit_contractors TO anon, authenticated;
GRANT ALL ON public.permit_contractors TO service_role;
ALTER TABLE public.permit_contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permit_contractors public read" ON public.permit_contractors FOR SELECT USING (true);

-- Market
CREATE TABLE IF NOT EXISTS public.market_comps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  comp_address text,
  comp_sale_price numeric,
  comp_sale_date date,
  comp_sqft int,
  distance_miles numeric(5,2),
  source text CHECK (source IN ('public_record','mls_licensed')),
  data_license_status text DEFAULT 'public_record',
  source_url text
);
GRANT SELECT ON public.market_comps TO anon, authenticated;
GRANT ALL ON public.market_comps TO service_role;
ALTER TABLE public.market_comps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_comps public read" ON public.market_comps FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.market_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  estimate_type text CHECK (estimate_type IN ('avm','rent','investor_value')),
  estimate_value numeric,
  estimate_date date,
  source text,
  data_license_status text DEFAULT 'requires_partnership'
);
GRANT SELECT ON public.market_estimates TO authenticated;
GRANT ALL ON public.market_estimates TO service_role;
ALTER TABLE public.market_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_estimates auth read" ON public.market_estimates FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.neighborhood_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id text NOT NULL,
  period date NOT NULL,
  median_sale_price numeric,
  price_change_pct numeric(5,2),
  median_days_on_market int,
  source_url text
);
GRANT SELECT ON public.neighborhood_trends TO anon, authenticated;
GRANT ALL ON public.neighborhood_trends TO service_role;
ALTER TABLE public.neighborhood_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "neighborhood_trends public read" ON public.neighborhood_trends FOR SELECT USING (true);

-- Schools (district + assignments — keep existing report-scoped schools table)
CREATE TABLE IF NOT EXISTS public.school_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text,
  phone text
);
GRANT SELECT ON public.school_districts TO anon, authenticated;
GRANT ALL ON public.school_districts TO service_role;
ALTER TABLE public.school_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_districts public read" ON public.school_districts FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.school_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  school_level text CHECK (school_level IN ('elementary','middle','high'))
);
GRANT SELECT ON public.school_assignments TO anon, authenticated;
GRANT ALL ON public.school_assignments TO service_role;
ALTER TABLE public.school_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_assignments public read" ON public.school_assignments FOR SELECT USING (true);

-- Crime & Safety
CREATE TABLE IF NOT EXISTS public.crime_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id text NOT NULL,
  report_type text,
  category text,
  incident_date date,
  source_url text
);
GRANT SELECT ON public.crime_reports TO anon, authenticated;
GRANT ALL ON public.crime_reports TO service_role;
ALTER TABLE public.crime_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crime_reports public read" ON public.crime_reports FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.crime_trend_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id text NOT NULL,
  period date NOT NULL,
  violent_crime_rate numeric,
  property_crime_rate numeric,
  trend_direction text CHECK (trend_direction IN ('improving','worsening','stable')),
  source_url text
);
GRANT SELECT ON public.crime_trend_summary TO anon, authenticated;
GRANT ALL ON public.crime_trend_summary TO service_role;
ALTER TABLE public.crime_trend_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crime_trend public read" ON public.crime_trend_summary FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.safety_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  district_type text CHECK (district_type IN ('police','fire','ems')),
  station_name text,
  station_address text,
  phone text,
  distance_miles numeric(5,2)
);
GRANT SELECT ON public.safety_districts TO anon, authenticated;
GRANT ALL ON public.safety_districts TO service_role;
ALTER TABLE public.safety_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "safety_districts public read" ON public.safety_districts FOR SELECT USING (true);

-- Living Outlook (property-scoped — alongside existing report-scoped scorecards)
CREATE TABLE IF NOT EXISTS public.living_outlook_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  overall_score numeric(4,1),
  schools_score numeric(4,1),
  crime_score numeric(4,1),
  market_growth_score numeric(4,1),
  tax_score numeric(4,1),
  utilities_score numeric(4,1),
  shopping_score numeric(4,1),
  healthcare_score numeric(4,1),
  commute_score numeric(4,1),
  parks_score numeric(4,1),
  development_score numeric(4,1),
  stability_score numeric(4,1),
  growth_potential_score numeric(4,1),
  methodology_version text,
  computed_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.living_outlook_scores TO anon, authenticated;
GRANT ALL ON public.living_outlook_scores TO service_role;
ALTER TABLE public.living_outlook_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "living_outlook public read" ON public.living_outlook_scores FOR SELECT USING (true);

-- Civic / Voter
CREATE TABLE IF NOT EXISTS public.property_jurisdictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  council_district text,
  state_house_district text,
  state_senate_district text,
  congressional_district text
);
GRANT SELECT ON public.property_jurisdictions TO anon, authenticated;
GRANT ALL ON public.property_jurisdictions TO service_role;
ALTER TABLE public.property_jurisdictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jurisdictions public read" ON public.property_jurisdictions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.voter_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  polling_place_name text,
  polling_place_address text,
  election_authority_name text,
  election_authority_contact text,
  registration_notes text,
  source_url text
);
GRANT SELECT ON public.voter_info TO anon, authenticated;
GRANT ALL ON public.voter_info TO service_role;
ALTER TABLE public.voter_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voter_info public read" ON public.voter_info FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.civic_services_nearby (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  service_type text CHECK (service_type IN ('dmv','city_hall')),
  name text,
  address text,
  distance_miles numeric(5,2),
  phone text,
  hours text
);
GRANT SELECT ON public.civic_services_nearby TO anon, authenticated;
GRANT ALL ON public.civic_services_nearby TO service_role;
ALTER TABLE public.civic_services_nearby ENABLE ROW LEVEL SECURITY;
CREATE POLICY "civic_services public read" ON public.civic_services_nearby FOR SELECT USING (true);

-- =================== PLATFORM TABLES ===================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text CHECK (plan IN ('free','full_report','realtor','builder','contractor_leads','investor_bulk','api','white_label')),
  status text CHECK (status IN ('active','canceled','past_due','trialing')),
  renews_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs select own" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "subs admin all" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  scopes text[],
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys own" ON public.api_keys FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.data_source_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  source_name text,
  source_url text,
  fetched_at timestamptz DEFAULT now(),
  data_license_status text CHECK (data_license_status IN ('public_record','licensed','requires_partnership','user_submitted'))
);
GRANT SELECT ON public.data_source_log TO authenticated;
GRANT ALL ON public.data_source_log TO service_role;
ALTER TABLE public.data_source_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "data_source_log admin read" ON public.data_source_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
