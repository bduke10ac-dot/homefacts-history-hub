import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { VerifiedProfessionalCard, type ProfessionalRow, type FraudFlagRow } from "@/components/professionals/VerifiedProfessionalCard";
import { MapPin, FileText, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Permit = {
  id: string;
  permit_number: string | null;
  permit_type: string | null;
  description: string | null;
  status: string | null;
  issued_date: string | null;
  finaled_date: string | null;
  valuation: number | null;
  applicant_name: string | null;
};

type WorkRow = {
  id: string;
  permit_id: string | null;
  permit_number: string | null;
  professional_id: string | null;
  professional_name: string | null;
  company_name: string | null;
  work_performed: string;
  work_date: string | null;
  license_verified: boolean | null;
  license_status_at_time: string | null;
  license_status_today: string | null;
  professional_badge_today: string | null;
  insurance_verified_at_time: boolean | null;
  insurance_status_today: string | null;
  source_url: string | null;
  risk_note: string | null;
};

export default function PropertyHomeHistory() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [workRows, setWorkRows] = useState<WorkRow[]>([]);
  const [proById, setProById] = useState<Record<string, ProfessionalRow>>({});
  const [proByPermit, setProByPermit] = useState<Record<string, ProfessionalRow | undefined>>({});
  const [flagsByPro, setFlagsByPro] = useState<Record<string, FraudFlagRow[]>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: prop }, { data: permitRows }, { data: links }, { data: pros }, { data: flags }, { data: work }] = await Promise.all([
        supabase.from("properties").select("*").eq("id", id).maybeSingle(),
        supabase.from("permits").select("*").eq("property_id", id).order("issued_date", { ascending: false }),
        supabase.from("permit_professionals").select("permit_id,professional_id,role"),
        supabase.from("professionals").select("*"),
        supabase.from("fraud_flags").select("*"),
        supabase.from("work_history_with_current_status").select("*").eq("property_id", id),
      ]);

      setProperty(prop);
      setPermits((permitRows ?? []) as Permit[]);
      setWorkRows((work ?? []) as WorkRow[]);

      const pIdx: Record<string, ProfessionalRow> = {};
      (pros ?? []).forEach((p: any) => { pIdx[p.id] = p; });
      setProById(pIdx);

      const permitIds = new Set((permitRows ?? []).map((p: any) => p.id));
      const pByPermit: Record<string, ProfessionalRow | undefined> = {};
      (links ?? []).forEach((l: any) => {
        if (permitIds.has(l.permit_id) && pIdx[l.professional_id]) {
          pByPermit[l.permit_id] = pIdx[l.professional_id];
        }
      });
      setProByPermit(pByPermit);

      const fIdx: Record<string, FraudFlagRow[]> = {};
      (flags ?? []).forEach((f: any) => {
        if (!f.professional_id) return;
        (fIdx[f.professional_id] ??= []).push(f);
      });
      setFlagsByPro(fIdx);

      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64" /></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">
          Property not found. <Link to="/" className="text-primary hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  const flagsForPermit = (permitId: string) => {
    const pro = proByPermit[permitId];
    if (!pro) return [];
    return (flagsByPro[pro.id] ?? []).filter((f) => !f.resolved);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <header className="mb-8">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> Home History
          </div>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">{property.full_address ?? property.address_line}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every permit and recorded work item at this property, with the contractor's verification status — both at the time of work and today.
          </p>
        </header>

        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Permits ({permits.length})</h2>
          </div>
          {permits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No permits on file.</p>
          ) : (
            <div className="space-y-4">
              {permits.map((permit) => {
                const pro = proByPermit[permit.id];
                const flags = flagsForPermit(permit.id);
                const nameMismatch = pro && permit.applicant_name && pro.professional_name &&
                  permit.applicant_name.trim().toLowerCase() !== pro.professional_name.trim().toLowerCase();
                return (
                  <div key={permit.id} className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm lg:grid-cols-[1fr_minmax(0,1.2fr)]">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <span>{permit.permit_type}</span>
                        <span>·</span>
                        <span>{permit.permit_number}</span>
                      </div>
                      <div className="mt-1 text-base font-semibold">{permit.description ?? "Permit"}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md border bg-background p-2">
                          <div className="text-muted-foreground">Status</div>
                          <div className="mt-0.5 font-medium capitalize">{permit.status}</div>
                        </div>
                        <div className="rounded-md border bg-background p-2">
                          <div className="text-muted-foreground">Valuation</div>
                          <div className="mt-0.5 font-medium">{permit.valuation != null ? `$${permit.valuation.toLocaleString()}` : "—"}</div>
                        </div>
                        <div className="rounded-md border bg-background p-2">
                          <div className="text-muted-foreground">Issued</div>
                          <div className="mt-0.5 font-medium">{permit.issued_date ?? "—"}</div>
                        </div>
                        <div className="rounded-md border bg-background p-2">
                          <div className="text-muted-foreground">Finaled</div>
                          <div className="mt-0.5 font-medium">{permit.finaled_date ?? "—"}</div>
                        </div>
                      </div>
                      {permit.applicant_name && (
                        <div className={`mt-3 rounded-md border p-2 text-xs ${nameMismatch ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300" : "bg-background text-muted-foreground"}`}>
                          <span className="font-medium">Applicant on permit:</span> {permit.applicant_name}
                          {nameMismatch && <div className="mt-0.5">⚠ Doesn't match linked professional ({pro?.professional_name})</div>}
                        </div>
                      )}
                    </div>
                    <VerifiedProfessionalCard professional={pro} flags={flags} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Work performed ({workRows.length})</h2>
          </div>
          {workRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded work history.</p>
          ) : (
            <div className="space-y-4">
              {[...workRows].sort((a, b) => (b.work_date ?? "").localeCompare(a.work_date ?? "")).map((w) => {
                const pro = w.professional_id ? proById[w.professional_id] : undefined;
                const flags = pro ? (flagsByPro[pro.id] ?? []).filter((f) => !f.resolved) : [];
                const tinted = !!w.risk_note;
                return (
                  <div key={w.id} className={`grid gap-4 rounded-2xl border p-5 shadow-sm lg:grid-cols-[1fr_minmax(0,1.2fr)] ${tinted ? "border-red-500/40 bg-red-500/5" : "bg-card"}`}>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {w.work_date ?? "—"}{w.permit_number ? ` · Permit ${w.permit_number}` : ""}
                      </div>
                      <div className="mt-1 text-base font-semibold">{w.work_performed}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md border bg-background p-2">
                          <div className="text-muted-foreground">License at time of work</div>
                          <div className="mt-0.5 font-medium capitalize">{w.license_status_at_time ?? "—"}</div>
                        </div>
                        <div className="rounded-md border bg-background p-2">
                          <div className="text-muted-foreground">License today</div>
                          <div className="mt-0.5 font-medium capitalize">{w.license_status_today ?? "—"}</div>
                        </div>
                        <div className="rounded-md border bg-background p-2">
                          <div className="text-muted-foreground">Verified at time</div>
                          <div className="mt-0.5 font-medium">{w.license_verified ? "Yes" : "No"}</div>
                        </div>
                        <div className="rounded-md border bg-background p-2">
                          <div className="text-muted-foreground">Insurance at time</div>
                          <div className="mt-0.5 font-medium">{w.insurance_verified_at_time ? "Yes" : "No"}</div>
                        </div>
                      </div>
                      {w.risk_note && (
                        <div className="mt-3 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs font-bold text-red-700 dark:text-red-300">
                          ⚠ {w.risk_note}
                        </div>
                      )}
                    </div>
                    <VerifiedProfessionalCard
                      professional={pro}
                      flags={flags}
                      workContext={{
                        license_status_at_time: w.license_status_at_time,
                        insurance_verified_at_time: w.insurance_verified_at_time,
                        work_date: w.work_date,
                        risk_note: w.risk_note,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
