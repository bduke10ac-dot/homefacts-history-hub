// Phase 2 — 10-system health dashboard.
// Derives status from existing property_health_scores (0..100) and refines
// using property_intelligence (install years / materials). Does NOT recompute a score.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home, Wind, Droplet, Zap, Flame, Refrigerator, Layers, PaintRoller, AppWindow, ShieldAlert,
} from "lucide-react";

type Status = "Good" | "Monitor" | "Needs Attention" | "Unknown";

interface SystemRow {
  key: string;
  label: string;
  icon: any;
  status: Status;
  detail: string;
}

const NOW_YEAR = new Date().getFullYear();

function bucketFromScore(score: number | null | undefined): Status {
  if (score == null) return "Unknown";
  if (score >= 80) return "Good";
  if (score >= 60) return "Monitor";
  return "Needs Attention";
}

function ageDowngrade(status: Status, installYear: number | null | undefined, expectedLifeYears: number): Status {
  if (installYear == null) return status;
  const age = NOW_YEAR - installYear;
  if (age >= expectedLifeYears) return "Needs Attention";
  if (age >= expectedLifeYears * 0.75 && status === "Good") return "Monitor";
  return status;
}

const STATUS_VARIANT: Record<Status, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  Good: { variant: "secondary", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
  Monitor: { variant: "secondary", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  "Needs Attention": { variant: "destructive", className: "" },
  Unknown: { variant: "outline", className: "" },
};

export function PropertyHealthDashboard({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<SystemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: health }, { data: intel }] = await Promise.all([
        supabase
          .from("property_health_scores")
          .select("*")
          .eq("property_id", propertyId)
          .order("computed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("property_intelligence").select("*").eq("property_id", propertyId).maybeSingle(),
      ]);

      const roofStatus = ageDowngrade(bucketFromScore(health?.roof_score), intel?.roof_install_year, 25);
      const hvacStatus = ageDowngrade(bucketFromScore(health?.hvac_score), intel?.hvac_install_year, 18);
      const whStatus = ageDowngrade(bucketFromScore(health?.water_heater_score), intel?.water_heater_install_year, 12);
      const elecStatus = ageDowngrade(bucketFromScore(health?.electrical_score), intel?.electrical_panel_year, 40);

      const next: SystemRow[] = [
        { key: "roof", label: "Roof", icon: Home, status: roofStatus,
          detail: intel?.roof_install_year ? `Installed ${intel.roof_install_year}${intel.roof_material ? ` · ${intel.roof_material}` : ""}` : "From condition score" },
        { key: "hvac", label: "HVAC", icon: Wind, status: hvacStatus,
          detail: intel?.hvac_install_year ? `Installed ${intel.hvac_install_year}${intel.hvac_type ? ` · ${intel.hvac_type}` : ""}` : "From condition score" },
        { key: "plumbing", label: "Plumbing", icon: Droplet, status: bucketFromScore(health?.plumbing_score),
          detail: intel?.plumbing_material ? `${intel.plumbing_material}` : "From condition score" },
        { key: "electrical", label: "Electrical", icon: Zap, status: elecStatus,
          detail: intel?.electrical_panel_year ? `Panel ${intel.electrical_panel_year}` : "From condition score" },
        { key: "water_heater", label: "Water Heater", icon: Flame, status: whStatus,
          detail: intel?.water_heater_install_year ? `Installed ${intel.water_heater_install_year}${intel.water_heater_type ? ` · ${intel.water_heater_type}` : ""}` : "From condition score" },
        { key: "appliances", label: "Appliances", icon: Refrigerator, status: "Unknown",
          detail: "Upload appliance records or warranties to assess." },
        { key: "foundation", label: "Foundation", icon: Layers, status: bucketFromScore(health?.foundation_score),
          detail: intel?.foundation_type ? `${intel.foundation_type}` : "From condition score" },
        { key: "exterior", label: "Exterior", icon: PaintRoller, status: bucketFromScore(health?.exterior_score),
          detail: intel?.exterior_material ? `${intel.exterior_material}` : "From condition score" },
        { key: "windows_doors", label: "Windows / Doors", icon: AppWindow, status: "Unknown",
          detail: "Upload records to assess." },
        { key: "safety", label: "Safety Devices", icon: ShieldAlert, status: "Unknown",
          detail: "Upload smoke / CO / security records to assess." },
      ];
      setRows(next);
      setLoading(false);
    })();
  }, [propertyId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Health Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading systems…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => {
              const Icon = r.icon;
              const sv = STATUS_VARIANT[r.status];
              return (
                <div key={r.key} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.detail}</p>
                    </div>
                  </div>
                  <Badge variant={sv.variant} className={sv.className}>{r.status}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
