import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Sparkles, Trash2, BookmarkPlus, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = ["Roofing","HVAC","Plumbing","Electrical","Foundation","Windows","Gutters","Solar","Pest control","Termite inspection","Insurance agents","Home inspectors","Realtors","Lenders","Appraisers","Builders","Emergency repair","Restoration","Landscaping","Pool service","Septic service","Well service"];

interface Rec {
  id: string; category: string; reason: string; urgency: string;
  estimated_cost_low: number | null; estimated_cost_high: number | null;
  status: string;
}

export default function Marketplace() {
  const { id } = useParams();
  const { user } = useAuth();
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "Roofing", reason: "", urgency: "medium", estimated_cost_low: 200, estimated_cost_high: 800 });

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("marketplace_recommendations").select("*").eq("property_id", id).order("created_at", { ascending: false });
    setRecs((data ?? []) as Rec[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const generate = async () => {
    if (!id || !user) return;
    // simple heuristic seed from property age + records
    const { data: prop } = await supabase.from("properties").select("year_built").eq("id", id).maybeSingle();
    const seeds: any[] = [];
    const age = prop?.year_built ? new Date().getFullYear() - prop.year_built : 0;
    if (age > 15) seeds.push({ category: "Roofing", reason: "Roof is likely past mid-life — schedule inspection.", urgency: "high", estimated_cost_low: 250, estimated_cost_high: 600 });
    if (age > 12) seeds.push({ category: "HVAC", reason: "HVAC system nearing end of expected lifespan.", urgency: "medium", estimated_cost_low: 4000, estimated_cost_high: 9000 });
    if (age > 10) seeds.push({ category: "Plumbing", reason: "Water heater approaching replacement window.", urgency: "medium", estimated_cost_low: 1200, estimated_cost_high: 2400 });
    seeds.push({ category: "Pest control", reason: "Annual termite + pest inspection recommended.", urgency: "low", estimated_cost_low: 120, estimated_cost_high: 300 });
    seeds.push({ category: "Insurance agents", reason: "Annual policy review keeps coverage aligned with home value.", urgency: "medium", estimated_cost_low: 0, estimated_cost_high: 0 });
    for (const s of seeds) {
      await supabase.from("marketplace_recommendations").insert({ property_id: id, created_by: user.id, status: "active", ...s });
    }
    toast.success(`${seeds.length} recommendations generated`);
    load();
  };

  const add = async () => {
    if (!id || !user || !form.reason) return;
    await supabase.from("marketplace_recommendations").insert({ property_id: id, created_by: user.id, status: "active", ...form });
    setForm({ category: "Roofing", reason: "", urgency: "medium", estimated_cost_low: 200, estimated_cost_high: 800 });
    load();
  };

  const setStatus = async (rid: string, status: string) => {
    await supabase.from("marketplace_recommendations").update({ status }).eq("id", rid);
    load();
  };

  const remove = async (rid: string) => { await supabase.from("marketplace_recommendations").delete().eq("id", rid); load(); };

  const groups = ["active","saved","quoted","dismissed"].map((g) => ({ status: g, items: recs.filter((r) => r.status === g) }));

  const urgencyColor = (u: string) => u === "high" ? "bg-red-500/15 text-red-700" : u === "low" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
            <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><ShoppingBag className="h-7 w-7 text-primary" />Contextual Marketplace</h1>
            <p className="text-muted-foreground">Services recommended only when this home actually needs them.</p>
          </div>
          <Button onClick={generate}><Sparkles className="mr-2 h-4 w-4" />Auto-generate</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Add manual recommendation</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Urgency</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                {["low","medium","high"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><Label>Why recommended</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div><Label>Cost low ($)</Label><Input type="number" value={form.estimated_cost_low} onChange={(e) => setForm({ ...form, estimated_cost_low: +e.target.value })} /></div>
            <div><Label>Cost high ($)</Label><Input type="number" value={form.estimated_cost_high} onChange={(e) => setForm({ ...form, estimated_cost_high: +e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={add}>Add</Button></div>
          </CardContent>
        </Card>

        {loading ? <p>Loading…</p> : groups.map((g) => g.items.length > 0 && (
          <div key={g.status}>
            <h2 className="text-lg font-semibold capitalize mb-2">{g.status}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {g.items.map((r) => (
                <Card key={r.id}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">{r.category}</CardTitle>
                      <Badge variant="outline" className={urgencyColor(r.urgency)}>{r.urgency}</Badge>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>{r.reason}</p>
                    {(r.estimated_cost_low || r.estimated_cost_high) ? <p className="text-muted-foreground">${(r.estimated_cost_low ?? 0).toLocaleString()}–${(r.estimated_cost_high ?? 0).toLocaleString()}</p> : null}
                    <div className="flex gap-2 flex-wrap pt-2">
                      {r.status !== "quoted" && <Button size="sm" onClick={() => setStatus(r.id, "quoted")}><Send className="mr-1 h-3 w-3" />Request quote</Button>}
                      {r.status !== "saved" && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "saved")}><BookmarkPlus className="mr-1 h-3 w-3" />Save</Button>}
                      {r.status !== "dismissed" && <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "dismissed")}>Dismiss</Button>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
