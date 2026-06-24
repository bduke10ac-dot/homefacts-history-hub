import { enforceAiQuota } from "../_shared/ai-quota.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM = `You are HomeFacts' Estate & Legacy educational assistant. You help homeowners understand
estate-planning concepts as they relate to their home. Be concise, plain-spoken, and always include
the disclaimer: "HomeFacts provides educational information only and does not provide legal, tax, or
financial advice. Please consult a licensed professional." Never draft binding legal language. Encourage
users to involve a licensed estate attorney for state-specific guidance.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const __quota = await enforceAiQuota(req, "estate-assistant", corsHeaders as Record<string,string>);
  if (__quota) return __quota;
  try {
    const { messages = [] } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM }, ...messages],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return new Response(JSON.stringify({ error: text }), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
