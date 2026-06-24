// Free government data source helpers.
// Each fn returns parsed data or null on failure (caller falls back to stub).
// Responses are cached in public.gov_data_cache (FIPS / area-keyed) to avoid hammering free endpoints.

import { createClient } from "npm:@supabase/supabase-js@2";

type Admin = ReturnType<typeof createClient>;

const DAY = 24 * 60 * 60 * 1000;

async function cacheGet(admin: Admin, source: string, key: string): Promise<any | null> {
  const { data } = await admin
    .from("gov_data_cache")
    .select("payload, expires_at")
    .eq("source", source)
    .eq("key", key)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return null;
  return data.payload;
}

async function cacheSet(admin: Admin, source: string, key: string, payload: any, ttlMs: number) {
  const expires = new Date(Date.now() + ttlMs).toISOString();
  await admin.from("gov_data_cache").upsert(
    { source, key, payload, fetched_at: new Date().toISOString(), expires_at: expires },
    { onConflict: "source,key" },
  );
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 8000): Promise<any | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) {
      console.warn("govdata fetch non-200", url, res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn("govdata fetch error", url, String((e as Error).message));
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ============ 1. Census Geocoder — address → FIPS state/county/tract + lat/lng ============
// No API key required.
export interface GeocodeResult {
  lat: number;
  lng: number;
  state_fips: string;
  county_fips: string;     // 3-digit county within state
  county_fips_full: string;// 5-digit STCOFIPS
  tract_fips: string;      // 6-digit tract
  tract_fips_full: string; // 11-digit GEOID (state+county+tract)
  state_abbr: string | null;
  county_name: string | null;
  matched_address: string;
}

export async function geocodeAddress(admin: Admin, address: string): Promise<GeocodeResult | null> {
  const cacheKey = address.toLowerCase().trim();
  const cached = await cacheGet(admin, "census_geocoder", cacheKey);
  if (cached) return cached as GeocodeResult;

  const url = new URL("https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress");
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("format", "json");
  url.searchParams.set("layers", "Census Tracts,Counties,States");

  const json = await fetchJson(url.toString(), undefined, 10000);
  const match = json?.result?.addressMatches?.[0];
  if (!match) return null;

  const geo = match.geographies ?? {};
  const tract = geo["Census Tracts"]?.[0];
  const county = geo["Counties"]?.[0];
  const state = geo["States"]?.[0];
  if (!tract || !county || !state) return null;

  const result: GeocodeResult = {
    lat: match.coordinates.y,
    lng: match.coordinates.x,
    state_fips: state.STATE,
    county_fips: county.COUNTY,
    county_fips_full: `${state.STATE}${county.COUNTY}`,
    tract_fips: tract.TRACT,
    tract_fips_full: `${state.STATE}${county.COUNTY}${tract.TRACT}`,
    state_abbr: state.STUSAB ?? null,
    county_name: county.NAME ?? null,
    matched_address: match.matchedAddress,
  };
  await cacheSet(admin, "census_geocoder", cacheKey, result, 30 * DAY);
  return result;
}

// ============ 2. Urban Institute Education Data Portal — NCES schools ============
// Free, no key. https://educationdata.urban.org/api/v1/schools/ccd/directory/<year>/?county_code=<5-digit>
export async function fetchSchoolsByCounty(
  admin: Admin,
  countyFipsFull: string,
  year = 2022,
): Promise<Array<any> | null> {
  const cached = await cacheGet(admin, "urban_inst_schools", countyFipsFull);
  if (cached) return cached as any[];

  const url = `https://educationdata.urban.org/api/v1/schools/ccd/directory/${year}/?county_code=${countyFipsFull}&limit=200`;
  const json = await fetchJson(url, undefined, 12000);
  const rows: any[] = json?.results ?? [];
  if (!rows.length) return null;

  // Normalise to a school-card shape; pick representative elementary/middle/high.
  const norm = rows.map((r) => {
    const lvl = (() => {
      const lvlStr = String(r.school_level ?? r.level ?? "").toLowerCase();
      if (lvlStr.includes("elem") || lvlStr.includes("primary")) return "elementary";
      if (lvlStr.includes("middle")) return "middle";
      if (lvlStr.includes("high") || lvlStr.includes("secondary")) return "high";
      // Fall back to grade range
      const lo = Number(r.lowest_grade_offered ?? 99);
      const hi = Number(r.highest_grade_offered ?? -1);
      if (hi <= 5) return "elementary";
      if (hi <= 8) return "middle";
      return "high";
    })();
    return {
      level: lvl,
      name: r.school_name ?? "Unknown school",
      district_name: r.lea_name ?? null,
      enrollment: r.enrollment ?? null,
      rating: null,                   // GreatSchools rating is paid; left null
      rating_source: "NCES (rating unavailable — free tier)",
      distance_miles: null,
      address: [r.street_location, r.city_location, r.state_location, r.zip_location]
        .filter(Boolean).join(", "),
      phone: r.phone ?? null,
    };
  });

  const byLevel = (lvl: string) => norm.filter((s) => s.level === lvl).sort((a, b) => (b.enrollment ?? 0) - (a.enrollment ?? 0)).slice(0, 2);
  const picked = [...byLevel("elementary"), ...byLevel("middle"), ...byLevel("high")];

  await cacheSet(admin, "urban_inst_schools", countyFipsFull, picked, 30 * DAY);
  return picked;
}

// ============ 3. NOAA — recent severe weather alerts for a point + storm events lookup ============
// Free, no key. Alerts API supports point queries; Storm Events DB has no JSON API, so we use the
// alerts API as a near-term proxy and label data accordingly.
export async function fetchWeatherEvents(
  admin: Admin,
  lat: number,
  lng: number,
): Promise<Array<any> | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = await cacheGet(admin, "noaa_alerts", key);
  if (cached) return cached as any[];

  const url = `https://api.weather.gov/alerts?point=${lat},${lng}&limit=50`;
  const json = await fetchJson(url, { headers: { "User-Agent": "Orivaz (contact@orivaz.com)", "Accept": "application/geo+json" } }, 8000);
  const features: any[] = json?.features ?? [];
  const events = features.map((f) => ({
    date: f.properties?.sent ?? f.properties?.effective ?? null,
    type: f.properties?.event ?? "Weather Alert",
    severity: f.properties?.severity ?? null,
    headline: f.properties?.headline ?? null,
    description: f.properties?.description ?? null,
  }));
  await cacheSet(admin, "noaa_alerts", key, events, 1 * DAY);
  return events;
}

// ============ FEMA MSC / NFHL — FIRM flood zone at point ============
// Free ArcGIS REST endpoint, no key. Layer 28 = Flood Hazard Zones.
// https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28
export interface FloodZoneRecord {
  flood_zone: string | null;          // e.g. "X", "AE", "VE"
  zone_subtype: string | null;        // e.g. "FLOODWAY", "0.2 PCT ANNUAL CHANCE FLOOD HAZARD"
  sfha_tf: string | null;             // "T" if Special Flood Hazard Area, else "F"
  static_bfe: number | null;          // Base Flood Elevation
  firm_panel: string | null;
  effective_date: string | null;
  description: string;
  fema_msc_url: string;
}

const FLOOD_ZONE_DESCRIPTIONS: Record<string, string> = {
  A: "High-risk Special Flood Hazard Area (1% annual chance flood, no BFE determined). Flood insurance required for federally-backed mortgages.",
  AE: "High-risk Special Flood Hazard Area with Base Flood Elevations determined. Flood insurance required for federally-backed mortgages.",
  AH: "High-risk shallow flooding (1-3 ft). Flood insurance required.",
  AO: "High-risk sheet-flow flooding. Flood insurance required.",
  AR: "High-risk area with temporarily decertified flood-control system.",
  "A99": "High-risk area with federal flood-control system under construction.",
  V: "High-risk coastal area subject to wave action. Flood insurance required.",
  VE: "High-risk coastal area with BFEs determined. Flood insurance required.",
  X: "Moderate to minimal flood risk (outside the SFHA). Flood insurance optional but recommended.",
  "X (shaded)": "Moderate flood risk — 0.2% annual chance (500-year) floodplain.",
  D: "Undetermined flood risk — no analysis has been conducted.",
};

export async function fetchFloodZoneAtPoint(
  admin: Admin,
  lat: number,
  lng: number,
): Promise<FloodZoneRecord | null> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = await cacheGet(admin, "fema_nfhl_point", key);
  if (cached) return cached as FloodZoneRecord;

  const url = new URL("https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query");
  url.searchParams.set("geometry", JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }));
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,DFIRM_ID");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");

  const json = await fetchJson(url.toString(), undefined, 10000);
  const attrs = json?.features?.[0]?.attributes;
  if (!attrs) {
    // No NFHL coverage at this point — record as undetermined and short-cache.
    const undet: FloodZoneRecord = {
      flood_zone: null, zone_subtype: null, sfha_tf: null, static_bfe: null,
      firm_panel: null, effective_date: null,
      description: "No FEMA NFHL data available at this point — area may be unmapped.",
      fema_msc_url: `https://msc.fema.gov/portal/search?AddressQuery=${encodeURIComponent(`${lat},${lng}`)}`,
    };
    await cacheSet(admin, "fema_nfhl_point", key, undet, 7 * DAY);
    return undet;
  }

  const zone: string = attrs.FLD_ZONE ?? null;
  const subtype: string = attrs.ZONE_SUBTY ?? null;
  const sfha = attrs.SFHA_TF ?? null;
  const bfe = attrs.STATIC_BFE != null && attrs.STATIC_BFE > -9000 ? Number(attrs.STATIC_BFE) : null;

  // X shaded vs unshaded
  const descKey = zone === "X" && /0\.2 PCT/i.test(subtype ?? "") ? "X (shaded)" : zone;
  const description = FLOOD_ZONE_DESCRIPTIONS[descKey] ?? `Flood zone ${zone}.`;

  const result: FloodZoneRecord = {
    flood_zone: zone,
    zone_subtype: subtype,
    sfha_tf: sfha,
    static_bfe: bfe,
    firm_panel: attrs.DFIRM_ID ?? null,
    effective_date: null,
    description,
    fema_msc_url: `https://msc.fema.gov/portal/search?AddressQuery=${encodeURIComponent(`${lat},${lng}`)}`,
  };
  await cacheSet(admin, "fema_nfhl_point", key, result, 30 * DAY);
  return result;
}

