import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Award, Plus, Trash2 } from "lucide-react";

interface Score {
  id: string; contractor_name: string; trade: string | null; score: number;
  jobs_completed: number; on_time_rate: number | null; quality_rating: number | null;
  complaint_count: number; badge: string | null; notes: string | null;
}

const badgeColor = (b: string | null) => {
  if (b === "green") return "bg-emerald-500/15 text-emerald-700 border-emerald-300";
  if (b === "yellow") return "bg-amber-500/15 text-amber-700 border-amber-300";
  if (b === "red") return "bg-red-500/15 text-red-700 border-red-300";
  return "bg-muted text-muted-foreground";
};

const deriveBadge = (score: number, complaints: number) => {
  if (complaints >= 3 || score < 50) return "red";
  if (score >= 85 && complaints === 0) return "green";
  return "yellow";
};

export default function ContractorScores() {
  const { id } = useParams();
  const { user } = useAuth();
  const [scores, setScores] = useState<Score[]>([]);
  const [form, setForm] = useState({ contractor_name: "", trade: "", score: 80, jobs_completed: 1, on_time_rate: 95, quality_rating: 4.5, complaint_count: 0, notes: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("contractor_scores").select("*").eq("property_id", id).order("score", { ascending: false });
    setScores((data ?? []) as Score[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const add = async () => {
    if (!id || !user || !form.contractor_name) return;
    const badge = deriveBadge(form.score, form.complaint_count);
    const { error } = await supabase.from("contractor_scores").insert({ property_id: id, created_by: user.id, badge, ...form });
    if (error) toast.error(error.message);
    else { toast.success("Contractor added"); setForm({ contractor_name: "", trade: "", score: 80, jobs_completed: 1, on_time_rate: 95, quality_rating: 4.5, complaint_count: 0, notes: "" }); load(); }
  };

  const remove = async (sid: string) => {
    await supabase.from("contractor_scores").delete().eq("id", sid);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div>
          <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><Award className="h-7 w-7 text-primary" />Contractor Scores</h1>
          <p className="text-muted-foreground">Track reputation, reliability, and quality for every contractor who works on this home.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Add contractor</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Name</Label><Input value={form.contractor_name} onChange={(e) => setForm({ ...form, contractor_name: e.target.value })} /></div>
            <div><Label>Trade</Label><Input value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="Roofing, HVAC…" /></div>
            <div><Label>Score (0-100)</Label><Input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: +e.target.value })} /></div>
            <div><Label>Jobs completed</Label><Input type="number" value={form.jobs_completed} onChange={(e) => setForm({ ...form, jobs_completed: +e.target.value })} /></div>
            <div><Label>On-time rate %</Label><Input type="number" value={form.on_time_rate} onChange={(e) => setForm({ ...form, on_time_rate: +e.target.value })} /></div>
            <div><Label>Quality rating (1-5)</Label><Input type="number" step="0.1" value={form.quality_rating} onChange={(e) => setForm({ ...form, quality_rating: +e.target.value })} /></div>
            <div><Label>Complaints</Label><Input type="number" value={form.complaint_count} onChange={(e) => setForm({ ...form, complaint_count: +e.target.value })} /></div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={add}><Plus className="mr-2 h-4 w-4" />Add contractor</Button></div>
          </CardContent>
        </Card>

        {loading ? <p className="text-muted-foreground">Loading…</p> : scores.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No contractors scored yet.</CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {scores.map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{s.contractor_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{s.trade ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={badgeColor(s.badge)}>{s.badge ?? "n/a"}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">Score</p><p className="text-2xl font-bold">{s.score}</p></div>
                  <div><p className="text-muted-foreground">Jobs</p><p className="text-2xl font-bold">{s.jobs_completed}</p></div>
                  <div><p className="text-muted-foreground">On-time</p><p>{s.on_time_rate ?? "—"}%</p></div>
                  <div><p className="text-muted-foreground">Quality</p><p>{s.quality_rating ?? "—"}/5</p></div>
                  <div><p className="text-muted-foreground">Complaints</p><p>{s.complaint_count}</p></div>
                  {s.notes && <div className="col-span-2"><p className="text-muted-foreground">Notes</p><p>{s.notes}</p></div>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
