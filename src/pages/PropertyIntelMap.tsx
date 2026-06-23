import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Info } from "lucide-react";

// @ts-expect-error - private API
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

type Severity = "low" | "moderate" | "high" | "info";
interface Layer {
  id: string;
  label: string;
  why: string;
  severity: Severity;
  source: string;
  count?: number;
}

const sevColor = (s: Severity) => s === "high" ? "hsl(var(--destructive))" : s === "moderate" ? "hsl(var(--primary))" : s === "low" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))";
const sevBadge = (s: Severity) => s === "high" ? "destructive" : s === "moderate" ? "default" : "secondary";

const LAYER_DEFS: Layer[] = [
  { id: "hail", label: "Hail history", why: "Repeated hail drives roof claims and premium hikes.", severity: "moderate", source: "NOAA SPC (sample)" },
  { id: "tornado", label: "Tornado activity", why: "Path proximity affects structural and insurance risk.", severity: "low", source: "NOAA SPC (sample)" },
  { id: "flood", label: "Flood zones", why: "FEMA SFHA zones require flood insurance and disclosures.", severity: "moderate", source: "FEMA NFHL (sample)" },
  { id: "wildfire", label: "Wildfire risk", why: "WUI exposure changes coverage availability and pricing.", severity: "low", source: "USFS WHP (sample)" },
  { id: "storm", label: "Storm exposure", why: "Severe wind / hail / tornado density over the last 10 years.", severity: "moderate", source: "NOAA Storm Events (sample)" },
  { id: "roof_age", label: "Roof age heatmap", why: "Older roofs in the area predict shared claim cycles.", severity: "info", source: "Orivaz derived" },
  { id: "home_age", label: "Home age", why: "Block-level build year clusters identify systems near end-of-life.", severity: "info", source: "Parcel records" },
  { id: "permits", label: "Permit activity", why: "Recent permits nearby signal active investment and code updates.", severity: "info", source: "Local permits" },
  { id: "taxes", label: "Property tax history", why: "Trend reveals reassessment risk.", severity: "info", source: "County assessor" },
  { id: "appreciation", label: "Neighborhood appreciation", why: "5-yr value trend for resale planning.", severity: "info", source: "Market comps" },
  { id: "crime", label: "Crime trends", why: "Direction of trend matters more than the single number.", severity: "moderate", source: "Local PD (sample)" },
  { id: "schools", label: "School ratings", why: "Boundary changes can swing resale value.", severity: "info", source: "GreatSchools (sample)" },
  { id: "insurance", label: "Insurance risk", why: "Composite of hazard + claims + roof age.", severity: "moderate", source: "Orivaz derived" },
  { id: "utilities", label: "Utility providers", why: "Electric / gas / water options & reliability.", severity: "info", source: "Local utility" },
  { id: "internet", label: "Internet providers", why: "Fiber availability affects daily life and value.", severity: "info", source: "FCC (sample)" },
  { id: "fema", label: "FEMA zone information", why: "Official flood zone designation drives mandatory coverage.", severity: "moderate", source: "FEMA" },
  { id: "developments", label: "Nearby developments", why: "New construction can shift comps and traffic.", severity: "info", source: "Planning dept (sample)" },
];

export default function PropertyIntelMap() {
  const { id } = useParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layerGroups = useRef<Record<string, L.LayerGroup>>({});
  const [property, setProperty] = useState<any>(null);
  const [active, setActive] = useState<Record<string, boolean>>({ hail: true, flood: true, crime: true });
  const [layers, setLayers] = useState<Layer[]>(LAYER_DEFS);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
      setProperty(data);

      // augment counts from existing tables
      const [{ count: hazardCount }, { count: crimeCount }, { count: weatherCount }, { count: permitCount }] = await Promise.all([
        supabase.from("hazard_intelligence").select("*", { count: "exact", head: true }).eq("property_id", id),
        supabase.from("crime_timeline").select("*", { count: "exact", head: true }).eq("property_id", id),
        supabase.from("weather_environmental_events").select("*", { count: "exact", head: true }).eq("property_id", id),
        supabase.from("permits").select("*", { count: "exact", head: true }).eq("property_id", id),
      ]);
      setLayers((prev) => prev.map((l) =>
        l.id === "hail" || l.id === "storm" ? { ...l, count: weatherCount ?? 0 } :
        l.id === "flood" || l.id === "wildfire" || l.id === "fema" ? { ...l, count: hazardCount ?? 0 } :
        l.id === "crime" ? { ...l, count: crimeCount ?? 0 } :
        l.id === "permits" ? { ...l, count: permitCount ?? 0 } : l
      ));
    })();
  }, [id]);

  useEffect(() => {
    if (!mapRef.current || !property?.latitude || !property?.longitude) return;
    if (map.current) return;
    const m = L.map(mapRef.current, { scrollWheelZoom: true }).setView([property.latitude, property.longitude], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(m);
    L.marker([property.latitude, property.longitude]).addTo(m).bindPopup(property.address_line);
    map.current = m;
  }, [property]);

  // toggle layers — render sample circles around the property
  useEffect(() => {
    if (!map.current || !property?.latitude) return;
    const lat = property.latitude, lng = property.longitude;
    Object.entries(active).forEach(([layerId, isOn]) => {
      const existing = layerGroups.current[layerId];
      if (!isOn) {
        if (existing) { existing.remove(); delete layerGroups.current[layerId]; }
        return;
      }
      if (existing) return;
      const def = LAYER_DEFS.find((l) => l.id === layerId)!;
      const grp = L.layerGroup();
      // sample placeholder points around property
      const seed = layerId.charCodeAt(0) + layerId.charCodeAt(layerId.length - 1);
      const n = (seed % 4) + 3;
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + seed;
        const r = 0.005 + ((seed * (i + 1)) % 10) / 1000;
        const plat = lat + Math.cos(angle) * r;
        const plng = lng + Math.sin(angle) * r * 1.4;
        L.circleMarker([plat, plng], {
          radius: 8, color: sevColor(def.severity), fillColor: sevColor(def.severity), fillOpacity: 0.35, weight: 2,
        }).bindPopup(`<strong>${def.label}</strong><br/><em>${def.source}</em><br/>${def.why}`).addTo(grp);
      }
      grp.addTo(map.current!);
      layerGroups.current[layerId] = grp;
    });
  }, [active, property]);

  const toggle = (id: string) => setActive((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back to property</Link>
        <h1 className="mt-3 text-2xl font-bold">Property Intelligence Map</h1>
        <p className="text-sm text-muted-foreground">17 toggleable layers of risk, history, and neighborhood data.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div ref={mapRef} className="h-[600px] rounded-2xl border shadow-card" />
          <div className="max-h-[600px] overflow-y-auto rounded-2xl border bg-card p-4 shadow-card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Layers</h2>
            <div className="space-y-3">
              {layers.map((l) => (
                <div key={l.id} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{l.label}</span>
                        <Badge variant={sevBadge(l.severity) as any} className="text-[10px]">{l.severity}</Badge>
                        {typeof l.count === "number" && <span className="text-xs text-muted-foreground">· {l.count}</span>}
                      </div>
                      <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" />{l.why}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Source: {l.source}</p>
                    </div>
                    <Switch checked={!!active[l.id]} onCheckedChange={() => toggle(l.id)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!property?.latitude && (
          <div className="mt-6 rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Map coordinates unavailable for this property. Add latitude/longitude to enable the map.
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Sample data shown for layers not yet connected to live sources.</p>
      </div>
    </div>
  );
}
