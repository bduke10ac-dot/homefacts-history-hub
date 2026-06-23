import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Home as HomeIcon, Wind, Zap, Droplets, Square, DoorClosed, Layers,
  Mountain, Refrigerator, Trees, Sun, Waves, ShieldCheck, Wifi, Plug, Wrench,
} from "lucide-react";

type SystemCard = {
  name: string;
  icon: any;
  installDate: string;
  contractor: string;
  manufacturer: string;
  model: string;
  serial: string;
  warrantyExp: string;
  expectedLife: string;
  service: string[];
  notes: string;
  status: "healthy" | "watch" | "due";
};

// Mock systems for the Creekside demo property
const SYSTEMS: SystemCard[] = [
  { name: "Roof", icon: HomeIcon, installDate: "Dec 2025", contractor: "Top Notch Roofing TN", manufacturer: "GAF", model: "Timberline HDZ Charcoal", serial: "GAF-2025-77821", warrantyExp: "Dec 2055", expectedLife: "30 yrs", service: ["May 2026 — Hail-event inspection, no damage"], notes: "Architectural shingles, ridge vent, ice & water shield.", status: "healthy" },
  { name: "HVAC", icon: Wind, installDate: "Jan 2026", contractor: "Comfort Pro HVAC", manufacturer: "Trane", model: "XR16 3-ton + 80% AFUE Furnace", serial: "TR-A4XR16-998212", warrantyExp: "Jan 2036", expectedLife: "15 yrs", service: ["May 2026 — Spring service ($189)"], notes: "Smart thermostat paired. Filter size 20x25x4.", status: "healthy" },
  { name: "Electrical", icon: Zap, installDate: "Nov 2025", contractor: "BrightWire Electric", manufacturer: "Square D", model: "QO 200A Main Panel", serial: "SQD-200-554102", warrantyExp: "Nov 2030", expectedLife: "40 yrs", service: [], notes: "AFCI/GFCI throughout. 220V garage circuit for EV-ready.", status: "healthy" },
  { name: "Plumbing", icon: Droplets, installDate: "Oct 2025", contractor: "Sumner Plumbing Co.", manufacturer: "Uponor PEX-A", model: "AquaPEX 1/2\" & 3/4\"", serial: "UP-PEX-771", warrantyExp: "Oct 2050", expectedLife: "50 yrs", service: [], notes: "Main shutoff in garage near water heater.", status: "healthy" },
  { name: "Windows", icon: Square, installDate: "Nov 2025", contractor: "Creekside Homes", manufacturer: "Andersen", model: "400 Series Double-Hung", serial: "AND-400-2025", warrantyExp: "Nov 2045", expectedLife: "20 yrs", service: [], notes: "Low-E glass, argon-filled. Lifetime glass-breakage on frames.", status: "healthy" },
  { name: "Doors", icon: DoorClosed, installDate: "Nov 2025", contractor: "Creekside Homes", manufacturer: "Therma-Tru", model: "Smooth-Star Fiberglass", serial: "TT-SS-99814", warrantyExp: "Nov 2035", expectedLife: "30 yrs", service: [], notes: "Front entry with sidelites. Smart lock pre-wired.", status: "healthy" },
  { name: "Siding", icon: Layers, installDate: "Dec 2025", contractor: "Creekside Homes", manufacturer: "James Hardie", model: "HardiePlank Lap, Cobblestone", serial: "JH-CS-2025", warrantyExp: "Dec 2055", expectedLife: "30+ yrs", service: [], notes: "ColorPlus finish — 15-yr paint warranty.", status: "healthy" },
  { name: "Foundation", icon: Mountain, installDate: "Sep 2025", contractor: "Volunteer Foundations", manufacturer: "Poured Concrete", model: "8\" stem wall on footings", serial: "—", warrantyExp: "Sep 2035 (10-yr structural)", expectedLife: "100+ yrs", service: ["Annual crawlspace humidity check recommended"], notes: "Vapor barrier installed. French drain at downspouts.", status: "healthy" },
  { name: "Appliances", icon: Refrigerator, installDate: "Mar 2026", contractor: "Creekside Homes", manufacturer: "Whirlpool", model: "Kitchen Suite — Fridge / Range / DW / MW", serial: "WP-SUITE-2026-15", warrantyExp: "Mar 2027 (1-yr mfr)", expectedLife: "12 yrs", service: [], notes: "Register online for extended coverage option.", status: "watch" },
  { name: "Landscaping", icon: Trees, installDate: "Mar 2026", contractor: "GreenScape TN", manufacturer: "—", model: "Sod + 18 shrubs + 4 trees", serial: "—", warrantyExp: "Sep 2026 (6-mo plant warranty)", expectedLife: "—", service: ["Spring 2026 — pre-emergent applied"], notes: "Irrigation zones 1-4. Winterize sprinklers in Nov.", status: "healthy" },
  { name: "Solar", icon: Sun, installDate: "—", contractor: "—", manufacturer: "—", model: "Not installed (roof is solar-ready)", serial: "—", warrantyExp: "—", expectedLife: "—", service: [], notes: "South-facing roof orientation. Pre-run conduit to attic.", status: "watch" },
  { name: "Pool", icon: Waves, installDate: "—", contractor: "—", manufacturer: "—", model: "No pool", serial: "—", warrantyExp: "—", expectedLife: "—", service: [], notes: "Backyard ready for future install.", status: "watch" },
  { name: "Security", icon: ShieldCheck, installDate: "Apr 2026", contractor: "SafeHome Security", manufacturer: "Ring", model: "Alarm Pro + 6 sensors + 2 cameras", serial: "RNG-PRO-2026", warrantyExp: "Apr 2027", expectedLife: "8 yrs", service: [], notes: "Professional monitoring active.", status: "healthy" },
  { name: "Internet", icon: Wifi, installDate: "Apr 2026", contractor: "AT&T Fiber", manufacturer: "Nokia", model: "BGW320 Gateway, 1 Gbps", serial: "ATT-FBR-998", warrantyExp: "Active service", expectedLife: "—", service: [], notes: "Cat6 drops in living room, all bedrooms, and office.", status: "healthy" },
  { name: "Utilities", icon: Plug, installDate: "Apr 2026", contractor: "—", manufacturer: "—", model: "Electric: Cumberland EMC · Gas: Piedmont · Water/Sewer: Hendersonville Utility", serial: "—", warrantyExp: "—", expectedLife: "—", service: [], notes: "Account numbers on file in Document Vault.", status: "healthy" },
];

