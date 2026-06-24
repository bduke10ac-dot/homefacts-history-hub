// Deletes a property and all dependent rows (via FK CASCADE) plus storage files.
// Only the property owner (claimed_by/created_by/active property_owners) or an admin can delete.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const BUCKETS = ["property-files"];

async function purgeBucketPrefix(admin: ReturnType<typeof createClient>, bucket: string, prefix: string) {
  // Recursively list and remove all objects under prefix/
  const toRemove: string[] = [];
  async function walk(p: string) {
    const { data, error } = await admin.storage.from(bucket).list(p, { limit: 1000 });
    if (error || !data) return;
    for (const entry of data) {
      const full = p ? `${p}/${entry.name}` : entry.name;
      // Folders have no id/metadata
      if ((entry as any).id === null || !(entry as any).metadata) {
        await walk(full);
      } else {
        toRemove.push(full);
      }
    }
  }
  await walk(prefix);
  if (toRemove.length) {
    // remove in chunks
    for (let i = 0; i < toRemove.length; i += 100) {
      await admin.storage.from(bucket).remove(toRemove.slice(i, i + 100));
    }
  }
  return toRemove.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const propertyId = String(body.property_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(propertyId)) return json({ error: "Invalid property_id" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Authorization: admin or property owner
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;

    const { data: prop, error: propErr } = await admin
      .from("properties")
      .select("id, claimed_by, created_by, address_line")
      .eq("id", propertyId)
      .maybeSingle();
    if (propErr) return json({ error: propErr.message }, 500);
    if (!prop) return json({ error: "Not found" }, 404);

    let allowed = isAdmin || prop.claimed_by === userId || prop.created_by === userId;
    if (!allowed) {
      const { data: owner } = await admin
        .from("property_owners")
        .select("user_id")
        .eq("property_id", propertyId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();
      allowed = !!owner;
    }
    if (!allowed) return json({ error: "Forbidden" }, 403);

    // Purge storage objects scoped to this property
    let filesRemoved = 0;
    for (const b of BUCKETS) {
      try { filesRemoved += await purgeBucketPrefix(admin, b, propertyId); } catch (_) { /* ignore */ }
    }

    // Audit log (best-effort)
    await admin.from("audit_logs").insert({
      actor_user_id: userId,
      action: "property.deleted",
      entity_type: "property",
      entity_id: propertyId,
      property_id: propertyId,
      metadata: { address_line: prop.address_line, files_removed: filesRemoved, by_admin: isAdmin },
    });

    // Hard delete — FK CASCADE handles all dependent tables.
    const { error: delErr } = await admin.from("properties").delete().eq("id", propertyId);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ ok: true, files_removed: filesRemoved });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
