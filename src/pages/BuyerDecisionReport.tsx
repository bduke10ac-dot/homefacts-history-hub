import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

const LIST_SECTIONS: { key: string; label: string }[] = [
  { key: "hidden_risks", label: "Hidden risks" },
  { key: "expected_maintenance", label: "Expected maintenance" },
  { key: "negotiation_items", label: "Negotiation items" },
  { key: "upgrade_opportunities", label: "Upgrade opportunities" },
  { key: "safety_concerns", label: "Safety concerns" },
  { key: "weather_risks", label: "Weather risks" },
  { key: "permit_concerns", label: "Permit concerns" },
];

export default function BuyerDecisionReport() {
  const { id } = useParams();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("buyer_decision_reports").select("*").eq("property_id", id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    setRow(data);
  };
  useEffect(() => { load(); }, [id]);

  const gen = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("generate-buyer-decision-report", { body: { property_id: id } });
    if (error) toast.error(error.message); else { toast.success("Report generated"); load(); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Buyer Decision Report</h1>
            <p className="text-muted-foreground">Comprehensive AI-generated analysis for potential buyers.</p>
          </div>
          <Button onClick={gen} disabled={loading}><Sparkles className="mr-2 h-4 w-4" />{row ? "Regenerate" : "Generate"}</Button>
        </div>

        {!row ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No report yet. Click Generate.</CardContent></Card>
        ) : (
          <>
            {row.ai_recommendation && (
              <Card><CardHeader><CardTitle>AI Recommendation</CardTitle></CardHeader>
                <CardContent><p className="text-lg">{row.ai_recommendation}</p></CardContent></Card>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {LIST_SECTIONS.map((s) => {
                const items: string[] = row[s.key] ?? [];
                return (
                  <Card key={s.key}>
                    <CardHeader><CardTitle className="text-base">{s.label}</CardTitle></CardHeader>
                    <CardContent>
                      {items.length === 0 ? <p className="text-sm text-muted-foreground">None identified.</p>
                        : <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>}
                    </CardContent>
                  </Card>
                );
              })}
              <Card><CardHeader><CardTitle className="text-base">Insurance outlook</CardTitle></CardHeader><CardContent><p className="text-sm">{row.insurance_outlook}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Long-term outlook</CardTitle></CardHeader><CardContent><p className="text-sm">{row.long_term_outlook}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Neighborhood overview</CardTitle></CardHeader><CardContent><p className="text-sm">{row.neighborhood_overview}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Warranty / Contractor history</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm"><p><span className="font-medium">Warranty:</span> {row.warranty_status}</p><p><span className="font-medium">Contractors:</span> {row.contractor_history}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Estimated annual ownership cost</CardTitle></CardHeader>
                <CardContent><Badge className="text-base">${((row.estimated_annual_cost_cents ?? 0)/100).toLocaleString()}/yr</Badge></CardContent></Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
