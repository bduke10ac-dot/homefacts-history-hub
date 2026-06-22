import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Sparkles, Upload, CheckCircle2 } from "lucide-react";
import { computeConfidenceScore, type ConfidenceResult } from "@/lib/confidenceScore";

interface Property { id: string; address_line: string; city: string; state: string; zip: string; }

const statusColor: Record<string, string> = {
  Excellent: "text-accent",
  Good: "text-primary",
  "Needs Attention": "text-warning-foreground",
  Critical: "text-destructive",
};

export default function HomeConfidenceScore() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [result, setResult] = useState<ConfidenceResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: recs }, { data: health }, { data: badges }] = await Promise.all([
        supabase.from("properties").select("id,address_line,city,state,zip").eq("id", id).maybeSingle(),
        supabase.from("property_records").select("category,verified,performed_at,cost").eq("property_id", id),
        supabase.from("home_health_sections").select("section,status,risk_level,warranty_expires,install_date,lifespan_years").eq("property_id", id),
        supabase.from("verification_badges").select("status").eq("property_id", id).eq("status", "verified"),
      ]);
      setProperty(p as Property | null);
      const r = computeConfidenceScore({
        records: (recs ?? []) as any,
        health: (health ?? []) as any,
        hasInsurance: (recs ?? []).some((x: any) => (x.category ?? "").toLowerCase().includes("insurance")),
        badgesVerified: (badges ?? []).length,
      });
      setResult(r);

      // persist latest snapshot (best-effort)
      await supabase.from("home_confidence_scores").upsert({
        property_id: id,
        overall_score: r.overall,
        categories: r.categories as any,
      }, { onConflict: "property_id" });

      setLoading(false);
    })();
  }, [id]);

  if (loading || !result || !property) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center text-muted-foreground">Calculating Confidence Score…</div></div>;
  }

  const helping = result.categories.filter((c) => c.score >= 70).slice(0, 5);
  const hurting = result.categories.filter((c) => c.score < 50).slice(0, 5);
  const topActions = [...result.categories].sort((a, b) => a.score - b.score).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-8 py-10">
        <Link to={`/property/${property.id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to property
        </Link>

        <Card className="overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-[auto,1fr] md:p-8">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-hero p-6 text-primary-foreground md:w-56">
              <div className="text-xs uppercase tracking-wider opacity-80">Home Confidence</div>
              <div className="mt-2 text-6xl font-bold tabular-nums">{result.overall}</div>
              <div className="mt-1 text-sm opacity-90">{result.status}</div>
              <div className="mt-3 text-xs opacity-80">out of 100</div>
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{property.address_line}</h1>
              <p className="text-sm text-muted-foreground">{property.city}, {property.state} {property.zip}</p>
              <Progress value={result.overall} />
              <p className="text-sm text-muted-foreground">
                A composite of 15 categories covering systems, documentation, insurance, contractors, and long-term value protection.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-accent" />Helping your score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {helping.length === 0 ? <p className="text-sm text-muted-foreground">Build up documentation to see strengths emerge.</p> :
                helping.map((c) => (
                  <div key={c.key} className="flex items-center justify-between text-sm">
                    <span>{c.label}</span>
                    <Badge variant="outline" className="text-accent">{c.score}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><TrendingDown className="h-4 w-4 text-destructive" />Lowering your score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hurting.length === 0 ? <p className="text-sm text-muted-foreground">No critical gaps detected.</p> :
                hurting.map((c) => (
                  <div key={c.key} className="flex items-center justify-between text-sm">
                    <span>{c.label}</span>
                    <Badge variant="outline" className="text-destructive">{c.score}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" />Top 3 actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topActions.map((c) => (
                <div key={c.key} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">{c.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.recommended_action}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All 15 categories</CardTitle>
            <CardDescription>Each category contributes equally to your overall Confidence Score.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {result.categories.map((c) => (
              <div key={c.key} className="rounded-lg border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{c.label}</span>
                  <span className={`text-sm font-semibold ${statusColor[c.status]}`}>{c.score} · {c.status}</span>
                </div>
                <Progress value={c.score} />
                <p className="mt-2 text-xs text-muted-foreground">{c.explanation}</p>
                <p className="mt-1 text-xs">{c.recommended_action}</p>
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" variant="outline"><Link to={`/property/${property.id}`}><Upload className="mr-1 h-3 w-3" />Upload</Link></Button>
                  <Button asChild size="sm" variant="ghost"><Link to={`/property/${property.id}/health`}><CheckCircle2 className="mr-1 h-3 w-3" />Mark complete</Link></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
