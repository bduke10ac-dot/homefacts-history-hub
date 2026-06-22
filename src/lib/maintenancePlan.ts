// Regional Smart Maintenance Engine — pure, deterministic, client-side.
// Produces a tailored yearly maintenance plan from property + records.

import type { HSProperty, HSRecord } from "./healthScore";

export type Region =
  | "southern"
  | "northern"
  | "coastal"
  | "tornado_hail"
  | "western_fire"
  | "desert"
  | "general";

export type Season = "spring" | "summer" | "fall" | "winter";
export type Priority = "low" | "medium" | "high";

export interface MaintenanceTask {
  id: string;
  title: string;
  category: string;
  region: Region | "all";
  season: Season | "any";
  cadenceMonths: number;
  priority: Priority;
  rationale: string;
  lastDoneAt?: string | null;
  nextDueAt: string; // ISO
  status: "upcoming" | "due" | "overdue" | "done";
  daysUntilDue: number;
}

const COASTAL = new Set(["FL", "LA", "TX", "MS", "AL", "GA", "SC", "NC", "VA", "MD", "DE", "NJ", "NY", "RI", "CT", "MA", "NH", "ME", "CA", "OR", "WA"]);
const TORNADO_HAIL = new Set(["TX", "OK", "KS", "NE", "MO", "AR", "IA", "IL", "IN", "OH", "TN", "KY", "CO", "SD", "ND"]);
const FIRE = new Set(["CA", "OR", "WA", "AZ", "NV", "CO", "NM", "MT", "ID", "UT"]);
const DESERT = new Set(["AZ", "NV", "NM", "UT"]);
const SOUTHERN = new Set(["FL", "GA", "AL", "MS", "LA", "TX", "SC", "NC", "TN", "AR", "OK"]);
const NORTHERN = new Set(["ME", "NH", "VT", "MA", "RI", "CT", "NY", "PA", "NJ", "OH", "MI", "WI", "MN", "IA", "ND", "SD", "MT", "ID", "WY", "IL", "IN"]);

export function classifyRegion(state?: string | null): Region[] {
  const s = (state ?? "").toUpperCase();
  const regions: Region[] = [];
  if (COASTAL.has(s)) regions.push("coastal");
  if (TORNADO_HAIL.has(s)) regions.push("tornado_hail");
  if (FIRE.has(s)) regions.push("western_fire");
  if (DESERT.has(s)) regions.push("desert");
  if (SOUTHERN.has(s)) regions.push("southern");
  if (NORTHERN.has(s)) regions.push("northern");
  if (regions.length === 0) regions.push("general");
  return regions;
}

interface Template {
  key: string;
  title: string;
  category: string;
  region: Region | "all";
  season: Season | "any";
  cadenceMonths: number;
  priority: Priority;
  rationale: string;
  match?: RegExp;
}

