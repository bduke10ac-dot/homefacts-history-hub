import { Skeleton } from "@/components/ui/skeleton";
import { riskTone } from "@/lib/outlook";
import { Home, ShieldAlert, GraduationCap, Receipt, Store, Plug, Landmark, Vote, Phone, ExternalLink } from "lucide-react";

const fmt = new Intl.NumberFormat("en-US");
const money = (n: number | null | undefined) => (n == null ? "—" : `$${fmt.format(Math.round(Number(n)))}`);

export function SectionShell({ title, icon: Icon, loading, children }: { title: string; icon: any; loading?: boolean; children?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
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

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 rounded-lg border bg-background p-3 text-sm">{children}</div>;
}

/* ─────────── Overview (property facts) ─────────── */
export function OverviewSection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Property facts" icon={Home} loading={loading}>
      {data && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Type" value={data.property_type ?? "—"} />
          <Stat label="Year built" value={data.year_built ?? "—"} />
          <Stat label="Living area" value={data.living_area_sqft ? `${fmt.format(data.living_area_sqft)} sf` : "—"} />
          <Stat label="Beds / Baths" value={`${data.bedrooms ?? "—"} / ${data.bathrooms ?? "—"}`} />
          <Stat label="Lot size" value={data.lot_size_sqft ? `${fmt.format(data.lot_size_sqft)} sf` : "—"} />
          <Stat label="Zoning" value={data.zoning ?? "—"} />
          <Stat label="Assessed value" value={money(data.assessed_value)} />
          <Stat label="Market value" value={money(data.market_value)} />
          <Stat label="Last sale" value={data.last_sale_price ? `${money(data.last_sale_price)}${data.last_sale_date ? ` (${data.last_sale_date})` : ""}` : "—"} />
        </div>
      )}
    </SectionShell>
  );
}

