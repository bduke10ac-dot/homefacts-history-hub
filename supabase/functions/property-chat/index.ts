import { enforceAiQuota } from "../_shared/ai-quota.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { convertToModelMessages, streamText, type UIMessage } from "npm:ai";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const __quota = await enforceAiQuota(req, "property-chat", corsHeaders as Record<string,string>);
  if (__quota) return __quota;

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500, headers: corsHeaders });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { messages, propertyId } = (await req.json()) as { messages: UIMessage[]; propertyId: string };
    if (!propertyId || !Array.isArray(messages)) {
      return new Response("Bad request", { status: 400, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Load property context
    const { data: property } = await admin.from("properties").select("*").eq("id", propertyId).maybeSingle();
    if (!property) return new Response("Property not found", { status: 404, headers: corsHeaders });

    const { data: records } = await admin
      .from("property_records")
      .select("category,title,description,performed_by,cost,performed_at,verified")
      .eq("property_id", propertyId)
      .order("performed_at", { ascending: false, nullsFirst: false })
      .limit(200);

    const systemPrompt = `You are HomeFacts AI, an assistant that answers questions about a specific home using its verified property history.

Property:
${JSON.stringify(property, null, 2)}

Records (most recent first, up to 200):
${JSON.stringify(records ?? [], null, 2)}

Guidelines:
- Be concise, factual, and friendly. Use markdown when helpful.
- Cite specific records (date + title) when relevant.
- If the records don't contain an answer, say so clearly and suggest what to add.
- Do not invent data. Health/risk estimates are heuristic.`;

    // Persist the latest user message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastText =
      lastUser?.parts?.map((p: any) => (p.type === "text" ? p.text : "")).join("") ?? "";
    if (lastUser && lastText) {
      await admin.from("property_chat_messages").insert({
        property_id: propertyId,
        user_id: user.id,
        role: "user",
        content: lastText,
      });
    }

    const gateway = createLovableAiGatewayProvider(apiKey);
    const result = streamText({
      model: gateway("google/gemini-3-flash-preview"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      onFinish: async ({ text }) => {
        if (text) {
          await admin.from("property_chat_messages").insert({
            property_id: propertyId,
            user_id: null,
            role: "assistant",
            content: text,
          });
        }
      },
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    console.error("property-chat error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
