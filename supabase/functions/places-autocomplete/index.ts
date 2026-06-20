import { corsHeaders } from "../_shared/ai-gateway.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const { input, sessionToken, action, placeId } = await req.json();

    if (!key) {
      // Graceful fallback: no key configured. Return empty list; UI falls back to free-text.
      return Response.json({ predictions: [], place: null, configured: false }, { headers: corsHeaders });
    }

    if (action === "details" && placeId) {
      const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      url.searchParams.set("place_id", placeId);
      url.searchParams.set("fields", "formatted_address,geometry,place_id");
      url.searchParams.set("key", key);
      if (sessionToken) url.searchParams.set("sessiontoken", sessionToken);
      const r = await fetch(url);
      const j = await r.json();
      const result = j.result;
      return Response.json({
        place: result
          ? {
              formatted_address: result.formatted_address,
              place_id: result.place_id,
              lat: result.geometry?.location?.lat,
              lng: result.geometry?.location?.lng,
            }
          : null,
        configured: true,
      }, { headers: corsHeaders });
    }

    if (!input || typeof input !== "string" || input.length < 3) {
      return Response.json({ predictions: [], configured: true }, { headers: corsHeaders });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("types", "address");
    url.searchParams.set("components", "country:us");
    url.searchParams.set("key", key);
    if (sessionToken) url.searchParams.set("sessiontoken", sessionToken);
    const r = await fetch(url);
    const j = await r.json();
    return Response.json({
      predictions: (j.predictions ?? []).slice(0, 5).map((p: any) => ({
        description: p.description,
        place_id: p.place_id,
      })),
      configured: true,
    }, { headers: corsHeaders });
  } catch (e) {
    console.error("places-autocomplete error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
