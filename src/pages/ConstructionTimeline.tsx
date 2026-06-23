import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Save, Wrench } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  "Lot preparation","Foundation","Framing","Roofing","Windows and doors",
  "Rough plumbing","Rough electrical","HVAC","Insulation","Drywall",
  "Cabinets","Flooring","Paint","Fixtures","Final inspection",
  "Final walkthrough","Closing","Homeowner handoff",
];
type Status = "pending" | "in_progress" | "complete";
interface Stage { stage: string; status: Status; completed_at?: string; contractor?: string; notes?: string; inspection_status?: string; photos?: string[]; }

const statusVariant: Record<Status, "secondary" | "default" | "outline"> = {
  pending: "outline", in_progress: "default", complete: "secondary",
};

export default function ConstructionTimeline() {
  const { id } = useParams();
  const [clone, setClone] = useState<any>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase.from("nb_property_clones").select("*").eq("id", id).maybeSingle();
      setClone(data);
      const stored: Stage[] = Array.isArray(data?.construction_stages) ? data.construction_stages as any : [];
      const merged = STAGES.map((s) => stored.find((x) => x.stage === s) ?? { stage: s, status: "pending" as Status });
      setStages(merged);
      setLoading(false);
    })();
  }, [id]);

  const patch = (idx: number, p: Partial<Stage>) => setStages((prev) => prev.map((s, i) => i === idx ? { ...s, ...p } : s));

  const cycle = (idx: number) => {
    const next: Record<Status, Status> = { pending: "in_progress", in_progress: "complete", complete: "pending" };
    const newStatus = next[stages[idx].status];
    patch(idx, { status: newStatus, completed_at: newStatus === "complete" ? new Date().toISOString().slice(0, 10) : undefined });
  };

  const save = async () => {
    if (!id) return;
    setSaving(true);
    const current = stages.find((s) => s.status === "in_progress")?.stage ?? stages.filter((s) => s.status === "complete").slice(-1)[0]?.stage ?? null;
    const { error } = await supabase
      .from("nb_property_clones")
      .update({ construction_stages: stages as any, construction_stage: current })
      .eq("id", id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Timeline saved");
  };

  const completedCount = stages.filter((s) => s.status === "complete").length;
  const progress = Math.round((completedCount / stages.length) * 100);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <Link to="/builder/clones" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back to homes</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="h-6 w-6" />Construction Timeline</h1>
            <p className="text-sm text-muted-foreground">{clone?.address_line ?? "Home"} · Lot {clone?.lot_number ?? "—"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-lg font-bold">{progress}%</p>
            </div>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save timeline
            </Button>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-6 space-y-3">
          {stages.map((s, i) => (
            <div key={s.stage} className="rounded-xl border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => cycle(i)} aria-label="Toggle status" className="shrink-0">
                    {s.status === "complete" ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                  </button>
                  <div>
                    <p className="font-medium">{i + 1}. {s.stage}</p>
                    {s.completed_at && s.status === "complete" && <p className="text-xs text-muted-foreground">Completed {s.completed_at}</p>}
                  </div>
                </div>
                <Badge variant={statusVariant[s.status]} className="capitalize">{s.status.replace("_"," ")}</Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Input placeholder="Contractor" value={s.contractor ?? ""} onChange={(e) => patch(i, { contractor: e.target.value })} />
                <Input placeholder="Inspection status" value={s.inspection_status ?? ""} onChange={(e) => patch(i, { inspection_status: e.target.value })} />
                <Input type="date" value={s.completed_at ?? ""} onChange={(e) => patch(i, { completed_at: e.target.value })} />
              </div>
              <Textarea className="mt-2" rows={2} placeholder="Notes / photos URLs" value={s.notes ?? ""} onChange={(e) => patch(i, { notes: e.target.value })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
