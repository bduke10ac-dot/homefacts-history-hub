import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Item {
  id: string; system: string; issue: string; severity: string;
  estimated_cost_low: number | null; estimated_cost_high: number | null;
  urgency_months: number | null; status: string; notes: string | null;
}

const sevColor = (s: string) => s === "high" ? "bg-red-500/15 text-red-700" : s === "low" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700";

export default function DeferredMaintenance() {
  const { id } = useParams();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState({ system: "Roof", issue: "", severity: "medium", estimated_cost_low: 500, estimated_cost_high: 1500, urgency_months: 12, notes: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("deferred_maintenance_items").select("*").eq("property_id", id).order("severity", { ascending: false }).order("urgency_months", { ascending: true });
    setItems((data ?? []) as Item[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const add = async () => {
    if (!id || !user || !form.issue) return;
    const { error } = await supabase.from("deferred_maintenance_items").insert({ property_id: id, created_by: user.id, status: "open", ...form });
    if (error) toast.error(error.message);
    else { toast.success("Added"); setForm({ system: "Roof", issue: "", severity: "medium", estimated_cost_low: 500, estimated_cost_high: 1500, urgency_months: 12, notes: "" }); load(); }
  };

  const resolve = async (iid: string) => { await supabase.from("deferred_maintenance_items").update({ status: "resolved" }).eq("id", iid); load(); };
  const remove = async (iid: string) => { await supabase.from("deferred_maintenance_items").delete().eq("id", iid); load(); };

  const open = items.filter((i) => i.status === "open");
  const totalLow = open.reduce((s, i) => s + (i.estimated_cost_low ?? 0), 0);
  const totalHigh = open.reduce((s, i) => s + (i.estimated_cost_high ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div>
          <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><Wrench className="h-7 w-7 text-primary" />Deferred Maintenance Estimator</h1>
          <p className="text-muted-foreground">Quantify postponed repairs and what they will cost.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4" />Estimated outstanding</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{open.length} open item(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Add deferred item</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>System</Label><Input value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} /></div>
            <div><Label>Issue</Label><Input value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} /></div>
            <div>
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Urgency (months)</Label><Input type="number" value={form.urgency_months} onChange={(e) => setForm({ ...form, urgency_months: +e.target.value })} /></div>
            <div><Label>Cost low ($)</Label><Input type="number" value={form.estimated_cost_low} onChange={(e) => setForm({ ...form, estimated_cost_low: +e.target.value })} /></div>
            <div><Label>Cost high ($)</Label><Input type="number" value={form.estimated_cost_high} onChange={(e) => setForm({ ...form, estimated_cost_high: +e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={add}><Plus className="mr-2 h-4 w-4" />Add item</Button></div>
          </CardContent>
        </Card>

        {loading ? <p className="text-muted-foreground">Loading…</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No deferred items tracked.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <Card key={i.id} className={i.status === "resolved" ? "opacity-60" : ""}>
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={sevColor(i.severity)}>{i.severity}</Badge>
                      <span className="font-medium">{i.system}</span>
                      <span className="text-muted-foreground">— {i.issue}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ${(i.estimated_cost_low ?? 0).toLocaleString()}–${(i.estimated_cost_high ?? 0).toLocaleString()} · within {i.urgency_months ?? "—"} mo
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {i.status === "open" && <Button size="sm" variant="outline" onClick={() => resolve(i.id)}>Mark resolved</Button>}
                    <Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
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