// ============ 4. FEMA National Risk Index — tract-level hazard ratings ============
// Free ArcGIS REST endpoint. No key required.
// https://hazards.fema.gov/gis/nri/REST/services/public/NRI/MapServer/5  (tract layer)
export interface NriRecord {
  risk_score: number | null;
  risk_rating: string | null;
  expected_annual_loss_score: number | null;
  social_vulnerability: number | null;
  community_resilience: number | null;
  hazards: Record<string, { rating: string | null; score: number | null }>;
}

const NRI_HAZARDS = [
  ["avalanche", "AVLN"], ["coastal_flooding", "CFLD"], ["cold_wave", "CWAV"],
  ["drought", "DRGT"], ["earthquake", "ERQK"], ["hail", "HAIL"],
  ["heat_wave", "HWAV"], ["hurricane", "HRCN"], ["ice_storm", "ISTM"],
  ["landslide", "LNDS"], ["lightning", "LTNG"], ["riverine_flooding", "RFLD"],
  ["strong_wind", "SWND"], ["tornado", "TRND"], ["tsunami", "TSUN"],
  ["volcanic_activity", "VLCN"], ["wildfire", "WFIR"], ["winter_weather", "WNTW"],
];

export async function fetchNriForTract(admin: Admin, tractFipsFull: string): Promise<NriRecord | null> {
  const cached = await cacheGet(admin, "fema_nri_tract", tractFipsFull);
  if (cached) return cached as NriRecord;

  const url = new URL("https://hazards.fema.gov/gis/nri/REST/services/public/NRI/MapServer/5/query");
  url.searchParams.set("where", `TRACTFIPS='${tractFipsFull}'`);
  url.searchParams.set("outFields", "*");
  url.searchParams.set("f", "json");

  const json = await fetchJson(url.toString(), undefined, 10000);
  const attrs = json?.features?.[0]?.attributes;
  if (!attrs) return null;

  const hazards: NriRecord["hazards"] = {};
  for (const [name, code] of NRI_HAZARDS) {
    hazards[name] = {
      rating: attrs[`${code}_RISKR`] ?? null,
      score: attrs[`${code}_RISKS`] ?? null,
    };
  }
  const result: NriRecord = {
    risk_score: attrs.RISK_SCORE ?? null,
    risk_rating: attrs.RISK_RATNG ?? null,
    expected_annual_loss_score: attrs.EAL_SCORE ?? null,
    social_vulnerability: attrs.SOVI_SCORE ?? null,
    community_resilience: attrs.RESL_SCORE ?? null,
    hazards,
  };
  await cacheSet(admin, "fema_nri_tract", tractFipsFull, result, 30 * DAY);
  return result;
}

