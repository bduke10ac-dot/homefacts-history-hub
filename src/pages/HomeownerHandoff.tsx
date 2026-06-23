import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HandoffQRDialog } from "@/components/newbuild/HandoffQRDialog";
import { BuiltBy } from "@/components/builder/BuiltBy";
import { ArrowLeft, FileText, Loader2, Sparkles, Home } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export default function HomeownerHandoff() {
  const { id } = useParams();
  const [clone, setClone] = useState<any>(null);
  const [builder, setBuilder] = useState<any>(null);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: c } = await supabase.from("nb_property_clones").select("*").eq("id", id).maybeSingle();
      setClone(c);
      if (c?.company_id) {
        const { data: b } = await supabase.from("builder_companies").select("*").eq("id", c.company_id).maybeSingle();
        setBuilder(b);
      }
      const [{ data: w }, { data: s }, { data: d }] = await Promise.all([
        supabase.from("nb_clone_warranties").select("*").eq("clone_id", id),
        supabase.from("nb_clone_subcontractors").select("*").eq("clone_id", id),
        supabase.from("nb_clone_documents").select("*").eq("clone_id", id),
      ]);
      setWarranties(w ?? []); setSubs(s ?? []); setDocs(d ?? []);
      setLoading(false);
    })();
  }, [id]);

  const generatePacket = async () => {
    if (!clone) return;
    setBuilding(true);
    try {
      const pdf = new jsPDF();
      const W = pdf.internal.pageSize.getWidth();
      // Cover
      pdf.setFontSize(22); pdf.text("Welcome to your new home", 14, 26);
      pdf.setFontSize(12); pdf.text(`${clone.address_line ?? ""}, ${clone.city ?? ""} ${clone.state ?? ""}`, 14, 36);
      if (builder?.name) { pdf.text(`Built by ${builder.name}`, 14, 44); }
      pdf.setFontSize(10); pdf.text(`Generated ${new Date().toLocaleDateString()}`, 14, 52);

      let y = 66;
      const section = (title: string) => {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setFontSize(14); pdf.text(title, 14, y); y += 8; pdf.setFontSize(10);
      };
      const line = (s: string) => {
        if (y > 280) { pdf.addPage(); y = 20; }
        pdf.splitTextToSize(s, W - 28).forEach((t: string) => { pdf.text(t, 16, y); y += 5; });
      };

      section("Warranty packet");
      if (warranties.length) warranties.forEach((w) => line(`• ${w.title ?? w.warranty_type ?? "Warranty"} — ${w.issuer ?? ""} (expires ${w.expiration_date ?? "n/a"})`));
      else line("No warranties added yet.");

      section("Maintenance checklist");
      ["Replace HVAC filter monthly","Test smoke + CO detectors quarterly","Flush water heater yearly","Inspect roof yearly","Clean gutters twice yearly","Service HVAC twice yearly","Inspect caulking yearly"].forEach(line);

      section("Emergency contact sheet");
      line("• Water main shut-off: garage / utility room");
      line("• Gas shut-off: meter at side of home");
      line("• Main electrical breaker: utility panel");
      if (builder?.phone) line(`• Builder: ${builder.name} — ${builder.phone}`);
      line("• 911 for fire / medical emergencies");

      section("Contractor list");
      if (subs.length) subs.forEach((s) => line(`• ${s.trade}: ${s.company_name ?? ""} ${s.phone ? "— " + s.phone : ""}`));
      else line("No subcontractors recorded.");

      section("Utility setup guide");
      ["Electric: contact your local provider with the address above","Water/sewer: call the municipal water department","Gas: set up service before move-in","Internet: check available providers in this neighborhood","Trash/recycling: contact your HOA or municipality"].forEach(line);

      section("Documents on file");
      if (docs.length) docs.forEach((d) => line(`• ${d.title ?? d.file_name ?? "Document"}`));
      else line("No documents uploaded yet.");

      section("Digital home record");
      const url = `${window.location.origin}/home/${clone.handoff_token}`;
      line(`Scan the QR or visit: ${url}`);

      pdf.save(`Orivaz-Handoff-${(clone.address_line ?? "home").replace(/\s+/g, "-")}.pdf`);
      toast.success("Handoff packet generated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to build packet");
    } finally { setBuilding(false); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>;
  if (!clone) return <div className="container py-12 text-center">Home not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <Link to="/builder/clones" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back to homes</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Home className="h-6 w-6" />Homeowner Handoff</h1>
            <p className="text-sm text-muted-foreground">{clone.address_line}, {clone.city} {clone.state}</p>
          </div>
          <Badge variant="secondary" className="capitalize">{(clone.status ?? "").replace(/_/g, " ")}</Badge>
        </div>

        {builder && <div className="mt-6"><BuiltBy company={builder} /></div>}



        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PacketCard title="Orivaz digital home profile" desc="Verified record of this home for the next owner." count={1} />
          <PacketCard title="Welcome packet" desc="Cover sheet + property profile." count={1} />
          <PacketCard title="Warranty packet" desc="All warranties pulled from the home record." count={warranties.length} />
          <PacketCard title="Maintenance checklist" desc="Monthly / quarterly / yearly tasks." count={7} />
          <PacketCard title="Emergency contact sheet" desc="Shut-offs and key numbers." count={4} />
          <PacketCard title="Contractor list" desc="All subcontractors on the build." count={subs.length} />
          <PacketCard title="Utility setup guide" desc="Step-by-step move-in." count={5} />
          <PacketCard title="QR code" desc="For the panel, garage, or welcome packet." count={1} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5 shadow-card">
          <p className="text-sm">
            <Sparkles className="mr-1 inline h-4 w-4 text-primary" />
            Generate a printable handoff packet with everything above.
          </p>
          <div className="flex flex-wrap gap-2">
            {clone.handoff_token && <HandoffQRDialog handoffToken={clone.handoff_token} label={clone.address_line ?? ""} />}
            <Button onClick={generatePacket} disabled={building}>
              {building ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}Generate Homeowner Handoff
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PacketCard({ title, desc, count }: { title: string; desc: string; count: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <Badge variant="outline">{count}</Badge>
      </div>
    </div>
  );
}
