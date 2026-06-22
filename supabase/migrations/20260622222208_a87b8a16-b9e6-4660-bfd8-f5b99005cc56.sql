
-- Phase 1: Property Operating System core tables

-- 1. Home Confidence Score
CREATE TABLE public.home_confidence_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  overall_score int NOT NULL DEFAULT 0,
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_summary jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_confidence_scores TO authenticated;
GRANT SELECT ON public.home_confidence_scores TO anon;
GRANT ALL ON public.home_confidence_scores TO service_role;
ALTER TABLE public.home_confidence_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "confidence_read_all" ON public.home_confidence_scores FOR SELECT USING (true);
CREATE POLICY "confidence_owner_write" ON public.home_confidence_scores FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- 2. Home Health Sections (one row per system per property)
CREATE TABLE public.home_health_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  section text NOT NULL,
  install_date date,
  lifespan_years int,
  contractor_name text,
  warranty_expires date,
  risk_level text DEFAULT 'unknown',
  status text DEFAULT 'good',
  next_maintenance_date date,
  replacement_estimate_cents int,
  notes text,
  photos jsonb DEFAULT '[]'::jsonb,
  ai_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, section)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_health_sections TO authenticated;
GRANT SELECT ON public.home_health_sections TO anon;
GRANT ALL ON public.home_health_sections TO service_role;
ALTER TABLE public.home_health_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_read_all" ON public.home_health_sections FOR SELECT USING (true);
CREATE POLICY "health_owner_write" ON public.home_health_sections FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- 3. Timeline Events
CREATE TABLE public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  cost_cents int,
  contractor_name text,
  verified boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_events TO authenticated;
GRANT SELECT ON public.timeline_events TO anon;
GRANT ALL ON public.timeline_events TO service_role;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline_read_all" ON public.timeline_events FOR SELECT USING (true);
CREATE POLICY "timeline_owner_write" ON public.timeline_events FOR ALL TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- 4. AI Assistant query log (per property)
CREATE TABLE public.ai_assistant_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text,
  confidence text,
  sources jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.ai_assistant_queries TO authenticated;
GRANT ALL ON public.ai_assistant_queries TO service_role;
ALTER TABLE public.ai_assistant_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_q_read_owner" ON public.ai_assistant_queries FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ai_q_insert_auth" ON public.ai_assistant_queries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. Verification Badges
CREATE TABLE public.verification_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, badge_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_badges TO authenticated;
GRANT SELECT ON public.verification_badges TO anon;
GRANT ALL ON public.verification_badges TO service_role;
ALTER TABLE public.verification_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_read_all" ON public.verification_badges FOR SELECT USING (true);
CREATE POLICY "badges_admin_write" ON public.verification_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "badges_owner_insert" ON public.verification_badges FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_confidence_updated BEFORE UPDATE ON public.home_confidence_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_health_updated BEFORE UPDATE ON public.home_health_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_timeline_updated BEFORE UPDATE ON public.timeline_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_badges_updated BEFORE UPDATE ON public.verification_badges FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- helpful indexes
CREATE INDEX idx_health_property ON public.home_health_sections(property_id);
CREATE INDEX idx_timeline_property_date ON public.timeline_events(property_id, occurred_at DESC);
CREATE INDEX idx_ai_q_property ON public.ai_assistant_queries(property_id, created_at DESC);
CREATE INDEX idx_badges_property ON public.verification_badges(property_id);
