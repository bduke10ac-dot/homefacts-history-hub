export type WarrantyLike = {
  status: string;
  is_registered: boolean;
  is_transferable: boolean;
  expiration_date: string | null;
  claim_instructions: string | null;
  provider_phone: string | null;
  installer_name: string | null;
};

export function computeWarrantyHealth(warranties: WarrantyLike[]): { score: number; recs: string[] } {
  if (!warranties.length) return { score: 0, recs: ["Add your first warranty to start tracking coverage."] };

  let score = 100;
  const recs: string[] = [];
  const now = Date.now();

  const expired = warranties.filter((w) => w.status === "expired").length;
  const unreg = warranties.filter((w) => !w.is_registered).length;
  const missingClaim = warranties.filter((w) => !w.claim_instructions && !w.provider_phone).length;
  const missingInstaller = warranties.filter((w) => !w.installer_name).length;
  const expiringSoon = warranties.filter((w) => {
    if (!w.expiration_date) return false;
    const diff = new Date(w.expiration_date).getTime() - now;
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
  }).length;

  score -= expired * 8;
  score -= unreg * 6;
  score -= missingClaim * 4;
  score -= missingInstaller * 2;
  score -= expiringSoon * 3;

  if (unreg) recs.push(`Register ${unreg} unregistered warranty${unreg > 1 ? "ies" : ""}.`);
  if (expiringSoon) recs.push(`${expiringSoon} warranty${expiringSoon > 1 ? "ies are" : " is"} expiring within 90 days — review coverage.`);
  if (missingClaim) recs.push(`${missingClaim} warranty${missingClaim > 1 ? "ies need" : " needs"} claim contact info.`);
  if (missingInstaller) recs.push(`Add installer/contractor info to ${missingInstaller} warranty${missingInstaller > 1 ? "ies" : ""}.`);
  if (expired) recs.push(`${expired} warranty${expired > 1 ? "ies have" : " has"} expired — consider extended service plans.`);
  if (!recs.length) recs.push("Warranty coverage looks great. Keep records up to date.");

  return { score: Math.max(0, Math.min(100, score)), recs };
}

export function categoryLabel(c: string): string {
  const map: Record<string, string> = {
    roof: "Roof", hvac: "HVAC", appliance: "Appliances", windows: "Windows", doors: "Doors",
    flooring: "Flooring", foundation: "Foundation", water_heater: "Water Heater", electrical: "Electrical",
    plumbing: "Plumbing", solar: "Solar", smart_home: "Smart Home", garage_door: "Garage Door",
    septic: "Septic", pool: "Pool", builder: "Builder Warranty", home_warranty: "Home Warranty Company",
    extended_service: "Extended Service Plan", other: "Other",
  };
  return map[c] ?? c;
}

export function statusFor(w: WarrantyLike): WarrantyLike["status"] {
  if (w.expiration_date) {
    const diff = new Date(w.expiration_date).getTime() - Date.now();
    if (diff < 0) return "expired";
    if (diff < 90 * 24 * 60 * 60 * 1000) return "expiring_soon";
  }
  if (!w.is_registered) return "needs_registration";
  return "active";
}
