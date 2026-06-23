import { corsHeaders, createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";

const Schema = z.object({
  hidden_risks: z.array(z.string()),
  expected_maintenance: z.array(z.string()),
  insurance_outlook: z.string(),
  estimated_annual_cost_cents: z.number(),
  negotiation_items: z.array(z.string()),
  upgrade_opportunities: z.array(z.string()),
  long_term_outlook: z.string(),
  neighborhood_overview: z.string(),
  safety_concerns: z.array(z.string()),
  weather_risks: z.array(z.string()),
  permit_concerns: z.array(z.string()),
  warranty_status: z.string(),
  contractor_history: z.string(),
  ai_recommendation: z.string(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { property_id } = await req.json();
    if (!property_id) return new Response(JSON.stringify({ error: "property_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: prop }, { data: recs }, { data: hazards }, { data: claims }, { data: permits }] = await Promise.all([
      supa.from("properties").select("*").eq("id", property_id).single(),
      supa.from("property_records").select("category,title,performed_at").eq("property_id", property_id).order("performed_at", { ascending: false }).limit(40),
      supa.from("hazard_intelligence").select("hazard_type,risk_level").eq("property_id", property_id),
      supa.from("insurance_claims").select("*").eq("property_id", property_id),
      supa.from("permits").select("permit_number,status,issued_date").eq("property_id", property_id),
    ]);

    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: Schema }),
      prompt: `Generate a buyer decision report for the following property.

PROPERTY: ${prop?.address_line1}, ${prop?.city}, ${prop?.state}. Built ${prop?.year_built}, ${prop?.living_area_sqft ?? "?"} sqft.
RECORDS (${recs?.length ?? 0}): ${(recs ?? []).slice(0,20).map((r: any) => `${r.category}:${r.title}`).join(" | ")}
HAZARDS: ${(hazards ?? []).map((h: any) => `${h.hazard_type}(${h.risk_level})`).join(", ") || "none"}
CLAIMS: ${claims?.length ?? 0}
PERMITS: ${permits?.length ?? 0}

Be specific. Use plain English. estimated_annual_cost_cents should be a realistic ownership cost in cents (taxes+insurance+maintenance+utilities estimate).`,
    });

    const { data, error } = await supa.from("buyer_decision_reports").insert({ property_id, ...output }).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
