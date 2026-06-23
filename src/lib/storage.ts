import { supabase } from "@/integrations/supabase/client";

const BUCKET = "property-files";
const DEFAULT_TTL = 60 * 10; // 10 minutes

/** Upload a file scoped to a property. Returns the storage path. */
export async function uploadPropertyFile(propertyId: string, file: File, subpath = ""): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = [propertyId, subpath, `${Date.now()}-${safeName}`].filter(Boolean).join("/");
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Generate a short-lived signed URL for a private file. */
export async function getSignedFileUrl(path: string, ttlSeconds: number = DEFAULT_TTL): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not sign URL");
  return data.signedUrl;
}

/** Best-effort: take either a stored path or a legacy public URL and return a usable signed URL. */
export async function resolveFileUrl(pathOrUrl: string, ttlSeconds: number = DEFAULT_TTL): Promise<string> {
  if (!pathOrUrl) return pathOrUrl;
  // legacy public URL: extract the storage path after the bucket name
  const publicMarker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = pathOrUrl.indexOf(publicMarker);
  if (idx !== -1) {
    const path = pathOrUrl.slice(idx + publicMarker.length);
    return getSignedFileUrl(path, ttlSeconds);
  }
  // already a signed URL or external URL — return as-is
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return getSignedFileUrl(pathOrUrl, ttlSeconds);
}
