import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandoffQRDialog } from "@/components/newbuild/HandoffQRDialog";
import { WarrantyCenter } from "@/components/newbuild/WarrantyCenter";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BuilderCloneDetail() {
  const { id } = useParams();
  const [clone, setClone] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: c }, { data: s }, { data: i }, { data: d }] = await Promise.all([
      supabase.from("nb_property_clones").select("*, nb_templates(name, subdivision)").eq("id", id).maybeSingle(),
      supabase.from("nb_clone_subcontractors").select("*").eq("clone_id", id).order("trade"),
      supabase.from("nb_clone_inspections").select("*").eq("clone_id", id).order("inspection_date"),
      supabase.from("nb_clone_documents").select("*").eq("clone_id", id).order("created_at", { ascending: false }),
    ]);
    setClone(c); setSubs(s ?? []); setInspections(i ?? []); setDocs(d ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const update = async (patch: any) => {
    const { error } = await supabase.from("nb_property_clones").update(patch).eq("id", id!);
    if (error) toast.error(error.message); else { toast.success("Saved"); load(); }
  };

  if (!clone) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <Link to="/builder/clones" className="text-sm text-muted-foreground">← Back to homes</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{clone.nb_templates?.name}</p>
            <h1 className="text-2xl font-bold">{clone.address_line ?? `Lot ${clone.lot_number ?? "?"}`}</h1>
            <p className="text-sm text-muted-foreground">{[clone.city, clone.state, clone.zip].filter(Boolean).join(", ")}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{clone.status.replace(/_/g, " ")}</Badge>
            <HandoffQRDialog handoffToken={clone.handoff_token} label={clone.address_line ?? `Lot ${clone.lot_number}`} />
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="warranties">Warranties</TabsTrigger>
            <TabsTrigger value="subs">Subs</TabsTrigger>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
            <Card><CardContent className="grid gap-3 p-6 md:grid-cols-2">
              <Field label="Lot number" value={clone.lot_number} onSave={(v) => update({ lot_number: v })} />
              <Field label="Parcel ID" value={clone.parcel_id} onSave={(v) => update({ parcel_id: v })} />
              <Field label="Address" value={clone.address_line} onSave={(v) => update({ address_line: v })} />
              <Field label="City" value={clone.city} onSave={(v) => update({ city: v })} />
              <Field label="Build start" type="date" value={clone.build_start_date} onSave={(v) => update({ build_start_date: v || null })} />
              <Field label="Completion" type="date" value={clone.completion_date} onSave={(v) => update({ completion_date: v || null })} />
              <Field label="Certificate of occupancy" type="date" value={clone.co_date} onSave={(v) => update({ co_date: v || null })} />
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={clone.status} onValueChange={(v) => update({ status: v, handed_off_at: v === "handed_off" ? new Date().toISOString() : clone.handed_off_at })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="under_construction">Under construction</SelectItem>
                    <SelectItem value="ready_for_handoff">Ready for handoff</SelectItem>
                    <SelectItem value="handed_off">Handed off</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="warranties"><WarrantyCenter cloneId={clone.id} /></TabsContent>

          <TabsContent value="subs" className="space-y-2">
            {subs.map((s) => (
              <Card key={s.id}><CardContent className="flex items-center justify-between p-4 text-sm">
                <div><p className="font-medium">{s.company_name}</p><p className="text-xs text-muted-foreground">{s.trade}</p></div>
                {s.warranty_months && <Badge variant="outline">{s.warranty_months} mo</Badge>}
              </CardContent></Card>
            ))}
            {!subs.length && <p className="text-sm text-muted-foreground">No subcontractors on this home.</p>}
          </TabsContent>

          <TabsContent value="inspections" className="space-y-2">
            {inspections.map((i) => (
              <Card key={i.id}><CardContent className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium capitalize">{i.milestone.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{i.inspector_name} · {i.inspection_date ? format(new Date(i.inspection_date), "MMM d, yyyy") : "—"}</p>
                </div>
                <Badge variant="outline" className={i.result === "pass" ? "bg-emerald-500/15 text-emerald-700" : ""}>{i.result ?? "pending"}</Badge>
              </CardContent></Card>
            ))}
            {!inspections.length && <p className="text-sm text-muted-foreground">No inspections recorded.</p>}
          </TabsContent>

          <TabsContent value="docs" className="space-y-2">
            {docs.map((d) => (
              <Card key={d.id}><CardContent className="flex items-center justify-between p-4 text-sm">
                <div><p className="font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{d.category}</p></div>
                {d.file_url && <Button asChild size="sm" variant="outline"><a href={d.file_url} target="_blank" rel="noreferrer">Open</a></Button>}
              </CardContent></Card>
            ))}
            {!docs.length && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, value, onSave, type = "text" }: { label: string; value: any; onSave: (v: string) => void; type?: string }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => { setV(value ?? ""); }, [value]);
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type={type} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== (value ?? "") && onSave(v)} />
    </div>
  );
}
