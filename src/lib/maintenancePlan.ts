// Regional Smart Maintenance & Reminder Engine — pure, deterministic, client-side.
// Produces a tailored maintenance plan + comprehensive reminders from property + records.

import type { HSProperty, HSRecord } from "./healthScore";

export type Region =
  | "southern" | "northern" | "coastal" | "tornado_hail"
  | "western_fire" | "desert" | "general";

export type Season = "spring" | "summer" | "fall" | "winter";
export type Priority = "low" | "medium" | "high";
export type Cadence = "monthly" | "quarterly" | "semiannual" | "annual" | "multiyear";
export type TaskGroup =
  | "maintenance" | "safety" | "utility" | "insurance"
  | "warranty" | "financial" | "weather" | "ai";

export interface MaintenanceTask {
  id: string;
  title: string;
  category: string;
  group: TaskGroup;
  region: Region | "all";
  season: Season | "any";
  cadence: Cadence;
  cadenceMonths: number;
  priority: Priority;
  rationale: string;
  lastDoneAt?: string | null;
  nextDueAt: string;
  status: "upcoming" | "due" | "overdue" | "done";
  daysUntilDue: number;
}

const COASTAL = new Set(["FL","LA","TX","MS","AL","GA","SC","NC","VA","MD","DE","NJ","NY","RI","CT","MA","NH","ME","CA","OR","WA"]);
const TORNADO_HAIL = new Set(["TX","OK","KS","NE","MO","AR","IA","IL","IN","OH","TN","KY","CO","SD","ND"]);
const FIRE = new Set(["CA","OR","WA","AZ","NV","CO","NM","MT","ID","UT"]);
const DESERT = new Set(["AZ","NV","NM","UT"]);
const SOUTHERN = new Set(["FL","GA","AL","MS","LA","TX","SC","NC","TN","AR","OK"]);
const NORTHERN = new Set(["ME","NH","VT","MA","RI","CT","NY","PA","NJ","OH","MI","WI","MN","IA","ND","SD","MT","ID","WY","IL","IN"]);

export function classifyRegion(state?: string | null): Region[] {
  const s = (state ?? "").toUpperCase();
  const r: Region[] = [];
  if (COASTAL.has(s)) r.push("coastal");
  if (TORNADO_HAIL.has(s)) r.push("tornado_hail");
  if (FIRE.has(s)) r.push("western_fire");
  if (DESERT.has(s)) r.push("desert");
  if (SOUTHERN.has(s)) r.push("southern");
  if (NORTHERN.has(s)) r.push("northern");
  if (r.length === 0) r.push("general");
  return r;
}

interface Template {
  key: string;
  title: string;
  category: string;
  group: TaskGroup;
  region: Region | "all";
  season: Season | "any";
  cadence: Cadence;
  cadenceMonths: number;
  priority: Priority;
  rationale: string;
  match?: RegExp;
}

