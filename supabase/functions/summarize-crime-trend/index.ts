import { corsHeaders, createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";

const Schema = z.object({
  buyer: z.string(), homeowner: z.string(), landlord: z.string(), insurer: z.string(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { categories } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const gateway = createLovableAiGatewayProvider(key);
    const { experimental_output: output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      experimental_output: Output.object({ schema: Schema }),
      prompt: `Crime data by category and period: ${JSON.stringify(categories).slice(0, 4000)}.
Return one-sentence interpretations tailored to four audiences: buyer, homeowner, landlord, insurer.`,
    });
    return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
