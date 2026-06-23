
DROP POLICY IF EXISTS "builder_logos_read" ON storage.objects;
DROP POLICY IF EXISTS "builder_logos_write" ON storage.objects;
DROP POLICY IF EXISTS "builder_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "builder_logos_delete" ON storage.objects;

CREATE POLICY "builder_logos_read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'builder-logos');

CREATE POLICY "builder_logos_write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'builder-logos'
  AND (
    public.has_role(auth.uid(),'admin')
    OR (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.is_builder_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
    )
  )
);

CREATE POLICY "builder_logos_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'builder-logos'
  AND (
    public.has_role(auth.uid(),'admin')
    OR owner = auth.uid()
    OR (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.is_builder_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
    )
  )
);

CREATE POLICY "builder_logos_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'builder-logos' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin')));
