
-- Property Trust Score (documentation completeness, 0-1000)
CREATE TABLE public.property_trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT 'Incomplete',
  completed_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX property_trust_scores_property_id_key ON public.property_trust_scores(property_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_trust_scores TO authenticated;
GRANT ALL ON public.property_trust_scores TO service_role;
ALTER TABLE public.property_trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read trust score" ON public.property_trust_scores
  FOR SELECT TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners write trust score" ON public.property_trust_scores
  FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners update trust score" ON public.property_trust_scores
  FOR UPDATE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete trust score" ON public.property_trust_scores
  FOR DELETE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_property_trust_scores_updated
  BEFORE UPDATE ON public.property_trust_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Generic certification ledger (property | contractor | builder)
CREATE TABLE public.certification_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('property','contractor','builder')),
  entity_id uuid NOT NULL,
  certification_level text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  requirements_met jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements_missing jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX certification_records_entity_idx ON public.certification_records(entity_type, entity_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certification_records TO authenticated;
GRANT ALL ON public.certification_records TO service_role;
ALTER TABLE public.certification_records ENABLE ROW LEVEL SECURITY;

-- Property entities: gated by property ownership. Contractor/builder rows: admin-only for now (Phase 4 wires those up).
CREATE POLICY "Read property certifications" ON public.certification_records
  FOR SELECT TO authenticated
  USING (
    (entity_type = 'property' AND public.is_property_owner(entity_id, auth.uid()))
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Write property certifications" ON public.certification_records
  FOR INSERT TO authenticated
  WITH CHECK (
    (entity_type = 'property' AND public.is_property_owner(entity_id, auth.uid()))
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Update property certifications" ON public.certification_records
  FOR UPDATE TO authenticated
  USING (
    (entity_type = 'property' AND public.is_property_owner(entity_id, auth.uid()))
    OR public.has_role(auth.uid(),'admin')
  )
  WITH CHECK (
    (entity_type = 'property' AND public.is_property_owner(entity_id, auth.uid()))
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Delete property certifications" ON public.certification_records
  FOR DELETE TO authenticated
  USING (
    (entity_type = 'property' AND public.is_property_owner(entity_id, auth.uid()))
    OR public.has_role(auth.uid(),'admin')
  );

CREATE TRIGGER trg_certification_records_updated
  BEFORE UPDATE ON public.certification_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
