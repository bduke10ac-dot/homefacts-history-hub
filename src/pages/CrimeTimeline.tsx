import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { toast } from "sonner";

const PERIODS = ["30d","6mo","12mo","5yr"];
const CATEGORIES = ["Theft","Vehicle theft","Burglary","Assault","Property crime","Fire incidents","EMS calls"];

export default function CrimeTimeline() {
  const { id } = useParams();
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("crime_timeline").select("*").eq("property_id", id);
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const seed = async () => {
    // demo data
    const sample = PERIODS.flatMap((p) => CATEGORIES.map((c) => ({
      property_id: id, period: p, category: c,
      count: Math.floor(Math.random() * (p === "5yr" ? 80 : p === "12mo" ? 20 : p === "6mo" ? 12 : 5)),
      trend: ["improving","stable","declining"][Math.floor(Math.random() * 3)],
    })));
    await supabase.from("crime_timeline").delete().eq("property_id", id);
    await supabase.from("crime_timeline").insert(sample);
    toast.success("Sample crime data loaded");
    load();
  };

  const summarize = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("summarize-crime-trend", { body: { categories: rows } });
    if (error) toast.error(error.message); else setSummary(data);
    setLoading(false);
  };

  const trendIcon = (t: string) => t === "improving" ? <TrendingDown className="h-4 w-4 text-accent" /> : t === "declining" ? <TrendingUp className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Crime Timeline</h1>
            <p className="text-muted-foreground">Crime trends across 30 days, 6 months, 12 months, and 5 years.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={seed}>Load sample data</Button>
            <Button onClick={summarize} disabled={loading || rows.length === 0}><Sparkles className="mr-2 h-4 w-4" />AI summary</Button>
          </div>
        </div>

        {summary && (
          <Card><CardHeader><CardTitle>AI Interpretation</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {(["buyer","homeowner","landlord","insurer"] as const).map((aud) => (
                <div key={aud} className="rounded-md border p-3"><div className="text-xs uppercase text-muted-foreground">{aud}</div><div className="text-sm">{summary[aud]}</div></div>
              ))}
            </CardContent></Card>
        )}

        {rows.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No crime data yet. Click "Load sample data" or wait for automated feed.</CardContent></Card>
        ) : (
          <Tabs defaultValue="30d">
            <TabsList>{PERIODS.map((p) => <TabsTrigger key={p} value={p}>{p}</TabsTrigger>)}</TabsList>
            {PERIODS.map((p) => (
              <TabsContent key={p} value={p}>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {CATEGORIES.map((c) => {
                    const r = rows.find((x) => x.period === p && x.category === c);
                    return (
                      <Card key={c}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div><div className="font-medium">{c}</div><div className="text-xs text-muted-foreground">{r?.count ?? 0} incidents</div></div>
                          <Badge variant="outline" className="gap-1">{r ? trendIcon(r.trend) : null}{r?.trend ?? "—"}</Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
