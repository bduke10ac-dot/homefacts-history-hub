import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Printer, Download, Copy, Share2, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { computeWarrantyHealth, categoryLabel, statusFor, type WarrantyLike } from "@/lib/warrantyHealth";

type Warranty = WarrantyLike & {
  id: string;
  category: string;
  product_name: string | null;
  provider: string | null;
  provider_phone: string | null;
  policy_number: string | null;
  installer_name: string | null;
  install_date: string | null;
  warranty_start_date: string | null;
  expiration_date: string | null;
  coverage_summary: string | null;
};

export default function WarrantyPassport() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const [{ data: prop }, { data: ws }, { data: tx }] = await Promise.all([
        supabase.from("properties").select("*").eq("id", id).maybeSingle(),
        supabase.from("warranties").select("*").eq("property_id", id).order("category"),
        supabase.from("warranty_transfers").select("*").eq("property_id", id).order("created_at", { ascending: false }),
      ]);
      setProperty(prop);
      const list = (ws ?? []) as unknown as Warranty[];
      setWarranties(list);
      setTransfers(tx ?? []);
      if (list.length) {
        const { data: regs } = await supabase
          .from("warranty_registrations")
          .select("*")
          .in("warranty_id", list.map((w) => w.id));
        setRegistrations(regs ?? []);
      }
      setLoading(false);
    })();
  }, [id]);

  const health = useMemo(() => computeWarrantyHealth(warranties), [warranties]);
  const active = warranties.filter((w) => statusFor(w) !== "expired");
  const registered = warranties.filter((w) => w.is_registered);
  const transferable = warranties.filter((w) => w.is_transferable && statusFor(w) !== "expired");

  const downloadJson = () => {
    const pkg = {
      generated_at: new Date().toISOString(),
      property: {
        id: property?.id,
        address: property?.address_line,
        city: property?.city,
        state: property?.state,
        zip: property?.zip,
      },
      health_score: health.score,
      summary: {
        total: warranties.length,
        active: active.length,
        registered: registered.length,
        transferable: transferable.length,
      },
      warranties,
      registrations,
      transfers,
    };
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warranty-passport-${property?.address_line ?? id}.json`.replace(/\s+/g, "-");
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Warranty package downloaded");
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/property/${id}/warranty-passport`;
    await navigator.clipboard.writeText(url);
    toast.success("Passport link copied");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-10 text-muted-foreground">Loading warranty passport…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden"><Navbar /></div>
      <div className="container max-w-5xl py-8 space-y-6">
        <div className="print:hidden">
          <Link to={`/property/${id}/warranties`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Warranty Hub
          </Link>
        </div>

        {/* Header */}
        <Card className="border-primary/30">
          <CardContent className="py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Warranty Passport</h1>
                <p className="text-sm text-muted-foreground">
                  Buyer-ready certificate of every active warranty, registration, and transfer for this home.
                </p>
                {property && (
                  <p className="mt-1 text-sm font-medium">
                    {property.address_line}, {property.city} {property.state} {property.zip}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Generated {new Date().toLocaleDateString()} · Orivaz Verified
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print / Save PDF</Button>
              <Button variant="outline" onClick={downloadJson}><Download className="mr-2 h-4 w-4" /> Download package</Button>
              <Button variant="outline" onClick={copyShareLink}><Share2 className="mr-2 h-4 w-4" /> Share link</Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Health Score" value={`${health.score}/100`} />
          <SummaryCard label="Active Warranties" value={active.length} />
          <SummaryCard label="Registered" value={`${registered.length}/${warranties.length}`} />
          <SummaryCard label="Transferable" value={transferable.length} />
        </div>

        {/* Warranties */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Warranties on file</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {warranties.length === 0 && (
              <p className="text-sm text-muted-foreground">No warranties on file for this property.</p>
            )}
            {warranties.map((w) => {
              const st = statusFor(w);
              return (
                <div key={w.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{w.product_name ?? categoryLabel(w.category)}</p>
                      <p className="text-xs text-muted-foreground">{categoryLabel(w.category)} · {w.provider ?? "Unknown provider"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={st === "expired" ? "destructive" : st === "expiring_soon" ? "secondary" : "default"}>
                        {st.replace("_", " ")}
                      </Badge>
                      {w.is_registered && <Badge variant="outline">Registered</Badge>}
                      {w.is_transferable && <Badge variant="outline">Transferable</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
                    <Field label="Policy #" value={w.policy_number} />
                    <Field label="Installer" value={w.installer_name} />
                    <Field label="Start" value={w.warranty_start_date} />
                    <Field label="Expires" value={w.expiration_date} />
                  </div>
                  {w.coverage_summary && (
                    <p className="mt-2 text-xs text-muted-foreground">{w.coverage_summary}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Registrations */}
        <Card>
          <CardHeader><CardTitle className="text-base">Registration history</CardTitle></CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registrations recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {registrations.map((r) => {
                  const w = warranties.find((x) => x.id === r.warranty_id);
                  return (
                    <li key={r.id} className="flex justify-between border-b py-2 last:border-0">
                      <span>{w?.product_name ?? categoryLabel(w?.category ?? "other")}</span>
                      <span className="text-muted-foreground">
                        Confirmation {r.confirmation_number ?? "—"} · {r.registered_at ? new Date(r.registered_at).toLocaleDateString() : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Transfers */}
        <Card>
          <CardHeader><CardTitle className="text-base">Transfer history</CardTitle></CardHeader>
          <CardContent>
            {transfers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ownership transfers recorded.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {transfers.map((t) => (
                  <li key={t.id} className="flex flex-col gap-1 border-b py-2 last:border-0 md:flex-row md:justify-between">
                    <span>
                      {new Date(t.created_at).toLocaleDateString()} → {t.recipient_name ?? t.recipient_email ?? "New owner"}
                    </span>
                    <span className="text-muted-foreground">
                      {(t.warranty_ids?.length ?? 0)} warranties · status {t.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Separator />
        <p className="text-center text-xs text-muted-foreground">
          This passport is generated from Orivaz records. Buyers and insurers can verify authenticity at homefacts.com.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card><CardContent className="py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </CardContent></Card>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}