// --- Comprehensive reminder library -------------------------------------------------
const TEMPLATES: Template[] = [
  // MONTHLY
  t("hvac_filter", "Replace HVAC air filter", "hvac", "maintenance", "all", "any", "monthly", 1, "medium", "Monthly filter swaps protect the blower motor and indoor air quality."),
  t("smoke_test", "Test smoke detectors", "safety", "safety", "all", "any", "monthly", 1, "high", "Push the test button on every alarm monthly."),
  t("co_test", "Test carbon monoxide detectors", "safety", "safety", "all", "any", "monthly", 1, "high", "CO alarms must be tested monthly."),
  t("softener_salt", "Check water softener salt", "plumbing", "utility", "all", "any", "monthly", 1, "low", "Low salt = no softening + scaled fixtures."),
  t("range_hood", "Clean range hood filters", "appliance", "maintenance", "all", "any", "monthly", 1, "low", "Grease buildup is a kitchen fire risk."),
  t("sink_leaks", "Inspect under sinks for leaks", "plumbing", "maintenance", "all", "any", "monthly", 1, "medium", "Catch slow leaks before cabinet rot."),
  t("toilet_leaks", "Inspect toilets for leaks", "plumbing", "maintenance", "all", "any", "monthly", 1, "medium", "A leaking flapper wastes 200+ gallons/day."),
  t("washer_hoses", "Inspect washing machine hoses", "plumbing", "maintenance", "all", "any", "monthly", 1, "medium", "Burst supply lines are a top insurance claim."),
  t("dryer_vent_air", "Check dryer vent airflow", "appliance", "safety", "all", "any", "monthly", 1, "medium", "Restricted airflow is a leading cause of dryer fires."),
  t("sump_test", "Check sump pump operation", "plumbing", "maintenance", "all", "any", "monthly", 1, "medium", "Pour a bucket of water to verify the pump cycles."),
  t("disposal_clean", "Clean garbage disposal", "appliance", "maintenance", "all", "any", "monthly", 1, "low", "Citrus + ice keeps blades clean and odor-free."),
  t("ext_lighting", "Check exterior lighting", "exterior", "safety", "all", "any", "monthly", 1, "low", "Burned-out bulbs are a security risk."),
  t("irrigation_check", "Inspect irrigation system", "exterior", "utility", "all", "any", "monthly", 1, "low", "Catch broken heads early to avoid water waste."),
  t("hf_backup", "Back up HomeFacts documents", "vault", "maintenance", "all", "any", "monthly", 1, "low", "Keep an offline copy of critical records."),

  // QUARTERLY
  t("fridge_filter", "Replace refrigerator water filter", "appliance", "utility", "all", "any", "quarterly", 3, "low", "Most fridges call for filter swaps every 6 months — verify yours."),
  t("dryer_vent_clean", "Clean dryer vent line", "appliance", "safety", "all", "any", "quarterly", 3, "medium", "Lint buildup beyond the trap is a fire risk."),
  t("attic_inspect", "Inspect attic", "roof", "maintenance", "all", "any", "quarterly", 3, "low", "Check for pests, leaks, and insulation gaps."),
  t("crawl_check", "Check crawlspace", "foundation", "maintenance", "all", "any", "quarterly", 3, "low", "Look for moisture, pests, and pipe sweat."),
  t("foundation_inspect", "Inspect foundation", "foundation", "maintenance", "all", "any", "quarterly", 3, "medium", "Catch cracks before they widen."),
  t("garage_lube", "Lubricate garage door", "exterior", "maintenance", "all", "any", "quarterly", 3, "low", "Quiet operation + longer opener life."),
  t("weather_strip", "Inspect weather stripping", "exterior", "utility", "all", "any", "quarterly", 3, "low", "Bad seals = high energy bills."),
  t("gfci_test", "Test GFCI outlets", "electrical", "safety", "all", "any", "quarterly", 3, "medium", "Press TEST/RESET on every kitchen, bath, and exterior GFCI."),
  t("afci_test", "Test AFCI breakers", "electrical", "safety", "all", "any", "quarterly", 3, "medium", "AFCIs protect against arc faults — confirm they trip."),
  t("outdoor_faucets", "Inspect outdoor faucets", "plumbing", "maintenance", "all", "any", "quarterly", 3, "low", "Drips and frost damage are easy to miss."),
  t("water_pressure", "Check water pressure", "plumbing", "maintenance", "all", "any", "quarterly", 3, "low", "Pressure over 80 psi damages fixtures and appliances."),
  t("roof_from_ground", "Visual roof check from ground", "roof", "maintenance", "all", "any", "quarterly", 3, "low", "Binoculars are enough — look for missing shingles."),
  t("deck_fasteners", "Inspect deck fasteners", "exterior", "safety", "all", "any", "quarterly", 3, "medium", "Loose ledger boards cause collapses."),
  t("retaining_walls", "Inspect retaining walls", "exterior", "maintenance", "all", "any", "quarterly", 3, "low", "Bulges = drainage failure."),
  t("landscape_drain", "Inspect landscaping drainage", "exterior", "maintenance", "all", "any", "quarterly", 3, "low", "Water should always flow away from the foundation."),

  // SEMI-ANNUAL
  t("hvac_pro", "HVAC professional service", "hvac", "maintenance", "all", "spring", "semiannual", 6, "high", "Spring + fall tune-ups extend system life.", /hvac|furnace|a\/c/i),
  t("wh_flush", "Flush water heater", "plumbing", "maintenance", "all", "any", "semiannual", 6, "medium", "Sediment cuts efficiency and lifespan.", /water heater|wh flush/i),
  t("roof_pro_inspect", "Inspect roof", "roof", "maintenance", "all", "spring", "semiannual", 6, "high", "Catch flashing and shingle issues before leaks.", /roof|shingle/i),
  t("gutter_clean", "Clean gutters", "exterior", "maintenance", "all", "fall", "semiannual", 6, "medium", "Clogged gutters cause roof and foundation damage.", /gutter/i),
  t("powerwash", "Power wash exterior", "exterior", "maintenance", "all", "spring", "semiannual", 6, "low", "Mildew and grime shorten siding life."),
  t("windows_doors", "Inspect windows and doors", "exterior", "utility", "all", "fall", "semiannual", 6, "low", "Re-caulk and re-weatherstrip as needed."),
  t("concrete_cracks", "Seal concrete cracks", "exterior", "maintenance", "all", "fall", "semiannual", 6, "low", "Stops freeze-thaw damage."),
  t("sump_test_pro", "Test sump pump fully", "plumbing", "maintenance", "all", "spring", "semiannual", 6, "medium", "Including backup battery / float switch."),
  t("chimney_inspect", "Inspect chimney", "safety", "safety", "all", "fall", "semiannual", 6, "medium", "Look for cap, cracks, and creosote.", /chimney/i),
  t("fireplace_service", "Service fireplace", "safety", "safety", "all", "fall", "semiannual", 6, "medium", "Open damper + clean glass + check seals."),
  t("attic_insulation", "Inspect attic insulation", "roof", "utility", "all", "fall", "semiannual", 6, "low", "Settled insulation = higher bills."),
  t("trim_trees", "Trim trees away from roof", "exterior", "maintenance", "all", "spring", "semiannual", 6, "medium", "Branches damage shingles and invite pests."),

  // ANNUAL
  t("roof_pro", "Professional roof inspection", "roof", "maintenance", "all", "spring", "annual", 12, "high", "Annual pro inspection preserves your warranty."),
  t("termite", "Annual termite inspection", "exterior", "maintenance", "southern", "spring", "annual", 12, "high", "Termites cause $5B+ in damage yearly in the South."),
  t("pest_control", "Pest control treatment", "exterior", "maintenance", "all", "summer", "annual", 12, "low", "Annual treatment limits termite, ant, and rodent damage."),
  t("insurance_review", "Insurance policy review", "insurance", "insurance", "all", "fall", "annual", 12, "high", "Replacement cost, deductibles, and discounts drift each year.", /insurance|policy/i),
  t("security_inspect", "Home security system inspection", "safety", "safety", "all", "any", "annual", 12, "low", "Verify sensors, batteries, and monitoring."),
  t("fire_ext", "Fire extinguisher inspection", "safety", "safety", "all", "any", "annual", 12, "low", "Check pressure gauge and accessibility."),
  t("water_quality", "Water quality testing", "plumbing", "utility", "all", "any", "annual", 12, "low", "Especially important for wells."),
  t("septic_inspect", "Septic inspection", "plumbing", "maintenance", "all", "any", "annual", 12, "medium", "Pump every 3–5 years; inspect annually."),
  t("well_inspect", "Well inspection", "plumbing", "maintenance", "all", "any", "annual", 12, "medium", "Test pump output and water chemistry."),
  t("plumbing_pro", "Plumbing inspection", "plumbing", "maintenance", "all", "any", "annual", 12, "low", "A pro can spot pin-hole leaks early."),
  t("electrical_pro", "Electrical inspection", "electrical", "safety", "all", "any", "annual", 12, "medium", "Panel, GFCIs, and grounding check."),
  t("foundation_pro", "Foundation inspection", "foundation", "maintenance", "all", "any", "annual", 12, "medium", "Pro can read cracks you can't."),
  t("ext_caulk", "Exterior caulking inspection", "exterior", "maintenance", "all", "fall", "annual", 12, "low", "Caulk fails quickly under sun + humidity."),
  t("driveway_wash", "Pressure wash driveway", "exterior", "maintenance", "all", "spring", "annual", 12, "low", "Removes oil and mildew before sealing."),
  t("deck_seal", "Deck sealing", "exterior", "maintenance", "all", "summer", "annual", 12, "low", "Sealant prevents rot and UV damage.", /deck/i),
  t("fence_inspect", "Fence inspection", "exterior", "maintenance", "all", "spring", "annual", 12, "low", "Tighten posts; replace rotten boards."),
  t("irrigation_pro", "Irrigation inspection", "exterior", "utility", "all", "spring", "annual", 12, "low", "Pressure test and head adjustment."),
  t("landscape_grade", "Landscape grading inspection", "exterior", "maintenance", "all", "spring", "annual", 12, "low", "Soil should slope away from the foundation."),
  t("window_clean", "Window cleaning", "exterior", "maintenance", "all", "spring", "annual", 12, "low", "Improves curb appeal + finds frame issues."),
  t("solar_inspect", "Solar panel inspection", "exterior", "utility", "all", "spring", "annual", 12, "low", "Clean panels + check inverter."),
  t("generator_service", "Generator service", "electrical", "utility", "all", "fall", "annual", 12, "medium", "Oil, filter, exercise — before storm season."),
  t("garage_door", "Garage door maintenance", "exterior", "maintenance", "all", "any", "annual", 12, "low", "Test reverse, balance, and safety eyes."),
  t("appliance_maint", "Appliance maintenance", "appliance", "maintenance", "all", "any", "annual", 12, "low", "Vacuum coils, descale, check seals."),
  t("fridge_coils", "Refrigerator coil cleaning", "appliance", "utility", "all", "any", "annual", 12, "low", "Dirty coils cost ~15% more in electricity."),
  t("hvac_duct", "HVAC duct inspection", "hvac", "maintenance", "all", "any", "annual", 12, "low", "Look for leaks and dust buildup."),
  t("dryer_vent_pro", "Dryer vent professional cleaning", "appliance", "safety", "all", "any", "annual", 12, "medium", "Lint fires cause 2,900+ home fires/year."),
  t("chimney_sweep", "Chimney sweep", "safety", "safety", "all", "fall", "annual", 12, "high", "Creosote is a leading cause of chimney fires."),
  t("fireplace_pro", "Fireplace inspection", "safety", "safety", "all", "fall", "annual", 12, "medium", "Level 1 inspection by certified sweep."),
  t("pool_inspect", "Pool inspection", "exterior", "maintenance", "all", "spring", "annual", 12, "low", "Pump, heater, and barrier compliance."),
  t("hottub_service", "Hot tub service", "exterior", "maintenance", "all", "any", "annual", 12, "low", "Drain, refill, sanitize."),

  // SAFETY-specific
  t("smoke_battery", "Replace smoke detector batteries", "safety", "safety", "all", "fall", "semiannual", 6, "high", "Daylight savings is a good prompt."),
  t("co_battery", "Replace CO detector batteries", "safety", "safety", "all", "fall", "semiannual", 6, "high", "Same schedule as smoke alarms."),
  t("smoke_replace", "Replace smoke detectors (10y rule)", "safety", "safety", "all", "any", "multiyear", 120, "high", "Sensors wear out — full replacement at 10 years."),
  t("emergency_plan", "Review family emergency plan", "safety", "safety", "all", "any", "annual", 12, "low", "Meeting points, contacts, evacuation routes."),
  t("emergency_contacts", "Update emergency contacts", "safety", "safety", "all", "any", "annual", 12, "low", "Phone numbers change."),
  t("emergency_kit", "Restock emergency kit", "safety", "safety", "all", "spring", "annual", 12, "low", "Water, batteries, meds, first aid."),
  t("evac_routes", "Review evacuation routes", "safety", "safety", "all", "any", "annual", 12, "low", "Especially important in fire/flood zones."),
  t("generator_fuel", "Check generator fuel", "utility", "utility", "all", "fall", "quarterly", 3, "medium", "Stale fuel = no power when you need it."),
  t("surge_inspect", "Inspect surge protectors", "electrical", "safety", "all", "any", "annual", 12, "low", "Most have a ~5-year life."),

  // UTILITY-specific
  t("septic_pump", "Septic pumping", "plumbing", "utility", "all", "any", "multiyear", 48, "medium", "Pump every 3–5 years depending on use."),
  t("propane_refill", "Propane refill check", "utility", "utility", "all", "fall", "quarterly", 3, "low", "Don't run out mid-winter."),
  t("well_test", "Well water testing", "plumbing", "utility", "all", "any", "annual", 12, "medium", "Bacteria + nitrate test annually."),
  t("irrigation_open", "Irrigation seasonal activation", "exterior", "utility", "all", "spring", "annual", 12, "low", "Pressurize and test every zone."),
  t("irrigation_winter", "Irrigation winterization", "exterior", "utility", "northern", "fall", "annual", 12, "high", "Blow out lines before first freeze."),

  // FINANCIAL
  t("prop_tax", "Property tax due", "financial", "financial", "all", "fall", "annual", 12, "high", "Late payments incur penalties."),
  t("hoa_dues", "HOA dues", "financial", "financial", "all", "any", "quarterly", 3, "medium", "Verify amount + due date."),
  t("escrow_review", "Mortgage escrow review", "financial", "financial", "all", "any", "annual", 12, "low", "Check for shortages or refunds."),
  t("ins_renewal", "Insurance renewal", "financial", "financial", "all", "any", "annual", 12, "high", "Compare quotes before auto-renewal."),
  t("utility_budget", "Utility budget review", "financial", "financial", "all", "any", "annual", 12, "low", "Spot creeping costs."),
  t("warranty_renewal", "Home warranty renewal", "financial", "financial", "all", "any", "annual", 12, "low", "Compare coverage tiers."),
  t("energy_audit", "Energy audit reminder", "financial", "financial", "all", "fall", "multiyear", 36, "low", "Many utilities offer free audits."),

  // MULTI-YEAR
  t("ext_paint", "Exterior painting inspection", "exterior", "maintenance", "all", "spring", "multiyear", 60, "low", "Touch-ups every 5 yrs, repaint every 7–10."),
  t("roof_sealant", "Roof sealant inspection", "roof", "maintenance", "all", "spring", "multiyear", 48, "medium", "Penetrations + flashings need fresh sealant."),
  t("wh_anode", "Water heater anode rod replacement", "plumbing", "maintenance", "all", "any", "multiyear", 48, "medium", "Extends tank life dramatically."),
  t("carpet_clean", "Professional carpet cleaning", "interior", "maintenance", "all", "any", "multiyear", 24, "low", "Preserves warranty + IAQ."),
  t("hvac_duct_clean", "HVAC duct cleaning", "hvac", "maintenance", "all", "any", "multiyear", 60, "low", "Only if visibly contaminated."),
  t("driveway_seal", "Driveway sealing", "exterior", "maintenance", "all", "summer", "multiyear", 36, "low", "Re-seal asphalt every 3 years."),
  t("foundation_wp", "Foundation waterproofing inspection", "foundation", "maintenance", "all", "any", "multiyear", 60, "low", "Hydrostatic pressure causes basement leaks."),
  t("tree_health", "Tree health evaluation", "exterior", "safety", "all", "any", "multiyear", 36, "low", "Dead limbs threaten roofs and people."),
  t("roof_condition", "Roof condition assessment", "roof", "maintenance", "all", "spring", "multiyear", 60, "medium", "Plan replacement before failure."),
  t("wh_replace_eval", "Water heater replacement evaluation", "plumbing", "maintenance", "all", "any", "multiyear", 96, "low", "Most tanks last 8–12 years."),
  t("hvac_replace_plan", "HVAC replacement planning", "hvac", "maintenance", "all", "any", "multiyear", 120, "medium", "Plan before mid-summer failure."),
  t("siding_inspect", "Exterior siding inspection", "exterior", "maintenance", "all", "spring", "multiyear", 60, "low", "Check for warping, gaps, woodpecker damage."),
  t("window_seal", "Window seal inspection", "exterior", "utility", "all", "fall", "multiyear", 60, "low", "Foggy panes = failed seals."),
  t("attic_eval", "Attic insulation evaluation", "roof", "utility", "all", "fall", "multiyear", 60, "low", "R-value drops as insulation settles."),
  t("flooring_inspect", "Flooring inspection", "interior", "maintenance", "all", "any", "multiyear", 60, "low", "Refinish hardwoods on a schedule."),
  t("ext_caulk_replace", "Exterior caulking replacement", "exterior", "maintenance", "all", "spring", "multiyear", 60, "low", "Full re-caulking every 5–10 years."),

  // REGIONAL OVERRIDES (in addition to all-region tasks above)
  t("furnace_pre", "Furnace pre-season service", "hvac", "maintenance", "northern", "fall", "annual", 12, "high", "Avoid mid-winter breakdowns."),
  t("ice_dam", "Ice dam / attic insulation check", "roof", "maintenance", "northern", "fall", "annual", 12, "medium", "Insulation imbalance creates damaging ice dams."),
  t("pipe_freeze", "Pipe freeze protection", "plumbing", "maintenance", "northern", "winter", "annual", 12, "high", "Burst pipes are the #1 winter claim."),
  t("salt_corrosion", "Salt corrosion inspection", "exterior", "maintenance", "coastal", "spring", "annual", 12, "medium", "Coastal air corrodes fasteners and coils."),
  t("wind_mit", "Wind mitigation inspection", "roof", "insurance", "coastal", "spring", "multiyear", 36, "medium", "May unlock significant insurance discounts."),
  t("flood_review", "Flood insurance review", "insurance", "insurance", "coastal", "summer", "annual", 12, "high", "Standard policies do not cover flood damage."),
  t("hurricane_prep", "Hurricane preparation", "exterior", "weather", "coastal", "summer", "annual", 12, "high", "Shutters, supplies, and documentation."),
  t("storm_doc", "Storm documentation prep", "safety", "weather", "tornado_hail", "spring", "annual", 12, "medium", "Photo inventory + insurance docs ready."),
  t("defensible_space", "Defensible space inspection", "exterior", "weather", "western_fire", "spring", "annual", 12, "high", "Vegetation within 30 ft accelerates wildfire spread."),
  t("ember_resist", "Roof / vent ember-resistance check", "roof", "weather", "western_fire", "spring", "multiyear", 24, "medium", "Most wildfire home losses begin with ember intrusion."),
  t("stucco_crack", "Stucco crack inspection", "exterior", "maintenance", "desert", "spring", "annual", 12, "low", "Thermal cycling cracks stucco."),
  t("uv_roof", "Roof UV inspection", "roof", "maintenance", "desert", "summer", "annual", 12, "medium", "Intense UV degrades shingles faster."),
];

