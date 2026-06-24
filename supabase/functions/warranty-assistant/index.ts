import { enforceAiQuota } from "../_shared/ai-quota.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { convertToModelMessages, streamText, type UIMessage } from "npm:ai";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const __quota = await enforceAiQuota(req, "warranty-assistant", corsHeaders as Record<string,string>);
  if (__quota) return __quota;

  try {
    const { propertyId, messages } = (await req.json()) as { propertyId: string; messages: UIMessage[] };
    if (!propertyId) {
      return new Response(JSON.stringify({ error: "Missing propertyId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: property } = await sb.from("properties").select("id,address_line,city,state,zip").eq("id", propertyId).maybeSingle();
    const { data: warranties } = await sb
      .from("warranties")
      .select("category,provider,product_name,model_number,serial_number,install_date,expiration_date,is_registered,is_transferable,transfer_deadline_days,transfer_fee,status,claim_phone,claim_website,installer_name,notes")
      .eq("property_id", propertyId);

    const ctx = {
      address: property ? [(property as any).address_line, property.city, property.state, property.zip].filter(Boolean).join(", ") : null,
      warranties: warranties ?? [],
      today: new Date().toISOString().slice(0, 10),
    };

    const gateway = createLovableAiGatewayProvider(key);
    const result = streamText({
      model: gateway("google/gemini-2.5-flash"),
      system: `You are the HomeFacts Warranty Assistant. Answer questions about this home's warranties using ONLY the provided data. Be concise, friendly, and actionable. Help with: is a warranty active, transferable, expiring; what documents are missing; what voids the warranty; who installed something; how to file a claim; what warranties need attention before selling; what transfers to the new buyer. If info is missing, say so plainly.

CONTEXT:
${JSON.stringify(ctx, null, 2)}`,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
