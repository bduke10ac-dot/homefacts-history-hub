create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Replace public-read with: authenticated can list/read; everyone can read via signed URLs/public URLs already works because bucket is public, but we keep direct file read too.
drop policy if exists "Public read property files" on storage.objects;
create policy "Authenticated read property files" on storage.objects for select
  to authenticated using (bucket_id = 'property-files');
-- Allow anonymous direct file reads (needed for shareable report links)
create policy "Anon read property files" on storage.objects for select
  to anon using (bucket_id = 'property-files');