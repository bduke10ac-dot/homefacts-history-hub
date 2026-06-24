import { corsHeaders, createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";
import { geocodeAddress, fetchNriForTract, nriRatingToHealthScore } from "../_shared/govdata.ts";

const Cat = z.object({ score: z.number(), level: z.enum(["low","medium","high"]), ai: z.string(), action: z.string() });
const Schema = z.object({
  overall_summary: z.string(),
  structural: Cat, weather: Cat, insurance: Cat, environmental: Cat,
  maintenance: Cat, neighborhood: Cat, appreciation: Cat,
});

const band = (s: number) => s >= 80 ? "low" : s >= 55 ? "medium" : "high";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { property_id } = await req.json();
    if (!property_id) return new Response(JSON.stringify({ error: "property_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: prop }, { data: records }, { data: hazards }, { data: claims }] = await Promise.all([
      supa.from("properties").select("*").eq("id", property_id).single(),
      supa.from("property_records").select("category,title,performed_at").eq("property_id", property_id),
      supa.from("hazard_intelligence").select("hazard_type,risk_level").eq("property_id", property_id),
      supa.from("insurance_claims").select("*").eq("property_id", property_id),
    ]);

    const age = prop?.year_built ? new Date().getFullYear() - prop.year_built : 30;
    const recCount = (records ?? []).length;
    const hazHigh = (hazards ?? []).filter((h: any) => h.risk_level === "high").length;
    const claimCount = (claims ?? []).length;

    // Heuristic baseline scores (higher = healthier)
    const structural = Math.max(20, Math.min(100, 100 - age * 1.2 + recCount * 2));
    const weather = Math.max(20, Math.min(100, 90 - hazHigh * 15));
    const insurance = Math.max(20, Math.min(100, 90 - claimCount * 12 - hazHigh * 8));
    const environmental = Math.max(20, Math.min(100, 95 - hazHigh * 10));
    const maintenance = Math.max(20, Math.min(100, 50 + recCount * 4));
    // Neighborhood: pull FEMA NRI tract risk if we can geocode the address.
    let neighborhood = 75; // fallback when NRI unavailable
    let neighborhoodSource = "modeled:default";
    try {
      const addressStr = [prop?.address_line1, prop?.city, prop?.state, prop?.zip].filter(Boolean).join(", ");
      if (addressStr) {
        const geo = await geocodeAddress(supa, addressStr);
        if (geo) {
          const nri = await fetchNriForTract(supa, geo.tract_fips_full);
          const s = nriRatingToHealthScore(nri?.risk_rating ?? null);
          if (s != null) { neighborhood = s; neighborhoodSource = "verified:fema_nri"; }
        }
      }
    } catch (e) { console.warn("nri lookup failed", e); }
    const appreciation = Math.max(20, Math.min(100, 70 + recCount));
    const overall = Math.round((structural + weather + insurance + environmental + maintenance + neighborhood + appreciation) / 7);

    let ai: any = null;
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (key) {
      try {
        const gateway = createLovableAiGatewayProvider(key);
        const { output } = await generateText({
          model: gateway("google/gemini-3-flash-preview"),
          output: Output.object({ schema: Schema }),
          prompt: `Property: ${prop?.address_line1 ?? "(unknown)"}, ${prop?.city}, ${prop?.state}. Built ${prop?.year_built}. Records:${recCount}. High-risk hazards:${hazHigh}. Claims:${claimCount}.
Numeric category scores (0-100, higher=healthier): structural=${Math.round(structural)}, weather=${Math.round(weather)}, insurance=${Math.round(insurance)}, environmental=${Math.round(environmental)}, maintenance=${Math.round(maintenance)}, neighborhood=${Math.round(neighborhood)}, appreciation=${Math.round(appreciation)}.
Return a JSON object: for each category provide the numeric score (use the numbers given), level (low/medium/high RISK — low risk = healthy = score >=80), ai (1 sentence homeowner-friendly explanation), action (one concrete next step). Also overall_summary (1 sentence).`,
        });
        ai = output;
      } catch (_) { /* fall through to heuristic */ }
    }

    const row = {
      property_id,
      overall_score: overall,
      overall_summary: ai?.overall_summary ?? `Overall risk score ${overall}/100 based on age, records and hazards.`,
      structural_score: Math.round(structural), structural_level: band(structural), structural_ai: ai?.structural?.ai ?? `Home age ${age}y with ${recCount} documented records.`, structural_action: ai?.structural?.action ?? "Document any major structural work to improve this score.",
      weather_score: Math.round(weather), weather_level: band(weather), weather_ai: ai?.weather?.ai ?? `Regional weather exposure with ${hazHigh} high-risk hazards nearby.`, weather_action: ai?.weather?.action ?? "Review roof and storm preparation annually.",
      insurance_score: Math.round(insurance), insurance_level: band(insurance), insurance_ai: ai?.insurance?.ai ?? `${claimCount} claims on record affecting insurability.`, insurance_action: ai?.insurance?.action ?? "Review policy and consider a wind/hail rider.",
      environmental_score: Math.round(environmental), environmental_level: band(environmental), environmental_ai: ai?.environmental?.ai ?? "No major environmental flags detected.", environmental_action: ai?.environmental?.action ?? "Monitor regional advisories.",
      maintenance_score: Math.round(maintenance), maintenance_level: band(maintenance), maintenance_ai: ai?.maintenance?.ai ?? `${recCount} maintenance records on file.`, maintenance_action: ai?.maintenance?.action ?? "Upload receipts and service records.",
      neighborhood_score: Math.round(neighborhood), neighborhood_level: band(neighborhood), neighborhood_ai: ai?.neighborhood?.ai ?? `Neighborhood profile (${neighborhoodSource}).`, neighborhood_action: ai?.neighborhood?.action ?? "Review crime and school trends.",
      appreciation_score: Math.round(appreciation), appreciation_level: band(appreciation), appreciation_ai: ai?.appreciation?.ai ?? "Stable appreciation outlook.", appreciation_action: ai?.appreciation?.action ?? "Track local comps quarterly.",
      computed_at: new Date().toISOString(),
    };

    const { data, error } = await supa.from("property_risk_scores").insert(row).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
