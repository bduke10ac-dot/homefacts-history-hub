// Phase 1 Property Trust Platform — documentation-completeness score (0..1000).
// Distinct from property_health_scores (systems-condition, 0..100 A–F).

export type TrustGrade = "Incomplete" | "Bronze" | "Silver" | "Gold" | "Platinum";

export interface TrustCategoryInput {
  builderVerified?: boolean;
  contractorRecordsVerified?: boolean;          // contractor_scores / permit_contractors / verified pros
  warrantyRecordsUploaded?: boolean;            // warranties / warranty_registrations
  maintenanceHistoryDocumented?: boolean;       // timeline_events of category 'maintenance' or maintenance_reminders
  permitHistoryDocumented?: boolean;            // permits
  inspectionReportsUploaded?: boolean;          // record_attachments under inspection record / disaster_vault inspection
  photoDocumentationUploaded?: boolean;         // digital_twin_rooms or property_satellite_snapshots
  insuranceClaimHistoryDocumented?: boolean;    // insurance_claims / insurance_reviews
  ownershipHistoryComplete?: boolean;           // ownership_history rows
  emergencyEstateTransferInfoComplete?: boolean; // estate_* or emergency_events
}

export interface TrustScoreResult {
  score: number;
  grade: TrustGrade;
  completedItems: TrustCategoryKey[];
  missingItems: TrustCategoryKey[];
  recommendations: { key: TrustCategoryKey; label: string; action: string }[];
}

export type TrustCategoryKey = keyof TrustCategoryInput;

const CATEGORY_DEFS: { key: TrustCategoryKey; label: string; action: string }[] = [
  { key: "builderVerified", label: "Builder verified", action: "Link a verified builder or import the build template." },
  { key: "contractorRecordsVerified", label: "Contractor records verified", action: "Add verified contractors to past work records." },
  { key: "warrantyRecordsUploaded", label: "Warranty records uploaded", action: "Upload appliance, system, and structural warranties." },
  { key: "maintenanceHistoryDocumented", label: "Maintenance history documented", action: "Log recurring maintenance — HVAC service, gutters, etc." },
  { key: "permitHistoryDocumented", label: "Permit history documented", action: "Pull or add permits for past work on this property." },
  { key: "inspectionReportsUploaded", label: "Inspection reports uploaded", action: "Upload your most recent home/roof/sewer inspection PDFs." },
  { key: "photoDocumentationUploaded", label: "Photo documentation uploaded", action: "Add room and exterior photos to the property record." },
  { key: "insuranceClaimHistoryDocumented", label: "Insurance claim history documented", action: "Record any insurance claims or confirm a clean history." },
  { key: "ownershipHistoryComplete", label: "Ownership history complete", action: "Fill in prior owners / purchase records." },
  { key: "emergencyEstateTransferInfoComplete", label: "Emergency & estate transfer info", action: "Add emergency contacts and estate/transfer instructions." },
];

const POINTS_PER_CATEGORY = 100;

function gradeFor(score: number): TrustGrade {
  if (score >= 850) return "Platinum";
  if (score >= 700) return "Gold";
  if (score >= 500) return "Silver";
  if (score >= 300) return "Bronze";
  return "Incomplete";
}

export function calculatePropertyTrustScore(input: TrustCategoryInput): TrustScoreResult {
  const completedItems: TrustCategoryKey[] = [];
  const missingItems: TrustCategoryKey[] = [];
  let score = 0;

  for (const def of CATEGORY_DEFS) {
    if (input[def.key]) {
      score += POINTS_PER_CATEGORY;
      completedItems.push(def.key);
    } else {
      missingItems.push(def.key);
    }
  }

  const recommendations = CATEGORY_DEFS
    .filter((d) => !input[d.key])
    .map((d) => ({ key: d.key, label: d.label, action: d.action }));

  return { score, grade: gradeFor(score), completedItems, missingItems, recommendations };
}

export function trustCategoryLabel(key: TrustCategoryKey): string {
  return CATEGORY_DEFS.find((d) => d.key === key)?.label ?? key;
}

export const NEXT_LEVEL_THRESHOLDS: Record<TrustGrade, number | null> = {
  Incomplete: 300,
  Bronze: 500,
  Silver: 700,
  Gold: 850,
  Platinum: null,
};

export const TRUST_CATEGORIES = CATEGORY_DEFS;
