import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, Plus, FileDown, CheckSquare, Cloud, Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";

const CATEGORIES = ["Storm Damage","Fire","Flood","Water Leak","Roof Leak","Hail Damage","Wind Damage","Tornado","Hurricane","Frozen Pipe","Electrical Hazard","Tree Damage","Break-in","Mold Concern","Structural Concern"];

const DEFAULT_CHECKLIST = [
  "Capture current photos",
  "Upload damage videos",
  "Save date and time of incident",
  "Pull weather event history",
  "Save NOAA/storm report references",
  "Save insurance policy",
  "Start claim checklist",
  "Contact emergency contractor",
  "Document temporary repairs",
  "Track expenses",
  "Create insurance claim packet",
  "Export PDF report",
];

interface Event {
  id: string; category: string; status: string; occurred_at: string;
  description: string | null; weather_reference: string | null; total_expense: number | null;
  photos: any[]; videos: any[]; checklist: any[]; contractor_notes: string | null;
  insurance_policy_ref: string | null; claim_status: string | null; owner_notes: string | null;
}

export default function EmergencyMode() {
  const { id } = useParams();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "Storm Damage", description: "", weather_reference: "", insurance_policy_ref: "" });

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("emergency_events").select("*").eq("property_id", id).order("occurred_at", { ascending: false });
    setEvents((data ?? []) as Event[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const activate = async () => {
    if (!id || !user) return;
    const checklist = DEFAULT_CHECKLIST.map((label) => ({ label, done: false }));
    const { error } = await supabase.from("emergency_events").insert({
      property_id: id, created_by: user.id, status: "active",
      category: form.category, description: form.description,
      weather_reference: form.weather_reference, insurance_policy_ref: form.insurance_policy_ref,
      checklist,
    });
    if (error) toast.error(error.message);
    else { toast.success("Emergency event opened"); setForm({ category: "Storm Damage", description: "", weather_reference: "", insurance_policy_ref: "" }); load(); }
  };

  const toggleCheck = async (ev: Event, idx: number) => {
    const next = [...ev.checklist];
    next[idx] = { ...next[idx], done: !next[idx].done };
    await supabase.from("emergency_events").update({ checklist: next }).eq("id", ev.id);
    load();
  };

  const closeEvent = async (eid: string) => {
    await supabase.from("emergency_events").update({ status: "resolved" }).eq("id", eid);
    load();
  };

  const exportPdf = async (ev: Event) => {
    const { data: prop } = await supabase.from("properties").select("address_line,city,state,zip").eq("id", id!).maybeSingle();
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text("Emergency Incident Report", 10, 15);
    pdf.setFontSize(11);
    let y = 28;
    const line = (t: string) => { pdf.text(t, 10, y); y += 7; };
    line(`Property: ${prop?.address_line ?? ""}, ${prop?.city ?? ""}, ${prop?.state ?? ""} ${prop?.zip ?? ""}`);
    line(`Category: ${ev.category}`);
    line(`Occurred: ${new Date(ev.occurred_at).toLocaleString()}`);
    line(`Status: ${ev.status}`);
    if (ev.weather_reference) line(`Weather ref: ${ev.weather_reference}`);
    if (ev.insurance_policy_ref) line(`Policy ref: ${ev.insurance_policy_ref}`);
    if (ev.total_expense) line(`Expenses: $${ev.total_expense}`);
    y += 4; pdf.setFontSize(13); line("Description"); pdf.setFontSize(10);
    const desc = pdf.splitTextToSize(ev.description ?? "—", 180);
    pdf.text(desc, 10, y); y += desc.length * 5 + 4;
    pdf.setFontSize(13); line("Checklist"); pdf.setFontSize(10);
    (ev.checklist as any[]).forEach((c) => { line(`${c.done ? "✓" : "•"} ${c.label}`); });
    pdf.save(`emergency-${ev.id.slice(0,8)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div>
          <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2 text-red-600"><AlertOctagon className="h-7 w-7" />Emergency Mode</h1>
          <p className="text-muted-foreground">Activate to start an incident record, run the response checklist, and build a claim packet.</p>
        </div>

        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-base text-red-700">Activate emergency</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Weather reference (NOAA event ID)</Label><Input value={form.weather_reference} onChange={(e) => setForm({ ...form, weather_reference: e.target.value })} /></div>
            <div><Label>Insurance policy #</Label><Input value={form.insurance_policy_ref} onChange={(e) => setForm({ ...form, insurance_policy_ref: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={activate} variant="destructive"><AlertOctagon className="mr-2 h-4 w-4" />Activate Emergency Mode</Button></div>
          </CardContent>
        </Card>

        {loading ? <p>Loading…</p> : events.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No emergency events.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <Card key={e.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">{e.category}<Badge variant="outline">{e.status}</Badge></CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <Cloud className="h-3 w-3" />{new Date(e.occurred_at).toLocaleString()}
                      {e.weather_reference && <> · ref {e.weather_reference}</>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => exportPdf(e)}><FileDown className="mr-1 h-3 w-3" />PDF</Button>
                    {e.status === "active" && <Button size="sm" variant="outline" onClick={() => closeEvent(e.id)}>Mark resolved</Button>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {e.description && <p>{e.description}</p>}
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-1"><CheckSquare className="h-4 w-4" />Response checklist</p>
                    {(e.checklist as any[]).map((c, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={c.done} onChange={() => toggleCheck(e, i)} />
                        <span className={c.done ? "line-through text-muted-foreground" : ""}>{c.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground"><Camera className="inline h-3 w-3 mr-1" />Upload damage photos via the property document vault.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
