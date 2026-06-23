import { corsHeaders } from "../_shared/ai-gateway.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const FACTORS = [
  "roof_age","roof_material","storm_exposure","claim_history","tree_risks",
  "maintenance_documentation","inspection_records","electrical_updates","plumbing_updates",
  "hvac_condition","foundation_condition","fire_safety","smoke_detectors","co_detectors",
  "water_shutoff","security_system","flood_risk","wind_hail_risk",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { property_id, factors_override } = await req.json();
    if (!property_id) return new Response(JSON.stringify({ error: "property_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: prop }, { data: records }, { data: claims }] = await Promise.all([
      supa.from("properties").select("*").eq("id", property_id).single(),
      supa.from("property_records").select("*").eq("property_id", property_id),
      supa.from("insurance_claims").select("*").eq("property_id", property_id),
    ]);

    const age = prop?.year_built ? new Date().getFullYear() - prop.year_built : 30;
    const recCount = (records ?? []).length;
    const claimCount = (claims ?? []).length;

    // Score each factor 0–100; allow override
    const base: Record<string, number> = {
      roof_age: Math.max(20, 100 - age * 2),
      roof_material: 70,
      storm_exposure: 65,
      claim_history: Math.max(20, 100 - claimCount * 20),
      tree_risks: 75,
      maintenance_documentation: Math.min(100, 40 + recCount * 5),
      inspection_records: Math.min(100, 40 + (records ?? []).filter((r: any) => /inspection/i.test(r.category)).length * 15),
      electrical_updates: Math.max(30, 100 - age * 1.5),
      plumbing_updates: Math.max(30, 100 - age * 1.5),
      hvac_condition: 70,
      foundation_condition: Math.max(40, 100 - age),
      fire_safety: 70, smoke_detectors: 80, co_detectors: 70,
      water_shutoff: 60, security_system: 60,
      flood_risk: 70, wind_hail_risk: 65,
    };
    const factors = { ...base, ...(factors_override ?? {}) };
    const overall = Math.round(FACTORS.reduce((s, f) => s + (factors[f] ?? 70), 0) / FACTORS.length);

    const savings = overall >= 85 ? 50000 : overall >= 70 ? 25000 : 0; // cents = $250-$500/yr typical
    const docs = [
      { label: "Roof age/installation receipt", done: factors.roof_age >= 70 },
      { label: "Latest inspection report", done: factors.inspection_records >= 70 },
      { label: "Electrical panel update receipt", done: factors.electrical_updates >= 70 },
      { label: "Plumbing service records", done: factors.plumbing_updates >= 70 },
      { label: "Photos of every room/exterior elevation", done: false },
    ];
    const claimReady = [
      { label: "Personal property inventory (Disaster Vault)", done: false },
      { label: "Pre-loss photos within last 12 months", done: false },
      { label: "Policy declarations page on file", done: false },
      { label: "Mortgagee/lender contact saved", done: false },
    ];
    const questions = [
      "Am I covered for wind/hail with a separate deductible?",
      "Is my dwelling limit keeping up with rebuild costs?",
      "Do I have ordinance-and-law coverage?",
      "Is my roof on ACV or replacement cost basis?",
      "What discounts apply for monitored security or water shutoff?",
    ];

    const row = {
      property_id,
      overall_score: overall,
      summary: `Insurance readiness score ${overall}/100. Estimated annual premium savings opportunity: $${(savings/100).toFixed(0)}.`,
      factors,
      premium_savings_estimate_cents: savings,
      documentation_checklist: docs,
      claim_readiness_checklist: claimReady,
      recommended_coverage_questions: questions,
      computed_at: new Date().toISOString(),
    };
    const { data, error } = await supa.from("insurance_readiness_scores").insert(row).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
