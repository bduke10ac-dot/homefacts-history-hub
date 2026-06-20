import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

const SECTION_KEYS = ["overview", "taxes", "schools", "risk", "amenities", "utilities", "civic", "voting", "scorecard"] as const;

function hash(s: string) { let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
function rng(seed: number) { let s = seed || 1; return () => { s = Math.imul(48271, s) % 0x7fffffff; return s / 0x7fffffff; }; }
function pick<T>(r: () => number, arr: T[]) { return arr[Math.floor(r() * arr.length)]; }
function range(r: () => number, min: number, max: number) { return Math.round(min + r() * (max - min)); }

function buildStubs(seed: number, address: string) {
  const r1 = rng(seed);
  const overview = {
    parcel_id: `P-${range(r1, 100000, 999999)}`,
    legal_description: "Lot 14, Block 7, Per recorded plat",
    property_type: pick(r1, ["Single family", "Townhome", "Condo", "Duplex"]),
    year_built: range(r1, 1920, 2020),
    living_area_sqft: range(r1, 900, 4200),
    bedrooms: range(r1, 1, 6),
    bathrooms: Math.round(range(r1, 1, 5) + r1()) ,
    lot_size_sqft: range(r1, 2000, 18000),
    zoning: pick(r1, ["R-1", "R-2", "R-3 Mixed", "RM-20"]),
    assessed_value: range(r1, 180_000, 1_400_000),
    market_value: range(r1, 220_000, 1_600_000),
    last_sale_date: `${range(r1, 2008, 2024)}-${String(range(r1, 1, 12)).padStart(2,"0")}-${String(range(r1, 1, 28)).padStart(2,"0")}`,
    last_sale_price: range(r1, 180_000, 1_400_000),
  };

  const r2 = rng(seed + 11);
  const baseTax = Math.round(overview.market_value * 0.012);
  const taxes = {
    years: [0,1,2,3,4].map((i) => {
      const y = new Date().getFullYear() - i;
      const av = Math.round(overview.market_value * (0.85 - i*0.04));
      return { tax_year: y, assessed_value: av, taxable_value: av - 25000, total_tax: Math.round(baseTax * (1 - i*0.05) * (0.95 + r2()*0.1)) };
    }),
  };

  const r3 = rng(seed + 22);
  const schoolNames = ["Lincoln", "Roosevelt", "Jefferson", "Maple Grove", "Oakwood", "Willow Creek", "Riverside", "Sequoia"];
  const districts = ["Unified School District", "Public Schools", "Community Schools"];
  const schools = {
    schools: ["elementary","middle","high"].map((lvl) => ({
      level: lvl,
      name: `${pick(r3, schoolNames)} ${lvl[0].toUpperCase()+lvl.slice(1)}`,
      district_name: `${pick(r3, ["Hillside","Westfield","Lakeside","Northgate"])} ${pick(r3, districts)}`,
      rating: range(r3, 3, 10),
      rating_source: "GreatSchools",
      distance_miles: Math.round(r3()*30)/10,
      address: `${range(r3, 100, 9999)} ${pick(r3, ["Oak","Elm","Pine","Cedar"])} St`,
      phone: `(${range(r3, 200, 999)}) ${range(r3, 200, 999)}-${range(r3, 1000, 9999)}`,
    })),
  };

  const r4 = rng(seed + 33);
  const lvl = () => pick(r4, ["Low", "Moderate", "High"]);
  const risk = {
    flood_zone: pick(r4, ["X", "AE", "A", "VE"]),
    flood_zone_description: pick(r4, ["Low", "Moderate", "High"]),
    fema_panel_url: "https://msc.fema.gov/portal/home",
    storm_events: Array.from({ length: range(r4, 0, 6) }, () => ({
      date: `202${range(r4,0,4)}-${String(range(r4,1,12)).padStart(2,"0")}-${String(range(r4,1,28)).padStart(2,"0")}`,
      type: pick(r4, ["Thunderstorm Wind","Hail","Flood","Tornado","Winter Storm"]),
      magnitude: range(r4, 1, 4),
    })),
    storm_level: lvl(),
    wildfire_risk_tier: lvl(),
    environmental_notes: r4() > 0.5 ? ["Older home — radon testing recommended"] : [],
  };

  const r5 = rng(seed + 44);
  const cats = ["grocery", "restaurant", "gas", "pharmacy", "hospital", "park", "gym", "bank", "hardware", "transit"];
  const placeNames: Record<string,string[]> = {
    grocery: ["Whole Foods","Trader Joe's","Safeway","Sprouts"],
    restaurant: ["Lucia's Cafe","Riverside Grill","The Local","Anchor Tavern"],
    gas: ["Shell","Chevron","BP"],
    pharmacy: ["CVS","Walgreens","Rite Aid"],
    hospital: ["Mercy General","St. Mary's","Regional Medical Center"],
    park: ["Sunset Park","Riverside Park","Oakwood Greenway"],
    gym: ["Anytime Fitness","Equinox","Planet Fitness"],
    bank: ["Chase","Bank of America","Wells Fargo"],
    hardware: ["Home Depot","Lowe's","Ace Hardware"],
    transit: ["Metro Bus 14 Stop","Light Rail Station","Park & Ride"],
  };
  const amenities = {
    places: cats.flatMap((c) => Array.from({ length: range(r5, 1, 3) }, () => ({
      category: c,
      name: pick(r5, placeNames[c]),
      address: `${range(r5, 100, 9999)} ${pick(r5, ["Main","Oak","Elm","Cedar","Pine"])} St`,
      distance_miles: Math.round(r5()*30)/10,
      rating: Math.round((3 + r5()*2) * 10) / 10,
    }))),
  };

  const r6 = rng(seed + 55);
  const utilities = {
    providers: [
      { utility_type: "electric", provider_name: pick(r6, ["PG&E","Duke Energy","Con Edison","Xcel Energy"]), contact_phone: "1-800-555-0100", contact_url: "https://example.com", notes: null },
      { utility_type: "gas", provider_name: pick(r6, ["PG&E","SoCalGas","National Grid"]), contact_phone: "1-800-555-0101", contact_url: "https://example.com", notes: null },
      { utility_type: "water_sewer", provider_name: `${pick(r6, ["City of ","County "])}Water Department`, contact_phone: "1-800-555-0102", contact_url: "https://example.com", notes: null },
      { utility_type: "trash", provider_name: pick(r6, ["Waste Management","Republic Services"]), contact_phone: "1-800-555-0103", contact_url: "https://example.com", notes: null },
      { utility_type: "internet", provider_name: pick(r6, ["Comcast Xfinity","Verizon Fios","AT&T Fiber","Spectrum"]), contact_phone: "1-800-555-0104", contact_url: "https://example.com", notes: "Fiber available" },
    ],
  };

  const r7 = rng(seed + 66);
  const firsts = ["Sarah","Michael","Lisa","David","Maria","James","Patricia","Robert"];
  const lasts = ["Johnson","Smith","Garcia","Lee","Martinez","Brown","Davis","Wilson"];
  const offices: [string,string?][] = [
    ["mayor"],["city_council","3"],["county_official"],["state_rep","42"],["state_senator","12"],["governor"],["us_house","11"],["us_senate"],["us_senate"]
  ];
  const civic = {
    officials: offices.map(([office, district]) => ({
      office,
      name: `${pick(r7, firsts)} ${pick(r7, lasts)}`,
      party: pick(r7, ["Democratic","Republican","Independent"]),
      contact_phone: `(${range(r7, 200, 999)}) ${range(r7, 200, 999)}-${range(r7, 1000, 9999)}`,
      contact_url: "https://example.gov",
      district_number: district ?? null,
    })),
  };

  const r8 = rng(seed + 77);
  const voting = {
    election_authority: `${pick(r8, ["County","City"])} Registrar of Voters`,
    election_authority_url: "https://example.gov/elections",
    polling_place_name: `${pick(r8, ["Lincoln","Roosevelt","Community"])} ${pick(r8, ["Elementary","Center","Library"])}`,
    polling_place_address: `${range(r8, 100, 9999)} ${pick(r8, ["Main","Oak","Elm"])} St`,
    closest_dmv_name: `${pick(r8, ["Downtown","Northside","Westgate"])} DMV`,
    closest_dmv_address: `${range(r8, 100, 9999)} ${pick(r8, ["Broadway","Market","2nd"])} St`,
    closest_dmv_distance_miles: Math.round(r8()*80)/10,
    closest_city_hall_address: `1 City Hall Plaza, ${address.split(",").slice(-2)[0]?.trim() ?? ""}`,
  };

  return { overview, taxes, schools, risk, amenities, utilities, civic, voting };
}

const ScoreSchema = z.object({
  living_outlook_score: z.number().min(0).max(100),
  living_outlook_grade: z.enum(["A","B","C","D","F"]),
  schools_score: z.number().min(0).max(100),
  crime_score: z.number().min(0).max(100),
  market_score: z.number().min(0).max(100),
  tax_burden_score: z.number().min(0).max(100),
  amenities_score: z.number().min(0).max(100),
  risk_score: z.number().min(0).max(100),
  commute_score: z.number().min(0).max(100),
  headline: z.string(),
  summary: z.string(),
  pros: z.array(z.string()).min(2).max(5),
  cons: z.array(z.string()).min(2).max(5),
  best_for: z.array(z.string()).min(2).max(4),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    const body = await req.json();
    const { address, formatted_address, place_id, lat, lng, anon_token } = body as {
      address: string; formatted_address?: string; place_id?: string; lat?: number; lng?: number; anon_token?: string;
    };
    if (!address) return new Response("address required", { status: 400, headers: corsHeaders });

    const addressNormalized = formatted_address ?? address;
    const parts = addressNormalized.split(",").map((s) => s.trim());
    const state = parts.length >= 2 ? (parts[parts.length-1].split(" ")[0] ?? null) : null;

    const { data: report, error: insErr } = await admin.from("reports").insert({
      user_id: userId,
      anon_token: userId ? null : (anon_token ?? null),
      address_raw: address,
      address_normalized: addressNormalized,
      place_id: place_id ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      state,
      status: "pending",
    }).select("*").single();
    if (insErr) throw insErr;

    await admin.from("report_sections").insert(
      SECTION_KEYS.map((k) => ({ report_id: report.id, section_key: k, status: "pending" })),
    );

    const responsePromise = Response.json({ id: report.id }, { headers: corsHeaders });

    const work = (async () => {
      try {
        const seed = hash(`${addressNormalized}|${place_id ?? ""}|${lat ?? ""}|${lng ?? ""}`);
        const stubs = buildStubs(seed, addressNormalized);

        // 1) Insert the normalized report_properties row + children
        const { data: rp } = await admin.from("report_properties").insert({
          report_id: report.id,
          parcel_id: stubs.overview.parcel_id,
          legal_description: stubs.overview.legal_description,
          lot_size_sqft: stubs.overview.lot_size_sqft,
          year_built: stubs.overview.year_built,
          living_area_sqft: stubs.overview.living_area_sqft,
          bedrooms: stubs.overview.bedrooms,
          bathrooms: stubs.overview.bathrooms,
          property_type: stubs.overview.property_type,
          zoning: stubs.overview.zoning,
          assessed_value: stubs.overview.assessed_value,
          market_value: stubs.overview.market_value,
          last_sale_date: stubs.overview.last_sale_date,
          last_sale_price: stubs.overview.last_sale_price,
        }).select("id").single();

        if (rp?.id) {
          await admin.from("tax_history").insert(stubs.taxes.years.map((y) => ({ property_id: rp.id, ...y })));
        }
        await admin.from("schools").insert(stubs.schools.schools.map((s) => ({ report_id: report.id, ...s })));
        await admin.from("risk_indicators").insert({
          report_id: report.id,
          flood_zone: stubs.risk.flood_zone,
          flood_zone_description: stubs.risk.flood_zone_description,
          fema_panel_url: stubs.risk.fema_panel_url,
          storm_events: stubs.risk.storm_events,
          wildfire_risk_tier: stubs.risk.wildfire_risk_tier,
          environmental_notes: stubs.risk.environmental_notes,
        });
        await admin.from("amenities").insert(stubs.amenities.places.map((p) => ({ report_id: report.id, ...p })));
        await admin.from("utilities").insert(stubs.utilities.providers.map((p) => ({ report_id: report.id, ...p })));
        await admin.from("civic_officials").insert(stubs.civic.officials.map((o) => ({ report_id: report.id, ...o })));
        await admin.from("voting_info").insert({ report_id: report.id, ...stubs.voting });

        // 2) Mark each data section as success with its payload
        const writes = [
          { key: "overview", data: stubs.overview, source: "stub:assessor" },
          { key: "taxes", data: stubs.taxes, source: "stub:tax_office" },
          { key: "schools", data: stubs.schools, source: "stub:greatschools" },
          { key: "risk", data: stubs.risk, source: "stub:fema_noaa" },
          { key: "amenities", data: stubs.amenities, source: "stub:places" },
          { key: "utilities", data: stubs.utilities, source: "stub:providers" },
          { key: "civic", data: stubs.civic, source: "stub:google_civic" },
          { key: "voting", data: stubs.voting, source: "stub:civic" },
        ];
        await Promise.all(writes.map((w) =>
          admin.from("report_sections").update({ status: "success", data: w.data, source: w.source, fetched_at: new Date().toISOString() })
            .eq("report_id", report.id).eq("section_key", w.key)
        ));

        // 3) Synthesize Living Outlook with Lovable AI
        const apiKey = Deno.env.get("LOVABLE_API_KEY");
        let outlook: z.infer<typeof ScoreSchema> | null = null;
        if (apiKey) {
          const gateway = createLovableAiGatewayProvider(apiKey);
          const prompt = `You are a real-estate intelligence analyst. Based on the data below for ${addressNormalized}, produce a "Living Outlook" composite score and sub-scores from 0-100 (higher is better). Also produce an A-F letter grade for the overall outlook, a one-line headline, a 3-4 sentence summary, top pros, top cons, and 2-4 lifestyle types this home is best for.

Sub-scores cover: schools (school quality), crime (lower crime = higher score), market (price trends/value), tax_burden (lower taxes = higher score), amenities (walkability/nearby places), risk (lower hazards = higher score), commute (transit/access).

Data:
${JSON.stringify(stubs, null, 2)}

Be specific. Reference real numbers. Tone: trustworthy and neutral, like an underwriter writing for a homebuyer.`;
          try {
            const { experimental_output } = await generateText({
              model: gateway("google/gemini-3-flash-preview"),
              experimental_output: Output.object({ schema: ScoreSchema }),
              prompt,
            });
            outlook = experimental_output;
          } catch (aiErr) { console.error("outlook AI error", aiErr); }
        }

        if (!outlook) {
          const r = rng(seed + 99);
          const score = range(r, 55, 92);
          outlook = {
            living_outlook_score: score,
            living_outlook_grade: score >= 85 ? "A" : score >= 75 ? "B" : score >= 65 ? "C" : score >= 55 ? "D" : "F",
            schools_score: range(r, 50, 95), crime_score: range(r, 40, 90), market_score: range(r, 55, 92),
            tax_burden_score: range(r, 45, 88), amenities_score: range(r, 50, 95), risk_score: range(r, 45, 90),
            commute_score: range(r, 40, 88),
            headline: "Solid pick with a few tradeoffs to weigh.",
            summary: "This property scores well on neighborhood amenities and school access, with moderate risk exposure. Verify roof and HVAC age before close.",
            pros: ["Walkable area", "Strong school zone", "Healthy appreciation"],
            cons: ["Older home", "Moderate flood exposure"],
            best_for: ["Young families", "Remote workers"],
          };
        }

        await admin.from("scorecards").insert({ report_id: report.id, ...outlook });
        await admin.from("report_sections").update({ status: "success", data: outlook, source: "lovable-ai", fetched_at: new Date().toISOString() })
          .eq("report_id", report.id).eq("section_key", "scorecard");
        await admin.from("reports").update({ status: "complete", last_refreshed_at: new Date().toISOString() }).eq("id", report.id);
      } catch (e) {
        console.error("background work error", e);
        await admin.from("reports").update({ status: "failed" }).eq("id", report.id);
      }
    })();

    // @ts-ignore EdgeRuntime is provided by Supabase runtime
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(work);
    } else {
      await work;
    }
    return responsePromise;
  } catch (e) {
    console.error("start-address-report error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
