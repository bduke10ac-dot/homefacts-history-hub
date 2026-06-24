import { createClient } from "npm:@supabase/supabase-js@2";
import { convertToModelMessages, streamText, type UIMessage } from "npm:ai";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, messages } = (await req.json()) as { token: string; messages: UIMessage[] };
    if (!token) return new Response(JSON.stringify({ error: "Missing token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: clone } = await sb
      .from("nb_property_clones")
      .select("*, nb_templates(name, subdivision), builder_companies(name, phone, email, website)")
      .eq("handoff_token", token)
      .maybeSingle();

    if (!clone) return new Response(JSON.stringify({ error: "Home not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const [{ data: warranties }, { data: guide }, { data: subs }] = await Promise.all([
      sb.from("nb_clone_warranties").select("warranty_type,title,coverage_description,start_date,expiration_date,issuer,issuer_phone,claim_instructions").eq("clone_id", clone.id),
      sb.from("nb_template_guide_items").select("section,title,body,responsibility").eq("template_id", clone.template_id).order("section"),
      sb.from("nb_clone_subcontractors").select("trade,company_name,phone,scope_of_work,warranty_months").eq("clone_id", clone.id),
    ]);

    const ctx = {
      address: [clone.address_line, clone.city, clone.state, clone.zip].filter(Boolean).join(", "),
      builder: (clone as any).builder_companies?.name,
      builder_phone: (clone as any).builder_companies?.phone,
      model: (clone as any).nb_templates?.name,
      co_date: clone.co_date,
      warranties, guide, subs,
    };

    const gateway = createLovableAiGatewayProvider(key);
    const result = streamText({
      model: gateway("google/gemini-2.5-flash"),
      system: `You are the HomeFacts AI Home Assistant for a specific home. Answer the homeowner's questions using ONLY this home's data. Be concise, friendly, and actionable. If unsure or info is missing, say so and suggest the builder contact. Always note responsibility (homeowner vs. builder warranty) when relevant.

HOME CONTEXT:
${JSON.stringify(ctx, null, 2)}`,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