// ============ 5. FBI Crime Data API — agency-level crime stats ============
// Requires data.gov API key. https://api.data.gov/signup/
// Endpoint: https://api.usa.gov/crime/fbi/cde/...
export async function fetchCountyCrime(
  admin: Admin,
  stateAbbr: string,
  countyFipsFull: string,
  apiKey: string | undefined,
): Promise<any | null> {
  if (!apiKey) return null;
  const cacheKey = countyFipsFull;
  const cached = await cacheGet(admin, "fbi_crime_county", cacheKey);
  if (cached) return cached;

  // Use county-level offense estimates endpoint.
  const url = `https://api.usa.gov/crime/fbi/cde/estimate/county/${countyFipsFull}?API_KEY=${apiKey}`;
  const json = await fetchJson(url, undefined, 10000);
  if (!json) return null;

  // Normalise: latest year totals where available
  const result = {
    jurisdiction_level: "county",
    state: stateAbbr,
    county_fips: countyFipsFull,
    raw: json,
    note: "Jurisdiction-level reported crime (FBI NIBRS/SRS). Not per-address incident data.",
  };
  await cacheSet(admin, "fbi_crime_county", cacheKey, result, 7 * DAY);
  return result;
}

// ============ 6. Census ACS 5-year — demographics by tract ============
// Free with API key. https://api.census.gov/data/key_signup.html
const ACS_VARS = [
  ["population", "B01003_001E"],
  ["median_age", "B01002_001E"],
  ["median_household_income", "B19013_001E"],
  ["per_capita_income", "B19301_001E"],
  ["housing_units", "B25001_001E"],
  ["owner_occupied", "B25003_002E"],
  ["renter_occupied", "B25003_003E"],
  ["median_home_value", "B25077_001E"],
  ["median_gross_rent", "B25064_001E"],
  ["bachelors_or_higher", "B15003_022E"],
  ["unemployment", "B23025_005E"],
];

