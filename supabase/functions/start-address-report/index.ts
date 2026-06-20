import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

const SECTIONS = ["property", "neighborhood", "risk", "schools", "market"] as const;

// Seeded deterministic-ish stubs so the demo feels alive per address.
function hash(s: string) { let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
function rng(seed: number) { let s = seed || 1; return () => { s = Math.imul(48271, s) % 0x7fffffff; return s / 0x7fffffff; }; }
function pick<T>(r: () => number, arr: T[]) { return arr[Math.floor(r() * arr.length)]; }
function range(r: () => number, min: number, max: number) { return Math.round(min + r() * (max - min)); }

function stubProperty(seed: number) {
  const r = rng(seed);
  return {
    year_built: range(r, 1920, 2020),
    sqft: range(r, 900, 4200),
    beds: range(r, 1, 6),
    baths: range(r, 1, 5),
    lot_size_sqft: range(r, 2000, 18000),
    property_type: pick(r, ["Single family", "Townhome", "Condo", "Duplex"]),
    last_sold_price: range(r, 180_000, 1_400_000),
    last_sold_year: range(r, 2005, 2024),
    roof_age_years: range(r, 1, 28),
    hvac_age_years: range(r, 1, 22),
  };
}
function stubNeighborhood(seed: number) {
  const r = rng(seed + 1);
  return {
    walk_score: range(r, 18, 98),
    transit_score: range(r, 10, 95),
    bike_score: range(r, 12, 92),
    noise_level: pick(r, ["Quiet", "Moderate", "Lively", "Loud"]),
    median_income: range(r, 38_000, 185_000),
    median_age: range(r, 28, 52),
    nearby_amenities: range(r, 4, 40),
  };
}
function stubRisk(seed: number) {
  const r = rng(seed + 2);
  const lvl = () => pick(r, ["Low", "Moderate", "High"]);
  return {
    flood: { level: lvl(), zone: pick(r, ["X", "AE", "A", "VE"]) },
    wildfire: { level: lvl() },
    earthquake: { level: lvl() },
    crime: { level: lvl(), incidents_last_year: range(r, 5, 380) },
    storm: { level: lvl() },
    air_quality: { aqi: range(r, 15, 140) },
  };
}
function stubSchools(seed: number) {
  const r = rng(seed + 3);
  const names = ["Lincoln", "Roosevelt", "Jefferson", "Maple Grove", "Oakwood", "Willow Creek", "Riverside"];
  return {
    schools: ["Elementary", "Middle", "High"].map((lvl) => ({
      level: lvl,
      name: `${pick(r, names)} ${lvl}`,
      rating: range(r, 3, 10),
      distance_mi: Math.round(r() * 30) / 10,
      students: range(r, 220, 1800),
    })),
  };
}
function stubMarket(seed: number) {
  const r = rng(seed + 4);
  const median = range(r, 240_000, 1_300_000);
  return {
    median_price: median,
    price_per_sqft: range(r, 140, 780),
    yoy_change_pct: Math.round((r() * 18 - 4) * 10) / 10,
    days_on_market: range(r, 6, 78),
    inventory: range(r, 18, 540),
    rent_estimate: range(r, 1500, 6800),
    appreciation_5yr_pct: range(r, 8, 65),
  };
}

const OutlookSchema = z.object({
  score: z.number().min(0).max(100),
  grade: z.enum(["A", "B", "C", "D", "F"]),
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

    // Create the report
    const { data: report, error: insErr } = await admin.from("address_reports").insert({
      user_id: userId,
      anon_token: userId ? null : (anon_token ?? null),
      address,
      formatted_address: formatted_address ?? address,
      place_id: place_id ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      status: "pending",
    }).select("*").single();
    if (insErr) throw insErr;

    // Pre-create pending section rows for instant UI skeletons
    await admin.from("address_report_sections").insert(
      [...SECTIONS, "outlook"].map((s) => ({ report_id: report.id, section: s, status: "pending" })),
    );

    // Respond immediately so the UI navigates to /report/:id
    const responsePromise = Response.json({ id: report.id }, { headers: corsHeaders });

    // Background: populate sections, then synthesize outlook
    const work = (async () => {
      try {
        const seed = hash(`${formatted_address ?? address}|${place_id ?? ""}|${lat ?? ""}|${lng ?? ""}`);
        const sectionData: Record<string, any> = {
          property: stubProperty(seed),
          neighborhood: stubNeighborhood(seed),
          risk: stubRisk(seed),
          schools: stubSchools(seed),
          market: stubMarket(seed),
        };

        // Save the five stub sections in parallel
        await Promise.all(SECTIONS.map((s) =>
          admin.from("address_report_sections").update({ status: "ready", data: sectionData[s] }).eq("report_id", report.id).eq("section", s)
        ));

        // Synthesize Living Outlook with Lovable AI
        const apiKey = Deno.env.get("LOVABLE_API_KEY");
        let outlook: z.infer<typeof OutlookSchema> | null = null;
        if (apiKey) {
          const gateway = createLovableAiGatewayProvider(apiKey);
          const prompt = `You are a real-estate intelligence analyst. Based on the following data for ${formatted_address ?? address}, produce a "Living Outlook" rating from 0-100 with an A-F letter grade, a one-line headline, a 3-4 sentence summary, the top pros and cons of living here, and 2-4 lifestyle types this home is best for (e.g. "Young families", "Remote workers", "Retirees").

Data:
${JSON.stringify(sectionData, null, 2)}

Be specific and reference the actual numbers. Tone: trustworthy, neutral, helpful — like an insurance underwriter writing for a homebuyer.`;

          try {
            const { experimental_output } = await generateText({
              model: gateway("google/gemini-3-flash-preview"),
              experimental_output: Output.object({ schema: OutlookSchema }),
              prompt,
            });
            outlook = experimental_output;
          } catch (aiErr) {
            console.error("outlook AI error", aiErr);
          }
        }

        if (!outlook) {
          // Fallback heuristic
          const r = rng(seed + 99);
          const score = range(r, 55, 92);
          const grade = score >= 85 ? "A" : score >= 75 ? "B" : score >= 65 ? "C" : score >= 55 ? "D" : "F";
          outlook = {
            score, grade,
            headline: "Solid pick with a few tradeoffs to weigh.",
            summary: "This property scores well on neighborhood amenities and school access, with moderate risk exposure. Verify roof and HVAC age before close.",
            pros: ["Walkable area", "Strong school zone", "Healthy appreciation"],
            cons: ["Older roof", "Moderate flood zone"],
            best_for: ["Young families", "Remote workers"],
          };
        }

        await admin.from("address_report_sections").update({ status: "ready", data: outlook }).eq("report_id", report.id).eq("section", "outlook");
        await admin.from("address_reports").update({
          status: "ready",
          living_outlook_score: outlook.score,
          living_outlook_grade: outlook.grade,
          summary: outlook.summary,
        }).eq("id", report.id);
      } catch (e) {
        console.error("background work error", e);
        await admin.from("address_reports").update({ status: "error" }).eq("id", report.id);
      }
    })();

    // @ts-ignore EdgeRuntime exists in Supabase functions runtime
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
