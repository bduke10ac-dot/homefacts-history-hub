
-- Storage policies for the property-files bucket (now private).
-- Path convention: <property_id>/<rest>  OR  builder-logos/<rest>  OR  estate/<user_id>/<rest>

DROP POLICY IF EXISTS "property_files_read" ON storage.objects;
DROP POLICY IF EXISTS "property_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "property_files_update" ON storage.objects;
DROP POLICY IF EXISTS "property_files_delete" ON storage.objects;

-- READ: admin, property member, or uploader (owner)
CREATE POLICY "property_files_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'property-files'
  AND (
    public.has_role(auth.uid(),'admin')
    OR owner = auth.uid()
    OR (
      -- first path segment is a property uuid the user is a member of
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.is_property_member(((storage.foldername(name))[1])::uuid, auth.uid())
    )
  )
);

-- INSERT: any authenticated user can upload to a property they belong to, or to a user-scoped path
CREATE POLICY "property_files_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-files'
  AND (
    public.has_role(auth.uid(),'admin')
    OR (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.is_property_member(((storage.foldername(name))[1])::uuid, auth.uid())
    )
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- UPDATE: uploader or admin
CREATE POLICY "property_files_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='property-files' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin')));

-- DELETE: uploader or admin
CREATE POLICY "property_files_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='property-files' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin')));
