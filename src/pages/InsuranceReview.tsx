import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id?: string; carrier: string | null; policy_number: string | null;
  premium: number | null; deductible: number | null; coverage_amount: number | null;
  effective_date: string | null; renewal_date: string | null;
  gaps: string[]; recommendations: string[]; ai_summary: string | null;
}

const empty: Review = { carrier: "", policy_number: "", premium: null, deductible: null, coverage_amount: null, effective_date: null, renewal_date: null, gaps: [], recommendations: [], ai_summary: "" };

export default function InsuranceReview() {
  const { id } = useParams();
  const { user } = useAuth();
  const [r, setR] = useState<Review>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase.from("insurance_reviews").select("*").eq("property_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setR({ ...(data as any), gaps: (data as any).gaps ?? [], recommendations: (data as any).recommendations ?? [] });
      setLoading(false);
    })();
  }, [id]);

  const analyze = (rv: Review): { gaps: string[]; recs: string[]; summary: string } => {
    const gaps: string[] = [];
    const recs: string[] = [];
    if (!rv.coverage_amount || rv.coverage_amount < 250000) gaps.push("Dwelling coverage may be below replacement cost.");
    if (!rv.deductible) gaps.push("Deductible not on file.");
    else if (rv.deductible > 5000) recs.push("High deductible — confirm you can cover out-of-pocket.");
    if (!rv.renewal_date) gaps.push("Renewal date missing — add one to enable reminders.");
    if (!rv.carrier) gaps.push("Carrier not recorded.");
    if (rv.premium && rv.coverage_amount && rv.premium / rv.coverage_amount > 0.01) recs.push("Premium-to-coverage ratio is high; consider shopping carriers.");
    recs.push("Add water backup, service line, and equipment breakdown endorsements if not present.");
    const summary = `Policy reviewed: ${gaps.length} gap(s), ${recs.length} recommendation(s).`;
    return { gaps, recs, summary };
  };

  const save = async () => {
    if (!id || !user) return;
    const { gaps, recs, summary } = analyze(r);
    const payload = { ...r, property_id: id, created_by: user.id, gaps, recommendations: recs, ai_summary: summary };
    const { error } = r.id
      ? await supabase.from("insurance_reviews").update(payload).eq("id", r.id)
      : await supabase.from("insurance_reviews").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Insurance review saved"); setR({ ...r, gaps, recommendations: recs, ai_summary: summary }); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6 max-w-4xl">
        <div>
          <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7 text-primary" />Insurance Review</h1>
          <p className="text-muted-foreground">Track your policy and get AI-flagged gaps and recommendations.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Policy details</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Carrier</Label><Input value={r.carrier ?? ""} onChange={(e) => setR({ ...r, carrier: e.target.value })} /></div>
            <div><Label>Policy #</Label><Input value={r.policy_number ?? ""} onChange={(e) => setR({ ...r, policy_number: e.target.value })} /></div>
            <div><Label>Premium ($/yr)</Label><Input type="number" value={r.premium ?? ""} onChange={(e) => setR({ ...r, premium: e.target.value ? +e.target.value : null })} /></div>
            <div><Label>Deductible ($)</Label><Input type="number" value={r.deductible ?? ""} onChange={(e) => setR({ ...r, deductible: e.target.value ? +e.target.value : null })} /></div>
            <div><Label>Dwelling coverage ($)</Label><Input type="number" value={r.coverage_amount ?? ""} onChange={(e) => setR({ ...r, coverage_amount: e.target.value ? +e.target.value : null })} /></div>
            <div><Label>Renewal date</Label><Input type="date" value={r.renewal_date ?? ""} onChange={(e) => setR({ ...r, renewal_date: e.target.value || null })} /></div>
            <div className="sm:col-span-2"><Label>Notes / summary</Label><Textarea value={r.ai_summary ?? ""} onChange={(e) => setR({ ...r, ai_summary: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={save}><Save className="mr-2 h-4 w-4" />Analyze & save</Button></div>
          </CardContent>
        </Card>

        {r.gaps.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2 text-amber-600"><AlertTriangle className="h-4 w-4" />Coverage gaps</CardTitle></CardHeader>
            <CardContent><ul className="list-disc pl-5 space-y-1 text-sm">{r.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul></CardContent>
          </Card>
        )}
        {r.recommendations.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" />Recommendations</CardTitle></CardHeader>
            <CardContent><ul className="list-disc pl-5 space-y-1 text-sm">{r.recommendations.map((g, i) => <li key={i}>{g}</li>)}</ul></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
