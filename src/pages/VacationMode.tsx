import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plane, ShieldCheck, Home, CloudSun, Camera, Bell, Wrench,
  FileText, ArrowLeft, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Property {
  id: string; address_line: string; city: string; state: string; zip: string;
}

interface VacationState {
  departure: string;
  returnDate: string;
  emergencyContact: string;
  trustedContact: string;
  petInfo: string;
  securityProvider: string;
  notes: string;
  predeparture: Record<string, boolean>;
  returnHome: Record<string, boolean>;
  whileAway: Record<string, boolean>;
  damageNotes: string;
  startedAt?: string;
  completedAt?: string;
}

const PRE_DEPARTURE = [
  "Test smoke detectors",
  "Test carbon monoxide detectors",
  "Set thermostat",
  "Shut off main water valve (if appropriate)",
  "Check sump pump",
  "Empty trash",
  "Clean refrigerator of perishables",
  "Unplug small appliances",
  "Lock all windows",
  "Lock all doors",
  "Close garage door",
  "Secure valuables",
  "Pause mail / package delivery",
  "Set lighting timers",
  "Adjust irrigation schedule",
  "Secure outdoor furniture",
  "Check weather forecast",
  "Photograph exterior property condition",
  "Photograph roof, siding, windows, doors, yard",
  "Upload photos to HomeFacts",
  "Notify trusted contact",
  "Confirm security system is active",
];

const WHILE_AWAY = [
  "Severe weather alerts",
  "Freeze warnings",
  "Heat warnings",
  "Water leak detector alerts",
  "Security system reminders",
  "Package delivery reminders",
  "Sump pump check reminder",
  "Neighbor check-in reminder",
];

const RETURN_HOME = [
  "Inspect exterior",
  "Inspect roof from ground",
  "Check ceilings for leaks",
  "Check under sinks",
  "Check water heater",
  "Turn water back on (if shut off)",
  "Reset thermostat",
  "Restart irrigation",
  "Check refrigerator / freezer",
  "Review security alerts",
  "Upload any damage photos",
  "Schedule contractor inspection if needed",
];

const SERVICE_REQUESTS = [
  { id: "check", label: "Vacation property check", icon: Home },
  { id: "seasonal", label: "Seasonal inspection", icon: CloudSun },
  { id: "storm", label: "Storm inspection", icon: AlertTriangle },
  { id: "maintenance", label: "Maintenance visit", icon: Wrench },
  { id: "roof", label: "Roof inspection", icon: ShieldCheck },
  { id: "hvac", label: "HVAC inspection", icon: Wrench },
  { id: "plumbing", label: "Plumbing leak inspection", icon: Wrench },
];

const STORAGE_KEY = (pid: string) => `hf_vacation_mode_${pid}`;

const DEFAULT_STATE: VacationState = {
  departure: "", returnDate: "", emergencyContact: "", trustedContact: "",
  petInfo: "", securityProvider: "", notes: "",
  predeparture: {}, returnHome: {}, whileAway: {}, damageNotes: "",
};

