// Verified Home Score + engagement metrics, computed client-side from property_records.

export interface ScoreRecord {
  id: string;
  category: string;
  title: string;
  cost: number | null;
  verified: boolean;
  performed_at: string | null;
  created_at: string;
  attachmentsCount?: number;
}

/** Sections that contribute to the Verified Home Score. */
export const HOME_SECTIONS = [
  { key: "roof",        label: "Roof",        categories: ["roof"] },
  { key: "hvac",        label: "HVAC",        categories: ["hvac"] },
  { key: "electrical",  label: "Electrical",  categories: ["electrical"] },
  { key: "plumbing",    label: "Plumbing",    categories: ["plumbing"] },
  { key: "foundation",  label: "Foundation",  categories: ["foundation"] },
  { key: "windows",     label: "Windows",     categories: ["renovation","other"], match: /window/i },
  { key: "appliances",  label: "Appliances",  categories: ["maintenance","warranty","other"], match: /appliance|fridge|washer|dryer|dishwasher|oven/i },
  { key: "permits",     label: "Permits",     categories: ["permit"] },
  { key: "inspections", label: "Inspections", categories: ["inspection"] },
  { key: "warranties",  label: "Warranties",  categories: ["warranty"] },
  { key: "landscaping", label: "Landscaping", categories: ["landscaping"] },
  { key: "claims",      label: "Insurance claims", categories: ["claim"] },
] as const;

/** Improvement-style categories that add documented value. */
const IMPROVEMENT_CATEGORIES = new Set([
  "renovation","roof","hvac","electrical","plumbing","windows","solar","landscaping","construction",
]);

export interface SectionStatus {
  key: string;
  label: string;
  count: number;
  verifiedCount: number;
  completion: number; // 0-100
}

export interface HomeScoreResult {
  score: number;            // 0-100 Verified Home Score
  completion: number;       // 0-100 documentation completion
  totalRecords: number;
  verifiedRecords: number;
  sections: SectionStatus[];
  missing: { key: string; label: string }[];
  totalInvestment: number;
  points: number;
  achievements: Achievement[];
  estimatedScoreAfter: number;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  icon: string; // lucide name
}

function matchSection(rec: ScoreRecord, section: typeof HOME_SECTIONS[number]): boolean {
  const cat = rec.category?.toLowerCase() ?? "";
  if (!section.categories.includes(cat as any)) return false;
  if ((section as any).match) return (section as any).match.test(rec.title ?? "");
  return true;
}

export function computeHomeScore(records: ScoreRecord[]): HomeScoreResult {
  const totalRecords = records.length;
  const verifiedRecords = records.filter((r) => r.verified).length;

  const sections: SectionStatus[] = HOME_SECTIONS.map((s) => {
    const matching = records.filter((r) => matchSection(r, s));
    const v = matching.filter((r) => r.verified).length;
    const count = matching.length;
    // Completion: 0 → 0%, 1 unverified → 50%, 1+ verified → 100%
    let completion = 0;
    if (count > 0) completion = v > 0 ? 100 : 50;
    return { key: s.key, label: s.label, count, verifiedCount: v, completion };
  });

  const completion = Math.round(
    sections.reduce((sum, s) => sum + s.completion, 0) / sections.length,
  );

  // Verified Home Score: weighted blend of completion + verification ratio + volume bonus.
  const verifyRatio = totalRecords > 0 ? verifiedRecords / totalRecords : 0;
  const volumeBonus = Math.min(15, totalRecords); // up to +15 for record volume
  const score = Math.min(
    100,
    Math.round(completion * 0.6 + verifyRatio * 100 * 0.25 + volumeBonus),
  );

  const missing = sections.filter((s) => s.completion < 100).map(({ key, label }) => ({ key, label }));

  const totalInvestment = records
    .filter((r) => IMPROVEMENT_CATEGORIES.has(r.category?.toLowerCase() ?? ""))
    .reduce((sum, r) => sum + (r.cost ?? 0), 0);

  // Points
  const pointsPer: Record<string, number> = {
    permit: 100, inspection: 150, warranty: 100, maintenance: 40,
    renovation: 250, repair: 75, roof: 250, hvac: 200, electrical: 200,
    plumbing: 200, claim: 125, landscaping: 50, other: 25,
  };
  const points = records.reduce((sum, r) => {
    const base = pointsPer[r.category?.toLowerCase() ?? "other"] ?? 25;
    const verifyBonus = r.verified ? 50 : 0;
    const photoBonus = (r.attachmentsCount ?? 0) > 0 ? 25 : 0;
    return sum + base + verifyBonus + photoBonus;
  }, 0);

  const achievements: Achievement[] = [
    { id: "first_upload", label: "First Upload", icon: "Upload",
      description: "Add your first record", earned: totalRecords >= 1 },
    { id: "warranty_protector", label: "Warranty Protector", icon: "ShieldCheck",
      description: "Document a warranty", earned: records.some((r) => r.category === "warranty") },
    { id: "roof_verified", label: "Roof Verified", icon: "Home",
      description: "Verified roof record on file",
      earned: records.some((r) => r.category === "roof" && r.verified) },
    { id: "maintenance_master", label: "Maintenance Master", icon: "Wrench",
      description: "Log 5+ maintenance records",
      earned: records.filter((r) => r.category === "maintenance").length >= 5 },
    { id: "storm_ready", label: "Storm Ready", icon: "CloudLightning",
      description: "Document an insurance claim or storm event",
      earned: records.some((r) => r.category === "claim") },
    { id: "insurance_ready", label: "Insurance Ready", icon: "FileCheck",
      description: "Have inspection + warranty + permit on file",
      earned: ["inspection","warranty","permit"].every((c) => records.some((r) => r.category === c)) },
    { id: "master_homeowner", label: "Master Homeowner", icon: "Trophy",
      description: "Reach a Verified Home Score of 90+",
      earned: score >= 90 },
  ];

  // What-if: if every missing section is completed and verified.
  const filledCompletion = 100;
  const filledVerify = 0.9;
  const filledVolume = Math.min(15, totalRecords + missing.length);
  const estimatedScoreAfter = Math.min(
    100,
    Math.round(filledCompletion * 0.6 + filledVerify * 100 * 0.25 + filledVolume),
  );

  return {
    score, completion, totalRecords, verifiedRecords, sections, missing,
    totalInvestment, points, achievements, estimatedScoreAfter,
  };
}
