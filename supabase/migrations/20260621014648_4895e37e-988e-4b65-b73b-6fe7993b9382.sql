
-- Certification tier enum
CREATE TYPE public.builder_cert_level AS ENUM ('certified', 'plus', 'elite');

ALTER TABLE public.builder_companies
  ADD COLUMN slug text UNIQUE,
  ADD COLUMN tagline text,
  ADD COLUMN years_in_business int,
  ADD COLUMN service_areas text[],
  ADD COLUMN certification_level public.builder_cert_level NOT NULL DEFAULT 'certified',
  ADD COLUMN certified_since date DEFAULT CURRENT_DATE,
  ADD COLUMN public_profile_enabled boolean NOT NULL DEFAULT true;

-- Backfill slug for any existing rows
UPDATE public.builder_companies
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Public read of builder profiles when enabled
CREATE POLICY "Public can view enabled builder profiles"
ON public.builder_companies FOR SELECT
TO anon, authenticated
USING (public_profile_enabled = true);

GRANT SELECT ON public.builder_companies TO anon;

-- Public read of clones via handoff token (anon) for AI assistant + passport
CREATE POLICY "Public can read clone by handoff token context"
ON public.nb_property_clones FOR SELECT
TO anon
USING (status IN ('handed_off','transferred'));

CREATE POLICY "Public read clone warranties via handoff"
ON public.nb_clone_warranties FOR SELECT
TO anon
USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND c.status IN ('handed_off','transferred')));

CREATE POLICY "Public read clone docs via handoff"
ON public.nb_clone_documents FOR SELECT
TO anon
USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.id = clone_id AND c.status IN ('handed_off','transferred')));

GRANT SELECT ON public.nb_property_clones TO anon;
GRANT SELECT ON public.nb_clone_warranties TO anon;
GRANT SELECT ON public.nb_clone_documents TO anon;
GRANT SELECT ON public.nb_template_guide_items TO anon;

CREATE POLICY "Public read guide items via handoff"
ON public.nb_template_guide_items FOR SELECT
TO anon
USING (EXISTS (SELECT 1 FROM public.nb_property_clones c WHERE c.template_id = nb_template_guide_items.template_id AND c.status IN ('handed_off','transferred')));
