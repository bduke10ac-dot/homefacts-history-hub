import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";
import { AddRecordDialog } from "@/components/AddRecordDialog";
import { MapPin, ShieldCheck, FileText, Share2, Printer, Award } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { computeHealthScore } from "@/lib/healthScore";
import { computeRiskScores } from "@/lib/riskScores";
import { HealthScoreCard } from "@/components/health/HealthScoreCard";
import { RiskBadgeGrid } from "@/components/health/RiskBadgeGrid";
import { HomeTimeline } from "@/components/timeline/HomeTimeline";
import { PropertyAssistant } from "@/components/ai/PropertyAssistant";
import { ReportsMenu } from "@/components/reports/ReportsMenu";
import { PropertyMap } from "@/components/map/PropertyMap";
import { EnvironmentalSection } from "@/components/environmental/EnvironmentalSection";
import { RegionalSection } from "@/components/regional/RegionalSection";

interface Property { id: string; address_line: string; city: string; state: string; zip: string; year_built: number | null; square_feet: number | null; bedrooms: number | null; bathrooms: number | null; property_type: string | null; claimed_by: string | null; latitude: number | null; longitude: number | null; }
interface RecordRow { id: string; category: string; title: string; description: string | null; performed_by: string | null; cost: number | null; performed_at: string | null; verified: boolean; created_at: string; submitted_by: string | null; }
interface Attachment { id: string; record_id: string; file_url: string; file_name: string; file_type: string | null; }