const TEMPLATES: Template[] = [
  // General / seasonal
  { key: "hvac_tuneup", title: "HVAC tune-up", category: "hvac", region: "all", season: "spring", cadenceMonths: 12, priority: "high", rationale: "Annual HVAC service extends lifespan and lowers energy use.", match: /hvac|furnace|a\/c/i },
  { key: "hvac_filter", title: "Replace HVAC filter", category: "hvac", region: "all", season: "any", cadenceMonths: 3, priority: "medium", rationale: "Quarterly filter swap protects the blower motor and indoor air quality." },
  { key: "gutter_clean", title: "Clean gutters", category: "exterior", region: "all", season: "fall", cadenceMonths: 6, priority: "medium", rationale: "Clogged gutters cause roof and foundation damage.", match: /gutter/i },
  { key: "roof_inspect", title: "Roof inspection", category: "roof", region: "all", season: "spring", cadenceMonths: 12, priority: "high", rationale: "Catch flashing and shingle issues before leaks.", match: /roof|shingle/i },
  { key: "wh_flush", title: "Water heater flush", category: "plumbing", region: "all", season: "any", cadenceMonths: 12, priority: "medium", rationale: "Flushing sediment improves efficiency and lifespan.", match: /water heater|wh flush/i },
  { key: "smoke_battery", title: "Smoke / CO detector battery", category: "safety", region: "all", season: "winter", cadenceMonths: 6, priority: "high", rationale: "Test alarms every 6 months." },
  { key: "fire_ext", title: "Fire extinguisher inspection", category: "safety", region: "all", season: "any", cadenceMonths: 12, priority: "low", rationale: "Check pressure gauge and accessibility annually." },
  { key: "insurance_review", title: "Annual insurance policy review", category: "insurance", region: "all", season: "fall", cadenceMonths: 12, priority: "high", rationale: "Replacement cost, deductibles, and discounts can drift each year." },
  { key: "deck_seal", title: "Deck inspection / re-seal", category: "exterior", region: "all", season: "summer", cadenceMonths: 24, priority: "low", rationale: "Sealant prevents rot and UV damage.", match: /deck/i },
  { key: "pest", title: "Pest treatment", category: "exterior", region: "all", season: "summer", cadenceMonths: 12, priority: "low", rationale: "Annual treatment limits termite, ant, and rodent damage." },

  // Southern
  { key: "attic_vent", title: "Attic ventilation inspection", category: "roof", region: "southern", season: "spring", cadenceMonths: 12, priority: "medium", rationale: "Hot, humid attics shorten roof life and breed mold." },
  { key: "termite", title: "Termite inspection", category: "exterior", region: "southern", season: "spring", cadenceMonths: 12, priority: "high", rationale: "Subterranean termites are widespread in the South." },
  { key: "crawl_humidity", title: "Crawlspace humidity check", category: "foundation", region: "southern", season: "summer", cadenceMonths: 12, priority: "medium", rationale: "Humid crawlspaces drive mold and floor damage." },
  { key: "ext_caulk", title: "Exterior caulking inspection", category: "exterior", region: "southern", season: "fall", cadenceMonths: 12, priority: "low", rationale: "Caulk fails quickly under sun + humidity." },

  // Northern
  { key: "furnace", title: "Furnace maintenance", category: "hvac", region: "northern", season: "fall", cadenceMonths: 12, priority: "high", rationale: "Service before heating season prevents mid-winter failures." },
  { key: "chimney", title: "Chimney cleaning", category: "safety", region: "northern", season: "fall", cadenceMonths: 12, priority: "high", rationale: "Creosote buildup is a leading cause of house fires." },
  { key: "ice_dam", title: "Ice dam / attic insulation check", category: "roof", region: "northern", season: "fall", cadenceMonths: 12, priority: "medium", rationale: "Insulation imbalance creates damaging ice dams." },
  { key: "pipe_freeze", title: "Pipe freeze protection", category: "plumbing", region: "northern", season: "winter", cadenceMonths: 12, priority: "high", rationale: "Burst pipes are the #1 winter insurance claim." },

  // Coastal
  { key: "salt_corrosion", title: "Salt corrosion inspection", category: "exterior", region: "coastal", season: "spring", cadenceMonths: 12, priority: "medium", rationale: "Coastal air corrodes fasteners, HVAC coils, and railings." },
  { key: "wind_mit", title: "Wind mitigation inspection", category: "roof", region: "coastal", season: "spring", cadenceMonths: 36, priority: "medium", rationale: "May unlock significant insurance discounts." },
  { key: "flood_review", title: "Flood insurance review", category: "insurance", region: "coastal", season: "summer", cadenceMonths: 12, priority: "high", rationale: "Standard policies do not cover flood damage." },

  // Tornado / Hail
  { key: "roof_storm", title: "Post-storm roof inspection", category: "roof", region: "tornado_hail", season: "spring", cadenceMonths: 12, priority: "high", rationale: "Hail damage often invisible from the ground." },
  { key: "siding_inspect", title: "Siding inspection", category: "exterior", region: "tornado_hail", season: "spring", cadenceMonths: 12, priority: "medium", rationale: "Hail and wind compromise siding integrity." },

  // Western fire
  { key: "defensible_space", title: "Defensible space inspection", category: "exterior", region: "western_fire", season: "spring", cadenceMonths: 12, priority: "high", rationale: "Vegetation within 30 ft accelerates wildfire spread." },
  { key: "ember_resist", title: "Roof / vent ember-resistance check", category: "roof", region: "western_fire", season: "spring", cadenceMonths: 24, priority: "medium", rationale: "Most wildfire home losses begin with ember intrusion." },

  // Desert
  { key: "stucco_crack", title: "Stucco crack inspection", category: "exterior", region: "desert", season: "spring", cadenceMonths: 12, priority: "low", rationale: "Thermal cycling cracks stucco; water then enters wall cavity." },
  { key: "uv_roof", title: "Roof UV inspection", category: "roof", region: "desert", season: "summer", cadenceMonths: 12, priority: "medium", rationale: "Intense UV degrades shingles 20-30% faster." },
  { key: "irrigation", title: "Irrigation inspection", category: "exterior", region: "desert", season: "spring", cadenceMonths: 12, priority: "low", rationale: "Leaks waste water and undermine foundations." },
];

