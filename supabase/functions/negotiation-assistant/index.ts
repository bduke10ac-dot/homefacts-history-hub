import { corsHeaders, createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";

const Schema = z.object({
  summary: z.string(),
  repair_concerns: z.array(z.string()),
  negotiation_points: z.array(z.string()),
  concession_low: z.number().nullable(),
  concession_high: z.number().nullable(),
  safety_issues: z.array(z.string()),
  code_concerns: z.array(z.string()),
  insurance_concerns: z.array(z.string()),
  future_risks: z.array(z.string()),
  buyer_questions: z.array(z.string()),
  realtor_talking_points: z.array(z.string()),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { inspection_summary = "", seller_disclosures = "", repair_estimates = "", appraisal_summary = "", insurance_quote = "", list_price = 0 } = body;

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `You are a real-estate buyer's negotiation analyst. Produce a structured report.

LIST PRICE: $${list_price || "unknown"}
INSPECTION SUMMARY:
${inspection_summary || "(none provided)"}

SELLER DISCLOSURES:
${seller_disclosures || "(none provided)"}

REPAIR ESTIMATES:
${repair_estimates || "(none provided)"}

APPRAISAL SUMMARY:
${appraisal_summary || "(none provided)"}

INSURANCE QUOTE / CONCERNS:
${insurance_quote || "(none provided)"}

Return concise bullet items (max 8 per list) and a recommended concession range in USD. If price is unknown, leave concession fields null.`;

    const { output } = await generateText({
      model,
      output: Output.object({ schema: Schema }),
      prompt,
    });

    return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
