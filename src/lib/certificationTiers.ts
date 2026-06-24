// Phase 4 — contractor & builder certification tier logic.
// Contractor signals reuse public.contractor_scores (jobs_completed, complaint_count, quality_rating).
// "License + insurance uploaded" maps to verified=true on a related professionals row; we approximate
// per-property using contractor_scores presence. If you wire a real professionals lookup later,
// swap the inputs — the tier function is pure.

export type ContractorTier = "Unverified" | "Verified" | "Elite" | "Master";
export type BuilderTier = "Unlisted" | "Builder Partner" | "Certified Builder" | "Premier Builder";

export interface ContractorTierInput {
  licenseOnFile: boolean;
  insuranceOnFile: boolean;
  completedProjects: number;
  hasWarrantyInfo: boolean;
  unresolvedComplaints: number; // no complaints table exists yet — defaults to complaint_count
  homeownerSatisfaction: number | null; // 0..5
}

export interface BuilderTierInput {
  profileComplete: boolean;
  warrantyPackageUploaded: boolean;
  manualsUploaded: boolean;
  propertyDocsUploaded: boolean;
  propertiesCreated: number;
  digitalHandoffsConsistent: boolean;
  homeownerCompletionRate: number | null; // 0..1
}

export function contractorTier(i: ContractorTierInput): ContractorTier {
  const verified = i.licenseOnFile && i.insuranceOnFile;
  if (!verified) return "Unverified";
  const elite = verified && i.completedProjects >= 3 && i.hasWarrantyInfo;
  if (!elite) return "Verified";
  const master =
    elite &&
    i.completedProjects >= 10 &&
    i.unresolvedComplaints === 0 &&
    (i.homeownerSatisfaction ?? 0) >= 4.5;
  return master ? "Master" : "Elite";
}

export function builderTier(i: BuilderTierInput): BuilderTier {
  if (!i.profileComplete) return "Unlisted";
  const certified =
    i.profileComplete && i.warrantyPackageUploaded && i.manualsUploaded && i.propertyDocsUploaded;
  if (!certified) return "Builder Partner";
  const premier =
    certified &&
    i.propertiesCreated >= 10 &&
    i.digitalHandoffsConsistent &&
    (i.homeownerCompletionRate ?? 0) >= 0.7;
  return premier ? "Premier Builder" : "Certified Builder";
}

export const CONTRACTOR_TIER_META: Record<ContractorTier, { color: string; description: string }> = {
  Unverified: { color: "bg-slate-200 text-slate-800", description: "License or insurance not on file." },
  Verified:   { color: "bg-blue-100 text-blue-800",   description: "License + insurance on file." },
  Elite:      { color: "bg-emerald-100 text-emerald-800", description: "Verified + 3 completed projects + warranty info." },
  Master:     { color: "bg-amber-100 text-amber-800", description: "Elite + 10 projects, no unresolved complaints, high satisfaction." },
};

export const BUILDER_TIER_META: Record<BuilderTier, { color: string; description: string }> = {
  Unlisted:           { color: "bg-slate-200 text-slate-800", description: "Profile incomplete." },
  "Builder Partner":  { color: "bg-blue-100 text-blue-800", description: "Profile complete." },
  "Certified Builder":{ color: "bg-emerald-100 text-emerald-800", description: "Partner + warranty pkg + manuals + property docs." },
  "Premier Builder":  { color: "bg-amber-100 text-amber-800", description: "Certified + 10+ properties, consistent handoff, strong completion." },
};