/* ─────────── Taxes ─────────── */
export function TaxesSection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Tax history" icon={Receipt} loading={loading}>
      {data?.years?.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-3 py-2 text-left">Year</th><th className="px-3 py-2 text-right">Assessed</th><th className="px-3 py-2 text-right">Taxable</th><th className="px-3 py-2 text-right">Tax</th></tr>
            </thead>
            <tbody>
              {data.years.map((y: any) => (
                <tr key={y.tax_year} className="border-t">
                  <td className="px-3 py-2 font-medium">{y.tax_year}</td>
                  <td className="px-3 py-2 text-right">{money(y.assessed_value)}</td>
                  <td className="px-3 py-2 text-right">{money(y.taxable_value)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{money(y.total_tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-muted-foreground">No tax records available.</p>}
    </SectionShell>
  );
}

/* ─────────── Schools ─────────── */
export function SchoolsSection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Schools" icon={GraduationCap} loading={loading}>
      {data?.schools?.length > 0 ? (
        <div className="space-y-2">
          {data.schools.map((s: any, i: number) => (
            <Row key={i}>
              <div className="min-w-0">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.level} · {s.district_name ?? ""}{s.distance_miles != null ? ` · ${s.distance_miles} mi` : ""}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{s.rating ?? "—"}<span className="text-xs text-muted-foreground">/10</span></div>
                {s.rating_source && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.rating_source}</div>}
              </div>
            </Row>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">No school data.</p>}
    </SectionShell>
  );
}

/* ─────────── Risk ─────────── */
export function RiskSection({ data, loading }: { data?: any; loading?: boolean }) {
  const items: [string, string, string | null][] = data ? [
    ["Flood", data.flood_zone_description ?? data.flood_zone, data.flood_zone ? `Zone ${data.flood_zone}` : null],
    ["Wildfire", data.wildfire_risk_tier, null],
    ["Storm exposure", data.storm_level ?? (data.storm_events?.length ? `${data.storm_events.length} recent events` : "Low"), null],
    ["Environmental", (data.environmental_notes?.[0] ?? "Low"), data.environmental_notes?.length ? `${data.environmental_notes.length} note(s)` : null],
  ] : [];
  return (
    <SectionShell title="Risk indicators" icon={ShieldAlert} loading={loading}>
      {data && (
        <>
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
          {data.fema_panel_url && (
            <a href={data.fema_panel_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              FEMA flood map panel <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </>
      )}
    </SectionShell>
  );
}

/* ─────────── Amenities ─────────── */
export function AmenitiesSection({ data, loading }: { data?: any; loading?: boolean }) {
  const grouped: Record<string, any[]> = {};
  (data?.places ?? []).forEach((p: any) => { (grouped[p.category] ??= []).push(p); });
  return (
    <SectionShell title="Nearby amenities" icon={Store} loading={loading}>
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, places]) => (
            <div key={cat}>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{cat}</div>
              <div className="space-y-1.5">
                {places.slice(0, 4).map((p: any, i: number) => (
                  <Row key={i}>
                    <div className="min-w-0">
                      <div className="font-medium">{p.name}</div>
                      {p.address && <div className="text-xs text-muted-foreground truncate">{p.address}</div>}
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {p.distance_miles != null && <div>{p.distance_miles} mi</div>}
                      {p.rating != null && <div>★ {p.rating}</div>}
                    </div>
                  </Row>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">No nearby amenities found.</p>}
    </SectionShell>
  );
}

/* ─────────── Utilities ─────────── */
export function UtilitiesSection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Utilities" icon={Plug} loading={loading}>
      {data?.providers?.length > 0 ? (
        <div className="space-y-2">
          {data.providers.map((p: any, i: number) => (
            <Row key={i}>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.utility_type}</div>
                <div className="font-medium">{p.provider_name}</div>
                {p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}
              </div>
              <div className="flex flex-col items-end gap-1 text-xs">
                {p.contact_phone && <a className="inline-flex items-center gap-1 hover:text-primary" href={`tel:${p.contact_phone}`}><Phone className="h-3 w-3" />{p.contact_phone}</a>}
                {p.contact_url && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={p.contact_url} target="_blank" rel="noreferrer">Website <ExternalLink className="h-3 w-3" /></a>}
              </div>
            </Row>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">No utility info.</p>}
    </SectionShell>
  );
}

/* ─────────── Civic ─────────── */
export function CivicSection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Civic officials" icon={Landmark} loading={loading}>
      {data?.officials?.length > 0 ? (
        <div className="space-y-2">
          {data.officials.map((o: any, i: number) => (
            <Row key={i}>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{o.office}{o.district_number ? ` · District ${o.district_number}` : ""}</div>
                <div className="font-medium">{o.name}</div>
                {o.party && <div className="text-xs text-muted-foreground">{o.party}</div>}
              </div>
              <div className="flex flex-col items-end gap-1 text-xs">
                {o.contact_phone && <a className="inline-flex items-center gap-1 hover:text-primary" href={`tel:${o.contact_phone}`}><Phone className="h-3 w-3" />{o.contact_phone}</a>}
                {o.contact_url && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={o.contact_url} target="_blank" rel="noreferrer">Website <ExternalLink className="h-3 w-3" /></a>}
              </div>
            </Row>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">No officials listed.</p>}
    </SectionShell>
  );
}

/* ─────────── Voting / civic services ─────────── */
export function VotingSection({ data, loading }: { data?: any; loading?: boolean }) {
  return (
    <SectionShell title="Voting & civic services" icon={Vote} loading={loading}>
      {data && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Polling place</div>
            <div className="mt-1 font-medium">{data.polling_place_name ?? "—"}</div>
            {data.polling_place_address && <div className="text-xs text-muted-foreground">{data.polling_place_address}</div>}
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Election authority</div>
            <div className="mt-1 font-medium">{data.election_authority ?? "—"}</div>
            {data.election_authority_url && <a href={data.election_authority_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Website <ExternalLink className="h-3 w-3" /></a>}
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Closest DMV</div>
            <div className="mt-1 font-medium">{data.closest_dmv_name ?? "—"}</div>
            {data.closest_dmv_address && <div className="text-xs text-muted-foreground">{data.closest_dmv_address}{data.closest_dmv_distance_miles != null ? ` · ${data.closest_dmv_distance_miles} mi` : ""}</div>}
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">City hall</div>
            <div className="mt-1 font-medium">{data.closest_city_hall_address ?? "—"}</div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
