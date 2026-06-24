// Reverse geocode lat/lng → street address.
// Primary: Nominatim (OSM, free, no key). Fallback: Google Geocoding API (uses GOOGLE_PLACES_API_KEY).
import { corsHeaders } from "../_shared/ai-gateway.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { lat, lng } = await req.json();
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return new Response(JSON.stringify({ error: "Invalid lat/lng" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- 1. Nominatim (free, no key) ----
    try {
      const u = new URL("https://nominatim.openstreetmap.org/reverse");
      u.searchParams.set("format", "jsonv2");
      u.searchParams.set("lat", String(latNum));
      u.searchParams.set("lon", String(lngNum));
      u.searchParams.set("addressdetails", "1");
      u.searchParams.set("zoom", "18");
      const r = await fetch(u.toString(), {
        headers: { "User-Agent": "Orivaz/1.0 (reverse-geocode)", "Accept-Language": "en" },
      });
      if (r.ok) {
        const j = await r.json();
        const a = j?.address ?? {};
        const houseNum = a.house_number ?? "";
        const road = a.road ?? a.pedestrian ?? a.residential ?? "";
        const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.suburb ?? "";
        const state = a["ISO3166-2-lvl4"]?.split("-")?.[1] ?? a.state ?? "";
        const zip = a.postcode ?? "";
        const street = [houseNum, road].filter(Boolean).join(" ").trim();
        const formatted = street && city
          ? `${street}, ${city}${state ? `, ${state}` : ""}${zip ? ` ${zip}` : ""}`
          : (j?.display_name ?? "");
        if (formatted) {
          return Response.json({
            formatted_address: formatted,
            lat: latNum, lng: lngNum, source: "nominatim",
          }, { headers: corsHeaders });
        }
      }
    } catch (e) {
      console.warn("nominatim reverse failed", String((e as Error).message));
    }

    // ---- 2. Google Geocoding fallback ----
    const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (key) {
      const u = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      u.searchParams.set("latlng", `${latNum},${lngNum}`);
      u.searchParams.set("key", key);
      const r = await fetch(u);
      if (r.ok) {
        const j = await r.json();
        const top = j?.results?.[0];
        if (top) {
          return Response.json({
            formatted_address: top.formatted_address,
            place_id: top.place_id ?? null,
            lat: latNum, lng: lngNum, source: "google",
          }, { headers: corsHeaders });
        }
      }
    }

    return Response.json({ formatted_address: null, source: "none" }, { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
