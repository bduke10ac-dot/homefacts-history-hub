import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Handshake, Sparkles, FileDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";

interface Report {
  id: string; title: string | null; inputs: any; ai_summary: string | null;
  repair_concerns: string[]; negotiation_points: string[];
  suggested_concession_low: number | null; suggested_concession_high: number | null;
  safety_issues: string[]; code_concerns: string[]; insurance_concerns: string[];
  future_risks: string[]; buyer_questions: string[]; realtor_talking_points: string[];
  created_at: string;
}

export default function NegotiationAssistant() {
  const { id } = useParams();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [inputs, setInputs] = useState({
    title: "",
    inspection_summary: "",
    seller_disclosures: "",
    repair_estimates: "",
    appraisal_summary: "",
    insurance_quote: "",
    list_price: 0,
  });

  const load = async () => {
    const q = supabase.from("negotiation_reports").select("*").order("created_at", { ascending: false });
    const { data } = id ? await q.eq("property_id", id) : await q.eq("user_id", user?.id ?? "");
    setReports((data ?? []) as Report[]);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [id, user]);

  const run = async () => {
    if (!user) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("negotiation-assistant", {
        body: { property_id: id ?? null, ...inputs },
      });
      if (error) throw error;
      const r = data;
      const { error: insErr } = await supabase.from("negotiation_reports").insert({
        property_id: id ?? null, user_id: user.id, title: inputs.title || "Negotiation report",
        inputs,
        ai_summary: r.summary,
        repair_concerns: r.repair_concerns ?? [],
        negotiation_points: r.negotiation_points ?? [],
        suggested_concession_low: r.concession_low ?? null,
        suggested_concession_high: r.concession_high ?? null,
        safety_issues: r.safety_issues ?? [],
        code_concerns: r.code_concerns ?? [],
        insurance_concerns: r.insurance_concerns ?? [],
        future_risks: r.future_risks ?? [],
        buyer_questions: r.buyer_questions ?? [],
        realtor_talking_points: r.realtor_talking_points ?? [],
      });
      if (insErr) throw insErr;
      toast.success("Negotiation report generated");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    } finally { setRunning(false); }
  };

  const exportPdf = (r: Report) => {
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text(r.title || "Buyer Negotiation Report", 10, 15);
    pdf.setFontSize(10); let y = 25;
    const block = (label: string, content: string | string[]) => {
      pdf.setFontSize(12); pdf.text(label, 10, y); y += 6; pdf.setFontSize(10);
      const text = Array.isArray(content) ? content.map((c) => `• ${c}`).join("\n") : content;
      const lines = pdf.splitTextToSize(text || "—", 185);
      lines.forEach((l: string) => { if (y > 275) { pdf.addPage(); y = 15; } pdf.text(l, 10, y); y += 5; });
      y += 3;
    };
    block("Summary", r.ai_summary ?? "—");
    block("Repair concerns", r.repair_concerns);
    block("Negotiation points", r.negotiation_points);
    block("Safety issues", r.safety_issues);
    block("Code concerns", r.code_concerns);
    block("Insurance concerns", r.insurance_concerns);
    block("Future maintenance risks", r.future_risks);
    block("Buyer questions", r.buyer_questions);
    block("Realtor talking points", r.realtor_talking_points);
    if (r.suggested_concession_low || r.suggested_concession_high) {
      block("Suggested concession range", `$${(r.suggested_concession_low ?? 0).toLocaleString()} – $${(r.suggested_concession_high ?? 0).toLocaleString()}`);
    }
    pdf.save(`negotiation-${r.id.slice(0, 8)}.pdf`);
  };

  const remove = async (rid: string) => { await supabase.from("negotiation_reports").delete().eq("id", rid); load(); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6 max-w-5xl">
        <div>
          {id && <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>}
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><Handshake className="h-7 w-7 text-primary" />AI Negotiation Assistant</h1>
          <p className="text-muted-foreground">Paste inspection, disclosure, and quote info — get a negotiation report.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">New report</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Title</Label><Input value={inputs.title} onChange={(e) => setInputs({ ...inputs, title: e.target.value })} /></div>
            <div><Label>List price ($)</Label><Input type="number" value={inputs.list_price} onChange={(e) => setInputs({ ...inputs, list_price: +e.target.value })} /></div>
            <div></div>
            <div className="sm:col-span-2"><Label>Inspection report summary</Label><Textarea rows={4} value={inputs.inspection_summary} onChange={(e) => setInputs({ ...inputs, inspection_summary: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Seller disclosures</Label><Textarea rows={3} value={inputs.seller_disclosures} onChange={(e) => setInputs({ ...inputs, seller_disclosures: e.target.value })} /></div>
            <div><Label>Repair estimates</Label><Textarea rows={3} value={inputs.repair_estimates} onChange={(e) => setInputs({ ...inputs, repair_estimates: e.target.value })} /></div>
            <div><Label>Appraisal summary</Label><Textarea rows={3} value={inputs.appraisal_summary} onChange={(e) => setInputs({ ...inputs, appraisal_summary: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Insurance quote / concerns</Label><Textarea rows={2} value={inputs.insurance_quote} onChange={(e) => setInputs({ ...inputs, insurance_quote: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={run} disabled={running}><Sparkles className="mr-2 h-4 w-4" />{running ? "Generating…" : "Generate report"}</Button></div>
          </CardContent>
        </Card>

        {loading ? <p>Loading…</p> : reports.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No reports yet.</CardContent></Card>
        ) : reports.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{r.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => exportPdf(r)}><FileDown className="mr-1 h-3 w-3" />PDF</Button>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {r.ai_summary && <p className="whitespace-pre-wrap">{r.ai_summary}</p>}
              {(r.suggested_concession_low || r.suggested_concession_high) && (
                <Badge variant="outline" className="text-base">Suggested concession: ${(r.suggested_concession_low ?? 0).toLocaleString()}–${(r.suggested_concession_high ?? 0).toLocaleString()}</Badge>
              )}
              <Group label="Repair concerns" items={r.repair_concerns} />
              <Group label="Negotiation points" items={r.negotiation_points} />
              <Group label="Safety issues" items={r.safety_issues} />
              <Group label="Code concerns" items={r.code_concerns} />
              <Group label="Insurance concerns" items={r.insurance_concerns} />
              <Group label="Future maintenance risks" items={r.future_risks} />
              <Group label="Buyer questions" items={r.buyer_questions} />
              <Group label="Realtor talking points" items={r.realtor_talking_points} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Group({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="font-medium">{label}</p>
      <ul className="list-disc pl-5">{items.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
    </div>
  );
}
