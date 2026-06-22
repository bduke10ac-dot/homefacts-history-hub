import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, AlertTriangle, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: string; permit_id: string | null; status: string;
  code_concerns: string[]; corrections_requested: string[];
  inspection_notes: string | null; ai_checklist: string[];
  final_approval: boolean; decided_at: string | null;
}

const DEFAULT_CHECKLIST = [
  "Permit on file for scope of work",
  "Licensed contractor verified",
  "Engineering stamp if structural",
  "Setbacks and easements respected",
  "Egress requirements met",
  "Smoke + CO detectors per code",
  "Electrical panel compliant",
  "Plumbing rough-in inspected",
  "Insulation R-value documented",
  "Final inspection scheduled",
];

export default function GovernmentPortal() {
  const { id } = useParams();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ permit_id: "", status: "pending", inspection_notes: "", concern: "", correction: "" });

  const load = async () => {
    if (!id) return;
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("government_reviews").select("*").eq("property_id", id).order("created_at", { ascending: false }),
      supabase.from("permits").select("*").eq("property_id", id).limit(50),
    ]);
    setReviews((r ?? []) as Review[]);
    setPermits(p ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const create = async () => {
    if (!id || !user) return;
    const concerns = form.concern ? form.concern.split("\n").filter(Boolean) : [];
    const corrections = form.correction ? form.correction.split("\n").filter(Boolean) : [];
    const { error } = await supabase.from("government_reviews").insert({
      property_id: id, reviewer_id: user.id,
      permit_id: form.permit_id || null,
      status: form.status, inspection_notes: form.inspection_notes,
      code_concerns: concerns, corrections_requested: corrections,
      ai_checklist: DEFAULT_CHECKLIST,
    });
    if (error) toast.error(error.message);
    else { toast.success("Review filed"); setForm({ permit_id: "", status: "pending", inspection_notes: "", concern: "", correction: "" }); load(); }
  };

  const decide = async (rid: string, approve: boolean) => {
    await supabase.from("government_reviews").update({
      status: approve ? "approved" : "rejected",
      final_approval: approve, decided_at: new Date().toISOString(),
    }).eq("id", rid);
    load();
  };

  const remove = async (rid: string) => { await supabase.from("government_reviews").delete().eq("id", rid); load(); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div>
          <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><Building2 className="h-7 w-7 text-primary" />Government / Permit Portal</h1>
          <p className="text-muted-foreground">Code officials review submitted projects, link permits, flag concerns, and approve work.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">File new review</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Link permit</Label>
              <Select value={form.permit_id} onValueChange={(v) => setForm({ ...form, permit_id: v })}>
                <SelectTrigger><SelectValue placeholder="Unlinked" /></SelectTrigger>
                <SelectContent>
                  {permits.map((p) => <SelectItem key={p.id} value={p.id}>{p.permit_number ?? p.id.slice(0,8)} — {p.permit_type ?? "permit"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pending","under_review","corrections_requested","approved","rejected"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Inspection notes</Label><Textarea value={form.inspection_notes} onChange={(e) => setForm({ ...form, inspection_notes: e.target.value })} /></div>
            <div><Label>Code concerns (one per line)</Label><Textarea value={form.concern} onChange={(e) => setForm({ ...form, concern: e.target.value })} /></div>
            <div><Label>Corrections requested (one per line)</Label><Textarea value={form.correction} onChange={(e) => setForm({ ...form, correction: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={create}><Plus className="mr-2 h-4 w-4" />File review</Button></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">AI Code Compliance Checklist</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-2">
              {DEFAULT_CHECKLIST.map((c) => <li key={c} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{c}</li>)}
            </ul>
          </CardContent>
        </Card>

        {loading ? <p className="text-muted-foreground">Loading…</p> : reviews.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No reviews filed yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />Review
                      <Badge variant="outline">{r.status}</Badge>
                      {r.final_approval && <Badge className="bg-emerald-500/15 text-emerald-700">Approved</Badge>}
                    </CardTitle>
                    {r.decided_at && <p className="text-xs text-muted-foreground mt-1">Decided {new Date(r.decided_at).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => decide(r.id, true)}><CheckCircle2 className="mr-1 h-3 w-3" />Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => decide(r.id, false)}>Reject</Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {r.inspection_notes && <div><span className="font-medium">Notes: </span>{r.inspection_notes}</div>}
                  {r.code_concerns.length > 0 && (
                    <div>
                      <p className="font-medium text-amber-700 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Code concerns</p>
                      <ul className="list-disc pl-5">{r.code_concerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
                    </div>
                  )}
                  {r.corrections_requested.length > 0 && (
                    <div>
                      <p className="font-medium">Corrections requested</p>
                      <ul className="list-disc pl-5">{r.corrections_requested.map((c, i) => <li key={i}>{c}</li>)}</ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
