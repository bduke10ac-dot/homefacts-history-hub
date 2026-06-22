import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Building, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Portfolio { id: string; name: string; notes: string | null; }
interface PortProp { id: string; portfolio_id: string; property_id: string; rent_estimate: number | null; cash_flow_notes: string | null; target_roi: number | null; }
interface Prop { id: string; address_line: string; city: string; state: string; }

export default function InvestorDashboard() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [active, setActive] = useState<Portfolio | null>(null);
  const [items, setItems] = useState<PortProp[]>([]);
  const [props, setProps] = useState<Record<string, Prop>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [defByProp, setDefByProp] = useState<Record<string, { low: number; high: number; open: number }>>({});
  const [newName, setNewName] = useState("");
  const [addPropId, setAddPropId] = useState("");
  const [myProps, setMyProps] = useState<Prop[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("investor_portfolios").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
      setPortfolios((p ?? []) as Portfolio[]);
      if (p?.length) setActive(p[0] as Portfolio);
      const { data: mine } = await supabase.from("properties").select("id,address_line,city,state").or(`claimed_by.eq.${user.id},created_by.eq.${user.id}`);
      setMyProps((mine ?? []) as Prop[]);
    })();
  }, [user]);

  useEffect(() => {
    if (!active) return;
    (async () => {
      const { data: it } = await supabase.from("portfolio_properties").select("*").eq("portfolio_id", active.id);
      const items = (it ?? []) as PortProp[];
      setItems(items);
      const ids = items.map((i) => i.property_id);
      if (ids.length) {
        const [{ data: pr }, { data: hcs }, { data: defs }] = await Promise.all([
          supabase.from("properties").select("id,address_line,city,state").in("id", ids),
          supabase.from("home_confidence_scores").select("property_id,score").in("property_id", ids),
          supabase.from("deferred_maintenance_items").select("property_id,estimated_cost_low,estimated_cost_high,status").in("property_id", ids),
        ]);
        const pm: Record<string, Prop> = {};
        (pr ?? []).forEach((p: any) => (pm[p.id] = p));
        setProps(pm);
        const sm: Record<string, number> = {};
        (hcs ?? []).forEach((s: any) => (sm[s.property_id] = s.score));
        setScores(sm);
        const dm: Record<string, { low: number; high: number; open: number }> = {};
        (defs ?? []).forEach((d: any) => {
          if (d.status !== "open") return;
          const cur = dm[d.property_id] ?? { low: 0, high: 0, open: 0 };
          cur.low += d.estimated_cost_low ?? 0;
          cur.high += d.estimated_cost_high ?? 0;
          cur.open += 1;
          dm[d.property_id] = cur;
        });
        setDefByProp(dm);
      } else {
        setProps({}); setScores({}); setDefByProp({});
      }
    })();
  }, [active]);

  const create = async () => {
    if (!user || !newName) return;
    const { data, error } = await supabase.from("investor_portfolios").insert({ user_id: user.id, name: newName }).select().single();
    if (error) return toast.error(error.message);
    setPortfolios([...portfolios, data as Portfolio]);
    setActive(data as Portfolio);
    setNewName("");
  };

  const addProperty = async () => {
    if (!active || !addPropId) return;
    const { error } = await supabase.from("portfolio_properties").insert({ portfolio_id: active.id, property_id: addPropId });
    if (error) return toast.error(error.message);
    setAddPropId("");
    setActive({ ...active });
  };

  const totalDefLow = Object.values(defByProp).reduce((s, v) => s + v.low, 0);
  const totalDefHigh = Object.values(defByProp).reduce((s, v) => s + v.high, 0);
  const avgScore = Object.values(scores).length ? Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / Object.values(scores).length) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><Briefcase className="h-7 w-7 text-primary" />Investor Dashboard</h1>
          <p className="text-muted-foreground">Track every property, score, deferred risk, and renewal in one view.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Portfolios</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {portfolios.map((p) => (
                <Button key={p.id} size="sm" variant={active?.id === p.id ? "default" : "outline"} onClick={() => setActive(p)}>{p.name}</Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="New portfolio name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Button onClick={create}><Plus className="mr-2 h-4 w-4" />Create</Button>
            </div>
          </CardContent>
        </Card>

        {active && (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <Card><CardContent className="py-5"><p className="text-sm text-muted-foreground">Properties</p><p className="text-2xl font-bold">{items.length}</p></CardContent></Card>
              <Card><CardContent className="py-5"><p className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" />Avg Confidence</p><p className="text-2xl font-bold">{avgScore}</p></CardContent></Card>
              <Card><CardContent className="py-5"><p className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Deferred Maint.</p><p className="text-2xl font-bold">${totalDefLow.toLocaleString()}–${totalDefHigh.toLocaleString()}</p></CardContent></Card>
              <Card><CardContent className="py-5"><p className="text-sm text-muted-foreground">Est. monthly rent</p><p className="text-2xl font-bold">${items.reduce((s, i) => s + (i.rent_estimate ?? 0), 0).toLocaleString()}</p></CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Add property</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <select className="flex-1 h-10 rounded-md border bg-background px-3 text-sm" value={addPropId} onChange={(e) => setAddPropId(e.target.value)}>
                  <option value="">Select a property…</option>
                  {myProps.filter((p) => !items.some((i) => i.property_id === p.id)).map((p) => <option key={p.id} value={p.id}>{p.address_line}, {p.city}</option>)}
                </select>
                <Button onClick={addProperty}><Plus className="mr-2 h-4 w-4" />Add</Button>
              </CardContent>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              {items.map((i) => {
                const p = props[i.property_id];
                const score = scores[i.property_id];
                const def = defByProp[i.property_id];
                return (
                  <Card key={i.id}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2"><Building className="h-4 w-4" />{p?.address_line ?? "—"}</CardTitle>
                      <p className="text-sm text-muted-foreground">{p?.city}, {p?.state}</p>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Confidence: {score ?? "—"}</Badge>
                        <Badge variant="outline">{def?.open ?? 0} deferred</Badge>
                        <Badge variant="outline">${(def?.low ?? 0).toLocaleString()}–${(def?.high ?? 0).toLocaleString()}</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">Rent est: ${(i.rent_estimate ?? 0).toLocaleString()}/mo</p>
                      <Link to={`/property/${i.property_id}`}><Button size="sm" variant="outline">Open</Button></Link>
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
