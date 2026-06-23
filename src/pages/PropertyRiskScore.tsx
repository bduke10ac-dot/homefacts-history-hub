import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ScoreRing";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const CATS = [
  { k: "structural", label: "Structural" },
  { k: "weather", label: "Weather" },
  { k: "insurance", label: "Insurance" },
  { k: "environmental", label: "Environmental" },
  { k: "maintenance", label: "Maintenance" },
  { k: "neighborhood", label: "Neighborhood" },
  { k: "appreciation", label: "Future Appreciation" },
] as const;

const levelColor = (l?: string | null) => l === "high" ? "destructive" : l === "medium" ? "secondary" : "default";

export default function PropertyRiskScore() {
  const { id } = useParams();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("property_risk_scores").select("*")
      .eq("property_id", id).order("computed_at", { ascending: false }).limit(1).maybeSingle();
    setRow(data);
  };
  useEffect(() => { load(); }, [id]);

  const recompute = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("compute-risk-score", { body: { property_id: id } });
    if (error) toast.error(error.message); else { toast.success("Risk score updated"); load(); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Property Risk Score</h1>
            <p className="text-muted-foreground">Seven-category risk breakdown.</p>
          </div>
          <Button onClick={recompute} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />{row ? "Recompute" : "Compute"}</Button>
        </div>

        {!row ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No risk score yet. Click Compute.</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-8 md:flex-row md:items-center md:justify-between">
                <ScoreRing score={row.overall_score} size={160} label="Overall" />
                <div className="flex-1 md:pl-8">
                  <h2 className="text-2xl font-semibold">{row.overall_score}/100</h2>
                  <p className="text-muted-foreground">{row.overall_summary}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {CATS.map((c) => {
                const score = row[`${c.k}_score`];
                const level = row[`${c.k}_level`];
                const ai = row[`${c.k}_ai`];
                const action = row[`${c.k}_action`];
                return (
                  <Card key={c.k}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        {c.label}
                        <Badge variant={levelColor(level) as any}>{level ?? "—"}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4">
                        <ScoreRing score={score ?? 0} size={80} />
                        <div className="text-sm text-muted-foreground">{ai}</div>
                      </div>
                      <div className="rounded-md border bg-muted/30 p-2 text-xs">
                        <span className="font-medium">Next action:</span> {action}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
