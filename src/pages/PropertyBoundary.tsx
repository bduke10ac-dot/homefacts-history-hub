import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin, Layers, Ruler, FileText, Upload, AlertTriangle,
  ShieldCheck, Mountain, Satellite, Maximize2, Download, Share2, Info
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { toast } from "sonner";

// @ts-expect-error - leaflet private
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

interface Property {
  id: string; address_line: string; city: string; state: string; zip: string;
  latitude: number | null; longitude: number | null; year_built: number | null;
  square_feet: number | null;
}

const LAYER_GROUPS = [
  { group: "Property", layers: [
    { id: "parcel", label: "Parcel boundary" },
    { id: "footprint", label: "Home footprint" },
    { id: "lines", label: "Property lines" },
    { id: "labels", label: "Dimension labels" },
  ]},
  { group: "Government GIS", layers: [
    { id: "aerial", label: "Aerial photography" },
    { id: "satellite", label: "Satellite view" },
    { id: "terrain", label: "Terrain / contours" },
  ]},
  { group: "Zoning", layers: [
    { id: "zoning", label: "Current zoning" },
    { id: "future", label: "Future land use" },
    { id: "overlay", label: "Overlay districts" },
  ]},
  { group: "FEMA", layers: [
    { id: "flood", label: "Flood zones" },
    { id: "floodway", label: "Floodway" },
  ]},
  { group: "Environmental", layers: [
    { id: "wetlands", label: "Wetlands" },
    { id: "soils", label: "Soil types" },
    { id: "drainage", label: "Drainage" },
  ]},
  { group: "Utilities", layers: [
    { id: "water_e", label: "Water easements" },
    { id: "sewer_e", label: "Sewer easements" },
    { id: "electric_e", label: "Electric easements" },
    { id: "gas_e", label: "Gas easements" },
  ]},
] as const;

const MOCK_BOUNDARY = {
  parcel_number: "R-04829-117",
  legal_description: "LOT 14, BLK 3, OAK MEADOWS PHASE 2, AS PER PLAT RECORDED IN VOL. 88, PG. 142.",
  lot_dimensions: "85' x 142'",
  acreage: 0.28,
  lot_size_sqft: 12_070,
  zoning: "R-1 Single Family Residential",
  future_land_use: "Low-Density Residential",
  overlay_districts: ["Tree Preservation Overlay"],
  flood_zone: "Zone X (Minimal Risk)",
  fema_flood_risk: "Low",
  land_value: 78_000,
  improvement_value: 312_500,
  property_classification: "Residential — Single Family",
};

const MOCK_EASEMENTS = [
  { type: "Utility Easement", width: "10 ft", side: "Rear", doc: "Vol 88 Pg 142", restrictions: "No permanent structures" },
  { type: "Drainage Easement", width: "5 ft", side: "East side", doc: "Vol 88 Pg 142", restrictions: "Must remain unobstructed" },
  { type: "Sidewalk / ROW", width: "15 ft", side: "Front", doc: "Plat dedication", restrictions: "Public right-of-way" },
];

const MOCK_SURVEYS = [
  { type: "Boundary Survey", date: "2018-04-12", surveyor: "Brazos Land Surveying LLC", license: "RPLS #5482" },
  { type: "Mortgage Survey", date: "2018-04-18", surveyor: "Brazos Land Surveying LLC", license: "RPLS #5482" },
];

const MOCK_AI_OBSERVATIONS = [
  { feature: "Fence (rear)", observation: "Fence appears to sit ~1.2 ft inside the rear utility easement.", severity: "warning" },
  { feature: "Detached shed", observation: "Shed is within the parcel and clear of setbacks.", severity: "ok" },
  { feature: "Driveway", observation: "Driveway aligns with front ROW dedication.", severity: "ok" },
  { feature: "Tree line (south)", observation: "Mature canopy may overhang neighboring parcel by ~3 ft.", severity: "info" },
];

const MOCK_SATELLITE_HISTORY = [
  { year: "2008", note: "Vacant lot — pre-construction" },
  { year: "2010", note: "Home construction completed" },
  { year: "2015", note: "Detached garage added" },
  { year: "2019", note: "Pool installed (rear yard)" },
  { year: "2023", note: "Roof replacement — full tear-off" },
];

