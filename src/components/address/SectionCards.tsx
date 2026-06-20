import { Skeleton } from "@/components/ui/skeleton";
import { riskTone } from "@/lib/outlook";
import { Home, Trees, ShieldAlert, GraduationCap, LineChart } from "lucide-react";

const fmt = new Intl.NumberFormat("en-US");
const money = (n: number) => `$${fmt.format(Math.round(n))}`;

export function SectionShell({ title, icon: Icon, loading, children }: { title: string; icon: any; loading?: boolean; children?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4.5 w-4.5" /></div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="mt-5">
        {loading ? <div className="space-y-2"><Skeleton className="h-4 w-3/4"/><Skeleton className="h-4 w-2/3"/><Skeleton className="h-4 w-1/2"/></div> : children}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

export function PropertySection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Property facts" icon={Home} loading={loading}>
      {data && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Type" value={data.property_type} />
          <Stat label="Year built" value={data.year_built} />
          <Stat label="Sq ft" value={fmt.format(data.sqft)} />
          <Stat label="Beds / Baths" value={`${data.beds} / ${data.baths}`} />
          <Stat label="Lot size" value={`${fmt.format(data.lot_size_sqft)} sf`} />
          <Stat label="Last sold" value={`${money(data.last_sold_price)} (${data.last_sold_year})`} />
          <Stat label="Roof age" value={`${data.roof_age_years} yrs`} />
          <Stat label="HVAC age" value={`${data.hvac_age_years} yrs`} />
        </div>
      )}
    </SectionShell>
  );
}

export function NeighborhoodSection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Neighborhood" icon={Trees} loading={loading}>
      {data && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Walk score" value={data.walk_score} />
          <Stat label="Transit" value={data.transit_score} />
          <Stat label="Bike" value={data.bike_score} />
          <Stat label="Noise" value={data.noise_level} />
          <Stat label="Median income" value={money(data.median_income)} />
          <Stat label="Median age" value={data.median_age} />
        </div>
      )}
    </SectionShell>
  );
}

export function RiskSection({ data, loading }: { data?: any; loading?: boolean }) {
  const items = data ? [
    ["Flood", data.flood?.level, data.flood?.zone && `Zone ${data.flood.zone}`],
    ["Wildfire", data.wildfire?.level, null],
    ["Earthquake", data.earthquake?.level, null],
    ["Crime", data.crime?.level, data.crime?.incidents_last_year && `${data.crime.incidents_last_year} incidents / yr`],
    ["Storm", data.storm?.level, null],
    ["Air quality", data.air_quality?.aqi >= 100 ? "High" : data.air_quality?.aqi >= 50 ? "Moderate" : "Low", data.air_quality?.aqi && `AQI ${data.air_quality.aqi}`],
  ] as [string, string, string | null][] : [];
  return (
    <SectionShell title="Risk indicators" icon={ShieldAlert} loading={loading}>
      {data && (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map(([name, lvl, detail]) => {
            const t = riskTone(lvl);
            return (
              <div key={name} className="flex items-center justify-between rounded-lg border bg-background p-3">
                <div>
                  <div className="text-sm font-medium">{name}</div>
                  {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${t.className}`}>{t.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}

export function SchoolsSection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Schools" icon={GraduationCap} loading={loading}>
      {data?.schools && (
        <div className="space-y-2">
          {data.schools.map((s: any) => (
            <div key={s.name} className="flex items-center justify-between rounded-lg border bg-background p-3">
              <div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.level} · {s.distance_mi} mi · {fmt.format(s.students)} students</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{s.rating}<span className="text-xs text-muted-foreground">/10</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

export function MarketSection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Market" icon={LineChart} loading={loading}>
      {data && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Median price" value={money(data.median_price)} />
          <Stat label="Price / sqft" value={money(data.price_per_sqft)} />
          <Stat label="YoY change" value={`${data.yoy_change_pct > 0 ? "+" : ""}${data.yoy_change_pct}%`} />
          <Stat label="Days on market" value={data.days_on_market} />
          <Stat label="Active inventory" value={fmt.format(data.inventory)} />
          <Stat label="Est. rent" value={`${money(data.rent_estimate)}/mo`} />
        </div>
      )}
    </SectionShell>
  );
}
