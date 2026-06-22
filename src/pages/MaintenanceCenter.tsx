import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { HealthScoreCard } from "@/components/health/HealthScoreCard";
import { computeHealthScore } from "@/lib/healthScore";
import {
  buildMaintenancePlan,
  predictiveRecommendations,
  WEATHER_BEFORE_STORM, WEATHER_AFTER_STORM,
  REALTOR_FOLLOWUPS, BUILDER_FOLLOWUPS, CONTRACTOR_FOLLOWUPS,
  type MaintenanceTask,
  type Season,
  type TaskGroup,
} from "@/lib/maintenancePlan";
import {
  AlertTriangle, Bell, CalendarDays, CheckCircle2, FileWarning, Mail,
  MessageSquare, Shield, Smartphone, Sparkles, Sun, Snowflake, Leaf, Cloud, Wrench,
  CloudRain, Droplets, DollarSign, Phone, Users
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Property {
  id: string; address_line: string; city: string; state: string; zip: string;
  year_built: number | null; latitude: number | null; longitude: number | null;
}
interface RecordRow {
  id: string; category: string; title: string; description: string | null;
  performed_at: string | null; verified: boolean; cost: number | null;
}

const SEASON_META: Record<Season, { icon: any; label: string; color: string }> = {
  spring: { icon: Leaf, label: "Spring", color: "text-emerald-600" },
  summer: { icon: Sun, label: "Summer", color: "text-amber-600" },
  fall: { icon: Cloud, label: "Fall", color: "text-orange-600" },
  winter: { icon: Snowflake, label: "Winter", color: "text-sky-600" },
};

const NOTIF_KEY = (pid: string) => `hf_notif_prefs_${pid}`;
const DONE_KEY = (pid: string) => `hf_done_tasks_${pid}`;

interface NotifPrefs {
  push: boolean; email: boolean; sms: boolean;
  digest: "immediate" | "daily" | "weekly" | "monthly";
  categories: Record<string, boolean>;
}
const DEFAULT_PREFS: NotifPrefs = {
  push: true, email: true, sms: false, digest: "weekly",
  categories: {
    maintenance: true, warranty: true, insurance: true, storm: true,
    safety: true, ai: true, recall: true, tax: false,
  },
};

export default function MaintenanceCenter() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [done, setDone] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("properties").select("*").eq("id", id).maybeSingle(),
        supabase.from("property_records").select("*").eq("property_id", id),
      ]);
      setProperty(p as Property | null);
      setRecords((r ?? []) as RecordRow[]);
      try {
        const raw = localStorage.getItem(NOTIF_KEY(id));
        if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
        const d = localStorage.getItem(DONE_KEY(id));
        if (d) setDone(JSON.parse(d));
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  const plan = useMemo(
    () => (property ? buildMaintenancePlan(property, records) : null),
    [property, records]
  );
  const aiRecs = useMemo(
    () => (property ? predictiveRecommendations(property, records) : []),
    [property, records]
  );

  const savePrefs = (next: NotifPrefs) => {
    setPrefs(next);
    if (id) localStorage.setItem(NOTIF_KEY(id), JSON.stringify(next));
  };

  const markComplete = (taskId: string) => {
    const next = { ...done, [taskId]: new Date().toISOString() };
    setDone(next);
    if (id) localStorage.setItem(DONE_KEY(id), JSON.stringify(next));
    toast.success("Marked complete — add a record from the property page to make it permanent.");
  };

  if (loading || !property || !plan) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading Maintenance Center…</div>;
  }

  const health = computeHealthScore(property, records);
  const tasks = plan.tasks.filter((t) => !done[t.id]);
  const overdue = tasks.filter((t) => t.status === "overdue");
  const due = tasks.filter((t) => t.status === "due");
  const upcoming = tasks.filter((t) => t.status === "upcoming");
  const completedRecent = records
    .filter((r) => r.performed_at)
    .sort((a, b) => new Date(b.performed_at!).getTime() - new Date(a.performed_at!).getTime())
    .slice(0, 5);

  // Warranty status — derived from records (heuristic)
  const warranties = records.filter((r) => /warrant/i.test(`${r.title} ${r.description ?? ""}`));
  const insuranceLast = records.find((r) => /insurance|policy/i.test(`${r.title} ${r.description ?? ""}`));
  const insuranceDays = insuranceLast?.performed_at
    ? Math.round((Date.now() - new Date(insuranceLast.performed_at).getTime()) / 86400000)
    : null;

  const warrantyScore = Math.min(100, warranties.length * 20);
  const insuranceScore = insuranceDays == null ? 30 : insuranceDays < 365 ? 100 : insuranceDays < 730 ? 60 : 25;
  const stormScore = Math.min(100, tasks.filter((t) => /storm|hurricane|hail|flood|wildfire/i.test(`${t.title} ${t.rationale}`) && t.status === "upcoming").length * 30 + 20);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Maintenance Center</p>
            <h1 className="mt-1 text-3xl font-bold">{property.address_line}</h1>
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.state} {property.zip}
              {plan.regions.length > 0 && (
                <> • Region: {plan.regions.map(formatRegion).join(", ")}</>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to={`/property/${property.id}`}>Back to property</Link></Button>
            <Button asChild size="sm"><Link to={`/property/${property.id}/vault`}><Wrench className="mr-2 h-4 w-4" />Add record</Link></Button>
          </div>
        </div>

        {/* Top row */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr,1fr]">
          <HealthScoreCard result={health} />
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={AlertTriangle} label="Overdue" value={overdue.length} tone="destructive" />
            <StatTile icon={Bell} label="Due soon" value={due.length} tone="warning" />
            <StatTile icon={CalendarDays} label="Upcoming" value={upcoming.length} tone="primary" />
            <StatTile icon={CheckCircle2} label="Completed" value={Object.keys(done).length + completedRecent.length} tone="accent" />
          </div>
        </div>

        {/* Readiness scores */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ReadinessBar label="Warranty protection" value={warrantyScore} />
          <ReadinessBar label="Insurance readiness" value={insuranceScore} />
          <ReadinessBar label="Storm preparedness" value={stormScore} />
        </div>

        <Tabs defaultValue="upcoming" className="mt-8">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="utility">Utility</TabsTrigger>
            <TabsTrigger value="warranties">Warranties</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>
            <TabsTrigger value="ai">AI assistant</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            <TaskList tasks={[...due, ...upcoming]} onComplete={markComplete} />
          </TabsContent>

          <TabsContent value="overdue" className="mt-4">
            {overdue.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Nothing overdue" body="You're on top of every scheduled task. Nice." />
            ) : (
              <TaskList tasks={overdue} onComplete={markComplete} />
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <SeasonalCalendar tasks={plan.tasks} />
          </TabsContent>

          <TabsContent value="safety" className="mt-4">
            <GroupView tasks={plan.tasks} group="safety" onComplete={markComplete} icon={Shield} title="Safety Reminder Center" />
          </TabsContent>

          <TabsContent value="weather" className="mt-4">
            <WeatherSection tasks={plan.tasks.filter((t) => t.group === "weather")} onComplete={markComplete} />
          </TabsContent>

          <TabsContent value="utility" className="mt-4">
            <GroupView tasks={plan.tasks} group="utility" onComplete={markComplete} icon={Droplets} title="Utility Reminder Center" />
          </TabsContent>

          <TabsContent value="warranties" className="mt-4">
            <WarrantySection records={warranties} />
          </TabsContent>

          <TabsContent value="insurance" className="mt-4">
            <InsuranceSection lastReviewDays={insuranceDays} score={insuranceScore} regions={plan.regions} />
          </TabsContent>

          <TabsContent value="financial" className="mt-4">
            <GroupView tasks={plan.tasks} group="financial" onComplete={markComplete} icon={DollarSign} title="Financial Reminder Center" />
          </TabsContent>

          <TabsContent value="followups" className="mt-4">
            <FollowupsSection />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <AISection recs={aiRecs} season={plan.season} />
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <NotificationPrefs prefs={prefs} onChange={savePrefs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function formatRegion(r: string) {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: "destructive" | "warning" | "primary" | "accent" }) {
  const toneClass = {
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
  }[tone];
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ReadinessBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value}/100</span>
      </div>
      <Progress value={value} className="mt-2 h-2" />
    </div>
  );
}

function TaskList({ tasks, onComplete }: { tasks: MaintenanceTask[]; onComplete: (id: string) => void }) {
  if (tasks.length === 0) {
    return <EmptyState icon={CheckCircle2} title="All caught up" body="No tasks in this view." />;
  }
  return (
    <div className="grid gap-3">
      {tasks.map((t) => {
        const status = t.status;
        const tone =
          status === "overdue" ? "border-destructive/40 bg-destructive/5"
          : status === "due" ? "border-warning/40 bg-warning/5"
          : "bg-card";
        return (
          <div key={t.id} className={`rounded-2xl border p-4 shadow-card ${tone}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{t.title}</h3>
                  <Badge variant="outline" className="capitalize">{t.category}</Badge>
                  <Badge variant={t.priority === "high" ? "destructive" : t.priority === "medium" ? "default" : "secondary"} className="capitalize">{t.priority}</Badge>
                  {t.region !== "all" && <Badge variant="outline" className="capitalize">{formatRegion(t.region)}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.rationale}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.lastDoneAt ? `Last done ${format(new Date(t.lastDoneAt), "MMM d, yyyy")} • ` : "No record on file • "}
                  Due {format(new Date(t.nextDueAt), "MMM d, yyyy")}
                  {status === "overdue" && ` (${Math.abs(t.daysUntilDue)}d overdue)`}
                  {status === "due" && ` (in ${t.daysUntilDue}d)`}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onComplete(t.id)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />Mark complete
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SeasonalCalendar({ tasks }: { tasks: MaintenanceTask[] }) {
  const groups: Record<Season, MaintenanceTask[]> = { spring: [], summer: [], fall: [], winter: [] };
  for (const t of tasks) {
    if (t.season === "any") continue;
    groups[t.season].push(t);
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(Object.keys(groups) as Season[]).map((s) => {
        const meta = SEASON_META[s];
        const Icon = meta.icon;
        return (
          <div key={s} className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${meta.color}`} />
              <h3 className="font-semibold">{meta.label}</h3>
              <Badge variant="outline" className="ml-auto">{groups[s].length} tasks</Badge>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {groups[s].length === 0 && <li className="text-muted-foreground">No regional tasks this season.</li>}
              {groups[s].map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2">
                  <span>{t.title}</span>
                  <span className="text-xs text-muted-foreground">{t.cadenceMonths}mo</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function WarrantySection({ records }: { records: RecordRow[] }) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No warranties on file"
        body="Upload product warranties to your vault — we'll remind you 90, 30, and 7 days before expiration."
      />
    );
  }
  return (
    <div className="grid gap-3">
      {records.map((r) => (
        <div key={r.id} className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{r.title}</h3>
              <p className="text-sm text-muted-foreground">{r.description ?? "Warranty on file"}</p>
            </div>
            <Badge variant="outline">{r.performed_at ? format(new Date(r.performed_at), "MMM yyyy") : "—"}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsuranceSection({ lastReviewDays, score, regions }: { lastReviewDays: number | null; score: number; regions: string[] }) {
  const topics = [
    "Is replacement cost accurate?",
    "Have recent renovations been reported?",
    "Are roof updates documented?",
    "Have new discounts become available?",
    "Are deductibles still appropriate?",
  ];
  if (regions.includes("coastal")) topics.push("Do you carry separate flood insurance?");
  if (regions.includes("western_fire")) topics.push("Is wildfire coverage included and adequate?");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Insurance review</h3>
          <Badge variant={score >= 80 ? "default" : "destructive"} className="ml-auto">{score}/100</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {lastReviewDays == null ? "No insurance review on file." :
           lastReviewDays < 365 ? `Reviewed ${lastReviewDays} days ago — you're current.` :
           `It has been ${Math.round(lastReviewDays / 30)} months since your last policy review.`}
        </p>
        <Progress value={score} className="mt-3 h-2" />
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="font-semibold">Suggested discussion topics</h3>
        <ul className="mt-3 space-y-1.5 text-sm">
          {topics.map((t) => (
            <li key={t} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" />{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AISection({ recs, season }: { recs: string[]; season: Season }) {
  const meta = SEASON_META[season];
  const Icon = meta.icon;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-card">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm">
          AI is analyzing your property history, climate, and home age.
          <span className={`ml-2 inline-flex items-center gap-1 ${meta.color}`}><Icon className="h-3 w-3" />{meta.label} focus</span>
        </p>
      </div>
      {recs.length === 0 ? (
        <EmptyState icon={Sparkles} title="No AI recommendations yet" body="Add more records to unlock predictive insights." />
      ) : (
        <div className="grid gap-3">
          {recs.map((r, i) => (
            <div key={i} className="flex gap-3 rounded-2xl border bg-card p-4 shadow-card">
              <FileWarning className="h-4 w-4 flex-none text-warning" />
              <p className="text-sm">{r}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationPrefs({ prefs, onChange }: { prefs: any; onChange: (p: any) => void }) {
  const setCat = (key: string, v: boolean) =>
    onChange({ ...prefs, categories: { ...prefs.categories, [key]: v } });

  const channels = [
    { key: "push", label: "Push notifications", icon: Smartphone },
    { key: "email", label: "Email", icon: Mail },
    { key: "sms", label: "SMS", icon: MessageSquare },
  ];
  const digests = ["immediate", "daily", "weekly", "monthly"] as const;
  const categories = [
    { key: "maintenance", label: "Maintenance reminders" },
    { key: "warranty", label: "Warranty expirations" },
    { key: "insurance", label: "Insurance reviews" },
    { key: "storm", label: "Storm prep & recovery" },
    { key: "safety", label: "Safety (smoke, CO, fire ext.)" },
    { key: "ai", label: "AI recommendations" },
    { key: "recall", label: "Product recalls" },
    { key: "tax", label: "Property tax / HOA deadlines" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="font-semibold">Delivery channels</h3>
        <div className="mt-3 space-y-3">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.key} className="flex items-center justify-between">
                <Label htmlFor={c.key} className="flex items-center gap-2 text-sm font-normal">
                  <Icon className="h-4 w-4 text-muted-foreground" />{c.label}
                </Label>
                <Switch id={c.key} checked={prefs[c.key]} onCheckedChange={(v) => onChange({ ...prefs, [c.key]: v })} />
              </div>
            );
          })}
        </div>
        <div className="mt-5">
          <p className="text-sm font-medium">Digest frequency</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {digests.map((d) => (
              <Button
                key={d}
                type="button"
                size="sm"
                variant={prefs.digest === d ? "default" : "outline"}
                onClick={() => onChange({ ...prefs, digest: d })}
                className="capitalize"
              >
                {d}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="font-semibold">Categories</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <div key={c.key} className="flex items-center justify-between">
              <Label htmlFor={`cat-${c.key}`} className="text-sm font-normal">{c.label}</Label>
              <Switch id={`cat-${c.key}`} checked={!!prefs.categories[c.key]} onCheckedChange={(v) => setCat(c.key, v)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed p-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function GroupView({ tasks, group, onComplete, icon: Icon, title }: { tasks: MaintenanceTask[]; group: TaskGroup; onComplete: (id: string) => void; icon: any; title: string }) {
  const filtered = tasks.filter((t) => t.group === group);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-card">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">{title}</h2>
        <Badge variant="outline" className="ml-auto">{filtered.length} reminders</Badge>
      </div>
      {filtered.length === 0
        ? <EmptyState icon={Icon} title="Nothing here yet" body="No reminders in this category for your region." />
        : <TaskList tasks={filtered} onComplete={onComplete} />}
    </div>
  );
}

function WeatherSection({ tasks, onComplete }: { tasks: MaintenanceTask[]; onComplete: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2"><CloudRain className="h-4 w-4 text-primary" /><h3 className="font-semibold">Before a storm</h3></div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {WEATHER_BEFORE_STORM.map((s) => (
              <li key={s} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" />{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-accent" /><h3 className="font-semibold">After a storm</h3></div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {WEATHER_AFTER_STORM.map((s) => (
              <li key={s} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent" />{s}</li>
            ))}
          </ul>
        </div>
      </div>
      {tasks.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Regional weather tasks</h3>
          <TaskList tasks={tasks} onComplete={onComplete} />
        </div>
      )}
    </div>
  );
}

function FollowupsSection() {
  const channelIcon = (ch: string) =>
    ch === "email" ? Mail : ch === "sms" ? MessageSquare : ch === "call" ? Phone : Smartphone;

  return (
    <div className="space-y-6">
      <FollowupBlock title="Realtor follow-ups" icon={Users} items={REALTOR_FOLLOWUPS} channelIcon={channelIcon} />
      <FollowupBlock title="Builder follow-ups" icon={Wrench} items={BUILDER_FOLLOWUPS} channelIcon={channelIcon} />
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /><h3 className="font-semibold">Contractor follow-ups</h3></div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {Object.entries(CONTRACTOR_FOLLOWUPS).map(([trade, items]) => (
            <div key={trade} className="rounded-xl border bg-muted/30 p-3">
              <p className="text-sm font-medium capitalize">{trade.replace("_", " ")} installed</p>
              <ul className="mt-2 space-y-1 text-sm">
                {items.map((f) => {
                  const Icon = channelIcon(f.channel);
                  return (
                    <li key={f.id} className="flex items-center justify-between gap-2">
                      <span>{f.label}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="h-3 w-3" />{Math.round(f.days / 30)}mo</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FollowupBlock({ title, icon: Icon, items, channelIcon }: { title: string; icon: any; items: { id: string; label: string; days: number; channel: string }[]; channelIcon: (c: string) => any }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h3 className="font-semibold">{title}</h3></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((f) => {
          const Ch = channelIcon(f.channel);
          return (
            <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <span>{f.label}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize"><Ch className="h-3 w-3" />{f.channel} • {f.days < 60 ? `${f.days}d` : `${Math.round(f.days / 30)}mo`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

