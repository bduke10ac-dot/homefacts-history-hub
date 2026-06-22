import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const SECTIONS = [
  "Roof","HVAC","Plumbing","Electrical","Foundation","Windows","Doors","Siding","Gutters","Drainage",
  "Appliances","Attic","Insulation","Crawlspace/Basement","Garage","Driveway","Deck/Patio","Fence",
  "Pool/Spa","Solar","Septic","Well","Irrigation","Security systems",
];

interface HealthRow {
  id: string;
  section: string;
  install_date: string | null;
  lifespan_years: number | null;
  contractor_name: string | null;
  warranty_expires: string | null;
  risk_level: string | null;
  status: string | null;
  next_maintenance_date: string | null;
  replacement_estimate_cents: number | null;
  notes: string | null;
  ai_notes: string | null;
}

export default function HomeHealth() {
  const { id } = useParams();
  const { user } = useAuth();
  const [rows, setRows] = useState<HealthRow[]>([]);
  const [propertyAddr, setPropertyAddr] = useState<string>("");
  const [editing, setEditing] = useState<{ section: string; existing?: HealthRow } | null>(null);

  const load = async () => {
    if (!id) return;
    const [{ data: p }, { data: h }] = await Promise.all([
      supabase.from("properties").select("address_line").eq("id", id).maybeSingle(),
      supabase.from("home_health_sections").select("*").eq("property_id", id),
    ]);
    setPropertyAddr((p as any)?.address_line ?? "");
    setRows((h ?? []) as HealthRow[]);
  };

  useEffect(() => { load(); }, [id]);

  const byKey = new Map(rows.map((r) => [r.section, r]));

  const save = async (form: Partial<HealthRow>) => {
    if (!id || !editing) return;
    const payload: any = { ...form, property_id: id, section: editing.section };
    if (form.replacement_estimate_cents) payload.replacement_estimate_cents = Number(form.replacement_estimate_cents);
    if (form.lifespan_years) payload.lifespan_years = Number(form.lifespan_years);
    const { error } = await supabase.from("home_health_sections").upsert(payload, { onConflict: "property_id,section" });
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEditing(null);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to property
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Home Health</h1>
          <p className="text-muted-foreground">{propertyAddr} — track every system from install date to expected replacement.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => {
            const existing = byKey.get(s);
            const age = existing?.install_date
              ? ((Date.now() - new Date(existing.install_date).getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
              : null;
            return (
              <Card key={s}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" />{s}</span>
                    {existing && <Badge variant="outline">{existing.status ?? "tracked"}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {existing ? (
                    <>
                      {existing.install_date && <p className="text-muted-foreground">Installed {existing.install_date} · age {age} yrs</p>}
                      {existing.lifespan_years && <p className="text-muted-foreground">Expected lifespan: {existing.lifespan_years} yrs</p>}
                      {existing.contractor_name && <p className="text-muted-foreground">By {existing.contractor_name}</p>}
                      {existing.warranty_expires && <p className="text-muted-foreground">Warranty until {existing.warranty_expires}</p>}
                      {existing.next_maintenance_date && <p className="text-muted-foreground">Next service: {existing.next_maintenance_date}</p>}
                      {existing.notes && <p className="text-xs">{existing.notes}</p>}
                    </>
                  ) : (
                    <p className="text-muted-foreground">No record yet.</p>
                  )}
                  {user && (
                    <Dialog open={editing?.section === s} onOpenChange={(o) => setEditing(o ? { section: s, existing } : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="mt-2">
                          <Plus className="mr-1 h-3 w-3" />{existing ? "Update" : "Add details"}
                        </Button>
                      </DialogTrigger>
                      {editing?.section === s && (
                        <DialogContent>
                          <DialogHeader><DialogTitle>{s}</DialogTitle></DialogHeader>
                          <HealthForm initial={existing} onSave={save} />
                        </DialogContent>
                      )}
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HealthForm({ initial, onSave }: { initial?: HealthRow; onSave: (data: Partial<HealthRow>) => void }) {
  const [form, setForm] = useState<Partial<HealthRow>>(initial ?? {});
  const set = (k: keyof HealthRow) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="space-y-3">
      <div><Label>Install date</Label><Input type="date" value={form.install_date ?? ""} onChange={set("install_date")} /></div>
      <div><Label>Expected lifespan (years)</Label><Input type="number" value={form.lifespan_years ?? ""} onChange={set("lifespan_years")} /></div>
      <div><Label>Contractor / installer</Label><Input value={form.contractor_name ?? ""} onChange={set("contractor_name")} /></div>
      <div><Label>Warranty expires</Label><Input type="date" value={form.warranty_expires ?? ""} onChange={set("warranty_expires")} /></div>
      <div><Label>Next maintenance date</Label><Input type="date" value={form.next_maintenance_date ?? ""} onChange={set("next_maintenance_date")} /></div>
      <div><Label>Notes</Label><Input value={form.notes ?? ""} onChange={set("notes")} /></div>
      <Button onClick={() => onSave(form)} className="w-full">Save</Button>
    </div>
  );
}
