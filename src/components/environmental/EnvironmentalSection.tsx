import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CloudLightning, ShieldAlert, Waves } from "lucide-react";

interface Props { propertyId: string }

type EnvEvent = { id: string; event_type: string; event_date: string; severity: string | null; magnitude: number | null; magnitude_unit: string | null; distance_miles: number | null; description: string | null };
type RiskScores = { hail_risk_level: string | null; wind_risk_level: string | null; tornado_risk_level: string | null; flood_risk_level: string | null; wildfire_risk_level: string | null; overall_risk_score: number | null };
type Flood = { fema_zone: string | null; elevation_ft: number | null; in_floodway: boolean | null; flood_insurance_required: boolean | null };
type Grade = { grade: string; score: number | null };

const riskColor = (level: string | null) => {
  switch (level) {
    case "very_high": return "bg-red-100 text-red-800 border-red-200";
    case "high": return "bg-orange-100 text-orange-800 border-orange-200";
    case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low": return "bg-green-100 text-green-800 border-green-200";
    case "very_low": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
};
const gradeColor = (g: string) => ({ A: "text-emerald-600", B: "text-green-600", C: "text-yellow-600", D: "text-orange-600", F: "text-red-600" } as Record<string, string>)[g] || "";

export function EnvironmentalSection({ propertyId }: Props) {
  const [events, setEvents] = useState<EnvEvent[]>([]);
  const [risk, setRisk] = useState<RiskScores | null>(null);
  const [flood, setFlood] = useState<Flood | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [e, r, f, g] = await Promise.all([
        supabase.from("env_events").select("*").eq("property_id", propertyId).order("event_date", { ascending: false }),
        supabase.from("env_risk_scores").select("*").eq("property_id", propertyId).maybeSingle(),
        supabase.from("env_flood_intelligence").select("*").eq("property_id", propertyId).maybeSingle(),
        supabase.from("env_grade").select("*").eq("property_id", propertyId).maybeSingle(),
      ]);
      setEvents((e.data ?? []) as EnvEvent[]);
      setRisk(r.data as RiskScores | null);
      setFlood(f.data as Flood | null);
      setGrade(g.data as Grade | null);
      setLoading(false);
    })();
  }, [propertyId]);

  if (loading) return null;
  if (!events.length && !risk && !flood && !grade) return null;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card space-y-5">
      <div className="flex items-center gap-2">
        <CloudLightning className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Environmental & Weather</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {grade && (
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Environmental Grade</p>
            <p className={`mt-1 text-4xl font-bold ${gradeColor(grade.grade)}`}>{grade.grade}</p>
            {grade.score != null && <p className="text-xs text-muted-foreground">Score: {grade.score}</p>}
          </div>
        )}
        {risk && (
          <div className="rounded-xl border p-4 md:col-span-2">
            <p className="text-xs text-muted-foreground mb-2">Risk Profile</p>
            <div className="flex flex-wrap gap-2">
              {([
                ["Hail", risk.hail_risk_level],
                ["Wind", risk.wind_risk_level],
                ["Tornado", risk.tornado_risk_level],
                ["Flood", risk.flood_risk_level],
                ["Wildfire", risk.wildfire_risk_level],
              ] as const).map(([label, level]) => level && (
                <span key={label} className={`rounded-full border px-2.5 py-0.5 text-xs ${riskColor(level)}`}>{label}: {level.replace("_", " ")}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {flood && (
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2"><Waves className="h-4 w-4 text-blue-600" /><p className="text-sm font-medium">Flood Intelligence</p></div>
          <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <div><p className="text-muted-foreground">FEMA Zone</p><p className="font-medium">{flood.fema_zone ?? "—"}</p></div>
            <div><p className="text-muted-foreground">Elevation</p><p className="font-medium">{flood.elevation_ft ? `${flood.elevation_ft} ft` : "—"}</p></div>
            <div><p className="text-muted-foreground">In Floodway</p><p className="font-medium">{flood.in_floodway ? "Yes" : "No"}</p></div>
            <div><p className="text-muted-foreground">Insurance Required</p><p className="font-medium">{flood.flood_insurance_required ? "Yes" : "No"}</p></div>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2"><ShieldAlert className="h-4 w-4 text-orange-600" /><p className="text-sm font-medium">Recent Weather Events</p></div>
          <div className="space-y-2">
            {events.slice(0, 8).map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="capitalize font-medium">{ev.event_type}</span>
                  <span className="text-muted-foreground">{new Date(ev.event_date).toLocaleDateString()}</span>
                  {ev.magnitude != null && <span>{ev.magnitude}{ev.magnitude_unit}</span>}
                  {ev.distance_miles != null && <span className="text-muted-foreground">{ev.distance_miles} mi</span>}
                </div>
                {ev.severity && <span className={`rounded-full border px-2 py-0.5 ${riskColor(ev.severity)}`}>{ev.severity}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">Data sources: NOAA, FEMA. AI-derived assessments are advisory only and cannot self-certify.</p>
    </div>
  );
}
