import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Activity, Loader2, RefreshCw } from "lucide-react";

interface Score {
  overall_score: number;
  grade: string;
  roof_score: number | null;
  hvac_score: number | null;
  plumbing_score: number | null;
  electrical_score: number | null;
  water_heater_score: number | null;
  exterior_score: number | null;
  foundation_score: number | null;
  strengths: string[];
  risks: string[];
  next_actions: string[];
  computed_at: string;
}

interface Intel {
  roof_install_year: number | null;
  hvac_install_year: number | null;
  water_heater_install_year: number | null;
  electrical_panel_year: number | null;
}

const SYSTEMS: Array<[keyof Score, string]> = [
  ["roof_score", "Roof"],
  ["hvac_score", "HVAC"],
  ["water_heater_score", "Water heater"],
  ["electrical_score", "Electrical"],
  ["plumbing_score", "Plumbing"],
  ["exterior_score", "Exterior"],
  ["foundation_score", "Foundation"],
];

const colorFor = (s: number | null) =>
  s == null ? "hsl(var(--muted))" :
  s >= 80 ? "hsl(var(--accent))" :
  s >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

export default function PropertyHealthScore() {
  const { id } = useParams<{ id: string }>();
  const [score, setScore] = useState<Score | null>(null);
  const [intel, setIntel] = useState<Intel>({
    roof_install_year: null, hvac_install_year: null, water_heater_install_year: null, electrical_panel_year: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  const load = async () => {
    if (!id) return;
    const [{ data: s }, { data: i }] = await Promise.all([
      supabase.from("property_health_scores").select("*").eq("property_id", id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("property_intelligence").select("roof_install_year,hvac_install_year,water_heater_install_year,electrical_panel_year").eq("property_id", id).maybeSingle(),
    ]);
    setScore(s as any);
    if (i) setIntel(i as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const saveIntel = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("property_intelligence").upsert(
      { property_id: id, ...intel }, { onConflict: "property_id" }
    );
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved" });
  };

  const recompute = async () => {
    if (!id) return;
    setRecomputing(true);
    await saveIntel();
    const { error } = await supabase.functions.invoke("compute-property-health", { body: { property_id: id } });
    setRecomputing(false);
    if (error) { toast({ title: "Recompute failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated", description: "Health score refreshed." });
    load();
  };

  const circ = 2 * Math.PI * 52;
  const offset = score ? circ - (score.overall_score / 100) * circ : circ;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-10">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Home health score</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              By-system scoring (roof, HVAC, plumbing, etc.). See <Link to={`/property/${id}/opportunities`} className="text-primary hover:underline">opportunities</Link>.
            </p>
          </div>
          <Button variant="outline" onClick={recompute} disabled={recomputing}>
            {recomputing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Recompute
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="grid items-center gap-6 py-6 sm:grid-cols-[auto,1fr]">
                <div className="relative mx-auto h-32 w-32">
                  <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                    {score && (
                      <circle cx="60" cy="60" r="52" fill="none" stroke={colorFor(score.overall_score)} strokeWidth="10"
                        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tabular-nums">{score?.overall_score ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{score ? `Grade ${score.grade}` : "Not scored"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {SYSTEMS.map(([key, label]) => {
                    const v = score?.[key] as number | null | undefined;
                    return (
                      <div key={key} className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-xl font-semibold tabular-nums" style={{ color: colorFor(v ?? null) }}>{v ?? "—"}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {score && (score.strengths.length > 0 || score.risks.length > 0 || score.next_actions.length > 0) && (
              <div className="grid gap-4 md:grid-cols-3">
                {score.strengths.length > 0 && (
                  <Card><CardHeader><CardTitle className="text-base">Strengths</CardTitle></CardHeader>
                    <CardContent><ul className="space-y-1 text-sm">{score.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul></CardContent></Card>
                )}
                {score.risks.length > 0 && (
                  <Card><CardHeader><CardTitle className="text-base">Risks</CardTitle></CardHeader>
                    <CardContent><ul className="space-y-1 text-sm">{score.risks.map((s, i) => <li key={i}>• {s}</li>)}</ul></CardContent></Card>
                )}
                {score.next_actions.length > 0 && (
                  <Card><CardHeader><CardTitle className="text-base">Next actions</CardTitle></CardHeader>
                    <CardContent><ul className="space-y-1 text-sm">{score.next_actions.map((s, i) => <li key={i}>• {s}</li>)}</ul></CardContent></Card>
                )}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">System details</CardTitle>
                <CardDescription>The more you fill in, the more accurate the score and opportunities.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {([
                  ["roof_install_year", "Roof install year"],
                  ["hvac_install_year", "HVAC install year"],
                  ["water_heater_install_year", "Water heater install year"],
                  ["electrical_panel_year", "Electrical panel year"],
                ] as const).map(([k, label]) => (
                  <div key={k}>
                    <Label htmlFor={k}>{label}</Label>
                    <Input id={k} type="number" inputMode="numeric" placeholder="e.g. 2015"
                      value={intel[k] ?? ""}
                      onChange={(e) => setIntel((p) => ({ ...p, [k]: e.target.value ? Number(e.target.value) : null }))} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Button onClick={saveIntel} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save details</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