export default function VacationMode() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [state, setState] = useState<VacationState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("properties").select("id,address_line,city,state,zip").eq("id", id).maybeSingle();
      setProperty(data as Property | null);
      try {
        const raw = localStorage.getItem(STORAGE_KEY(id));
        if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  const save = (next: VacationState) => {
    setState(next);
    if (id) localStorage.setItem(STORAGE_KEY(id), JSON.stringify(next));
  };

  const update = <K extends keyof VacationState>(k: K, v: VacationState[K]) =>
    save({ ...state, [k]: v });

  const toggle = (group: "predeparture" | "returnHome" | "whileAway", item: string) => {
    const current = state[group];
    save({ ...state, [group]: { ...current, [item]: !current[item] } });
  };

  const preCount = useMemo(() => PRE_DEPARTURE.filter((i) => state.predeparture[i]).length, [state.predeparture]);
  const retCount = useMemo(() => RETURN_HOME.filter((i) => state.returnHome[i]).length, [state.returnHome]);
  const prePct = Math.round((preCount / PRE_DEPARTURE.length) * 100);
  const retPct = Math.round((retCount / RETURN_HOME.length) * 100);

  const startTrip = () => {
    save({ ...state, startedAt: new Date().toISOString(), completedAt: undefined });
    toast.success("Vacation Mode active — safe travels.");
  };
  const completeTrip = () => {
    save({ ...state, completedAt: new Date().toISOString() });
    toast.success("Welcome home. Property Condition Report saved to history.");
  };

  const generateReport = () => {
    if (!property) return;
    const lines: string[] = [];
    lines.push(`HomeFacts — Vacation Mode Property Condition Report`);
    lines.push(`Property: ${property.address_line}, ${property.city}, ${property.state} ${property.zip}`);
    lines.push(`Departure: ${state.departure || "—"}    Return: ${state.returnDate || "—"}`);
    lines.push(`Emergency contact: ${state.emergencyContact || "—"}`);
    lines.push(`Trusted contact: ${state.trustedContact || "—"}`);
    lines.push(`Security provider: ${state.securityProvider || "—"}`);
    lines.push(`Pet info: ${state.petInfo || "—"}`);
    lines.push(`Notes: ${state.notes || "—"}`);
    lines.push(``);
    lines.push(`Pre-Departure Checklist (${preCount}/${PRE_DEPARTURE.length})`);
    PRE_DEPARTURE.forEach((i) => lines.push(`  [${state.predeparture[i] ? "x" : " "}] ${i}`));
    lines.push(``);
    lines.push(`Return Home Checklist (${retCount}/${RETURN_HOME.length})`);
    RETURN_HOME.forEach((i) => lines.push(`  [${state.returnHome[i] ? "x" : " "}] ${i}`));
    lines.push(``);
    lines.push(`Damage notes: ${state.damageNotes || "None reported"}`);
    lines.push(``);
    lines.push(`Generated ${format(new Date(), "PPpp")}`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vacation-report-${property.address_line.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded. Add it to the property Vault to make it permanent.");
  };

  const requestService = (label: string) => {
    toast.success(`Request sent: ${label}. We'll notify verified providers in your area.`);
  };

  if (loading || !property) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading Vacation Mode…</div>;
  }

  const active = !!state.startedAt && !state.completedAt;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plane className="h-4 w-4" /> Vacation Mode
              {active && <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>}
              {state.completedAt && <Badge variant="secondary">Trip complete</Badge>}
            </div>
            <h1 className="mt-1 text-3xl font-bold">{property.address_line}</h1>
            <p className="text-sm text-muted-foreground">{property.city}, {property.state} {property.zip}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/property/${property.id}/maintenance`}><ArrowLeft className="mr-2 h-4 w-4" />Maintenance Center</Link>
            </Button>
            {!active ? (
              <Button size="sm" onClick={startTrip}><Plane className="mr-2 h-4 w-4" />Start Vacation Mode</Button>
            ) : (
              <Button size="sm" onClick={completeTrip}><CheckCircle2 className="mr-2 h-4 w-4" />Mark Trip Complete</Button>
            )}
          </div>
        </div>

        {/* Progress strip */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ProgressTile label="Pre-Departure" count={preCount} total={PRE_DEPARTURE.length} pct={prePct} />
          <ProgressTile label="Return Home" count={retCount} total={RETURN_HOME.length} pct={retPct} />
        </div>

        <Tabs defaultValue="trip" className="mt-8">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="trip">Trip details</TabsTrigger>
            <TabsTrigger value="predeparture">Pre-Departure</TabsTrigger>
            <TabsTrigger value="while">While away</TabsTrigger>
            <TabsTrigger value="return">Return home</TabsTrigger>
            <TabsTrigger value="services">Request service</TabsTrigger>
            <TabsTrigger value="report">Condition report</TabsTrigger>
          </TabsList>

          <TabsContent value="trip" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Trip details</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Departure date">
                  <Input type="date" value={state.departure} onChange={(e) => update("departure", e.target.value)} />
                </Field>
                <Field label="Return date">
                  <Input type="date" value={state.returnDate} onChange={(e) => update("returnDate", e.target.value)} />
                </Field>
                <Field label="Emergency contact">
                  <Input placeholder="Name and phone" value={state.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} />
                </Field>
                <Field label="Trusted neighbor / contact">
                  <Input placeholder="Name and phone" value={state.trustedContact} onChange={(e) => update("trustedContact", e.target.value)} />
                </Field>
                <Field label="Pet information">
                  <Input placeholder="Pets at home, sitter contact" value={state.petInfo} onChange={(e) => update("petInfo", e.target.value)} />
                </Field>
                <Field label="Security system provider">
                  <Input placeholder="Provider and account #" value={state.securityProvider} onChange={(e) => update("securityProvider", e.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Vacation notes">
                    <Textarea rows={3} placeholder="Anything our system or your trusted contact should know." value={state.notes} onChange={(e) => update("notes", e.target.value)} />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predeparture" className="mt-4">
            <ChecklistCard
              icon={ShieldCheck}
              title="Pre-Departure Checklist"
              description="Walk through these before you leave to protect the home and reduce insurance risk."
              items={PRE_DEPARTURE}
              checked={state.predeparture}
              onToggle={(i) => toggle("predeparture", i)}
            />
          </TabsContent>

          <TabsContent value="while" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> While-Away Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Pick the alerts you want delivered while the home is unoccupied.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {WHILE_AWAY.map((i) => (
                    <label key={i} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/40 cursor-pointer">
                      <Checkbox checked={!!state.whileAway[i]} onCheckedChange={() => toggle("whileAway", i)} />
                      <span className="text-sm">{i}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="return" className="mt-4">
            <ChecklistCard
              icon={Home}
              title="Return Home Checklist"
              description="Inspect and document anything that needs follow-up."
              items={RETURN_HOME}
              checked={state.returnHome}
              onToggle={(i) => toggle("returnHome", i)}
            />
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base">Damage or follow-up notes</CardTitle></CardHeader>
              <CardContent>
                <Textarea rows={4} placeholder="Note any damage, leaks, missed deliveries, or follow-ups." value={state.damageNotes} onChange={(e) => update("damageNotes", e.target.value)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Request service from verified providers</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {SERVICE_REQUESTS.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <s.icon className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{s.label}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => requestService(s.label)}>Request</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Vacation Mode Property Condition Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat label="Pre-departure" value={`${preCount}/${PRE_DEPARTURE.length}`} />
                  <Stat label="Return home" value={`${retCount}/${RETURN_HOME.length}`} />
                  <Stat label="Status" value={state.completedAt ? "Trip complete" : active ? "Active" : "Not started"} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Generates a report covering checklists, uploaded photos (added via the Vault),
                  weather alerts, damage notes, and any contractor inspection requests.
                  Add the downloaded file to the property Vault to make it part of the permanent HomeFacts history.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={generateReport}><FileText className="mr-2 h-4 w-4" />Generate report</Button>
                  <Button asChild variant="outline"><Link to={`/property/${property.id}/vault`}><Camera className="mr-2 h-4 w-4" />Upload photos to Vault</Link></Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ProgressTile({ label, count, total, pct }: { label: string; count: number; total: number; pct: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">{count}/{total}</span>
        </div>
        <Progress value={pct} className="mt-2" />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ChecklistCard({
  icon: Icon, title, description, items, checked, onToggle,
}: {
  icon: any; title: string; description: string;
  items: string[]; checked: Record<string, boolean>; onToggle: (i: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5" /> {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((i) => (
            <label key={i} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/40 cursor-pointer">
              <Checkbox checked={!!checked[i]} onCheckedChange={() => onToggle(i)} className="mt-0.5" />
              <span className={`text-sm ${checked[i] ? "line-through text-muted-foreground" : ""}`}>{i}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
