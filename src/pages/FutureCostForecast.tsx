import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw, Bell } from "lucide-react";
import { toast } from "sonner";

const HORIZONS = [1,3,5,10];
const urgColor = (u: string) => u === "high" ? "destructive" : u === "medium" ? "secondary" : "outline";

export default function FutureCostForecast() {
  const { id } = useParams();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("future_cost_forecasts").select("*").eq("property_id", id).order("horizon_years");
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const compute = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("forecast-future-costs", { body: { property_id: id } });
    if (error) toast.error(error.message); else { toast.success("Forecast generated"); load(); }
    setLoading(false);
  };

  const createReminder = async (item: any) => {
    const { error } = await supabase.from("maintenance_reminders").insert({
      property_id: id, title: item.item, category: item.category, cadence: "one-time",
      next_due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0,10),
    });
    if (error) toast.error(error.message); else toast.success("Reminder created");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Future Cost Forecast</h1>
            <p className="text-muted-foreground">Estimated expenses across 1, 3, 5 and 10 year horizons.</p>
          </div>
          <Button onClick={compute} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />{rows.length ? "Regenerate" : "Generate"}</Button>
        </div>

        {rows.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No forecast yet.</CardContent></Card>
        ) : (
          <Tabs defaultValue="1">
            <TabsList>{HORIZONS.map((h) => <TabsTrigger key={h} value={String(h)}>{h} year{h>1?"s":""}</TabsTrigger>)}</TabsList>
            {HORIZONS.map((h) => (
              <TabsContent key={h} value={String(h)}>
                <div className="grid gap-3 md:grid-cols-2">
                  {rows.filter((r) => r.horizon_years <= h).map((r) => (
                    <Card key={r.id}>
                      <CardHeader><CardTitle className="flex items-center justify-between text-base">{r.item}<Badge variant={urgColor(r.urgency) as any}>{r.urgency}</Badge></CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="text-muted-foreground">{r.category} · {r.recommended_timing}</div>
                        <div className="text-lg font-semibold">${(r.low_cost_cents/100).toLocaleString()} – ${(r.high_cost_cents/100).toLocaleString()}</div>
                        {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                        <Button size="sm" variant="outline" onClick={() => createReminder(r)}><Bell className="mr-2 h-3 w-3" />Create reminder</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
