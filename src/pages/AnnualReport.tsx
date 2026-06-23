import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Delta { label: string; previous: string; current: string; change: string; trend: "up" | "down" | "flat"; }

export default function AnnualReport() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [done, setDone] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);

  useEffect(() => { (async () => {
    if (!id) return;
    setLoading(true);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
    const [{ data: prop }, { data: records }, { data: storms }, { data: permits }, { data: reminders }] = await Promise.all([
      supabase.from("properties").select("*").eq("id", id).maybeSingle(),
      supabase.from("property_records").select("*").eq("property_id", id),
      supabase.from("weather_environmental_events").select("*").eq("property_id", id).gte("event_date", oneYearAgo),
      supabase.from("permits").select("*").eq("property_id", id).gte("issued_date", oneYearAgo),
      supabase.from("maintenance_reminders").select("*").eq("property_id", id),
    ]);
    setProperty(prop);
    const yearRecords = (records ?? []).filter((r: any) => r.performed_at && r.performed_at >= oneYearAgo);
    const yearSpend = yearRecords.reduce((s: number, r: any) => s + (r.cost ?? 0), 0);
    setDone(yearRecords.slice(0, 8).map((r: any) => r.title));
    setMissed((reminders ?? []).filter((r: any) => r.last_completed_at && r.last_completed_at < oneYearAgo).map((r: any) => r.title));

    setDeltas([
      { label: "Maintenance records added", previous: "—", current: String(yearRecords.length), change: `+${yearRecords.length}`, trend: "up" },
      { label: "Documented spend", previous: "—", current: `$${yearSpend.toLocaleString()}`, change: `+$${yearSpend.toLocaleString()}`, trend: "up" },
      { label: "Storm events nearby", previous: "—", current: String(storms?.length ?? 0), change: `${storms?.length ?? 0}`, trend: (storms?.length ?? 0) > 2 ? "up" : "flat" },
      { label: "Permits in area", previous: "—", current: String(permits?.length ?? 0), change: `${permits?.length ?? 0}`, trend: "flat" },
      { label: "Open reminders", previous: "—", current: String(reminders?.length ?? 0), change: `${reminders?.length ?? 0}`, trend: "flat" },
    ]);
    setLoading(false);
  })(); }, [id]);

  const generateAI = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-annual-report", { body: { property_id: id, deltas, done, missed } });
      if (error) throw error;
      setSummary(data?.summary ?? "No summary returned.");
      toast.success("Annual summary generated");
    } catch (e: any) {
      toast.error(e.message ?? "Could not generate summary");
    } finally { setGenerating(false); }
  };

  const downloadPdf = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text("Orivaz Annual Report", 14, 20);
    pdf.setFontSize(11); pdf.text(`${property?.address_line ?? ""}, ${property?.city ?? ""} ${property?.state ?? ""}`, 14, 28);
    let y = 40;
    pdf.setFontSize(14); pdf.text("What changed this year", 14, y); y += 8;
    pdf.setFontSize(10);
    deltas.forEach((d) => { pdf.text(`• ${d.label}: ${d.current} (${d.change})`, 16, y); y += 6; });
    y += 4; pdf.setFontSize(14); pdf.text("Maintenance completed", 14, y); y += 8; pdf.setFontSize(10);
    done.forEach((t) => { pdf.text(`✓ ${t}`, 16, y); y += 6; });
    if (missed.length) { y += 4; pdf.setFontSize(14); pdf.text("Maintenance missed", 14, y); y += 8; pdf.setFontSize(10);
      missed.forEach((t) => { pdf.text(`! ${t}`, 16, y); y += 6; }); }
    if (summary) { y += 4; pdf.setFontSize(14); pdf.text("AI summary", 14, y); y += 8; pdf.setFontSize(10);
      pdf.splitTextToSize(summary, 180).forEach((line: string) => { pdf.text(line, 14, y); y += 5; }); }
    pdf.save(`Orivaz-Annual-${property?.address_line?.replace(/\s+/g, "-") ?? id}.pdf`);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back to property</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Annual "What Changed?" Report</h1>
            <p className="text-sm text-muted-foreground">{property?.address_line} · last 12 months</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={generateAI} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Generate AI summary
            </Button>
            <Button size="sm" variant="outline" onClick={downloadPdf}><FileText className="mr-2 h-4 w-4" />Download PDF</Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deltas.map((d) => (
            <div key={d.label} className="rounded-xl border bg-card p-4 shadow-card">
              <p className="text-xs uppercase text-muted-foreground">{d.label}</p>
              <p className="mt-1 text-2xl font-bold">{d.current}</p>
              <Badge variant="outline" className="mt-2">{d.change}</Badge>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h3 className="font-semibold">Maintenance completed ({done.length})</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {done.length ? done.map((t, i) => <li key={i}>✓ {t}</li>) : <li className="text-muted-foreground">No completed records logged this year.</li>}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h3 className="font-semibold">Maintenance missed ({missed.length})</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {missed.length ? missed.map((t, i) => <li key={i} className="text-destructive">! {t}</li>) : <li className="text-muted-foreground">All reminders are current.</li>}
            </ul>
          </div>
        </div>

        {summary && (
          <div className="mt-6 rounded-2xl border bg-card p-6 shadow-card">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI summary</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
