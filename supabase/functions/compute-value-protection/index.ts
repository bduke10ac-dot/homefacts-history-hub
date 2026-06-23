import { corsHeaders } from "../_shared/ai-gateway.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { property_id } = await req.json();
    if (!property_id) return new Response(JSON.stringify({ error: "property_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: records }, { data: permits }, { data: irs }] = await Promise.all([
      supa.from("property_records").select("category,verified,performed_at").eq("property_id", property_id),
      supa.from("permits").select("id").eq("property_id", property_id),
      supa.from("insurance_readiness_scores").select("overall_score").eq("property_id", property_id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const recs = records ?? [];
    const maintenance_consistency = Math.min(100, recs.length * 8);
    const documented_repairs = Math.min(100, recs.filter((r: any) => /repair|fix/i.test(r.category)).length * 15 + 40);
    const verified_contractors = Math.min(100, recs.filter((r: any) => r.verified).length * 12 + 40);
    const permitted_work = Math.min(100, (permits?.length ?? 0) * 15 + 40);
    const warranty_tracking = 65;
    const energy_improvements = Math.min(100, recs.filter((r: any) => /solar|insulat|window|efficient/i.test(r.category)).length * 25 + 40);
    const safety_upgrades = Math.min(100, recs.filter((r: any) => /smoke|alarm|security|safety/i.test(r.category)).length * 20 + 50);
    const insurance_readiness = irs?.overall_score ?? 70;
    const neighborhood_trends = 70;
    const market_comparison = 70;
    const resale_documentation = Math.min(100, recs.length * 5 + 40);
    const overall = Math.round((maintenance_consistency + documented_repairs + verified_contractors + permitted_work + warranty_tracking + energy_improvements + safety_upgrades + insurance_readiness + neighborhood_trends + market_comparison + resale_documentation) / 11);

    const row = {
      property_id, overall_score: overall,
      summary: `Home Value Protection score ${overall}/100 — measures how well you're protecting long-term value.`,
      maintenance_consistency, documented_repairs, verified_contractors, permitted_work,
      warranty_tracking, energy_improvements, safety_upgrades, insurance_readiness,
      neighborhood_trends, market_comparison, resale_documentation,
      computed_at: new Date().toISOString(),
    };
    const { data, error } = await supa.from("home_value_protection_scores").insert(row).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
