import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, ShieldCheck, MapPin, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PaywallGate } from "@/components/paywall/PaywallGate";
import { PropertyMap } from "@/components/map/PropertyMap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportPayload {
  title: string;
  executive_summary: string;
  key_findings: string[];
  risks: { name: string; severity: "low" | "medium" | "high"; detail: string }[];
  recommendations: string[];
  systems: { name: string; status: string; notes: string }[];
}

interface SavedReport {
  id: string;
  property_id: string;
  report_type: string;
  payload: ReportPayload;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  buyer: "Buyer's Due-Diligence Report",
  seller: "Seller's Disclosure Report",
  insurance: "Insurance Underwriting Report",
  roof: "Roof Condition Report",
  maintenance: "Maintenance Plan",
};

export default function PropertyReport() {
  const { id, type } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReport = async (force = false) => {
    if (!id || !type) return;
    setGenerating(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ propertyId: id, reportType: type, force }),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed (${res.status})`);
      }
      const { report } = await res.json();
      setReport(report);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: p } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
      setProperty(p);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (user && id && type) fetchReport(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, type]);

  const downloadPdf = async () => {
    const el = document.getElementById("report-printable");
    if (!el) return;
    toast.info("Generating PDF…");
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 10;
      pdf.addImage(imgData, "PNG", 10, position, imgW, imgH);
      heightLeft -= pageH - 20;
      while (heightLeft > 0) {
        position = heightLeft - imgH + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgW, imgH);
        heightLeft -= pageH - 20;
      }
      pdf.save(`HomeFacts-${type}-${property?.address_line?.replace(/\s+/g, "-") ?? "report"}.pdf`);
    } catch (e: any) {
      toast.error(e?.message ?? "PDF export failed");
    }
  };

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!property || !type || !TYPE_LABELS[type]) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center">Report not found.<div className="mt-4"><Button asChild><Link to="/search">Back</Link></Button></div></div></div>
  );

  const p = report?.payload;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchReport(true)} disabled={generating}>
              <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
            <Button variant="outline" size="sm" onClick={downloadPdf}><FileText className="mr-2 h-4 w-4" />Download PDF</Button>
          </div>
        </div>

        <div id="report-printable" className="space-y-6">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
            <div className="bg-gradient-hero px-8 py-10 text-primary-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80"><ShieldCheck className="h-4 w-4" />{TYPE_LABELS[type]}</div>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">{p?.title ?? property.address_line}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-primary-foreground/85"><MapPin className="h-4 w-4" />{property.address_line}, {property.city}, {property.state} {property.zip}</p>
            </div>
          </div>

          {generating && !p && (
            <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
              <p className="mt-3">Generating AI report…</p>
            </div>
          )}

          {p && (
            <>
              <Section title="Executive summary">
                <p className="text-sm leading-relaxed text-muted-foreground">{p.executive_summary}</p>
              </Section>

              <Section title="Key findings">
                <ul className="space-y-2">
                  {p.key_findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <PaywallGate
                title="Full risk & recommendation report is Pro"
                description="Unlock the full risk breakdown, system-by-system analysis, and prioritized recommendations."
                teaser={
                  <Section title="Risks">
                    <div className="space-y-3">
                      {p.risks.slice(0, 1).map((r, i) => (
                        <div key={i} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{r.name}</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.severity}</span>
          </div>

          <PropertyMap
            latitude={property.latitude}
            longitude={property.longitude}
            address={`${property.address_line}, ${property.city}, ${property.state} ${property.zip}`}
            height={240}
          />
                          <p className="mt-1 text-sm text-muted-foreground">{r.detail.slice(0, 80)}…</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                }
              >
                <Section title="Risks">
                  <div className="space-y-3">
                    {p.risks.map((r, i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{r.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.severity === "high" ? "bg-destructive/15 text-destructive" :
                            r.severity === "medium" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          }`}>{r.severity}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="System breakdown">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {p.systems.map((s, i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.name}</p>
                        <p className="mt-1 font-semibold">{s.status}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{s.notes}</p>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Recommendations">
                  <ul className="space-y-2">
                    {p.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              </PaywallGate>

              <p className="text-center text-xs text-muted-foreground">
                Generated by HomeFacts AI{report ? ` on ${format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}` : ""} · AI-generated; verify with a licensed professional.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
