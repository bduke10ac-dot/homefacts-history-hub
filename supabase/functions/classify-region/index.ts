// Classify a property's region (climate zone, region classification) from
// state/lat/lon. Stub — uses a simple state-based table; will be replaced
// with IECC/Köppen logic in the Module D master prompt.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATE_TO_ZONE: Record<string, { climate_zone: string; region_classification: string }> = {
  TX: { climate_zone: "2A", region_classification: "South Central" },
  CA: { climate_zone: "3B", region_classification: "West" },
  FL: { climate_zone: "1A", region_classification: "Southeast" },
  NY: { climate_zone: "5A", region_classification: "Northeast" },
  TN: { climate_zone: "4A", region_classification: "Southeast" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { property_id } = await req.json();
    if (!property_id) return new Response(JSON.stringify({ error: "property_id required" }), { status: 400, headers: corsHeaders });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: prop } = await admin.from("properties").select("state").eq("id", property_id).maybeSingle();
    if (!prop) return new Response(JSON.stringify({ error: "property not found" }), { status: 404, headers: corsHeaders });

    const zone = STATE_TO_ZONE[prop.state ?? ""] ?? { climate_zone: "unknown", region_classification: "unknown" };
    await admin.from("regional_property_profile").upsert({
      property_id,
      state_code: prop.state,
      climate_zone: zone.climate_zone,
      region_classification: zone.region_classification,
      classified_at: new Date().toISOString(),
    }, { onConflict: "property_id" });

    return new Response(JSON.stringify({ property_id, ...zone }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
