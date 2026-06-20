import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sun, Wrench, Sparkles } from "lucide-react";

interface Props { propertyId: string; state?: string | null }

type Profile = { climate_zone: string | null; region_classification: string | null };
type SystemRow = { id: string; system_type: string; manufacturer: string | null; model: string | null; install_date: string | null; notes: string | null; status: string };
type Solar = { panel_count: number | null; system_capacity_kw: number | null; estimated_annual_kwh: number | null; ownership_type: string | null };
type Incentive = { id: string; title: string; authority_level: string; amount_text: string | null; url: string | null; category: string };

export function RegionalSection({ propertyId, state }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [systems, setSystems] = useState<SystemRow[]>([]);
  const [solar, setSolar] = useState<Solar | null>(null);
  const [incentives, setIncentives] = useState<Incentive[]>([]);

  useEffect(() => {
    (async () => {
      const [pr, sys, sol, inc] = await Promise.all([
        supabase.from("regional_property_profile").select("climate_zone,region_classification").eq("property_id", propertyId).maybeSingle(),
        supabase.from("regional_property_systems").select("*").eq("property_id", propertyId).order("install_date", { ascending: false }),
        supabase.from("regional_solar_systems").select("*").eq("property_id", propertyId).maybeSingle(),
        supabase.from("regional_incentives").select("id,title,authority_level,amount_text,url,category,state_code").or(`state_code.is.null${state ? `,state_code.eq.${state}` : ""}`).limit(6),
      ]);
      setProfile(pr.data as Profile | null);
      setSystems((sys.data ?? []) as SystemRow[]);
      setSolar(sol.data as Solar | null);
      setIncentives((inc.data ?? []) as Incentive[]);
    })();
  }, [propertyId, state]);

  if (!profile && !systems.length && !incentives.length) return null;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Regional Intelligence & Systems</h2>
      </div>

      {profile && (profile.climate_zone || profile.region_classification) && (
        <div className="rounded-xl border p-4 text-xs">
          <p className="text-muted-foreground">Region</p>
          <p className="mt-1 font-medium">{profile.region_classification ?? "—"} · Climate zone {profile.climate_zone ?? "—"}</p>
        </div>
      )}

      {systems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2"><Wrench className="h-4 w-4 text-primary" /><p className="text-sm font-medium">Installed Systems</p></div>
          <div className="space-y-2">
            {systems.map((s) => (
              <div key={s.id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-medium capitalize">{s.system_type}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5">{s.status}</span>
                </div>
                <p className="text-muted-foreground">{[s.manufacturer, s.model].filter(Boolean).join(" · ")}</p>
                {s.install_date && <p className="text-muted-foreground">Installed {new Date(s.install_date).toLocaleDateString()}</p>}
                {s.system_type === "solar" && solar && (
                  <div className="mt-2 flex flex-wrap gap-3 border-t pt-2">
                    <span className="flex items-center gap-1"><Sun className="h-3 w-3 text-yellow-600" />{solar.panel_count} panels</span>
                    <span>{solar.system_capacity_kw} kW</span>
                    <span>{solar.estimated_annual_kwh?.toLocaleString()} kWh/yr</span>
                    {solar.ownership_type && <span className="capitalize">{solar.ownership_type}</span>}
                  </div>
                )}
                {s.notes && <p className="mt-1">{s.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {incentives.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Matching Incentives</p>
          <div className="grid gap-2 md:grid-cols-2">
            {incentives.map((i) => (
              <a key={i.id} href={i.url ?? "#"} target="_blank" rel="noreferrer" className="block rounded-lg border p-3 text-xs hover:bg-muted/40">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{i.title}</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary capitalize">{i.authority_level}</span>
                </div>
                {i.amount_text && <p className="mt-1">{i.amount_text}</p>}
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">Educational content. AI suggestions are advisory only and cannot self-certify.</p>
    </div>
  );
}
