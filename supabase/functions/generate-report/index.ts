import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

const ReportSchema = z.object({
  title: z.string(),
  executive_summary: z.string(),
  key_findings: z.array(z.string()),
  risks: z.array(z.object({ name: z.string(), severity: z.enum(["low", "medium", "high"]), detail: z.string() })),
  recommendations: z.array(z.string()),
  systems: z.array(z.object({ name: z.string(), status: z.string(), notes: z.string() })),
});

const TYPE_INSTRUCTIONS: Record<string, string> = {
  buyer: "Generate a Buyer's Due-Diligence report. Focus on what a prospective buyer should know: condition, deferred maintenance, red flags, negotiating points.",
  seller: "Generate a Seller's Disclosure-style report. Highlight strengths, verified upgrades, and items that may need disclosure.",
  insurance: "Generate an Insurance Underwriting report. Focus on roof age, electrical, plumbing, HVAC, claims history, and risk factors.",
  roof: "Generate a Roof Condition report. Focus exclusively on roof age, materials, repairs, claims, and remaining useful life.",
  maintenance: "Generate a Maintenance Plan report. Focus on overdue items, suggested cadence, and a 12-month action plan.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500, headers: corsHeaders });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { propertyId, reportType, force } = (await req.json()) as { propertyId: string; reportType: string; force?: boolean };
    if (!propertyId || !TYPE_INSTRUCTIONS[reportType]) {
      return new Response("Bad request", { status: 400, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    if (!force) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: cached } = await admin
        .from("property_reports")
        .select("*")
        .eq("property_id", propertyId)
        .eq("report_type", reportType)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached) return Response.json({ report: cached }, { headers: corsHeaders });
    }

    const { data: property } = await admin.from("properties").select("*").eq("id", propertyId).maybeSingle();
    if (!property) return new Response("Property not found", { status: 404, headers: corsHeaders });

    const { data: records } = await admin
      .from("property_records")
      .select("category,title,description,performed_by,cost,performed_at,verified")
      .eq("property_id", propertyId)
      .order("performed_at", { ascending: false, nullsFirst: false })
      .limit(200);

    const prompt = `${TYPE_INSTRUCTIONS[reportType]}

Property:
${JSON.stringify(property, null, 2)}

Records (most recent first, up to 200):
${JSON.stringify(records ?? [], null, 2)}

Be specific. Reference dates and titles from records where relevant. Mark heuristic estimates as such.`;

    const gateway = createLovableAiGatewayProvider(apiKey);
    const { experimental_output: output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      experimental_output: Output.object({ schema: ReportSchema }),
      prompt,
    });

    const { data: saved, error } = await admin
      .from("property_reports")
      .insert({ property_id: propertyId, report_type: reportType, payload: output, created_by: user.id })
      .select("*")
      .single();
    if (error) throw error;

    return Response.json({ report: saved }, { headers: corsHeaders });
  } catch (e) {
    console.error("generate-report error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
