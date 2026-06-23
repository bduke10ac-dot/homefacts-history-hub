import { corsHeaders } from "../_shared/ai-gateway.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { property_id } = await req.json();
    if (!property_id) return new Response(JSON.stringify({ error: "property_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: prop }, { data: recs }, { data: permits }, { data: claims }, { data: irs }, { data: hvp }] = await Promise.all([
      supa.from("properties").select("claimed_by").eq("id", property_id).single(),
      supa.from("property_records").select("verified,category").eq("property_id", property_id),
      supa.from("permits").select("id").eq("property_id", property_id),
      supa.from("insurance_claims").select("id").eq("property_id", property_id),
      supa.from("insurance_readiness_scores").select("overall_score").eq("property_id", property_id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
      supa.from("home_value_protection_scores").select("overall_score").eq("property_id", property_id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const recCount = (recs ?? []).length;
    const verifiedRecCount = (recs ?? []).filter((r: any) => r.verified).length;
    const permitCount = permits?.length ?? 0;
    const criteria = {
      ownership_verified: !!prop?.claimed_by,
      documents_uploaded: recCount >= 5,
      contractors_verified: verifiedRecCount >= 1,
      permits_matched: permitCount >= 1,
      warranties_verified: false,
      maintenance_current: recCount >= 3,
      insurance_reviewed: !!irs?.overall_score && irs.overall_score >= 60,
      ai_reviewed: !!hvp?.overall_score,
      photos_attached: false,
      safety_checklist_done: false,
    };
    const met = Object.values(criteria).filter(Boolean).length;
    const tier = met >= 9 ? "platinum" : met >= 7 ? "gold" : met >= 5 ? "silver" : met >= 3 ? "bronze" : "none";

    const { data, error } = await supa.from("certification_status").upsert({
      property_id, tier, criteria_met: criteria, issued_at: tier !== "none" ? new Date().toISOString() : null,
    }, { onConflict: "property_id" }).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
