// Phase 2 — Regional Intelligence. Real data for storm/hail/wind/flood/hard-water;
// labeled placeholders for tornado, soil, radon, utilities, permit office, school zone, tax info.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudLightning, CloudHail, Wind, Waves, Mountain, Activity, Droplets, Zap, Building2, School, Receipt, Tornado } from "lucide-react";

interface Row { key: string; label: string; icon: any; value: string; tone: "real" | "placeholder"; }

function levelLabel(v: string | null | undefined): string {
  if (!v) return "Not assessed";
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

export function RegionalIntelligence({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: intel }, { data: hazards }] = await Promise.all([
        supabase.from("property_intelligence").select("*").eq("property_id", propertyId).maybeSingle(),
        supabase.from("hazard_intelligence").select("hazard_type,risk_level,label").eq("property_id", propertyId),
      ]);

      const hazardByType: Record<string, string> = {};
      for (const h of hazards ?? []) hazardByType[h.hazard_type] = h.risk_level ?? "";

      const hardWater = hazardByType["hard_water"] || (intel?.plumbing_material === "copper" ? "elevated" : "");

      const next: Row[] = [
        { key: "storm", label: "Storm risk", icon: CloudLightning, value: levelLabel(intel?.storm_risk_level || hazardByType["storm"]), tone: "real" },
        { key: "hail", label: "Hail history", icon: CloudHail, value: levelLabel(intel?.hail_risk_level || hazardByType["hail"]), tone: "real" },
        { key: "wind", label: "Wind risk", icon: Wind, value: levelLabel(intel?.wind_risk_level || hazardByType["wind"]), tone: "real" },
        { key: "flood", label: "Flood risk", icon: Waves, value: levelLabel(intel?.flood_risk_level || hazardByType["flood"]), tone: "real" },
        { key: "hardwater", label: "Hard water", icon: Droplets, value: levelLabel(hardWater), tone: "real" },
        { key: "tornado", label: "Tornado history", icon: Tornado, value: "Regional intelligence data connection coming soon.", tone: "placeholder" },
        { key: "soil", label: "Soil conditions", icon: Mountain, value: "Regional intelligence data connection coming soon.", tone: "placeholder" },
        { key: "radon", label: "Radon risk", icon: Activity, value: "Regional intelligence data connection coming soon.", tone: "placeholder" },
        { key: "utilities", label: "Utility providers", icon: Zap, value: "Regional intelligence data connection coming soon.", tone: "placeholder" },
        { key: "permits", label: "Local permit office", icon: Building2, value: "Regional intelligence data connection coming soon.", tone: "placeholder" },
        { key: "school", label: "School zone", icon: School, value: "Regional intelligence data connection coming soon.", tone: "placeholder" },
        { key: "tax", label: "Property tax info", icon: Receipt, value: "Regional intelligence data connection coming soon.", tone: "placeholder" },
      ];
      setRows(next);
      setLoading(false);
    })();
  }, [propertyId]);

  return (
    <Card>
      <CardHeader><CardTitle>Regional Intelligence</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.key} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.value}</p>
                    </div>
                  </div>
                  {r.tone === "placeholder" ? (
                    <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Live</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