const statusMeta: Record<SystemCard["status"], { label: string; cls: string }> = {
  healthy: { label: "Healthy", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  watch: { label: "Monitor", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  due: { label: "Service due", cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" },
};

export default function PropertySystems() {
  const { id } = useParams();
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    supabase.from("properties").select("address_line,city,state").eq("id", id).maybeSingle()
      .then(({ data }) => data && setAddress(`${data.address_line} · ${data.city}, ${data.state}`));
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to property
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold"><Wrench className="h-7 w-7 text-primary" />Property Systems</h1>
            <p className="mt-1 text-sm text-muted-foreground">{address || "Every system in this home — install dates, warranties, and service history."}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link to={`/property/${id}/warranties`}>View warranties</Link></Button>
            <Button size="sm" asChild><Link to={`/property/${id}/maintenance`}>Schedule service</Link></Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SYSTEMS.map((s) => (
            <Card key={s.name} className="overflow-hidden transition-shadow hover:shadow-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={statusMeta[s.status].cls}>{statusMeta[s.status].label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Field label="Installed" value={s.installDate} />
                <Field label="Contractor" value={s.contractor} />
                <Field label="Manufacturer" value={s.manufacturer} />
                <Field label="Model" value={s.model} />
                <Field label="Serial #" value={s.serial} />
                <Field label="Warranty exp." value={s.warrantyExp} />
                <Field label="Expected life" value={s.expectedLife} />
                {s.service.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service history</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                      {s.service.map((h) => <li key={h}>{h}</li>)}
                    </ul>
                  </div>
                )}
                {s.notes && <p className="border-t pt-2 text-xs text-muted-foreground">{s.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium">{value}</span>
    </div>
  );
}
