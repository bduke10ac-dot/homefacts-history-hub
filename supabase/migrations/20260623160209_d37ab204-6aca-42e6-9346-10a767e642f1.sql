
ALTER TABLE public.builder_companies
  ADD COLUMN IF NOT EXISTS founding_builder_number integer,
  ADD COLUMN IF NOT EXISTS is_founding_builder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.nb_property_clones
  ADD COLUMN IF NOT EXISTS construction_stage text,
  ADD COLUMN IF NOT EXISTS construction_stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS handoff_packet_url text;
