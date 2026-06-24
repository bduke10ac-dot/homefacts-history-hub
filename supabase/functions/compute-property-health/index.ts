// Phase 1 Revenue Intelligence: compute health score + opportunities for a single property.
// Hydrates property_intelligence risk fields from hazard_intelligence/regional_property_profile,
// then heuristically scores each system and writes property_health_scores + property_opportunities.
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CURRENT_YEAR = new Date().getFullYear();

// Expected lifespan (years) per system — used to translate install year → score.
const LIFESPANS: Record<string, number> = {
  roof: 25,
  hvac: 15,
  water_heater: 12,
  electrical: 40,
  plumbing: 60,
  exterior: 30,
  foundation: 80,
};

const URGENCY = (remainingPct: number): "low" | "medium" | "high" => {
  if (remainingPct <= 0.15) return "high";
  if (remainingPct <= 0.4) return "medium";
  return "low";
};

const ageScore = (installYear: number | null | undefined, lifespan: number, yearBuilt?: number | null): number => {
  const yr = installYear ?? yearBuilt;
  if (!yr) return 60; // unknown — neutral
  const age = Math.max(0, CURRENT_YEAR - yr);
  const remaining = Math.max(0, 1 - age / lifespan);
  return Math.round(20 + remaining * 80); // 20..100
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property_id } = await req.json();
    if (!property_id) {
      return new Response(JSON.stringify({ error: "property_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: prop }, { data: intel }, { data: hazards }, { data: regional }] = await Promise.all([
      supa.from("properties").select("id,year_built,address_line,city,state,zip").eq("id", property_id).single(),
      supa.from("property_intelligence").select("*").eq("property_id", property_id).maybeSingle(),
      supa.from("hazard_intelligence").select("hazard_type,risk_level").eq("property_id", property_id),
      supa.from("regional_property_profile").select("hail_risk_level,wind_risk_level,flood_risk_level,wildfire_risk_level").eq("property_id", property_id).maybeSingle(),
    ]);

    if (!prop) {
      return new Response(JSON.stringify({ error: "property not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Derive risk levels: prefer regional_property_profile, fall back to hazard_intelligence rows.
    const hazByType = new Map<string, string>();
    for (const h of hazards ?? []) hazByType.set(h.hazard_type, h.risk_level);
    const riskSnapshot = {
      storm_risk_level: hazByType.get("storm") ?? null,
      hail_risk_level: regional?.hail_risk_level ?? hazByType.get("hail") ?? null,
      wind_risk_level: regional?.wind_risk_level ?? hazByType.get("wind") ?? null,
      flood_risk_level: regional?.flood_risk_level ?? hazByType.get("flood") ?? null,
      wildfire_risk_level: regional?.wildfire_risk_level ?? hazByType.get("wildfire") ?? null,
    };

    // Upsert intelligence row with hydrated risk fields.
    const intelRow = {
      property_id,
      ...(intel ?? {}),
      ...riskSnapshot,
      last_recomputed_at: new Date().toISOString(),
    };
    delete (intelRow as any).id;
    delete (intelRow as any).created_at;
    delete (intelRow as any).updated_at;

    const { data: savedIntel, error: intelErr } = await supa
      .from("property_intelligence")
      .upsert(intelRow, { onConflict: "property_id" })
      .select()
      .single();
    if (intelErr) throw intelErr;

    // Score each system.
    const yb = prop.year_built;
    const scores = {
      roof: ageScore(savedIntel.roof_install_year, LIFESPANS.roof, yb),
      hvac: ageScore(savedIntel.hvac_install_year, LIFESPANS.hvac, yb),
      water_heater: ageScore(savedIntel.water_heater_install_year, LIFESPANS.water_heater, yb),
      electrical: ageScore(savedIntel.electrical_panel_year, LIFESPANS.electrical, yb),
      plumbing: ageScore(null, LIFESPANS.plumbing, yb),
      exterior: ageScore(null, LIFESPANS.exterior, yb),
      foundation: ageScore(null, LIFESPANS.foundation, yb),
    };

    // Risk-adjust: high regional hail/wind cuts roof score; flood cuts foundation.
    if (riskSnapshot.hail_risk_level === "high" || riskSnapshot.wind_risk_level === "high") {
      scores.roof = Math.max(20, scores.roof - 10);
    }
    if (riskSnapshot.flood_risk_level === "high") {
      scores.foundation = Math.max(20, scores.foundation - 10);
    }

    const overall = Math.round(
      (scores.roof + scores.hvac + scores.water_heater + scores.electrical +
       scores.plumbing + scores.exterior + scores.foundation) / 7
    );
    const grade = overall >= 90 ? "A" : overall >= 80 ? "B" : overall >= 70 ? "C" : overall >= 60 ? "D" : "F";

    const strengths: string[] = [];
    const risks: string[] = [];
    const next_actions: string[] = [];

    const systemLabel: Record<string, string> = {
      roof: "Roof", hvac: "HVAC", water_heater: "Water heater", electrical: "Electrical panel",
      plumbing: "Plumbing", exterior: "Exterior", foundation: "Foundation",
    };

    for (const [sys, score] of Object.entries(scores)) {
      if (score >= 80) strengths.push(`${systemLabel[sys]} is in good shape (${score}/100).`);
      else if (score < 50) {
        risks.push(`${systemLabel[sys]} scored ${score}/100 — likely nearing end of life.`);
        next_actions.push(`Get a ${systemLabel[sys].toLowerCase()} inspection or quote.`);
      }
    }
    if (riskSnapshot.flood_risk_level === "high") risks.push("Property sits in a high-flood-risk area.");
    if (riskSnapshot.hail_risk_level === "high") risks.push("Regional hail risk is elevated — consider impact-rated roofing.");

    // Persist score (history row).
    const { error: scoreErr } = await supa.from("property_health_scores").insert({
      property_id,
      overall_score: overall,
      grade,
      roof_score: scores.roof,
      hvac_score: scores.hvac,
      plumbing_score: scores.plumbing,
      electrical_score: scores.electrical,
      water_heater_score: scores.water_heater,
      exterior_score: scores.exterior,
      foundation_score: scores.foundation,
      strengths,
      risks,
      next_actions,
      computation_source: "heuristic",
    });
    if (scoreErr) throw scoreErr;

    // Generate opportunities for any system under 70.
    const opportunityRows: any[] = [];
    const costBands: Record<string, [number, number]> = {
      roof: [8000, 25000],
      hvac: [5000, 12000],
      water_heater: [1200, 3500],
      electrical: [1500, 4500],
      plumbing: [2000, 8000],
      exterior: [4000, 15000],
      foundation: [3000, 20000],
    };

    for (const [sys, score] of Object.entries(scores)) {
      if (score >= 70) continue;
      const lifespan = LIFESPANS[sys];
      const installYear =
        sys === "roof" ? savedIntel.roof_install_year :
        sys === "hvac" ? savedIntel.hvac_install_year :
        sys === "water_heater" ? savedIntel.water_heater_install_year :
        sys === "electrical" ? savedIntel.electrical_panel_year :
        yb;
      const age = installYear ? Math.max(0, CURRENT_YEAR - installYear) : null;
      const remainingPct = age != null ? Math.max(0, 1 - age / lifespan) : 0.5;
      const urgency = URGENCY(remainingPct);
      const [lo, hi] = costBands[sys];

      opportunityRows.push({
        property_id,
        system: sys,
        opportunity_type: score < 40 ? "replace" : "inspect_or_quote",
        urgency,
        confidence: installYear ? 0.75 : 0.45,
        estimated_cost_low: lo,
        estimated_cost_high: hi,
        recommended_action: score < 40
          ? `Plan ${systemLabel[sys]} replacement and get 2-3 quotes.`
          : `Schedule a ${systemLabel[sys].toLowerCase()} inspection to confirm remaining life.`,
        rationale: age != null
          ? `${systemLabel[sys]} is ~${age}y old vs. ${lifespan}y typical lifespan.`
          : `${systemLabel[sys]} age unknown — estimated from home year built.`,
        source: "heuristic",
      });
    }

    // Replace prior opportunities with the fresh set (simple snapshot model for Phase 1).
    await supa.from("property_opportunities").delete().eq("property_id", property_id);
    if (opportunityRows.length) {
      const { error: oppErr } = await supa.from("property_opportunities").insert(opportunityRows);
      if (oppErr) throw oppErr;
    }

    return new Response(JSON.stringify({
      ok: true,
      overall_score: overall,
      grade,
      scores,
      opportunity_count: opportunityRows.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("compute-property-health error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
