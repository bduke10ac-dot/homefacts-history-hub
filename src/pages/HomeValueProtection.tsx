import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { EstimateDisclaimer } from "@/components/legal/EstimateDisclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ScoreRing";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const COMPONENTS = [
  "maintenance_consistency","documented_repairs","verified_contractors","permitted_work","warranty_tracking",
  "energy_improvements","safety_upgrades","insurance_readiness","neighborhood_trends","market_comparison","resale_documentation",
];
const label = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function HomeValueProtection() {
  const { id } = useParams();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("home_value_protection_scores").select("*").eq("property_id", id)
      .order("computed_at", { ascending: false }).limit(1).maybeSingle();
    setRow(data);
  };
  useEffect(() => { load(); }, [id]);

  const compute = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("compute-value-protection", { body: { property_id: id } });
    if (error) toast.error(error.message); else { toast.success("Value protection updated"); load(); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <EstimateDisclaimer />
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Home Value Protection Score</h1>
            <p className="text-muted-foreground">How well you're protecting long-term value.</p>
          </div>
          <Button onClick={compute} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />{row ? "Recompute" : "Compute"}</Button>
        </div>

        {!row ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No score yet.</CardContent></Card>
        ) : (
          <>
            <Card><CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
              <ScoreRing score={row.overall_score} size={160} label="Protection" />
              <div className="flex-1 md:pl-8">
                <h2 className="text-2xl font-semibold">{row.overall_score}/100</h2>
                <p className="text-muted-foreground">{row.summary}</p>
              </div>
            </CardContent></Card>
            <Card>
              <CardHeader><CardTitle>Components</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {COMPONENTS.map((c) => (
                  <div key={c} className="space-y-1">
                    <div className="flex justify-between text-sm"><span>{label(c)}</span><span className="text-muted-foreground">{row[c] ?? 0}</span></div>
                    <Progress value={row[c] ?? 0} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
