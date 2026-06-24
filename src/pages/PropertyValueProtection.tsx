// Phase 2 — Value Protection checklist. Reuses the SAME evidence-detection counts
// the Passport / Trust Score uses (warranties, permits, etc.) so we don't double-implement.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

type Impact = "High" | "Medium" | "Low";

interface ChecklistItem {
  key: string;
  label: string;
  impact: Impact;
  why: string;
  done: boolean;
}

async function tableCount(table: string, propertyId: string): Promise<number> {
  const { count } = await supabase.from(table as any).select("id", { count: "exact", head: true }).eq("property_id", propertyId);
  return count ?? 0;
}

const IMPACT_TONE: Record<Impact, string> = {
  High: "bg-rose-100 text-rose-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-slate-100 text-slate-800",
};

export default function PropertyValueProtection() {
  const { id } = useParams();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [warranties, permits, photos, inspections, claims, ownership, contractors, maintenance, estate, emergency] = await Promise.all([
        tableCount("warranties", id),
        tableCount("permits", id),
        tableCount("digital_twin_rooms", id),
        tableCount("disaster_vault_documents", id),
        tableCount("insurance_claims", id),
        tableCount("ownership_history", id),
        tableCount("contractor_scores", id),
        tableCount("maintenance_reminders", id),
        tableCount("estate_documents", id),
        tableCount("emergency_events", id),
      ]);

      // Roof / HVAC / WH warranty heuristics
      const { data: warrantyRows } = await supabase.from("warranties").select("category,title").eq("property_id", id);
      const hasMatch = (re: RegExp) => (warrantyRows ?? []).some((w: any) => re.test(`${w.category ?? ""} ${w.title ?? ""}`));
      const hasRoof = hasMatch(/roof/i);
      const hasHvac = hasMatch(/hvac|furnace|air condition/i);
      const hasWaterHeater = hasMatch(/water heater|tankless|boiler/i);

      const list: ChecklistItem[] = [
        { key: "roof_docs", label: "Upload roof documentation", impact: "High",
          why: "Roof age and warranty drive resale value and insurance eligibility.", done: hasRoof },
        { key: "hvac_warranty", label: "Upload HVAC warranty", impact: "High",
          why: "Transferable HVAC warranties add value at sale.", done: hasHvac },
        { key: "water_heater_warranty", label: "Upload water heater warranty", impact: "Medium",
          why: "Documents replacement timeline for the next owner.", done: hasWaterHeater },
        { key: "contractor_invoices", label: "Upload contractor invoices", impact: "High",
          why: "Proof of qualified work; supports insurance and resale.", done: contractors > 0 },
        { key: "before_after_photos", label: "Add before/after photos", impact: "Medium",
          why: "Visual proof of improvements raises appraiser confidence.", done: photos > 0 },
        { key: "permits", label: "Document permits", impact: "High",
          why: "Unpermitted work is a top resale and insurance blocker.", done: permits > 0 },
        { key: "inspections", label: "Upload inspection reports", impact: "Medium",
          why: "Baseline condition records protect against buyer disputes.", done: inspections > 0 },
        { key: "warranties_registered", label: "Register warranties", impact: "Medium",
          why: "Unregistered warranties often void at transfer.", done: warranties > 0 },
        { key: "emergency_contacts", label: "Add emergency contacts", impact: "Low",
          why: "Faster response during incidents preserves value.", done: estate > 0 || emergency > 0 },
        { key: "ownership_history", label: "Complete ownership history", impact: "Medium",
          why: "Chain of title clarity speeds sales and refinances.", done: ownership > 0 },
        { key: "maintenance_history", label: "Log maintenance history", impact: "Medium",
          why: "Documented upkeep is a top trust signal for buyers.", done: maintenance > 0 },
        { key: "claims", label: "Document insurance claim history", impact: "Low",
          why: "A clean or fully-documented claim history affects premiums.", done: claims > 0 },
      ];
      setItems(list);
      setLoading(false);
    })();
  }, [id]);

  const completed = items.filter((i) => i.done).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Value Protection Center</h1>
          <p className="text-muted-foreground">Actions that protect long-term property value.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Checklist {loading ? "" : `· ${completed} / ${items.length} complete`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : items.map((it) => (
              <div key={it.key} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  {it.done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{it.label}</p>
                    <p className="text-xs text-muted-foreground">{it.why}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={IMPACT_TONE[it.impact]}>{it.impact} impact</Badge>
                  <Badge variant={it.done ? "secondary" : "outline"} className="text-[10px]">
                    {it.done ? "Done" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to={`/property/${id}/passport`}>View Passport</Link></Button>
          <Button asChild variant="outline"><Link to={`/property/${id}/vault`}>Open Vault</Link></Button>
        </div>
      </div>
    </div>
  );
}
