import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldX, ShieldQuestion, ExternalLink, AlertTriangle, CalendarClock } from "lucide-react";

export type ProfessionalRow = {
  id: string;
  professional_name: string | null;
  company_name: string | null;
  professional_category: string | null;
  trade_type?: string | null;
  license_number: string | null;
  license_type: string | null;
  license_status: string | null;
  issuing_state_agency: string | null;
  issuing_state: string | null;
  expiration_date: string | null;
  nmls_id?: string | null;
  business_registration_status?: string | null;
  bbb_rating?: string | null;
  bbb_accredited?: boolean | null;
  insurance_status: string | null;
  bond_status?: string | null;
  workers_comp_status?: string | null;
  complaints_count?: number | null;
  major_complaint?: boolean | null;
  verification_score?: number | null;
  verification_badge: "green" | "yellow" | "red" | "gray" | string | null;
  verified_date?: string | null;
  source_link?: string | null;
};

export type FraudFlagRow = {
  id: string;
  flag_type: string | null;
  severity: string | null;
  detail: string | null;
  resolved: boolean | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  general_contractor: "General Contractor",
  roofer: "Roofer",
  plumber: "Plumber",
  electrician: "Electrician",
  hvac: "HVAC",
  home_inspector: "Home Inspector",
  public_adjuster: "Public Adjuster",
  realtor: "Realtor",
  mortgage_lender: "Mortgage Lender",
  insurance_agent: "Insurance Agent",
  appraiser: "Appraiser",
  other: "Other",
};

const FLAG_LABEL: Record<string, string> = {
  name_mismatch: "Name mismatch",
  license_number_mismatch: "License # mismatch",
  expired_license: "Expired license",
  wrong_trade_license: "Wrong trade license",
  business_not_registered: "Business not registered",
  insurance_missing: "Insurance missing",
  repeat_complaints: "Repeat complaints",
  permit_pulled_by_other: "Permit pulled by other",
};

