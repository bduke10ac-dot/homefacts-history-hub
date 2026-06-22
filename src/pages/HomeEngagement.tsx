import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, ShieldCheck, Trophy, Sparkles, MapPin, ArrowRight, Coins,
  Upload, Home, Wrench, CloudLightning, FileCheck,
} from "lucide-react";
import { computeHomeScore, type ScoreRecord } from "@/lib/homeScore";

const ACHIEVEMENT_ICONS: Record<string, any> = {
  Upload, ShieldCheck, Home, Wrench, CloudLightning, FileCheck, Trophy,
};

interface Property {
  id: string; address_line: string; city: string; state: string; zip: string;
}

export default function HomeEngagement() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("properties").select("id,address_line,city,state,zip").eq("id", id).maybeSingle(),
        supabase.from("property_records").select("id,category,title,cost,verified,performed_at,created_at").eq("property_id", id),
      ]);
      setProperty(p as Property | null);
      const recs = (r ?? []) as ScoreRecord[];
      if (recs.length) {
        const { data: att } = await supabase.from("record_attachments").select("record_id").in("record_id", recs.map((x) => x.id));
        const counts = new Map<string, number>();
        for (const a of att ?? []) counts.set(a.record_id, (counts.get(a.record_id) ?? 0) + 1);
        for (const rec of recs) rec.attachmentsCount = counts.get(rec.id) ?? 0;
      }
      setRecords(recs);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center text-muted-foreground">Loading your home score…</div></div>;
  if (!property) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center">Property not found.</div></div>;

  const result = computeHomeScore(records);
  const scoreColor = result.score >= 85 ? "text-accent" : result.score >= 60 ? "text-primary" : "text-warning-foreground";
  const scoreLabel = result.score >= 90 ? "Excellent" : result.score >= 75 ? "Strong" : result.score >= 50 ? "Building" : "Just starting";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-8 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link to={`/property/${property.id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
            <h1 className="mt-2 text-3xl font-bold">Home Engagement</h1>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{property.address_line}, {property.city}, {property.state}</p>
          </div>
          <Button asChild><Link to={`/property/${property.id}`}><Upload className="mr-2 h-4 w-4" />Add a record</Link></Button>
        </div>

        {/* Hero score */}
        <Card className="overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-[auto,1fr] md:p-8">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-hero p-6 text-primary-foreground md:w-56">
              <div className="text-xs uppercase tracking-wider opacity-80">Verified Home Score</div>
              <div className="mt-2 text-6xl font-bold tabular-nums">{result.score}</div>
              <div className="mt-1 text-sm opacity-90">{scoreLabel}</div>
              <div className="mt-3 text-xs opacity-80">out of 100</div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">Documentation completion</span>
                  <span className="text-muted-foreground">{result.completion}%</span>
                </div>
                <Progress value={result.completion} />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat icon={<TrendingUp className="h-4 w-4" />} label="Records" value={result.totalRecords} />
                <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Verified" value={result.verifiedRecords} accent />
                <Stat icon={<Coins className="h-4 w-4" />} label="Points" value={result.points.toLocaleString()} />
                <Stat icon={<Sparkles className="h-4 w-4" />} label="Documented spend" value={`$${result.totalInvestment.toLocaleString()}`} />
              </div>
              {result.missing.length > 0 && (
                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Complete your record to reach <span className={scoreColor}>{result.estimatedScoreAfter}</span></p>
                    <Badge variant="outline">+{result.estimatedScoreAfter - result.score} pts</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{result.missing.length} sections still need documentation.</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Progress tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Home progress tracker</CardTitle>
            <CardDescription>Every section you document strengthens your home's verified history.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.sections.map((s) => (
              <div key={s.key} className="rounded-lg border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-xs text-muted-foreground">{s.count} {s.count === 1 ? "record" : "records"}</span>
                </div>
                <Progress value={s.completion} />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.completion === 100 ? "Verified" : s.completion === 50 ? "Documented" : "Missing"}</span>
                  <span>{s.completion}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Missing items FOMO */}
        {result.missing.length > 0 && (
          <Card className="border-warning/40 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-lg">Missing documentation</CardTitle>
              <CardDescription>Comparable verified homes average <span className="font-semibold">92%</span>. Closing these gaps increases buyer confidence and verified value.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.missing.map((m) => (
                  <Badge key={m.key} variant="outline" className="text-sm">{m.label}</Badge>
                ))}
              </div>
              <Button asChild className="mt-4" size="sm">
                <Link to={`/property/${property.id}`}>Add missing records<ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Achievements</CardTitle>
            <CardDescription>Earn badges as you build out your home's verified history.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.achievements.map((a) => {
              const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Trophy;
              return (
                <div key={a.id} className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${a.earned ? "border-accent/50 bg-accent/5" : "opacity-60"}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${a.earned ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.label}</p>
                      {a.earned && <Badge variant="outline" className="text-[10px]">Earned</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Rewards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">HomeFacts Rewards</CardTitle>
            <CardDescription>Points earned for each documented action. Redeem with partners for contractor discounts, warranties, inspections, and more.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">{result.points.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">points earned</span>
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["Permit", 100], ["Invoice", 50], ["Inspection report", 150], ["Warranty", 100],
                ["Maintenance record", 40], ["Project photos", 25], ["Verified contractor project", 250], ["Annual inspection", 500],
              ].map(([k, v]) => (
                <div key={k as string} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">+{v}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: any; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className={`mb-1 flex items-center gap-1.5 text-xs ${accent ? "text-accent" : "text-muted-foreground"}`}>{icon}{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
