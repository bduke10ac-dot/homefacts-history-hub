import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";
import { generateText } from "npm:ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { property_id, deltas = [], done = [], missed = [] } = await req.json();
    const gateway = createLovableAiGatewayProvider(key);
    const prompt = `You are HomeFacts AI writing a homeowner-friendly Annual "What Changed?" report for property ${property_id}.
Past 12 months data:
- Deltas: ${JSON.stringify(deltas)}
- Maintenance completed: ${done.join(", ") || "none"}
- Maintenance missed: ${missed.join(", ") || "none"}

Write 4 short sections (markdown, ~250 words total):
1. **Highlights** – best wins this year
2. **Watch-outs** – missed tasks and risks
3. **Recommended next steps** – 3 concrete actions
4. **Resale outlook** – what a buyer will notice`;
    const { text } = await generateText({ model: gateway("google/gemini-2.5-flash"), prompt });
    return new Response(JSON.stringify({ summary: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