const SEASON_MONTHS: Record<Season, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  fall: [9, 10, 11],
  winter: [12, 1, 2],
};

function currentSeason(): Season {
  const m = new Date().getMonth() + 1;
  for (const [k, months] of Object.entries(SEASON_MONTHS) as [Season, number[]][]) {
    if (months.includes(m)) return k;
  }
  return "spring";
}

function lastMatch(records: HSRecord[], rx?: RegExp): HSRecord | null {
  if (!rx) return null;
  const list = records
    .filter((r) => r.performed_at && (rx.test(r.category) || rx.test(`${r.title ?? ""} ${r.description ?? ""}`)))
    .sort((a, b) => new Date(b.performed_at!).getTime() - new Date(a.performed_at!).getTime());
  return list[0] ?? null;
}

function nextDueFrom(lastIso: string | null | undefined, cadenceMonths: number, season: Season | "any"): string {
  const base = lastIso ? new Date(lastIso) : new Date();
  const next = new Date(base);
  next.setMonth(next.getMonth() + cadenceMonths);
  if (season !== "any") {
    // snap to first month of target season if upcoming is far off
    const target = SEASON_MONTHS[season][0];
    const cur = next.getMonth() + 1;
    if (Math.abs(cur - target) > 3) {
      next.setMonth(target - 1);
      if (next < new Date()) next.setFullYear(next.getFullYear() + 1);
    }
  }
  return next.toISOString();
}

export interface MaintenancePlan {
  regions: Region[];
  season: Season;
  tasks: MaintenanceTask[];
}

export function buildMaintenancePlan(property: HSProperty, records: HSRecord[]): MaintenancePlan {
  const regions = classifyRegion(property.state);
  const season = currentSeason();
  const now = Date.now();

  const tasks: MaintenanceTask[] = TEMPLATES.filter(
    (t) => t.region === "all" || regions.includes(t.region as Region)
  ).map((t) => {
    const last = lastMatch(records, t.match);
    const lastIso = last?.performed_at ?? null;
    const nextDueAt = nextDueFrom(lastIso, t.cadenceMonths, t.season);
    const daysUntilDue = Math.round((new Date(nextDueAt).getTime() - now) / 86400000);
    const status: MaintenanceTask["status"] =
      daysUntilDue < -14 ? "overdue" : daysUntilDue < 30 ? "due" : "upcoming";

    return {
      id: t.key,
      title: t.title,
      category: t.category,
      region: t.region,
      season: t.season,
      cadenceMonths: t.cadenceMonths,
      priority: t.priority,
      rationale: t.rationale,
      lastDoneAt: lastIso,
      nextDueAt,
      status,
      daysUntilDue,
    };
  });

  tasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  return { regions, season, tasks };
}

// AI-style predictive recommendations (heuristic).
export function predictiveRecommendations(property: HSProperty, records: HSRecord[]): string[] {
  const recs: string[] = [];
  const age = property.year_built ? new Date().getFullYear() - property.year_built : null;
  const last = (rx: RegExp) => lastMatch(records, rx);

  const roof = last(/roof|shingle|reroof/i);
  const roofAge = roof ? (Date.now() - new Date(roof.performed_at!).getTime()) / 31557600000 : age;
  if (roofAge != null && roofAge > 18) recs.push("Your roof is entering the final 20% of its expected lifespan — schedule an inspection.");

  const hvac = last(/hvac|furnace|a\/c/i);
  if (hvac) {
    const months = (Date.now() - new Date(hvac.performed_at!).getTime()) / (30 * 86400000);
    if (months > 18) recs.push(`You haven't serviced your HVAC in ${Math.round(months)} months — efficiency may be declining.`);
  } else if (age && age > 5) {
    recs.push("No HVAC service on record — schedule a tune-up to extend system life.");
  }

  const wh = last(/water heater|wh flush/i);
  if (!wh && age && age > 8) recs.push("Water heater is approaching expected lifespan — consider an inspection or replacement plan.");

  const insurance = last(/insurance|policy/i);
  if (roof && (!insurance || new Date(insurance.performed_at!) < new Date(roof.performed_at!))) {
    recs.push("Your insurance policy should be reviewed after your recent roof work — you may qualify for new discounts.");
  }

  if (records.length === 0) recs.push("Upload your first maintenance record to start building a verified property history.");
  return recs;
}
