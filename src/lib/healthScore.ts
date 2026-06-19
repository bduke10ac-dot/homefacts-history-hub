// Heuristic Home Health Score (0-100). Pure, deterministic, client-side.
// Real data sources (FEMA, NOAA, county GIS) will replace heuristics later.

export interface HSProperty {
  year_built?: number | null;
  state?: string | null;
  zip?: string | null;
}

export interface HSRecord {
  category: string;
  performed_at?: string | null;
  verified?: boolean;
  cost?: number | null;
  title?: string | null;
  description?: string | null;
}

export interface HealthFactor {
  label: string;
  impact: number; // signed points contribution from baseline 100
  detail: string;
}

export interface HealthScoreResult {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  factors: HealthFactor[];
}

function yearsSince(date?: string | null): number | null {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (365.25 * 24 * 3600 * 1000);
}

function mostRecent(records: HSRecord[], match: (r: HSRecord) => boolean): HSRecord | null {
  const filtered = records.filter(match).filter((r) => r.performed_at);
  if (!filtered.length) return null;
  return filtered.sort(
    (a, b) => new Date(b.performed_at!).getTime() - new Date(a.performed_at!).getTime()
  )[0];
}

const isRoof = (r: HSRecord) =>
  r.category === "roof" ||
  /roof|shingle|reroof/i.test(`${r.title ?? ""} ${r.description ?? ""}`);
const isHvac = (r: HSRecord) =>
  r.category === "hvac" || /hvac|furnace|a\/c|air condition/i.test(`${r.title ?? ""} ${r.description ?? ""}`);
const isClaim = (r: HSRecord) =>
  r.category === "claim" || /insurance claim|damage/i.test(`${r.title ?? ""} ${r.description ?? ""}`);

export function computeHealthScore(
  property: HSProperty,
  records: HSRecord[]
): HealthScoreResult {
  const factors: HealthFactor[] = [];
  let score = 100;

  // Roof age — replacement expected ~25y
  const roof = mostRecent(records, isRoof);
  const roofAge = roof ? yearsSince(roof.performed_at) : property.year_built ? new Date().getFullYear() - property.year_built : null;
  if (roofAge != null) {
    const impact = roofAge > 25 ? -20 : roofAge > 15 ? -10 : roofAge > 8 ? -4 : 2;
    score += impact;
    factors.push({
      label: "Roof age",
      impact,
      detail: roof
        ? `Last roof work ${Math.round(roofAge)}y ago`
        : `Estimated from year built (${Math.round(roofAge)}y)`,
    });
  }

  // HVAC age — replacement expected ~15y
  const hvac = mostRecent(records, isHvac);
  const hvacAge = hvac ? yearsSince(hvac.performed_at) : property.year_built ? new Date().getFullYear() - property.year_built : null;
  if (hvacAge != null) {
    const impact = hvacAge > 18 ? -12 : hvacAge > 12 ? -6 : hvacAge > 6 ? -2 : 2;
    score += impact;
    factors.push({
      label: "HVAC age",
      impact,
      detail: hvac ? `Last HVAC service/install ${Math.round(hvacAge)}y ago` : `Estimated (${Math.round(hvacAge)}y)`,
    });
  }

  // Maintenance cadence — penalize gaps > 18mo
  const maintenance = records
    .filter((r) => ["maintenance", "repair", "inspection"].includes(r.category) && r.performed_at)
    .sort((a, b) => new Date(b.performed_at!).getTime() - new Date(a.performed_at!).getTime());
  const lastMaint = maintenance[0];
  if (lastMaint) {
    const gap = yearsSince(lastMaint.performed_at)!;
    const impact = gap > 2 ? -8 : gap > 1.5 ? -4 : 3;
    score += impact;
    factors.push({
      label: "Maintenance cadence",
      impact,
      detail: `Most recent maintenance ${gap < 1 ? "<1" : Math.round(gap)}y ago`,
    });
  } else if (records.length === 0) {
    score -= 6;
    factors.push({ label: "Maintenance cadence", impact: -6, detail: "No maintenance records on file" });
  }

  // Verified-record ratio
  if (records.length > 0) {
    const ratio = records.filter((r) => r.verified).length / records.length;
    const impact = Math.round((ratio - 0.5) * 10); // -5..+5
    score += impact;
    factors.push({
      label: "Verified records",
      impact,
      detail: `${Math.round(ratio * 100)}% of records verified`,
    });
  }

  // Insurance claims / damage
  const claims = records.filter(isClaim).length;
  if (claims > 0) {
    const impact = -Math.min(12, claims * 4);
    score += impact;
    factors.push({ label: "Insurance claims", impact, detail: `${claims} claim${claims > 1 ? "s" : ""} on record` });
  }

  // Year built decay (very mild)
  if (property.year_built) {
    const age = new Date().getFullYear() - property.year_built;
    const impact = age > 80 ? -6 : age > 50 ? -3 : age > 20 ? -1 : 1;
    score += impact;
    factors.push({ label: "Home age", impact, detail: `Built ${property.year_built} (${age}y)` });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade: HealthScoreResult["grade"] =
    score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";

  factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  return { score, grade, factors };
}