export function PropertyView({ shared = false }: { shared?: boolean }) {
  const { id, token } = useParams();
  const { user, hasRole } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let propertyId = id;

    if (shared && token) {
      const { data: link, error: linkErr } = await supabase
        .rpc("get_share_link_property", { p_token: token })
        .maybeSingle();
      if (linkErr || !link) { toast.error("Share link not found"); setLoading(false); return; }
      if (link.expires_at && new Date(link.expires_at as string) < new Date()) { toast.error("Share link expired"); setLoading(false); return; }
      propertyId = link.property_id as string;
    }
    if (!propertyId) { setLoading(false); return; }

    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("properties").select("*").eq("id", propertyId).maybeSingle(),
      supabase.from("property_records").select("*").eq("property_id", propertyId).order("performed_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    ]);
    setProperty(p as Property | null);
    setRecords((r ?? []) as RecordRow[]);
    if (r && r.length) {
      const { data: att } = await supabase.from("record_attachments").select("*").in("record_id", r.map((x) => x.id));
      setAttachments((att ?? []) as Attachment[]);
    } else { setAttachments([]); }
    setLoading(false);
  }, [id, token, shared]);

  useEffect(() => { load(); }, [load]);

  const claim = async () => {
    if (!user || !property) return;
    const { error } = await supabase.from("properties").update({ claimed_by: user.id }).eq("id", property.id);
    if (error) toast.error(error.message); else { toast.success("Property claimed"); load(); }
  };

  const createShareLink = async () => {
    if (!property || !user) return;
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("share_links").insert({ property_id: property.id, token, created_by: user.id });
    if (error) { toast.error(error.message); return; }
    const url = `${window.location.origin}/r/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  const verifyRecord = async (recId: string, verified: boolean) => {
    if (!user) return;
    const { error } = await supabase.from("property_records").update({
      verified, verified_by: verified ? user.id : null, verified_at: verified ? new Date().toISOString() : null,
    }).eq("id", recId);
    if (error) toast.error(error.message); else { toast.success(verified ? "Record verified" : "Verification removed"); load(); }
  };

  const downloadPdf = async () => {
    const el = document.getElementById("report-printable");
    if (!el) return;
    toast.info("Generating PDF…");
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW - 20;
    const imgH = (canvas.height * imgW) / canvas.width;
    let heightLeft = imgH; let position = 10;
    pdf.addImage(imgData, "PNG", 10, position, imgW, imgH); heightLeft -= pageH - 20;
    while (heightLeft > 0) { position = heightLeft - imgH + 10; pdf.addPage(); pdf.addImage(imgData, "PNG", 10, position, imgW, imgH); heightLeft -= pageH - 20; }
    pdf.save(`HomeFacts-${property?.address_line.replace(/\s+/g, "-")}.pdf`);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading report…</div>;
  if (!property) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center"><p className="text-lg">Property not found.</p><Button asChild className="mt-4"><Link to="/search">Back to search</Link></Button></div></div>
  );

  const verifiedCount = records.filter((r) => r.verified).length;
  const totalSpent = records.reduce((s, r) => s + (r.cost ?? 0), 0);
  const canEdit = !!user && !shared;
  const canVerify = hasRole("admin") && !shared;
  const canShare = !shared && (hasRole("realtor") || hasRole("admin"));

  return (
    <div className="min-h-screen bg-background">
      {!shared && <Navbar />}
      <div className="container py-8">
        {/* Action bar */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground">← Back to search</Link>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
            <Button variant="outline" size="sm" onClick={downloadPdf}><FileText className="mr-2 h-4 w-4" />Download PDF</Button>
            {canShare && <Button variant="outline" size="sm" onClick={createShareLink}><Share2 className="mr-2 h-4 w-4" />Share</Button>}
            {canEdit && <ReportsMenu propertyId={property.id} />}
            {canEdit && !property.claimed_by && <Button variant="outline" size="sm" onClick={claim}>Claim home</Button>}
            {canEdit && <AddRecordDialog propertyId={property.id} onAdded={load} />}
          </div>
        </div>

        {/* Printable report */}
        <div id="report-printable" className="space-y-6 bg-background">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
            <div className="bg-gradient-hero px-8 py-10 text-primary-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80"><ShieldCheck className="h-4 w-4" />HomeFacts Report</div>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">{property.address_line}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-primary-foreground/85"><MapPin className="h-4 w-4" />{property.city}, {property.state} {property.zip}</p>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-4">
              {[
                { label: "Year built", value: property.year_built ?? "—" },
                { label: "Square feet", value: property.square_feet?.toLocaleString() ?? "—" },
                { label: "Beds / Baths", value: `${property.bedrooms ?? "—"} / ${property.bathrooms ?? "—"}` },
                { label: "Type", value: property.property_type ?? "—" },
              ].map((s) => (
                <div key={s.label} className="bg-card px-6 py-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-lg font-semibold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          <PropertyMap
            latitude={property.latitude}
            longitude={property.longitude}
            address={`${property.address_line}, ${property.city}, ${property.state} ${property.zip}`}
          />

          {/* Health + Risk */}
          <div className="grid gap-4 lg:grid-cols-2">
            <HealthScoreCard result={computeHealthScore(property, records)} />
            <RiskBadgeGrid risks={computeRiskScores(property, records)} />
          </div>

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Total records" value={records.length} icon={FileText} />
            <SummaryCard label="Verified" value={verifiedCount} icon={ShieldCheck} accent />
            <SummaryCard label="Documented spend" value={`$${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={Award} />
          </div>

          {/* Timeline */}
          <HomeTimeline
            property={property}
            records={records.map((r) => ({
              ...r,
              attachmentsCount: attachments.filter((a) => a.record_id === r.id).length,
            }))}
            recordActions={
              canVerify
                ? Object.fromEntries(
                    records.map((r) => [
                      r.id,
                      <Button
                        key={r.id}
                        size="sm"
                        variant={r.verified ? "outline" : "default"}
                        onClick={() => verifyRecord(r.id, !r.verified)}
                      >
                        {r.verified ? "Unverify" : "Verify"}
                      </Button>,
                    ])
                  )
                : undefined
            }
          />

          {/* Environmental */}
          <EnvironmentalSection propertyId={property.id} />

          {/* Regional & Systems */}
          <RegionalSection propertyId={property.id} state={property.state} />

          {/* Vault + Projects quick links */}
          {!shared && (
            <div className="flex flex-wrap gap-2 no-print">
              <Link to={`/property/${property.id}/confidence`}><Button size="sm"><ShieldCheck className="mr-2 h-4 w-4" />Home Confidence Score</Button></Link>
              <Link to={`/property/${property.id}/health`}><Button variant="outline" size="sm">Home Health</Button></Link>
              <Link to={`/property/${property.id}/timeline`}><Button variant="outline" size="sm">Timeline</Button></Link>
              <Link to={`/property/${property.id}/ask`}><Button variant="outline" size="sm">Ask HomeFacts AI</Button></Link>
              <Link to={`/property/${property.id}/reports`}><Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />Reports</Button></Link>
              <Link to={`/property/${property.id}/contractors`}><Button variant="outline" size="sm"><Award className="mr-2 h-4 w-4" />Contractor Scores</Button></Link>
              <Link to={`/property/${property.id}/insurance`}><Button variant="outline" size="sm"><ShieldCheck className="mr-2 h-4 w-4" />Insurance Review</Button></Link>
              <Link to={`/property/${property.id}/deferred`}><Button variant="outline" size="sm">Deferred Maintenance</Button></Link>
              <Link to={`/property/${property.id}/twin`}><Button variant="outline" size="sm">Digital Twin</Button></Link>
              <Link to={`/property/${property.id}/neighborhood`}><Button variant="outline" size="sm">Neighborhood</Button></Link>
              <Link to={`/property/${property.id}/marketplace`}><Button variant="outline" size="sm">Marketplace</Button></Link>
              <Link to={`/property/${property.id}/gov`}><Button variant="outline" size="sm">Permit Portal</Button></Link>
              <Link to={`/property/${property.id}/vault-dr`}><Button variant="outline" size="sm">Disaster Vault</Button></Link>
              <Link to={`/property/${property.id}/estate`}><Button variant="outline" size="sm">Estate Planning</Button></Link>
              <Link to={`/property/${property.id}/negotiate`}><Button variant="outline" size="sm">Negotiation AI</Button></Link>
              <Link to={`/property/${property.id}/passport`}><Button variant="outline" size="sm">Ownership Passport</Button></Link>
              <Link to={`/property/${property.id}/emergency`}><Button variant="destructive" size="sm">Emergency Mode</Button></Link>
              <Link to={`/property/${property.id}/maintenance`}><Button variant="outline" size="sm"><Award className="mr-2 h-4 w-4" />Maintenance</Button></Link>
              <Link to={`/property/${property.id}/engagement`}><Button variant="outline" size="sm"><Award className="mr-2 h-4 w-4" />Home Score & Rewards</Button></Link>
              <Link to={`/property/${property.id}/boundary`}><Button variant="outline" size="sm"><MapPin className="mr-2 h-4 w-4" />Boundary & Land</Button></Link>
              {user && <Link to={`/property/${property.id}/vault`}><Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />Document Vault</Button></Link>}
              {user && <Link to={`/property/${property.id}/projects`}><Button variant="outline" size="sm">Projects</Button></Link>}
            </div>
          )}

          {/* AI Assistant */}
          {!shared && user && (
            <div className="no-print">
              <PropertyAssistant propertyId={property.id} />
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <h2 className="text-base font-semibold">Documents & photos</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="group">
                    {a.file_type?.startsWith("image/") ? (
                      <img src={a.file_url} alt={a.file_name} className="h-20 w-20 rounded-lg border object-cover group-hover:opacity-90" />
                    ) : (
                      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border bg-muted p-2 text-center text-xs">
                        <FileText className="h-5 w-5" />
                        <span className="mt-1 line-clamp-2">{a.file_name}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">Generated by HomeFacts Report on {format(new Date(), "MMM d, yyyy")}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, accent }: { label: string; value: any; icon: any; accent?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default PropertyView;
