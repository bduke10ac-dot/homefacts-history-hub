
-- 1. property_boundaries
CREATE TABLE public.property_boundaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  parcel_number text,
  legal_description text,
  lot_dimensions text,
  acreage numeric,
  lot_size_sqft numeric,
  zoning text,
  future_land_use text,
  overlay_districts text[],
  flood_zone text,
  base_flood_elevation numeric,
  fema_flood_risk text,
  land_value numeric,
  improvement_value numeric,
  property_classification text,
  county_gis_url text,
  assessor_url text,
  geometry_geojson jsonb,
  centroid_lat numeric,
  centroid_lng numeric,
  source text,
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);
GRANT SELECT ON public.property_boundaries TO anon, authenticated;
GRANT ALL ON public.property_boundaries TO service_role;
ALTER TABLE public.property_boundaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view boundaries" ON public.property_boundaries FOR SELECT USING (true);
CREATE POLICY "Owners/admins manage boundaries" ON public.property_boundaries FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_property_boundaries_updated BEFORE UPDATE ON public.property_boundaries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. property_easements
CREATE TABLE public.property_easements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  easement_type text NOT NULL,
  width_feet numeric,
  description text,
  restrictions text,
  recorded_doc_ref text,
  recorded_date date,
  location_geojson jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_easements TO anon, authenticated;
GRANT ALL ON public.property_easements TO service_role;
ALTER TABLE public.property_easements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view easements" ON public.property_easements FOR SELECT USING (true);
CREATE POLICY "Owners/admins manage easements" ON public.property_easements FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_property_easements_updated BEFORE UPDATE ON public.property_easements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. property_surveys
CREATE TABLE public.property_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  survey_type text NOT NULL,
  document_url text,
  document_name text,
  survey_date date,
  surveyor_company text,
  surveyor_license text,
  surveyor_name text,
  notes text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_surveys TO authenticated;
GRANT ALL ON public.property_surveys TO service_role;
ALTER TABLE public.property_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed view surveys" ON public.property_surveys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners/admins manage surveys" ON public.property_surveys FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR uploaded_by = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR uploaded_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_property_surveys_updated BEFORE UPDATE ON public.property_surveys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. property_plat_maps
CREATE TABLE public.property_plat_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  subdivision_name text,
  plat_book text,
  plat_page text,
  recorded_date date,
  document_url text,
  thumbnail_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_plat_maps TO anon, authenticated;
GRANT ALL ON public.property_plat_maps TO service_role;
ALTER TABLE public.property_plat_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view plats" ON public.property_plat_maps FOR SELECT USING (true);
CREATE POLICY "Owners/admins manage plats" ON public.property_plat_maps FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_property_plat_maps_updated BEFORE UPDATE ON public.property_plat_maps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. property_ai_boundary_observations
CREATE TABLE public.property_ai_boundary_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  feature_type text NOT NULL,
  observation text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  confidence numeric,
  location_geojson jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_ai_boundary_observations TO anon, authenticated;
GRANT ALL ON public.property_ai_boundary_observations TO service_role;
ALTER TABLE public.property_ai_boundary_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view AI observations" ON public.property_ai_boundary_observations FOR SELECT USING (true);
CREATE POLICY "Owners/admins manage AI observations" ON public.property_ai_boundary_observations FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_property_ai_obs_updated BEFORE UPDATE ON public.property_ai_boundary_observations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. property_satellite_snapshots
CREATE TABLE public.property_satellite_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  captured_on date NOT NULL,
  image_url text,
  thumbnail_url text,
  change_summary text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_satellite_snapshots TO anon, authenticated;
GRANT ALL ON public.property_satellite_snapshots TO service_role;
ALTER TABLE public.property_satellite_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view snapshots" ON public.property_satellite_snapshots FOR SELECT USING (true);
CREATE POLICY "Owners/admins manage snapshots" ON public.property_satellite_snapshots FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_property_sat_updated BEFORE UPDATE ON public.property_satellite_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. property_confidence_scores
CREATE TABLE public.property_confidence_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  overall_score int NOT NULL DEFAULT 0,
  has_recorded_survey boolean DEFAULT false,
  has_verified_permits boolean DEFAULT false,
  has_licensed_contractor_docs boolean DEFAULT false,
  has_inspector_reports boolean DEFAULT false,
  has_gis_records boolean DEFAULT false,
  has_recorded_deeds boolean DEFAULT false,
  has_plat_map boolean DEFAULT false,
  has_utility_verification boolean DEFAULT false,
  has_homeowner_docs boolean DEFAULT false,
  factors jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);
GRANT SELECT ON public.property_confidence_scores TO anon, authenticated;
GRANT ALL ON public.property_confidence_scores TO service_role;
ALTER TABLE public.property_confidence_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view confidence" ON public.property_confidence_scores FOR SELECT USING (true);
CREATE POLICY "Owners/admins manage confidence" ON public.property_confidence_scores FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_property_conf_updated BEFORE UPDATE ON public.property_confidence_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
