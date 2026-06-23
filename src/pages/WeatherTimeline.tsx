import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, CloudLightning } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const TYPES = ["Hail","Wind","Tornado","Hurricane","Ice storm","Flood","Wildfire","Earthquake","Drought","Extreme temperature"];

export default function WeatherTimeline() {
  const { id } = useParams();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ event_date: new Date().toISOString().slice(0,10), severity: "moderate" });

  const load = async () => {
    const { data } = await supabase.from("weather_environmental_events").select("*").eq("property_id", id).order("event_date", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const add = async () => {
    if (!form.event_type) return toast.error("Event type required");
    const { error } = await supabase.from("weather_environmental_events").insert({
      property_id: id, event_date: form.event_date, event_type: form.event_type, severity: form.severity,
      distance_m: form.distance_m ? Number(form.distance_m) : null,
      property_impact: form.property_impact, insurance_impact: form.insurance_impact, recommended_action: form.recommended_action,
    });
    if (error) return toast.error(error.message);
    toast.success("Event added"); setOpen(false); setForm({ event_date: new Date().toISOString().slice(0,10), severity: "moderate" }); load();
  };

  const sevColor = (s: string) => /severe|major|catastrophic/i.test(s) ? "destructive" : /moderate/i.test(s) ? "secondary" : "outline";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Weather & Environmental Timeline</h1>
            <p className="text-muted-foreground">Storms, fires, floods, and other events near this property.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add event</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add weather event</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={form.event_type ?? ""} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Severity</Label>
                    <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["minor","moderate","severe","catastrophic"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Distance (m)</Label><Input type="number" value={form.distance_m ?? ""} onChange={(e) => setForm({ ...form, distance_m: e.target.value })} /></div>
                </div>
                <div><Label>Property impact</Label><Textarea value={form.property_impact ?? ""} onChange={(e) => setForm({ ...form, property_impact: e.target.value })} /></div>
                <div><Label>Insurance impact</Label><Textarea value={form.insurance_impact ?? ""} onChange={(e) => setForm({ ...form, insurance_impact: e.target.value })} /></div>
                <div><Label>Recommended action</Label><Textarea value={form.recommended_action ?? ""} onChange={(e) => setForm({ ...form, recommended_action: e.target.value })} /></div>
                <Button className="w-full" onClick={add}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {rows.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No weather events logged yet.</CardContent></Card>
        ) : (
          <div className="relative space-y-4 border-l-2 border-border pl-6">
            {rows.map((e) => (
              <div key={e.id} className="relative">
                <div className="absolute -left-[1.85rem] mt-2 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                <Card>
                  <CardContent className="space-y-1 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium"><CloudLightning className="h-4 w-4" />{e.event_type}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant={sevColor(e.severity ?? "") as any}>{e.severity}</Badge>
                        <span className="text-muted-foreground">{format(new Date(e.event_date), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    {e.property_impact && <p className="text-sm"><span className="font-medium">Property impact:</span> {e.property_impact}</p>}
                    {e.insurance_impact && <p className="text-sm"><span className="font-medium">Insurance impact:</span> {e.insurance_impact}</p>}
                    {e.recommended_action && <p className="text-sm text-muted-foreground">→ {e.recommended_action}</p>}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
