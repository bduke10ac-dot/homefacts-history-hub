// Heuristic per-system risk scores. 0 = no risk, 100 = severe risk.
// Region weights are illustrative — replace with FEMA/NOAA/USGS feeds later.

import type { HSProperty, HSRecord } from "./healthScore";

export type RiskBand = "low" | "medium" | "high";

export interface RiskScore {
  key: string;
  label: string;
  score: number; // 0-100 (higher = riskier)
  band: RiskBand;
  detail: string;
}

const FLOOD_STATES: Record<string, number> = {
  FL: 70, LA: 75, TX: 55, SC: 60, NC: 55, NJ: 50, NY: 40, MS: 60, AL: 55, GA: 45,
};
const WIND_STATES: Record<string, number> = {
  FL: 80, TX: 65, LA: 75, OK: 70, KS: 70, NE: 65, MS: 65, AL: 60, NC: 55, SC: 55,
};
const FIRE_STATES: Record<string, number> = {
  CA: 80, OR: 65, WA: 55, AZ: 60, NV: 60, CO: 55, NM: 55, MT: 50, ID: 50, UT: 50,
};

function band(score: number): RiskBand {
  return score >= 66 ? "high" : score >= 33 ? "medium" : "low";
}

function yearsSince(date?: string | null) {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (365.25 * 24 * 3600 * 1000);
}

function lastIn(records: HSRecord[], match: RegExp): HSRecord | null {
  const list = records
    .filter((r) => r.performed_at && (match.test(r.category) || match.test(`${r.title ?? ""} ${r.description ?? ""}`)))
    .sort((a, b) => new Date(b.performed_at!).getTime() - new Date(a.performed_at!).getTime());
  return list[0] ?? null;
}

export function computeRiskScores(property: HSProperty, records: HSRecord[]): RiskScore[] {
  const state = (property.state ?? "").toUpperCase();
  const age = property.year_built ? new Date().getFullYear() - property.year_built : 30;

  // Roof — depends on age of last roof work
  const roof = lastIn(records, /roof|shingle|reroof/i);
  const roofYrs = roof ? yearsSince(roof.performed_at)! : age;
  const roofScore = Math.min(100, Math.round(roofYrs * 4));

  // Flood
  const floodBase = FLOOD_STATES[state] ?? 20;
  const floodScore = Math.min(100, floodBase);

  // Wind
  const windScore = Math.min(100, WIND_STATES[state] ?? 25);

  // Fire (wildfire)
  const fireScore = Math.min(100, FIRE_STATES[state] ?? 20);

  // Foundation — penalize old homes without foundation work
  const foundation = lastIn(records, /foundation|drain|pier/i);
  const foundationScore = foundation
    ? Math.max(10, Math.min(70, Math.round(yearsSince(foundation.performed_at)! * 3)))
    : Math.min(80, Math.round(age * 1.2));

  // Electrical — old homes risky
  const elecScore = Math.min(90, Math.round(age * 1.0));

  // Plumbing
  const plumbing = lastIn(records, /plumb|water heater|pipe|leak/i);
  const plumbingScore = plumbing
    ? Math.min(70, Math.round(yearsSince(plumbing.performed_at)! * 5))
    : Math.min(85, Math.round(age * 1.1));

  // Insurance — driven by claims and storm exposure
  const claims = records.filter((r) => /claim|damage/i.test(`${r.category} ${r.title ?? ""}`)).length;
  const insScore = Math.min(100, claims * 25 + Math.round((windScore + floodScore) / 6));

  // Maintenance — gap since last touch
  const lastTouch = records
    .filter((r) => r.performed_at)
    .sort((a, b) => new Date(b.performed_at!).getTime() - new Date(a.performed_at!).getTime())[0];
  const gap = lastTouch ? yearsSince(lastTouch.performed_at)! : 5;
  const maintScore = Math.min(100, Math.round(gap * 18));

  const scores: RiskScore[] = [
    { key: "roof", label: "Roof", score: roofScore, band: band(roofScore), detail: roof ? `Last roof work ${Math.round(roofYrs)}y ago` : `Estimated from home age` },
    { key: "flood", label: "Flood", score: floodScore, band: band(floodScore), detail: `Regional estimate (${state || "US"})` },
    { key: "wind", label: "Wind / Storm", score: windScore, band: band(windScore), detail: `Regional estimate (${state || "US"})` },
    { key: "fire", label: "Wildfire", score: fireScore, band: band(fireScore), detail: `Regional estimate (${state || "US"})` },
    { key: "foundation", label: "Foundation", score: foundationScore, band: band(foundationScore), detail: foundation ? "Foundation work on file" : "No foundation work on file" },
    { key: "electrical", label: "Electrical", score: elecScore, band: band(elecScore), detail: `Based on home age (${age}y)` },
    { key: "plumbing", label: "Plumbing", score: plumbingScore, band: band(plumbingScore), detail: plumbing ? "Recent plumbing on file" : "No recent plumbing work" },
    { key: "insurance", label: "Insurance", score: insScore, band: band(insScore), detail: claims ? `${claims} claim${claims > 1 ? "s" : ""} on record` : "No claims on record" },
    { key: "maintenance", label: "Maintenance", score: maintScore, band: band(maintScore), detail: lastTouch ? `Last activity ${gap < 1 ? "<1" : Math.round(gap)}y ago` : "No activity on file" },
  ];

  return scores;
}
