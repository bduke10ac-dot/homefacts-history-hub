import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const DEFAULTS = [
  ["Change air filters","HVAC","recurring","quarterly"],["Test smoke detectors","Safety","recurring","quarterly"],
  ["Test CO detectors","Safety","recurring","quarterly"],["Clean gutters","Exterior","seasonal","fall"],
  ["Inspect roof","Roof","seasonal","spring"],["Inspect attic","Interior","recurring","yearly"],
  ["Inspect crawlspace","Foundation","recurring","yearly"],["Flush water heater","Plumbing","recurring","yearly"],
  ["HVAC service","HVAC","recurring","yearly"],["Pest control","Pest","recurring","quarterly"],
  ["Termite inspection","Pest","recurring","yearly"],["Dryer vent cleaning","Safety","recurring","yearly"],
  ["Check sump pump","Plumbing","recurring","yearly"],["Check exterior caulking","Exterior","recurring","yearly"],
  ["Inspect siding","Exterior","recurring","yearly"],["Review insurance policy","Insurance","recurring","yearly"],
  ["Review warranties","Warranty","recurring","yearly"],["Update home photos","Documentation","recurring","yearly"],
  ["Upload new receipts","Documentation","recurring","quarterly"],["Realtor follow-up","Realtor","one-time",""],
  ["Annual home value review","Value","recurring","yearly"],
];

export default function MaintenanceReminders() {
  const { id } = useParams();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ cadence: "one-time", next_due: new Date().toISOString().slice(0,10) });

  const load = async () => {
    const { data } = await supabase.from("maintenance_reminders").select("*").eq("property_id", id).order("next_due", { ascending: true });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const seed = async () => {
    const today = new Date().toISOString().slice(0,10);
    const items = DEFAULTS.map(([title, category, cadence, recurrence_rule]) => ({
      property_id: id, title, category, cadence, recurrence_rule, next_due: today, created_by: user?.id,
    }));
    await supabase.from("maintenance_reminders").insert(items);
    toast.success("Default reminders added"); load();
  };

  const add = async () => {
    if (!form.title) return toast.error("Title required");
    const { error } = await supabase.from("maintenance_reminders").insert({ ...form, property_id: id, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Reminder created"); setOpen(false); setForm({ cadence: "one-time", next_due: new Date().toISOString().slice(0,10) }); load();
  };

  const toggle = async (r: any) => {
    await supabase.from("maintenance_reminders").update({ is_done: !r.is_done, last_completed_at: r.is_done ? null : new Date().toISOString() }).eq("id", r.id);
    load();
  };

  const filt = (cad: string) => rows.filter((r) => cad === "all" ? true : r.cadence === cad);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Maintenance Reminders</h1>
            <p className="text-muted-foreground">One-time, recurring, seasonal, and region-specific.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={seed}><Sparkles className="mr-2 h-4 w-4" />Load defaults</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New reminder</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Title</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Category</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                    <div><Label>Cadence</Label>
                      <Select value={form.cadence} onValueChange={(v) => setForm({ ...form, cadence: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["one-time","recurring","seasonal","region-specific"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Next due</Label><Input type="date" value={form.next_due} onChange={(e) => setForm({ ...form, next_due: e.target.value })} /></div>
                  <Button className="w-full" onClick={add}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            {["all","one-time","recurring","seasonal","region-specific"].map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
          </TabsList>
          {["all","one-time","recurring","seasonal","region-specific"].map((c) => (
            <TabsContent key={c} value={c}>
              {filt(c).length === 0 ? (
                <Card><CardContent className="p-10 text-center text-muted-foreground">No reminders.</CardContent></Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filt(c).map((r) => (
                    <Card key={r.id}>
                      <CardContent className="flex items-center gap-3 p-4">
                        <Checkbox checked={r.is_done} onCheckedChange={() => toggle(r)} />
                        <div className="flex-1">
                          <div className={`font-medium ${r.is_done ? "line-through text-muted-foreground" : ""}`}>{r.title}</div>
                          <div className="text-xs text-muted-foreground">{r.category} · Due {r.next_due ? format(new Date(r.next_due), "MMM d, yyyy") : "—"}</div>
                        </div>
                        <Badge variant="outline">{r.cadence}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
