
-- 1. Estate planning: re-scope owner policies from `public` to `authenticated`
DO $$
DECLARE
  t text;
  p text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'estate_checklist_items','estate_documents','estate_incapacity_plans',
    'estate_probate_tasks','estate_reviews'
  ]) LOOP
    FOR p IN SELECT policyname FROM pg_policies
             WHERE schemaname='public' AND tablename=t AND 'public' = ANY(roles)
    LOOP
      EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated', p, t);
    END LOOP;
  END LOOP;
END $$;

-- 2. Builder logos: allow public/anon read
DROP POLICY IF EXISTS builder_logos_read ON storage.objects;
CREATE POLICY builder_logos_read ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'builder-logos');
