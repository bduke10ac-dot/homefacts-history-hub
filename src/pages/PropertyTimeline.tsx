import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = ["Built","Sale","Permit","Inspection","Remodel","Repair","Maintenance","Insurance Claim","Roof Replacement","HVAC Replacement","Plumbing","Electrical","Solar","Appliance","Storm Event","Realtor Note","Contractor Note","Builder Warranty","Other"];

interface Event {
  id: string;
  occurred_at: string;
  category: string;
  title: string;
  description: string | null;
  cost_cents: number | null;
  contractor_name: string | null;
  verified: boolean;
}

export default function PropertyTimeline() {
  const { id } = useParams();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    // pull both timeline_events and legacy property_records
    const [{ data: te }, { data: pr }] = await Promise.all([
      supabase.from("timeline_events").select("*").eq("property_id", id).order("occurred_at", { ascending: false }),
      supabase.from("property_records").select("id,category,title,description,cost,performed_at,verified,performed_by").eq("property_id", id),
    ]);
    const merged: Event[] = [
      ...((te ?? []) as Event[]),
      ...((pr ?? []) as any[]).map((r) => ({
        id: `pr-${r.id}`,
        occurred_at: r.performed_at ?? r.created_at,
        category: r.category ?? "Record",
        title: r.title,
        description: r.description,
        cost_cents: r.cost ? Math.round(r.cost * 100) : null,
        contractor_name: r.performed_by,
        verified: !!r.verified,
      })),
    ].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    setEvents(merged);
  };

  useEffect(() => { load(); }, [id]);

  const onAdd = async (form: any) => {
    if (!id) return;
    const { error } = await supabase.from("timeline_events").insert({
      property_id: id,
      occurred_at: form.occurred_at,
      category: form.category,
      title: form.title,
      description: form.description || null,
      cost_cents: form.cost ? Math.round(Number(form.cost) * 100) : null,
      contractor_name: form.contractor_name || null,
      created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Event added");
    setOpen(false);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to property
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Property Timeline</h1>
            <p className="text-muted-foreground">Every chapter in this home's history.</p>
          </div>
          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Add event</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add timeline event</DialogTitle></DialogHeader>
                <EventForm onSubmit={onAdd} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative space-y-4 border-l-2 border-border pl-6">
          {events.length === 0 && <p className="text-muted-foreground">No events yet.</p>}
          {events.map((e) => (
            <div key={e.id} className="relative">
              <div className="absolute -left-[1.85rem] mt-2 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              <Card>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{e.category}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(e.occurred_at), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{e.title}</h3>
                    {e.verified && <ShieldCheck className="h-4 w-4 text-accent" />}
                  </div>
                  {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
                  {(e.contractor_name || e.cost_cents) && (
                    <p className="text-xs text-muted-foreground">
                      {e.contractor_name && `${e.contractor_name} · `}
                      {e.cost_cents && `$${(e.cost_cents / 100).toLocaleString()}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventForm({ onSubmit }: { onSubmit: (f: any) => void }) {
  const [form, setForm] = useState<any>({ occurred_at: new Date().toISOString().slice(0, 10), category: "Maintenance" });
  return (
    <div className="space-y-3">
      <div><Label>Date</Label><Input type="date" value={form.occurred_at} onChange={(e) => setForm({ ...form, occurred_at: e.target.value })} /></div>
      <div>
        <Label>Category</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Title</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Contractor</Label><Input value={form.contractor_name ?? ""} onChange={(e) => setForm({ ...form, contractor_name: e.target.value })} /></div>
        <div><Label>Cost ($)</Label><Input type="number" value={form.cost ?? ""} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
      </div>
      <Button className="w-full" onClick={() => onSubmit(form)} disabled={!form.title}>Add event</Button>
    </div>
  );
}
