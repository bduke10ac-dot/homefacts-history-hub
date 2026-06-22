import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const SECTIONS = [
  "Crime trends","School information","Property tax info","Market comparisons","Recent sales",
  "Weather/storm history","Flood risk","Wildfire risk","Hail/wind/tornado history",
  "Utility providers","Internet providers","Cell coverage","Local officials","Voting info",
  "DMV/city hall distance","Local amenities","Shopping","Hospitals","Fire stations","Police stations",
  "Road construction","Future developments","HOA info","Noise concerns","Air quality",
  "Walkability","Public transportation","Insurance risk factors",
];

interface Override {
  id: string; section_key: string; data: any; source: string | null;
  last_updated: string | null; confidence: string | null; notes: string | null;
  source_link: string | null; saved_to_report: boolean;
}

export default function NeighborhoodIntelligence() {
  const { id } = useParams();
  const { user } = useAuth();
  const [items, setItems] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ section_key: SECTIONS[0], summary: "", source: "", source_link: "", confidence: "medium", notes: "" });

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("neighborhood_data_overrides").select("*").eq("property_id", id).order("section_key");
    setItems((data ?? []) as Override[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const add = async () => {
    if (!id || !user) return;
    const { error } = await supabase.from("neighborhood_data_overrides").insert({
      property_id: id, created_by: user.id,
      section_key: form.section_key,
      data: { summary: form.summary },
      source: form.source, source_link: form.source_link,
      confidence: form.confidence, notes: form.notes,
      last_updated: new Date().toISOString().slice(0,10),
    });
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setForm({ ...form, summary: "", source: "", source_link: "", notes: "" }); load(); }
  };

  const toggleReport = async (it: Override) => {
    await supabase.from("neighborhood_data_overrides").update({ saved_to_report: !it.saved_to_report }).eq("id", it.id);
    load();
  };

  const remove = async (iid: string) => { await supabase.from("neighborhood_data_overrides").delete().eq("id", iid); load(); };

  const grouped = SECTIONS.map((s) => ({ key: s, rows: items.filter((i) => i.section_key === s) }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div>
          <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><MapPin className="h-7 w-7 text-primary" />Neighborhood Intelligence</h1>
          <p className="text-muted-foreground">Track everything that shapes life and value in this neighborhood.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Add data point</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Section</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.section_key} onChange={(e) => setForm({ ...form, section_key: e.target.value })}>
                {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><Label>Summary</Label><Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
            <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="NOAA, FBI UCR, GreatSchools…" /></div>
            <div><Label>Source link</Label><Input value={form.source_link} onChange={(e) => setForm({ ...form, source_link: e.target.value })} /></div>
            <div>
              <Label>Confidence</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })}>
                {["high","medium","low"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={add}><Plus className="mr-2 h-4 w-4" />Add</Button></div>
          </CardContent>
        </Card>

        {loading ? <p className="text-muted-foreground">Loading…</p> : (
          <div className="grid gap-3 md:grid-cols-2">
            {grouped.map((g) => (
              <Card key={g.key} className={g.rows.length === 0 ? "opacity-60" : ""}>
                <CardHeader><CardTitle className="text-sm">{g.key}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {g.rows.length === 0 ? <p className="text-muted-foreground text-xs">No data yet.</p> : g.rows.map((r) => (
                    <div key={r.id} className="border rounded-lg p-2">
                      <p>{(r.data as any)?.summary ?? "—"}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {r.source && <span>📊 {r.source}</span>}
                        {r.confidence && <span>· conf: {r.confidence}</span>}
                        {r.last_updated && <span>· {r.last_updated}</span>}
                        {r.source_link && <a href={r.source_link} target="_blank" rel="noreferrer" className="text-primary underline">link</a>}
                      </div>
                      <div className="mt-1 flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => toggleReport(r)}>
                          <Star className={`h-3 w-3 mr-1 ${r.saved_to_report ? "fill-yellow-400 text-yellow-500" : ""}`} />
                          {r.saved_to_report ? "Saved" : "Save to report"}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
