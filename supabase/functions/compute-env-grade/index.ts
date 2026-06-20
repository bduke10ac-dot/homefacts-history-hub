// Recompute env_grade from env_events + env_risk_scores. Stub — full
// scoring formula will arrive with the Module C master prompt.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function letterFromScore(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { property_id } = await req.json();
    if (!property_id) return new Response(JSON.stringify({ error: "property_id required" }), { status: 400, headers: corsHeaders });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: risk }, { count: eventCount }] = await Promise.all([
      admin.from("env_risk_scores").select("overall_risk_score").eq("property_id", property_id).maybeSingle(),
      admin.from("env_events").select("id", { count: "exact", head: true }).eq("property_id", property_id),
    ]);

    const base = 100 - (risk?.overall_risk_score ?? 0);
    const eventPenalty = Math.min((eventCount ?? 0) * 2, 15);
    const score = Math.max(0, Math.min(100, base - eventPenalty));
    const grade = letterFromScore(score);

    await admin.from("env_grade").upsert({
      property_id,
      grade,
      score,
      breakdown: { base, event_penalty: eventPenalty, event_count: eventCount ?? 0 },
      computed_at: new Date().toISOString(),
    }, { onConflict: "property_id" });

    return new Response(JSON.stringify({ property_id, grade, score }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