export async function fetchAcsForTract(
  admin: Admin,
  stateFips: string,
  countyFips: string,
  tractFips: string,
  apiKey: string | undefined,
  year = 2022,
): Promise<Record<string, number | null> | null> {
  const key = `${year}|${stateFips}${countyFips}${tractFips}`;
  const cached = await cacheGet(admin, "census_acs5_tract", key);
  if (cached) return cached as Record<string, number | null>;

  const vars = ACS_VARS.map(([, v]) => v).join(",");
  const url = new URL(`https://api.census.gov/data/${year}/acs/acs5`);
  url.searchParams.set("get", vars);
  url.searchParams.set("for", `tract:${tractFips}`);
  url.searchParams.set("in", `state:${stateFips} county:${countyFips}`);
  if (apiKey) url.searchParams.set("key", apiKey);

  const json = await fetchJson(url.toString(), undefined, 10000);
  if (!Array.isArray(json) || json.length < 2) return null;

  const [headers, row] = json;
  const out: Record<string, number | null> = {};
  ACS_VARS.forEach(([label, code]) => {
    const i = headers.indexOf(code);
    const v = i >= 0 ? row[i] : null;
    out[label] = v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : null;
  });
  await cacheSet(admin, "census_acs5_tract", key, out, 30 * DAY);
  return out;
}

// ============ Helper: convert NRI rating string → numeric score 0-100 (healthy = high) ============
export function nriRatingToHealthScore(rating: string | null): number | null {
  if (!rating) return null;
  const m: Record<string, number> = {
    "Very Low": 95, "Relatively Low": 80, "Relatively Moderate": 65,
    "Relatively High": 40, "Very High": 20, "No Rating": 75,
    "Not Applicable": 75, "Insufficient Data": 75,
  };
  return m[rating] ?? null;
}

// risk_level enum for hazard_intelligence: low | medium | high
export function nriRatingToRiskLevel(rating: string | null): "low" | "medium" | "high" {
  if (!rating) return "low";
  if (rating.includes("High") || rating.includes("Very High")) return "high";
  if (rating.includes("Moderate")) return "medium";
  return "low";
}
