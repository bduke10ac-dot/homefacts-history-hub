// Phase 4 — Builder certification page. Uses Creekside Homes if present.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, CheckCircle2, Circle } from "lucide-react";
import { builderTier, BUILDER_TIER_META, type BuilderTierInput, type BuilderTier } from "@/lib/certificationTiers";

const TIERS: BuilderTier[] = ["Builder Partner", "Certified Builder", "Premier Builder"];

const REQS: { label: string; key: keyof BuilderTierInput | "propertiesCreatedAtLeast10" }[] = [
  { label: "Profile complete", key: "profileComplete" },
  { label: "Warranty package uploaded", key: "warrantyPackageUploaded" },
  { label: "Manuals uploaded", key: "manualsUploaded" },
  { label: "Property documents uploaded", key: "propertyDocsUploaded" },
  { label: "10+ properties created", key: "propertiesCreatedAtLeast10" },
  { label: "Consistent digital handoff", key: "digitalHandoffsConsistent" },
];

export default function BuilderCertification() {
  const [builder, setBuilder] = useState<any>(null);
  const [input, setInput] = useState<BuilderTierInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingExample, setMissingExample] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: bc } = await supabase
        .from("builder_companies")
        .select("id,name,description,certifications,logo_url,years_in_business")
        .ilike("name", "%creekside%")
        .maybeSingle();

      if (!bc) { setMissingExample(true); setLoading(false); return; }
      setBuilder(bc);

      const [{ count: clonesCount }, { count: templatesCount }, { count: handoffCount }] = await Promise.all([
        supabase.from("nb_property_clones").select("id", { count: "exact", head: true }).eq("company_id", bc.id),
        supabase.from("nb_templates").select("id", { count: "exact", head: true }).eq("company_id", bc.id),
        supabase.from("nb_handoff_log").select("id", { count: "exact", head: true }),
      ]);

      const properties = clonesCount ?? 0;
      const i: BuilderTierInput = {
        profileComplete: Boolean(bc.name && bc.description),
        warrantyPackageUploaded: (templatesCount ?? 0) > 0,
        manualsUploaded: (templatesCount ?? 0) > 0,
        propertyDocsUploaded: properties > 0,
        propertiesCreated: properties,
        digitalHandoffsConsistent: properties > 0 && (handoffCount ?? 0) >= properties,
        homeownerCompletionRate: null, // no source yet
      };
      setInput(i);
      setLoading(false);
    })();
  }, []);

  const tier = input ? builderTier(input) : "Unlisted";
  const meta = BUILDER_TIER_META[tier];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl space-y-6 py-10">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Award className="h-7 w-7" /> Builder Certification</h1>
          <p className="text-muted-foreground">Three tiers based on documentation completeness and homeowner handoff quality.</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : missingExample ? (
          <Card><CardContent className="p-8">
            <p className="font-medium">No Creekside Homes sample builder found.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seed `builder_companies` with a row whose name contains "Creekside" to preview this page with real data.
            </p>
          </CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{builder.name}</span>
                  <Badge className={meta.color}><Award className="mr-1 h-3 w-3" />{tier}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Requirements progress</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {REQS.map((r) => {
                  let done = false;
                  if (r.key === "propertiesCreatedAtLeast10") done = (input?.propertiesCreated ?? 0) >= 10;
                  else done = Boolean(input?.[r.key as keyof BuilderTierInput]);
                  return (
                    <div key={r.label} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm">{r.label}</span>
                      </div>
                      <Badge variant={done ? "secondary" : "outline"}>{done ? "Met" : "Pending"}</Badge>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground pt-2">
                  Homeowner completion rate isn't yet tracked — Premier Builder ignores it until a source is connected.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>All tiers</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {TIERS.map((t) => {
                  const m = BUILDER_TIER_META[t];
                  const current = t === tier;
                  return (
                    <div key={t} className={`rounded-lg border p-4 ${current ? "ring-2 ring-primary" : ""}`}>
                      <Badge className={m.color}><Award className="mr-1 h-3 w-3" />{t}</Badge>
                      <p className="mt-2 text-xs text-muted-foreground">{m.description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button asChild variant="outline"><Link to={`/builder/dashboard`}>Open Builder Dashboard</Link></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
