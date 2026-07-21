
-- =========================
-- Deal Analyzer: Phase 1 schema
-- =========================

CREATE TABLE public.deal_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  strategy text CHECK (strategy IN (
    'buy_and_hold','brrrr','fix_and_flip','rental','wholesale',
    'owner_occupied_renovation','current_equity','custom'
  )),
  status text NOT NULL DEFAULT 'draft',
  active_scenario_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_analysis_id uuid NOT NULL REFERENCES public.deal_analyses(id) ON DELETE CASCADE,
  scenario_name text,
  purchase_price numeric,
  current_value numeric,
  after_repair_value numeric,
  monthly_rent numeric,
  financing_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  expense_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  assumptions_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  results_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_analyses
  ADD CONSTRAINT deal_analyses_active_scenario_fk
  FOREIGN KEY (active_scenario_id) REFERENCES public.deal_scenarios(id) ON DELETE SET NULL;

CREATE TABLE public.renovation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  deal_analysis_id uuid NOT NULL REFERENCES public.deal_analyses(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES public.deal_scenarios(id) ON DELETE CASCADE,
  property_record_id uuid,
  category text CHECK (category IN (
    'roofing','gutters','siding','windows','doors','foundation','structural',
    'hvac','plumbing','electrical','water_heater','kitchen','bathrooms',
    'flooring','drywall','painting','landscaping','permits','gc_overhead',
    'contingency','other'
  )),
  description text,
  source_type text CHECK (source_type IN ('orivaz_record','contractor_estimate','user_entered','notes_only')),
  source_reference text,
  estimated_cost numeric,
  actual_cost numeric,
  included boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_analysis_id uuid NOT NULL REFERENCES public.deal_analyses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type text,
  report_data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_deal_analyses_property_id ON public.deal_analyses(property_id);
CREATE INDEX idx_deal_analyses_user_id ON public.deal_analyses(user_id);
CREATE INDEX idx_deal_scenarios_deal_analysis_id ON public.deal_scenarios(deal_analysis_id);
CREATE INDEX idx_renovation_items_property_id ON public.renovation_items(property_id);
CREATE INDEX idx_renovation_items_deal_analysis_id ON public.renovation_items(deal_analysis_id);
CREATE INDEX idx_renovation_items_scenario_id ON public.renovation_items(scenario_id);
CREATE INDEX idx_deal_reports_deal_analysis_id ON public.deal_reports(deal_analysis_id);

-- Grants (auth-only; no anon access — private by default)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_analyses TO authenticated;
GRANT ALL ON public.deal_analyses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_scenarios TO authenticated;
GRANT ALL ON public.deal_scenarios TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.renovation_items TO authenticated;
GRANT ALL ON public.renovation_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_reports TO authenticated;
GRANT ALL ON public.deal_reports TO service_role;

-- RLS
ALTER TABLE public.deal_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_reports ENABLE ROW LEVEL SECURITY;

-- deal_analyses: gated on property membership (reuses existing is_property_member)
CREATE POLICY "Deal analyses readable by property members"
  ON public.deal_analyses FOR SELECT TO authenticated
  USING (public.is_property_member(property_id, auth.uid()));

CREATE POLICY "Deal analyses insertable by property members"
  ON public.deal_analyses FOR INSERT TO authenticated
  WITH CHECK (
    public.is_property_member(property_id, auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Deal analyses updatable by property members"
  ON public.deal_analyses FOR UPDATE TO authenticated
  USING (public.is_property_member(property_id, auth.uid()))
  WITH CHECK (public.is_property_member(property_id, auth.uid()));

CREATE POLICY "Deal analyses deletable by property members"
  ON public.deal_analyses FOR DELETE TO authenticated
  USING (public.is_property_member(property_id, auth.uid()));

-- deal_scenarios: access via parent deal_analyses -> property membership
CREATE POLICY "Deal scenarios readable by property members"
  ON public.deal_scenarios FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_scenarios.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ));

CREATE POLICY "Deal scenarios insertable by property members"
  ON public.deal_scenarios FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_scenarios.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ));

CREATE POLICY "Deal scenarios updatable by property members"
  ON public.deal_scenarios FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_scenarios.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_scenarios.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ));

CREATE POLICY "Deal scenarios deletable by property members"
  ON public.deal_scenarios FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_scenarios.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ));

-- renovation_items: gated on property membership
CREATE POLICY "Renovation items readable by property members"
  ON public.renovation_items FOR SELECT TO authenticated
  USING (public.is_property_member(property_id, auth.uid()));

CREATE POLICY "Renovation items insertable by property members"
  ON public.renovation_items FOR INSERT TO authenticated
  WITH CHECK (public.is_property_member(property_id, auth.uid()));

CREATE POLICY "Renovation items updatable by property members"
  ON public.renovation_items FOR UPDATE TO authenticated
  USING (public.is_property_member(property_id, auth.uid()))
  WITH CHECK (public.is_property_member(property_id, auth.uid()));

CREATE POLICY "Renovation items deletable by property members"
  ON public.renovation_items FOR DELETE TO authenticated
  USING (public.is_property_member(property_id, auth.uid()));

-- deal_reports: access via parent deal_analyses -> property membership
CREATE POLICY "Deal reports readable by property members"
  ON public.deal_reports FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_reports.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ));

CREATE POLICY "Deal reports insertable by property members"
  ON public.deal_reports FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_reports.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ));

CREATE POLICY "Deal reports updatable by property members"
  ON public.deal_reports FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_reports.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_reports.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ));

CREATE POLICY "Deal reports deletable by property members"
  ON public.deal_reports FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deal_analyses da
    WHERE da.id = deal_reports.deal_analysis_id
      AND public.is_property_member(da.property_id, auth.uid())
  ));

-- updated_at triggers (reuse existing set_updated_at)
CREATE TRIGGER trg_deal_analyses_updated_at BEFORE UPDATE ON public.deal_analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_deal_scenarios_updated_at BEFORE UPDATE ON public.deal_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_renovation_items_updated_at BEFORE UPDATE ON public.renovation_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
