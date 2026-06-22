import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property_id, question } = await req.json();
    if (!property_id || !question) {
      return new Response(JSON.stringify({ error: "property_id and question required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: property }, { data: records }, { data: health }, { data: timeline }] = await Promise.all([
      supabase.from("properties").select("address_line,city,state,zip,year_built,square_feet,bedrooms,bathrooms,property_type").eq("id", property_id).maybeSingle(),
      supabase.from("property_records").select("category,title,description,performed_by,performed_at,cost,verified").eq("property_id", property_id).limit(100),
      supabase.from("home_health_sections").select("section,install_date,lifespan_years,contractor_name,warranty_expires,notes").eq("property_id", property_id),
      supabase.from("timeline_events").select("occurred_at,category,title,description,contractor_name").eq("property_id", property_id).limit(50),
    ]);

    const context = JSON.stringify({ property, records, health, timeline }, null, 2);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({
          answer: z.string(),
          confidence: z.enum(["High", "Medium", "Low"]),
          sources: z.array(z.string()).default([]),
        }),
      }),
      system: `You are HomeFacts AI, answering questions about a single property using ONLY the verified records provided.
- If the data clearly answers the question, return confidence "High".
- If you can infer with reasonable assumptions, "Medium".
- If you can't, set confidence "Low" and answer: "I do not have enough verified information yet. Upload a document, photo, invoice, or note to improve this answer."
- Keep answers concise and concrete. Cite which record types you used in "sources".`,
      prompt: `Property data:\n${context}\n\nQuestion: ${question}`,
    });

    return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
