import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { EstimateDisclaimer } from "@/components/legal/EstimateDisclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ScoreRing";
import { ArrowLeft, RefreshCw, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

const FACTORS = [
  "roof_age","roof_material","storm_exposure","claim_history","tree_risks","maintenance_documentation",
  "inspection_records","electrical_updates","plumbing_updates","hvac_condition","foundation_condition",
  "fire_safety","smoke_detectors","co_detectors","water_shutoff","security_system","flood_risk","wind_hail_risk",
];
const label = (k: string) => k.replace(/_/g," ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function InsuranceReadinessScore() {
  const { id } = useParams();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("insurance_readiness_scores").select("*").eq("property_id", id)
      .order("computed_at", { ascending: false }).limit(1).maybeSingle();
    setRow(data);
  };
  useEffect(() => { load(); }, [id]);

  const compute = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("compute-insurance-readiness", { body: { property_id: id } });
    if (error) toast.error(error.message); else { toast.success("Insurance readiness computed"); load(); }
    setLoading(false);
  };

  const factors = row?.factors ?? {};
  const docs = row?.documentation_checklist ?? [];
  const claim = row?.claim_readiness_checklist ?? [];
  const questions = row?.recommended_coverage_questions ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <EstimateDisclaimer />
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Insurance Readiness Score</h1>
            <p className="text-muted-foreground">18-factor readiness with premium savings estimate.</p>
          </div>
          <Button onClick={compute} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />{row ? "Recompute" : "Compute"}</Button>
        </div>

        {!row ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No score yet.</CardContent></Card>
        ) : (
          <>
            <Card><CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
              <ScoreRing score={row.overall_score} size={160} label="Readiness" />
              <div className="flex-1 md:pl-8">
                <h2 className="text-2xl font-semibold">{row.overall_score}/100</h2>
                <p className="text-muted-foreground">{row.summary}</p>
                {row.premium_savings_estimate_cents > 0 && (
                  <p className="mt-2 text-sm"><Badge>Potential savings ~${(row.premium_savings_estimate_cents/100).toFixed(0)}/yr</Badge></p>
                )}
              </div>
            </CardContent></Card>

            <Card>
              <CardHeader><CardTitle>18-Factor Scorecard</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {FACTORS.map((f) => (
                  <div key={f} className="space-y-1">
                    <div className="flex justify-between text-sm"><span>{label(f)}</span><span className="text-muted-foreground">{Math.round(factors[f] ?? 0)}</span></div>
                    <Progress value={factors[f] ?? 0} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Documentation Checklist</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {docs.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {d.done ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                      {d.label}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Claim Readiness</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {claim.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {d.done ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                      {d.label}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Questions to Ask Your Agent</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">{questions.map((q: string, i: number) => <li key={i}>{q}</li>)}</ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
