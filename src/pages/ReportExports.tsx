import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const REPORTS = [
  { key: "full", title: "Full HomeFacts Report", desc: "Comprehensive property record" },
  { key: "buyer", title: "Buyer Confidence Report", desc: "Built for prospective buyers" },
  { key: "seller", title: "Seller Listing Packet", desc: "Showcase your home's history" },
  { key: "insurance_claim", title: "Insurance Claim Packet", desc: "Photos, timelines, contractors" },
  { key: "disaster", title: "Disaster Recovery Packet", desc: "Everything an adjuster needs" },
  { key: "contractor", title: "Contractor Project Report", desc: "Verified work history" },
  { key: "maintenance", title: "Maintenance History Report", desc: "Service log over time" },
  { key: "permit", title: "Permit Compliance Report", desc: "Permits and inspections" },
  { key: "builder", title: "Builder New Home Manual", desc: "Handoff package for new builds" },
  { key: "realtor", title: "Realtor Listing Readiness", desc: "Pre-listing checklist + summary" },
  { key: "investor", title: "Investor Portfolio Report", desc: "Asset-by-asset rollup" },
  { key: "value", title: "Property Value Protection", desc: "What's protecting/lowering value" },
  { key: "passport", title: "Ownership Passport PDF", desc: "Lifelong, transferable record" },
];

export default function ReportExports() {
  const { id } = useParams();
  const [busy, setBusy] = useState<string | null>(null);

  const generate = async (key: string, title: string) => {
    if (!id) return;
    setBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: { property_id: id, template: key, title },
      });
      if (error) throw error;
      toast.success(`${title} generated`);
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to property
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Report Exports</h1>
          <p className="text-muted-foreground">Professional PDF reports for any audience.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map((r) => (
            <Card key={r.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" />{r.title}</CardTitle>
                <CardDescription>{r.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" disabled={busy === r.key} onClick={() => generate(r.key, r.title)}>
                  <Download className="mr-1 h-3 w-3" />{busy === r.key ? "Generating…" : "Generate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
