import { corsHeaders } from "../_shared/ai-gateway.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface Item { item: string; category: string; lifespan: number; low: number; high: number; urgency: string }
const CATALOG: Item[] = [
  { item: "Roof replacement", category: "Roof", lifespan: 25, low: 1200000, high: 3500000, urgency: "medium" },
  { item: "HVAC replacement", category: "HVAC", lifespan: 18, low: 600000, high: 1500000, urgency: "high" },
  { item: "Water heater replacement", category: "Plumbing", lifespan: 12, low: 100000, high: 350000, urgency: "high" },
  { item: "Appliance replacement", category: "Appliances", lifespan: 12, low: 80000, high: 400000, urgency: "low" },
  { item: "Window replacement", category: "Windows", lifespan: 25, low: 800000, high: 2500000, urgency: "low" },
  { item: "Deck maintenance", category: "Exterior", lifespan: 3, low: 30000, high: 150000, urgency: "low" },
  { item: "Driveway sealing", category: "Exterior", lifespan: 3, low: 30000, high: 90000, urgency: "low" },
  { item: "Gutter replacement", category: "Exterior", lifespan: 20, low: 100000, high: 300000, urgency: "low" },
  { item: "Plumbing update", category: "Plumbing", lifespan: 50, low: 200000, high: 1500000, urgency: "low" },
  { item: "Electrical update", category: "Electrical", lifespan: 40, low: 200000, high: 800000, urgency: "medium" },
  { item: "Foundation inspection", category: "Foundation", lifespan: 5, low: 20000, high: 80000, urgency: "low" },
  { item: "Pest inspection", category: "Inspection", lifespan: 1, low: 10000, high: 30000, urgency: "low" },
  { item: "Termite inspection", category: "Inspection", lifespan: 1, low: 10000, high: 40000, urgency: "low" },
  { item: "Insurance policy review", category: "Insurance", lifespan: 1, low: 0, high: 0, urgency: "low" },
  { item: "General maintenance reserve", category: "General", lifespan: 1, low: 100000, high: 300000, urgency: "low" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { property_id } = await req.json();
    if (!property_id) return new Response(JSON.stringify({ error: "property_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: prop } = await supa.from("properties").select("year_built").eq("id", property_id).single();
    const age = prop?.year_built ? new Date().getFullYear() - prop.year_built : 25;
    await supa.from("future_cost_forecasts").delete().eq("property_id", property_id);

    const rows = CATALOG.flatMap((it) => {
      const yearsToReplace = Math.max(1, it.lifespan - (age % it.lifespan));
      const horizon = yearsToReplace <= 1 ? 1 : yearsToReplace <= 3 ? 3 : yearsToReplace <= 5 ? 5 : 10;
      return [{
        property_id, item: it.item, category: it.category, horizon_years: horizon,
        low_cost_cents: it.low, high_cost_cents: it.high,
        urgency: yearsToReplace <= 1 ? "high" : yearsToReplace <= 3 ? "medium" : "low",
        recommended_timing: `Within ${yearsToReplace} year${yearsToReplace > 1 ? "s" : ""}`,
        notes: `Typical lifespan ${it.lifespan}y. Home age ~${age}y.`,
      }];
    });
    const { data, error } = await supa.from("future_cost_forecasts").insert(rows).select();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