const BADGE_META: Record<string, { label: string; cls: string; Icon: any; emoji: string }> = {
  green: { label: "Verified", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300", Icon: Shield, emoji: "🟢" },
  yellow: { label: "Caution", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300", Icon: ShieldAlert, emoji: "🟡" },
  red: { label: "High risk", cls: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300", Icon: ShieldX, emoji: "🔴" },
  gray: { label: "Unverified", cls: "bg-muted text-muted-foreground border-border", Icon: ShieldQuestion, emoji: "⚪" },
};

function badgeReasons(p: ProfessionalRow): string[] {
  const r: string[] = [];
  const isTrade = ["general_contractor", "roofer", "plumber", "electrician", "hvac"].includes(p.professional_category ?? "");
  if (!p.license_status || p.license_status === "unknown") r.push("No license record found");
  if (["expired", "suspended", "revoked"].includes(p.license_status ?? "")) r.push(`License ${p.license_status}`);
  if (["lapsed", "none"].includes(p.insurance_status ?? "")) r.push(`Insurance ${p.insurance_status}`);
  if (["unverified", "unknown"].includes(p.insurance_status ?? "")) r.push("Insurance not verified");
  if (isTrade && ["unverified", "unknown"].includes(p.bond_status ?? "")) r.push("Bond not verified");
  if (isTrade && ["unverified", "unknown"].includes(p.workers_comp_status ?? "")) r.push("Workers' comp not verified");
  if (p.major_complaint) r.push("Major complaint on file");
  if ((p.complaints_count ?? 0) >= 3) r.push(`${p.complaints_count} complaints`);
  else if ((p.complaints_count ?? 0) > 0) r.push(`${p.complaints_count} complaint${p.complaints_count === 1 ? "" : "s"}`);
  if (["inactive", "dissolved", "not_found"].includes(p.business_registration_status ?? "")) r.push(`Business ${p.business_registration_status}`);
  if (p.expiration_date) {
    const days = Math.round((new Date(p.expiration_date).getTime() - Date.now()) / 86400000);
    if (days <= 60 && days >= 0) r.push(`License expires in ${days} day${days === 1 ? "" : "s"}`);
    if (days < 0) r.push("License past expiration");
  }
  return r;
}

function StatusPill({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null) return null;
  const tone =
    value === "verified" || value === "active" || value === "exempt"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : value === "unverified" || value === "unknown" || value === "pending"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "bg-red-500/10 text-red-700 dark:text-red-300";
  return (
    <div className="flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`rounded px-1.5 py-0.5 font-medium capitalize ${tone}`}>{value}</span>
    </div>
  );
}

export function VerifiedProfessionalCard({
  professional,
  flags = [],
  workContext,
}: {
  professional: ProfessionalRow | null | undefined;
  flags?: FraudFlagRow[];
  workContext?: {
    license_status_at_time?: string | null;
    insurance_verified_at_time?: boolean | null;
    work_date?: string | null;
    risk_note?: string | null;
  };
}) {
  if (!professional) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        Unverified / Not on file
      </div>
    );
  }

  const p = professional;
  const isTrade = ["general_contractor", "roofer", "plumber", "electrician", "hvac"].includes(p.professional_category ?? "");
  const badgeKey = (p.verification_badge ?? "gray") as keyof typeof BADGE_META;
  const meta = BADGE_META[badgeKey] ?? BADGE_META.gray;
  const reasons = badgeReasons(p);
  const openFlags = flags.filter((f) => !f.resolved);

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABEL[p.professional_category ?? ""] ?? "Professional"}
            {p.trade_type ? ` · ${p.trade_type}` : ""}
          </div>
          <div className="mt-0.5 truncate text-base font-semibold">{p.professional_name ?? "—"}</div>
          {p.company_name && <div className="truncate text-sm text-muted-foreground">{p.company_name}</div>}
        </div>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.cls}`}>
                <meta.Icon className="h-3.5 w-3.5" />
                {meta.emoji} {meta.label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="font-medium">Why this badge</div>
              {reasons.length === 0 ? (
                <div className="mt-1 text-xs">Active, insured, no flags.</div>
              ) : (
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
                  {reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border bg-background p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">License</div>
            <div className="mt-0.5 text-sm font-medium">{p.license_number ?? "—"}</div>
            {p.license_type && <div className="text-xs text-muted-foreground">{p.license_type}</div>}
          </div>
          <div className="rounded-md border bg-background p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Issuing agency</div>
            <div className="mt-0.5 text-sm font-medium">{p.issuing_state_agency ?? "—"}</div>
            {p.issuing_state && <div className="text-xs text-muted-foreground">{p.issuing_state}</div>}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <StatusPill label="License status" value={p.license_status} />
          <StatusPill label="Insurance" value={p.insurance_status} />
          {isTrade && <StatusPill label="Bond" value={p.bond_status} />}
          {isTrade && <StatusPill label="Workers' comp" value={p.workers_comp_status} />}
          {p.business_registration_status && <StatusPill label="Business reg." value={p.business_registration_status} />}
          {p.bbb_rating && <StatusPill label={`BBB${p.bbb_accredited ? " (accredited)" : ""}`} value={p.bbb_rating} />}
          {p.nmls_id && <StatusPill label="NMLS ID" value={p.nmls_id} />}
        </div>

        {p.expiration_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Expires {new Date(p.expiration_date).toLocaleDateString()}
          </div>
        )}

        {(p.complaints_count ?? 0) > 0 && (
          <div className="text-xs">
            <span className="text-muted-foreground">Complaints on file: </span>
            <span className="font-medium">{p.complaints_count}</span>
            {p.major_complaint && <Badge variant="destructive" className="ml-2">Major</Badge>}
          </div>
        )}

        {workContext && (
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">License history for this work</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">At time of work{workContext.work_date ? ` (${workContext.work_date})` : ""}</div>
                <div className="mt-0.5 font-semibold capitalize">{workContext.license_status_at_time ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Today</div>
                <div className="mt-0.5 font-semibold capitalize">{p.license_status ?? "—"}</div>
              </div>
            </div>
            {workContext.risk_note && (
              <div className="mt-3 flex items-start gap-1.5 rounded border border-red-500/30 bg-red-500/10 p-2 text-xs font-medium text-red-700 dark:text-red-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {workContext.risk_note}
              </div>
            )}
          </div>
        )}

        {openFlags.length > 0 && (
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fraud flags</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {openFlags.map((f) => (
                <TooltipProvider key={f.id} delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        f.severity === "high"
                          ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }`}>
                        <AlertTriangle className="h-3 w-3" />
                        {FLAG_LABEL[f.flag_type ?? ""] ?? f.flag_type}
                      </span>
                    </TooltipTrigger>
                    {f.detail && <TooltipContent side="top" className="max-w-xs text-xs">{f.detail}</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
          <span>
            {p.verified_date ? `Last verified ${new Date(p.verified_date).toLocaleDateString()}` : "Not yet verified"}
            {p.verification_score != null && ` · score ${p.verification_score}`}
          </span>
          {p.source_link && (
            <a href={p.source_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              Source <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
