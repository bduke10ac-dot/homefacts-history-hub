import { enforceAiQuota } from "../_shared/ai-quota.ts";
// AI Home Coach edge function (stub). Wraps Lovable AI Gateway and logs each
// query with the mandatory disclaimer. Will be fleshed out when the full
// Module D master prompt arrives.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DISCLAIMER = "AI-generated guidance is advisory only and is not a substitute for a licensed professional. The AI cannot self-certify any claim.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const __quota = await enforceAiQuota(req, "home-coach", corsHeaders as Record<string,string>);
  if (__quota) return __quota;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { prompt, property_id } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: corsHeaders });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    let answer = "Home Coach is initializing. Please ask again in a moment.";
    if (lovableKey) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": lovableKey, "X-Lovable-AIG-SDK": "edge-fetch" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `You are HomeFacts Home Coach. Give practical home-ownership guidance. Always end with: "${DISCLAIMER}"` },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (r.ok) {
        const j = await r.json();
        answer = j.choices?.[0]?.message?.content ?? answer;
      } else if (r.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), { status: 429, headers: corsHeaders });
      } else if (r.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: corsHeaders });
      }
    }

    await supabase.from("regional_home_coach_query_log").insert({
      property_id: property_id ?? null,
      user_id: userId,
      model: "google/gemini-3-flash-preview",
      prompt,
      response_text: answer,
      disclaimer: DISCLAIMER,
      is_certified: false,
    });

    return new Response(JSON.stringify({ answer, disclaimer: DISCLAIMER }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
