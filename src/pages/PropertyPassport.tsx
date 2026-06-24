import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificationBadge } from "@/components/property/CertificationBadge";
import {
  calculatePropertyTrustScore,
  TRUST_CATEGORIES,
  type TrustCategoryInput,
  type TrustScoreResult,
} from "@/lib/propertyTrustScore";
import { FileDown, CheckCircle2, Circle, Shield, Camera, FileText, Wrench, ClipboardCheck, History, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SectionCount { count: number; label: string; icon: any; }

async function tableCount(table: string, propertyId: string): Promise<number> {
  const { count } = await supabase.from(table as any).select("id", { count: "exact", head: true }).eq("property_id", propertyId);
  return count ?? 0;
}

export default function PropertyPassport() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [trust, setTrust] = useState<TrustScoreResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);

      const { data: prop } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
      setProperty(prop);

      // Pull category-evidence counts in parallel.
      const builderClone = await supabase.from("nb_property_clones").select("id", { count: "exact", head: true }).eq("property_id", id);
      const builderLink = builderClone.count ?? 0;

      const [
        warranties, maintenance, permits, inspections, photos, claims, ownership, estate, emergency, contractors,
      ] = await Promise.all([
        tableCount("warranties", id),
        tableCount("maintenance_reminders", id),
        tableCount("permits", id),
        tableCount("disaster_vault_documents", id),
        tableCount("digital_twin_rooms", id),
        tableCount("insurance_claims", id),
        tableCount("ownership_history", id),
        tableCount("estate_documents", id),
        tableCount("emergency_events", id),
        tableCount("contractor_scores", id),
      ]);

      const c: Record<string, number> = {
        warranties, maintenance, permits, inspections, photos, claims, ownership, estate, emergency, contractors, builderLink,
      };
      setCounts(c);

      const input: TrustCategoryInput = {
        builderVerified: builderLink > 0,
        contractorRecordsVerified: contractors > 0,
        warrantyRecordsUploaded: warranties > 0,
        maintenanceHistoryDocumented: maintenance > 0,
        permitHistoryDocumented: permits > 0,
        inspectionReportsUploaded: inspections > 0,
        photoDocumentationUploaded: photos > 0,
        insuranceClaimHistoryDocumented: claims > 0,
        ownershipHistoryComplete: ownership > 0,
        emergencyEstateTransferInfoComplete: estate > 0 || emergency > 0,
      };
      const result = calculatePropertyTrustScore(input);
      setTrust(result);

      // Persist snapshots — RLS will accept only if the caller is an owner/admin.
      await supabase.from("property_trust_scores").upsert(
        {
          property_id: id,
          score: result.score,
          grade: result.grade,
          completed_items: result.completedItems,
          missing_items: result.missingItems,
          recommendations: result.recommendations,
        },
        { onConflict: "property_id" },
      );
      await supabase.from("certification_records").insert({
        entity_type: "property",
        entity_id: id,
        certification_level: result.grade,
        score: result.score,
        requirements_met: result.completedItems,
        requirements_missing: result.missingItems,
      });

      setLoading(false);
    })();
  }, [id]);

  const downloadPdf = () => toast.info("Property Passport PDF export coming soon.");

  const sections: { title: string; icon: any; body: React.ReactNode }[] = [
    {
      title: "Ownership timeline",
      icon: History,
      body: (
        <p className="text-sm text-muted-foreground">
          {counts.ownership ?? 0} ownership record(s) on file. Full timeline view arrives in Phase 2.
        </p>
      ),
    },
    {
      title: "Warranty center",
      icon: Shield,
      body: (
        <div className="text-sm flex items-center justify-between">
          <span>{counts.warranties ?? 0} warranties</span>
          <Link to={`/property/${id}/warranties`}><Button variant="outline" size="sm">Open</Button></Link>
        </div>
      ),
    },
    {
      title: "Maintenance history",
      icon: Wrench,
      body: <div className="text-sm">{counts.maintenance ?? 0} maintenance records</div>,
    },
    {
      title: "Contractor history",
      icon: Users,
      body: <div className="text-sm">{counts.contractors ?? 0} verified contractor records</div>,
    },
    {
      title: "Permit history",
      icon: ClipboardCheck,
      body: <div className="text-sm">{counts.permits ?? 0} permits</div>,
    },
    {
      title: "Insurance & storm history",
      icon: AlertTriangle,
      body: <div className="text-sm">{counts.claims ?? 0} claim records · {counts.emergency ?? 0} emergency events</div>,
    },
    {
      title: "Photo documentation",
      icon: Camera,
      body: <div className="text-sm">{counts.photos ?? 0} documented rooms / snapshots</div>,
    },
    {
      title: "Documents (inspection / vault)",
      icon: FileText,
      body: <div className="text-sm">{counts.inspections ?? 0} documents in the disaster vault</div>,
    },
    {
      title: "Estate & emergency info",
      icon: Shield,
      body: <div className="text-sm">{counts.estate ?? 0} estate doc(s)</div>,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
            <h1 className="mt-2 text-3xl font-bold">Property Passport</h1>
            {property && <p className="text-muted-foreground">{property.address_line}{property.city ? `, ${property.city}` : ""}{property.state ? `, ${property.state}` : ""}</p>}
          </div>
          <Button onClick={downloadPdf}><FileDown className="mr-2 h-4 w-4" />Download Property Passport PDF</Button>
        </div>

        {property && (
          <Card>
            <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><p className="text-muted-foreground">Year built</p><p className="font-semibold">{property.year_built ?? "—"}</p></div>
              <div><p className="text-muted-foreground">Sq ft</p><p className="font-semibold">{property.square_feet ?? "—"}</p></div>
              <div><p className="text-muted-foreground">Beds</p><p className="font-semibold">{property.bedrooms ?? "—"}</p></div>
              <div><p className="text-muted-foreground">Baths</p><p className="font-semibold">{property.bathrooms ?? "—"}</p></div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {trust && <CertificationBadge score={trust.score} grade={trust.grade} />}
          <Card>
            <CardHeader><CardTitle className="text-base">Trust Score breakdown</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {TRUST_CATEGORIES.map((cat) => {
                  const done = trust?.completedItems.includes(cat.key) ?? false;
                  return (
                    <li key={cat.key} className="flex items-start gap-2">
                      {done ? <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600" /> : <Circle className="h-4 w-4 mt-0.5 text-muted-foreground" />}
                      <div className="flex-1">
                        <p className={done ? "" : "text-muted-foreground"}>{cat.label}</p>
                        {!done && <p className="text-xs text-muted-foreground">{cat.action}</p>}
                      </div>
                      <Badge variant={done ? "secondary" : "outline"}>{done ? "+100" : "0"}</Badge>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{s.title}</CardTitle></CardHeader>
                <CardContent>{s.body}</CardContent>
              </Card>
            );
          })}
        </div>

        {loading && <p className="text-sm text-muted-foreground">Computing trust score…</p>}
      </div>
    </div>
  );
}