function t(
  key: string, title: string, category: string, group: TaskGroup,
  region: Region | "all", season: Season | "any",
  cadence: Cadence, cadenceMonths: number, priority: Priority, rationale: string,
  match?: RegExp,
): Template {
  return { key, title, category, group, region, season, cadence, cadenceMonths, priority, rationale, match };
}

const SEASON_MONTHS: Record<Season, number[]> = {
  spring: [3,4,5], summer: [6,7,8], fall: [9,10,11], winter: [12,1,2],
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
  if (season !== "any" && cadenceMonths >= 6) {
    const target = SEASON_MONTHS[season][0];
    next.setMonth(target - 1);
    while (next.getTime() < Date.now() - 30 * 86400000) next.setFullYear(next.getFullYear() + 1);
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

  const tasks: MaintenanceTask[] = TEMPLATES
    .filter((t) => t.region === "all" || regions.includes(t.region as Region))
    .map((t) => {
      const last = lastMatch(records, t.match);
      const lastIso = last?.performed_at ?? null;
      const nextDueAt = nextDueFrom(lastIso, t.cadenceMonths, t.season);
      const daysUntilDue = Math.round((new Date(nextDueAt).getTime() - now) / 86400000);
      const status: MaintenanceTask["status"] =
        daysUntilDue < -14 ? "overdue" : daysUntilDue < 30 ? "due" : "upcoming";
      return {
        id: t.key, title: t.title, category: t.category, group: t.group,
        region: t.region, season: t.season, cadence: t.cadence,
        cadenceMonths: t.cadenceMonths, priority: t.priority, rationale: t.rationale,
        lastDoneAt: lastIso, nextDueAt, status, daysUntilDue,
      };
    });

  tasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  return { regions, season, tasks };
}

// --- Weather-based reminders --------------------------------------------------------
export const WEATHER_BEFORE_STORM = [
  "Secure outdoor furniture",
  "Clean gutters",
  "Charge backup batteries",
  "Photograph property",
  "Move vehicles to safety",
  "Test sump pump",
];
export const WEATHER_AFTER_STORM = [
  "Inspect roof",
  "Inspect gutters",
  "Inspect siding",
  "Inspect windows",
  "Check attic for leaks",
  "Upload damage photos",
  "Schedule contractor inspection",
  "Contact insurance if necessary",
];

// --- Warranty reminders -------------------------------------------------------------
export interface WarrantyReminder { label: string; daysOut: number; priority: Priority }
export const WARRANTY_WINDOWS: WarrantyReminder[] = [
  { label: "Registration incomplete", daysOut: 30, priority: "medium" },
  { label: "Expires in 90 days", daysOut: 90, priority: "low" },
  { label: "Expires in 30 days", daysOut: 30, priority: "medium" },
  { label: "Expires in 7 days", daysOut: 7, priority: "high" },
  { label: "Expires today", daysOut: 0, priority: "high" },
];

// --- Role-based follow-up templates -------------------------------------------------
export interface FollowupTemplate { id: string; label: string; days: number; channel: "email" | "sms" | "push" | "call" }
export const REALTOR_FOLLOWUPS: FollowupTemplate[] = [
  { id: "r30", label: "30-day check-in", days: 30, channel: "email" },
  { id: "r90", label: "90-day follow-up", days: 90, channel: "email" },
  { id: "r180", label: "6-month homeownership check-in", days: 180, channel: "email" },
  { id: "r365", label: "Annual home anniversary", days: 365, channel: "email" },
  { id: "rcma", label: "CMA (Comparative Market Analysis)", days: 365, channel: "email" },
  { id: "rvalue", label: "Property value update", days: 180, channel: "push" },
  { id: "rreport", label: "HomeFacts annual report review", days: 365, channel: "email" },
  { id: "rrefer", label: "Referral request", days: 120, channel: "email" },
  { id: "rbday", label: "Birthday greeting", days: 365, channel: "sms" },
  { id: "rholiday", label: "Holiday greeting", days: 365, channel: "email" },
  { id: "rmaint", label: "Maintenance reminder outreach", days: 180, channel: "email" },
  { id: "requity", label: "Equity update", days: 365, channel: "email" },
  { id: "rrefi", label: "Refinance opportunity", days: 180, channel: "email" },
  { id: "rmarket", label: "Market update", days: 90, channel: "email" },
  { id: "rimprove", label: "Home improvement recommendations", days: 270, channel: "email" },
];
export const BUILDER_FOLLOWUPS: FollowupTemplate[] = [
  { id: "b30", label: "30-day walkthrough", days: 30, channel: "call" },
  { id: "b90", label: "90-day warranty visit", days: 90, channel: "email" },
  { id: "b330", label: "11-month warranty reminder", days: 330, channel: "email" },
  { id: "b365", label: "1-year warranty inspection", days: 365, channel: "call" },
  { id: "bfound", label: "Foundation inspection", days: 365, channel: "call" },
  { id: "bseason", label: "Seasonal maintenance reminder", days: 180, channel: "email" },
  { id: "bexp", label: "Warranty expiration reminder", days: 365, channel: "email" },
];
export const CONTRACTOR_FOLLOWUPS: Record<string, FollowupTemplate[]> = {
  roof: [
    { id: "roof1y", label: "Annual roof inspection", days: 365, channel: "email" },
    { id: "roof3y", label: "3-year inspection", days: 1095, channel: "email" },
    { id: "roof5y", label: "5-year inspection", days: 1825, channel: "email" },
  ],
  hvac: [
    { id: "hvac6m", label: "6-month service", days: 180, channel: "email" },
    { id: "hvac1y", label: "Annual maintenance", days: 365, channel: "email" },
  ],
  plumbing: [{ id: "plumb1y", label: "1-year inspection", days: 365, channel: "email" }],
  deck: [{ id: "deck1y", label: "Annual sealing reminder", days: 365, channel: "email" }],
  water_heater: [
    { id: "wh1y", label: "Annual flush reminder", days: 365, channel: "email" },
    { id: "whanode", label: "Anode rod inspection", days: 1095, channel: "email" },
  ],
};

// --- Predictive AI recommendations --------------------------------------------------
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
