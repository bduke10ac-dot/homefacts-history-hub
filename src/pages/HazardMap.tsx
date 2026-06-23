import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const HAZARD_TYPES = [
  "Flood zone","FEMA flood data","Tornado history","Hail history","High wind events","Wildfire zone","Earthquake zone",
  "Sinkhole","Mine subsidence","EPA site","Superfund site","Chemical plant","Pipeline","High-voltage transmission line",
  "Railroad crossing","Airport","Noise exposure zone",
];

const levelColor = (l: string) => l === "high" ? "destructive" : l === "medium" ? "secondary" : "default";

export default function HazardMap() {
  const { id } = useParams();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ risk_level: "low" });

  const load = async () => {
    const { data } = await supabase.from("hazard_intelligence").select("*").eq("property_id", id)
      .order("risk_level", { ascending: false }).order("distance_m");
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const add = async () => {
    if (!form.hazard_type) return toast.error("Hazard type required");
    const { error } = await supabase.from("hazard_intelligence").insert({
      property_id: id, hazard_type: form.hazard_type, label: form.label || form.hazard_type,
      distance_m: form.distance_m ? Number(form.distance_m) : null,
      risk_level: form.risk_level, insurance_impact: form.insurance_impact,
      homeowner_explanation: form.homeowner_explanation, recommended_action: form.recommended_action,
    });
    if (error) return toast.error(error.message);
    toast.success("Hazard added"); setOpen(false); setForm({ risk_level: "low" }); load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Hazard Intelligence</h1>
            <p className="text-muted-foreground">Nearby hazards ranked by risk level and distance.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add hazard</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add hazard</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Type</Label>
                  <Select value={form.hazard_type ?? ""} onValueChange={(v) => setForm({ ...form, hazard_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{HAZARD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Distance (meters)</Label><Input type="number" value={form.distance_m ?? ""} onChange={(e) => setForm({ ...form, distance_m: e.target.value })} /></div>
                  <div><Label>Risk level</Label>
                    <Select value={form.risk_level} onValueChange={(v) => setForm({ ...form, risk_level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["low","medium","high"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Insurance impact</Label><Textarea value={form.insurance_impact ?? ""} onChange={(e) => setForm({ ...form, insurance_impact: e.target.value })} /></div>
                <div><Label>How this affects me</Label><Textarea value={form.homeowner_explanation ?? ""} onChange={(e) => setForm({ ...form, homeowner_explanation: e.target.value })} /></div>
                <div><Label>Recommended action</Label><Textarea value={form.recommended_action ?? ""} onChange={(e) => setForm({ ...form, recommended_action: e.target.value })} /></div>
                <Button className="w-full" onClick={add}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {rows.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No hazards on file. Add hazards manually or wait for automated detection.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((h) => (
              <Card key={h.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{h.label}</span>
                    <Badge variant={levelColor(h.risk_level) as any}>{h.risk_level}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-muted-foreground">{h.hazard_type}{h.distance_m && ` · ${(h.distance_m/1000).toFixed(2)} km away`}</div>
                  {h.homeowner_explanation && <div><span className="font-medium">How this affects me:</span> {h.homeowner_explanation}</div>}
                  {h.insurance_impact && <div><span className="font-medium">Insurance impact:</span> {h.insurance_impact}</div>}
                  {h.recommended_action && <div className="rounded-md border bg-muted/30 p-2 text-xs"><span className="font-medium">Next action:</span> {h.recommended_action}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
