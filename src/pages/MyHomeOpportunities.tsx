import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Wrench, RefreshCw, AlertTriangle } from "lucide-react";

interface Opportunity {
  id: string;
  system: string;
  opportunity_type: string;
  urgency: "low" | "medium" | "high";
  confidence: number;
  estimated_cost_low: number | null;
  estimated_cost_high: number | null;
  recommended_action: string;
  rationale: string | null;
}

const urgencyColor = (u: string) =>
  u === "high" ? "destructive" : u === "medium" ? "default" : "secondary";

export default function MyHomeOpportunities() {
  const { id } = useParams<{ id: string }>();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("property_opportunities")
      .select("*")
      .eq("property_id", id)
      .is("dismissed_at", null)
      .order("urgency", { ascending: false })
      .order("computed_at", { ascending: false });
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setOpps((data ?? []) as Opportunity[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const recompute = async () => {
    if (!id) return;
    setRecomputing(true);
    const { error } = await supabase.functions.invoke("compute-property-health", { body: { property_id: id } });
    setRecomputing(false);
    if (error) { toast({ title: "Recompute failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated", description: "Opportunities refreshed." });
    load();
  };

  const dismiss = async (oppId: string) => {
    await supabase.from("property_opportunities").update({ dismissed_at: new Date().toISOString() }).eq("id", oppId);
    setOpps((o) => o.filter((x) => x.id !== oppId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-10">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Opportunities for your home</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Heuristic suggestions based on your home's systems and ages. Nothing here is shared with anyone unless you turn on
              {" "}<Link to="/privacy-controls" className="text-primary hover:underline">data sharing</Link>.
            </p>
          </div>
          <Button variant="outline" onClick={recompute} disabled={recomputing}>
            {recomputing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Recompute
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : opps.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No active opportunities. Tap Recompute after adding system details (roof, HVAC, water heater install years) on the
              {" "}<Link to={`/property/${id}/health-score`} className="text-primary hover:underline">Health Score</Link> page.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {opps.map((o) => (
              <Card key={o.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base capitalize">{o.system.replace("_", " ")}</CardTitle>
                      <CardDescription className="capitalize">{o.opportunity_type.replace("_", " ")}</CardDescription>
                    </div>
                    <Badge variant={urgencyColor(o.urgency) as any} className="capitalize">
                      {o.urgency === "high" && <AlertTriangle className="mr-1 h-3 w-3" />}{o.urgency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{o.recommended_action}</p>
                  {o.rationale && <p className="text-muted-foreground">{o.rationale}</p>}
                  {(o.estimated_cost_low || o.estimated_cost_high) && (
                    <p className="text-muted-foreground">
                      Typical cost: ${o.estimated_cost_low?.toLocaleString()}–${o.estimated_cost_high?.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">Confidence {Math.round(o.confidence * 100)}%</span>
                    <Button variant="ghost" size="sm" onClick={() => dismiss(o.id)}>Dismiss</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
