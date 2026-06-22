// Home Confidence Score — 15-category 0-100 score for a property.
// Pure functions; pulls from records, health sections, badges, insurance, etc.

export const CONFIDENCE_CATEGORIES = [
  { key: "roof", label: "Roof condition", systems: ["Roof"] },
  { key: "hvac", label: "HVAC condition", systems: ["HVAC", "Furnace", "AC"] },
  { key: "plumbing", label: "Plumbing condition", systems: ["Plumbing", "Water Heater"] },
  { key: "electrical", label: "Electrical condition", systems: ["Electrical"] },
  { key: "foundation", label: "Foundation condition", systems: ["Foundation"] },
  { key: "insurance", label: "Insurance readiness", systems: [] },
  { key: "maintenance", label: "Maintenance compliance", systems: [] },
  { key: "energy", label: "Energy efficiency", systems: ["Solar", "Insulation", "Windows"] },
  { key: "permits", label: "Permit compliance", systems: [] },
  { key: "documentation", label: "Documentation completeness", systems: [] },
  { key: "warranty", label: "Warranty coverage", systems: [] },
  { key: "contractor", label: "Contractor verification", systems: [] },
  { key: "weather", label: "Weather / storm risk", systems: [] },
  { key: "buyer", label: "Buyer confidence", systems: [] },
  { key: "value", label: "Property value protection", systems: [] },
] as const;

export type ConfidenceCategoryKey = typeof CONFIDENCE_CATEGORIES[number]["key"];

export interface CategoryResult {
  key: ConfidenceCategoryKey;
  label: string;
  score: number;
  status: "Excellent" | "Good" | "Needs Attention" | "Critical";
  explanation: string;
  recommended_action: string;
}

export interface ConfidenceResult {
  overall: number;
  status: string;
  categories: CategoryResult[];
}

interface Inputs {
  records: Array<{ category?: string | null; verified?: boolean; performed_at?: string | null; cost?: number | null }>;
  health: Array<{ section: string; status?: string; risk_level?: string; warranty_expires?: string | null; install_date?: string | null; lifespan_years?: number | null }>;
  hasInsurance?: boolean;
  badgesVerified?: number;
}

function statusFor(score: number): CategoryResult["status"] {
  if (score >= 85) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 40) return "Needs Attention";
  return "Critical";
}

function scoreSystem(systems: string[], h: Inputs["health"]): { score: number; note: string } {
  if (!systems.length) return { score: 50, note: "No system tracked" };
  const matched = h.filter((s) => systems.some((sys) => s.section.toLowerCase().includes(sys.toLowerCase())));
  if (!matched.length) return { score: 35, note: `No ${systems[0]} record on file. Add install date, contractor, and warranty to improve.` };
  // average remaining life %
  let total = 0;
  let count = 0;
  for (const m of matched) {
    if (!m.install_date || !m.lifespan_years) { total += 60; count++; continue; }
    const age = (Date.now() - new Date(m.install_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const remaining = Math.max(0, 1 - age / m.lifespan_years);
    total += Math.round(remaining * 100);
    count++;
  }
  const avg = Math.round(total / Math.max(1, count));
  return { score: avg, note: `Based on ${count} documented ${systems[0]} record${count > 1 ? "s" : ""}.` };
}

export function computeConfidenceScore(inputs: Inputs): ConfidenceResult {
  const cats: CategoryResult[] = CONFIDENCE_CATEGORIES.map((c) => {
    let score = 50;
    let explanation = "";
    let action = "";

    if (c.systems.length) {
      const s = scoreSystem([...c.systems], inputs.health);
      score = s.score;
      explanation = s.note;
      action = score < 65 ? `Document or service ${c.systems[0]} to improve this score.` : "Keep records current at each service.";
    } else {
      switch (c.key) {
        case "insurance":
          score = inputs.hasInsurance ? 90 : 25;
          explanation = inputs.hasInsurance ? "Active insurance policy on file." : "No insurance policy uploaded.";
          action = inputs.hasInsurance ? "Review annually before renewal." : "Upload your current homeowners policy.";
          break;
        case "maintenance": {
          const recent = inputs.records.filter((r) => r.performed_at && (Date.now() - new Date(r.performed_at).getTime()) < 365 * 24 * 3600 * 1000).length;
          score = Math.min(100, 40 + recent * 8);
          explanation = `${recent} maintenance record(s) in the last 12 months.`;
          action = recent < 4 ? "Log routine maintenance (filters, gutters, HVAC tune-up)." : "Maintenance cadence looks healthy.";
          break;
        }
        case "permits": {
          const permits = inputs.records.filter((r) => (r.category ?? "").toLowerCase().includes("permit")).length;
          score = Math.min(100, 40 + permits * 15);
          explanation = `${permits} permit record(s) on file.`;
          action = permits === 0 ? "Add any historical permits to prove code compliance." : "Keep adding permits for new work.";
          break;
        }
        case "documentation": {
          const n = inputs.records.length;
          score = Math.min(100, 30 + n * 4);
          explanation = `${n} total records documented.`;
          action = n < 10 ? "Add more documents and photos to strengthen the record." : "Excellent documentation depth.";
          break;
        }
        case "warranty": {
          const active = inputs.health.filter((s) => s.warranty_expires && new Date(s.warranty_expires) > new Date()).length;
          score = Math.min(100, 30 + active * 15);
          explanation = `${active} active warranty record(s).`;
          action = active === 0 ? "Upload warranty documents from builders, contractors, and appliances." : "Track warranty expiration dates.";
          break;
        }
        case "contractor": {
          const verified = inputs.records.filter((r) => r.verified).length;
          score = Math.min(100, 30 + verified * 8);
          explanation = `${verified} contractor-verified record(s).`;
          action = verified < 5 ? "Invite contractors to verify their completed projects." : "Strong verified contractor history.";
          break;
        }
        case "weather": {
          score = 65;
          explanation = "Regional weather/storm exposure considered.";
          action = "Document any storm damage and inspections in the Timeline.";
          break;
        }
        case "buyer": {
          const verified = inputs.records.filter((r) => r.verified).length;
          score = Math.min(100, 30 + inputs.records.length * 3 + verified * 5);
          explanation = "Based on documentation depth and verification.";
          action = "Stronger records build buyer confidence.";
          break;
        }
        case "value": {
          score = Math.min(100, 40 + inputs.records.length * 3 + (inputs.hasInsurance ? 10 : 0) + (inputs.badgesVerified ?? 0) * 5);
          explanation = "Composite of documentation, insurance, and verified badges.";
          action = "Each verified record protects long-term value.";
          break;
        }
      }
    }

    return {
      key: c.key,
      label: c.label,
      score,
      status: statusFor(score),
      explanation,
      recommended_action: action,
    };
  });

  const overall = Math.round(cats.reduce((a, c) => a + c.score, 0) / cats.length);
  return {
    overall,
    status: overall >= 85 ? "Excellent" : overall >= 65 ? "Strong" : overall >= 40 ? "Building" : "Needs attention",
    categories: cats,
  };
}