const MOCK_TIMELINE = [
  { date: "2008-06-01", title: "Plat recorded", source: "Register of Deeds" },
  { date: "2009-11-14", title: "Building permit issued", source: "City Planning" },
  { date: "2010-08-22", title: "Boundary survey recorded", source: "County GIS" },
  { date: "2015-03-09", title: "Rear utility easement updated", source: "Recorded Easement" },
  { date: "2023-05-17", title: "Roofing permit issued", source: "Permits" },
];

export default function PropertyBoundary() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Record<string, boolean>>({
    parcel: true, footprint: true, lines: true, labels: true,
    aerial: true, satellite: false, terrain: false,
    zoning: false, future: false, overlay: false,
    flood: false, floodway: false,
    wetlands: false, soils: false, drainage: false,
    water_e: false, sewer_e: false, electric_e: false, gas_e: false,
  });

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, L.Layer>>({});
  const baseRef = useRef<{ aerial: L.TileLayer; street: L.TileLayer; terrain: L.TileLayer } | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("properties").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setProperty(data as Property | null);
      setLoading(false);
    });
  }, [id]);

  // Init map
  useEffect(() => {
    if (!mapEl.current || !property) return;
    const lat = property.latitude ?? 30.6280;
    const lng = property.longitude ?? -96.3344;
    if (mapRef.current) return;

    const map = L.map(mapEl.current, { scrollWheelZoom: true }).setView([lat, lng], 19);
    mapRef.current = map;

    const aerial = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri", maxZoom: 21 }
    );
    const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    });
    const terrain = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenTopoMap", maxZoom: 17 }
    );
    aerial.addTo(map);
    baseRef.current = { aerial, street, terrain };

    // Mock parcel polygon roughly around point (~85' x 142')
    const dLat = 0.00019;
    const dLng = 0.00028;
    const parcel = L.polygon([
      [lat - dLat, lng - dLng], [lat - dLat, lng + dLng],
      [lat + dLat, lng + dLng], [lat + dLat, lng - dLng],
    ], { color: "#facc15", weight: 3, fillOpacity: 0.08 }).bindPopup(
      `<strong>Parcel ${MOCK_BOUNDARY.parcel_number}</strong><br/>${MOCK_BOUNDARY.lot_dimensions} • ${MOCK_BOUNDARY.acreage} ac`
    );
    layersRef.current.parcel = parcel;

    const footprint = L.polygon([
      [lat - dLat * 0.4, lng - dLng * 0.4], [lat - dLat * 0.4, lng + dLng * 0.3],
      [lat + dLat * 0.3, lng + dLng * 0.3], [lat + dLat * 0.3, lng - dLng * 0.4],
    ], { color: "#3b82f6", weight: 2, fillOpacity: 0.35 }).bindPopup("Home footprint");
    layersRef.current.footprint = footprint;

    const lines = L.polyline([
      [lat - dLat, lng - dLng], [lat - dLat, lng + dLng],
      [lat + dLat, lng + dLng], [lat + dLat, lng - dLng], [lat - dLat, lng - dLng],
    ], { color: "#ef4444", weight: 2, dashArray: "6 4" });
    layersRef.current.lines = lines;

    const labels = L.layerGroup([
      L.marker([lat, lng + dLng], { icon: textIcon("85'") }),
      L.marker([lat + dLat, lng], { icon: textIcon("142'") }),
    ]);
    layersRef.current.labels = labels;

    // Easements
    const utility = L.polygon([
      [lat + dLat * 0.85, lng - dLng], [lat + dLat * 0.85, lng + dLng],
      [lat + dLat, lng + dLng], [lat + dLat, lng - dLng],
    ], { color: "#a855f7", weight: 1, fillOpacity: 0.25 }).bindPopup("Utility easement — 10 ft");
    layersRef.current.electric_e = utility;
    layersRef.current.water_e = utility;
    layersRef.current.sewer_e = utility;
    layersRef.current.gas_e = utility;

    L.marker([lat, lng]).addTo(map).bindPopup(`${property.address_line}<br/>${property.city}, ${property.state} ${property.zip}`);

    return () => { map.remove(); mapRef.current = null; layersRef.current = {}; baseRef.current = null; };
  }, [property]);

  // Toggle layers
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    // Base toggle: prefer terrain > street > aerial(default)
    if (baseRef.current) {
      const { aerial, street, terrain } = baseRef.current;
      [aerial, street, terrain].forEach((l) => map.removeLayer(l));
      if (active.terrain) terrain.addTo(map);
      else if (!active.aerial && active.satellite) aerial.addTo(map);
      else if (!active.aerial) street.addTo(map);
      else aerial.addTo(map);
    }
    Object.entries(layersRef.current).forEach(([key, layer]) => {
      if (active[key]) layer.addTo(map); else map.removeLayer(layer);
    });
  }, [active]);

  const confidence = useMemo(() => {
    const checks = [
      { label: "Recorded survey", on: true },
      { label: "Verified permits", on: true },
      { label: "Licensed contractor docs", on: true },
      { label: "Inspector reports", on: false },
      { label: "Government GIS records", on: true },
      { label: "Recorded deeds", on: true },
      { label: "Official plat map", on: true },
      { label: "Utility verification", on: false },
      { label: "Homeowner documentation", on: true },
    ];
    const pct = Math.round((checks.filter(c => c.on).length / checks.length) * 100);
    return { pct, checks };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading property…</div>;
  if (!property) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="container py-20 text-center">Property not found.<div className="mt-4"><Button asChild><Link to="/search">Back to search</Link></Button></div></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to={`/property/${property.id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <MapPin className="h-6 w-6 text-primary" /> Property Boundary & Land Intelligence
            </h1>
            <p className="text-sm text-muted-foreground">{property.address_line}, {property.city}, {property.state} {property.zip}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" />Property report</Button>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}>
              <Share2 className="mr-2 h-4 w-4" />Share
            </Button>
          </div>
        </div>

        {/* Header strip with key parcel facts */}
        <div className="mb-4 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-5">
          {[
            { label: "Parcel #", value: MOCK_BOUNDARY.parcel_number },
            { label: "Lot size", value: `${MOCK_BOUNDARY.lot_size_sqft.toLocaleString()} sqft` },
            { label: "Acreage", value: `${MOCK_BOUNDARY.acreage} ac` },
            { label: "Zoning", value: MOCK_BOUNDARY.zoning.split(" ")[0] },
            { label: "Flood zone", value: MOCK_BOUNDARY.flood_zone.split(" ")[0] },
          ].map(s => (
            <div key={s.label} className="bg-card px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Layer panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4" />Map layers</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[560px] space-y-4 overflow-auto pb-4">
              {LAYER_GROUPS.map(g => (
                <div key={g.group}>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{g.group}</p>
                  <div className="space-y-1.5">
                    {g.layers.map(l => (
                      <label key={l.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={!!active[l.id]}
                          onCheckedChange={(v) => setActive(s => ({ ...s, [l.id]: !!v }))}
                        />
                        <span>{l.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Map */}
          <div className="relative overflow-hidden rounded-2xl border shadow-card" style={{ height: 560 }}>
            <div ref={mapEl} className="h-full w-full" />
            <div className="pointer-events-none absolute left-3 top-3 z-[400] flex gap-2">
              <Badge className="pointer-events-auto bg-background/90 text-foreground"><Ruler className="mr-1 h-3 w-3" />Measure</Badge>
              <Badge className="pointer-events-auto bg-background/90 text-foreground"><Maximize2 className="mr-1 h-3 w-3" />Full screen</Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="boundary" className="mt-6">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="boundary">Boundary & legal</TabsTrigger>
            <TabsTrigger value="easements">Easements</TabsTrigger>
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="plat">Plat map</TabsTrigger>
            <TabsTrigger value="ai">AI intelligence</TabsTrigger>
            <TabsTrigger value="topography">Topography</TabsTrigger>
            <TabsTrigger value="satellite">Satellite history</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="confidence">Confidence score</TabsTrigger>
          </TabsList>

          <TabsContent value="boundary">
            <Card><CardContent className="grid gap-3 p-6 sm:grid-cols-2">
              <Field label="Parcel number" value={MOCK_BOUNDARY.parcel_number} />
              <Field label="Lot dimensions" value={MOCK_BOUNDARY.lot_dimensions} />
              <Field label="Acreage" value={`${MOCK_BOUNDARY.acreage} ac`} />
              <Field label="Lot size" value={`${MOCK_BOUNDARY.lot_size_sqft.toLocaleString()} sqft`} />
              <Field label="Zoning" value={MOCK_BOUNDARY.zoning} />
              <Field label="Future land use" value={MOCK_BOUNDARY.future_land_use} />
              <Field label="Overlay districts" value={MOCK_BOUNDARY.overlay_districts.join(", ")} />
              <Field label="Property class" value={MOCK_BOUNDARY.property_classification} />
              <Field label="FEMA flood zone" value={MOCK_BOUNDARY.flood_zone} />
              <Field label="Land / improvement value" value={`$${MOCK_BOUNDARY.land_value.toLocaleString()} / $${MOCK_BOUNDARY.improvement_value.toLocaleString()}`} />
              <div className="sm:col-span-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Legal description</p>
                <p className="mt-1 rounded-md bg-muted/40 p-3 text-sm">{MOCK_BOUNDARY.legal_description}</p>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="easements">
            <Card><CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="px-4 py-2">Type</th><th className="px-4 py-2">Width</th><th className="px-4 py-2">Location</th><th className="px-4 py-2">Recorded</th><th className="px-4 py-2">Restrictions</th></tr>
                </thead>
                <tbody>
                  {MOCK_EASEMENTS.map((e, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3 font-medium">{e.type}</td>
                      <td className="px-4 py-3">{e.width}</td>
                      <td className="px-4 py-3">{e.side}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.doc}</td>
                      <td className="px-4 py-3">{e.restrictions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="surveys">
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Recorded surveys</CardTitle>
              <Button size="sm"><Upload className="mr-2 h-4 w-4" />Upload survey</Button></CardHeader>
              <CardContent className="space-y-3">
                {MOCK_SURVEYS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{s.type}</p>
                      <p className="text-xs text-muted-foreground">{s.surveyor} • {s.license} • Recorded {s.date}</p>
                    </div>
                    <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />View PDF</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plat">
            <Card><CardContent className="p-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <div className="flex h-40 w-56 items-center justify-center rounded-lg border bg-muted/30 text-xs text-muted-foreground">Plat thumbnail</div>
                <div className="flex-1">
                  <p className="font-medium">Oak Meadows, Phase 2</p>
                  <p className="text-sm text-muted-foreground">Plat Book 88, Page 142 • Recorded June 1, 2008</p>
                  <p className="mt-3 text-sm">Original lot layout, dimensions, easements, drainage, and street dedications recorded with the county.</p>
                  <Button className="mt-4" size="sm"><FileText className="mr-2 h-4 w-4" />View recorded plat</Button>
                </div>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />AI boundary intelligence</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {MOCK_AI_OBSERVATIONS.map((o, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                    {o.severity === "warning" ? <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" /> :
                      o.severity === "ok" ? <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" /> :
                      <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">{o.feature}</p>
                      <p className="text-sm text-muted-foreground">{o.observation}</p>
                    </div>
                  </div>
                ))}
                <p className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                  AI observations compare aerial imagery to public parcel boundaries. Informational only — not a substitute for a licensed land survey.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topography">
            <Card><CardContent className="grid gap-3 p-6 sm:grid-cols-2">
              <Field label="Elevation" value="312 ft" />
              <Field label="Slope" value="3% (gentle)" />
              <Field label="Drainage direction" value="Northeast → Southwest" />
              <Field label="High / low points" value="NE corner / SW corner" />
              <div className="sm:col-span-2 rounded-md bg-muted/40 p-3 text-sm">
                <Mountain className="mr-2 inline h-4 w-4" />
                Useful for roofing, drainage planning, foundation evaluation, landscaping, and retaining walls.
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="satellite">
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Satellite className="h-4 w-4" />Historical aerial timeline</CardTitle></CardHeader>
              <CardContent>
                <ol className="relative border-l pl-6">
                  {MOCK_SATELLITE_HISTORY.map((s, i) => (
                    <li key={i} className="mb-4">
                      <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{s.year}</p>
                      <p className="text-sm text-muted-foreground">{s.note}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card><CardContent className="p-6">
              <ol className="relative border-l pl-6">
                {MOCK_TIMELINE.map((t, i) => (
                  <li key={i} className="mb-4">
                    <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-accent" />
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.date} • {t.source}</p>
                  </li>
                ))}
              </ol>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="confidence">
            <Card>
              <CardHeader><CardTitle className="text-base">Property Confidence Score</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <div className="text-4xl font-bold">{confidence.pct}%</div>
                  <Progress value={confidence.pct} className="flex-1" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {confidence.checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <span className={`inline-block h-2 w-2 rounded-full ${c.on ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      <span className={c.on ? "" : "text-muted-foreground"}>{c.label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Higher confidence means more verified public records and documentation back this property's digital history — useful for buyers, insurers, lenders, and contractors.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function textIcon(text: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:rgba(255,255,255,0.9);border:1px solid #e5e7eb;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:600;color:#111;white-space:nowrap;">${text}</div>`,
    iconSize: [40, 18], iconAnchor: [20, 9],
  });
}
