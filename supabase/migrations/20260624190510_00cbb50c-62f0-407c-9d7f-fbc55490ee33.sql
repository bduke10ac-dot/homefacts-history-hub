
CREATE TABLE IF NOT EXISTS public.property_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL DEFAULT now(),
  related_document_id uuid,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_timeline_events TO authenticated;
GRANT ALL ON public.property_timeline_events TO service_role;

ALTER TABLE public.property_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view timeline events"
  ON public.property_timeline_events FOR SELECT
  TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners insert timeline events"
  ON public.property_timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners update timeline events"
  ON public.property_timeline_events FOR UPDATE
  TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners delete timeline events"
  ON public.property_timeline_events FOR DELETE
  TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS property_timeline_events_property_idx
  ON public.property_timeline_events(property_id, event_date DESC);

CREATE TRIGGER property_timeline_events_set_updated_at
  BEFORE UPDATE ON public.property_timeline_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
