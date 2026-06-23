import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  LayoutDashboard, Home, BadgeCheck, UserPlus, FileText, Megaphone, Trophy, BarChart3,
  Users, GraduationCap, Handshake, Bot, Settings, QrCode, Share2, Copy, Search,
  Sparkles, TrendingUp, Star, Award, ShieldCheck, Bell, Mail, Calendar, Download,
  ChevronRight, Send, Wrench, CloudLightning, Building2, Camera, FileCheck, Phone,
  Globe, Linkedin, MessageSquare, Zap, Target, Gift, BookOpen, PlayCircle,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types & nav                                                                */
/* -------------------------------------------------------------------------- */

type ViewKey =
  | "dashboard" | "listings" | "certified" | "onboarding" | "buyer-reports"
  | "marketing" | "rewards" | "analytics" | "crm" | "education" | "partners"
  | "ai" | "profile";

const NAV: { key: ViewKey; label: string; icon: any; group: "Grow" | "Workflows" | "Brand" | "You" }[] = [
  { key: "dashboard",    label: "Dashboard",                icon: LayoutDashboard, group: "Grow" },
  { key: "listings",     label: "My Listings",              icon: Home,            group: "Workflows" },
  { key: "certified",    label: "Certified Listings",       icon: BadgeCheck,      group: "Workflows" },
  { key: "onboarding",   label: "Seller Onboarding",        icon: UserPlus,        group: "Workflows" },
  { key: "buyer-reports",label: "Buyer Reports",            icon: FileText,        group: "Workflows" },
  { key: "marketing",    label: "Marketing Center",         icon: Megaphone,       group: "Brand" },
  { key: "rewards",      label: "Rewards & Incentives",     icon: Trophy,          group: "Grow" },
  { key: "analytics",    label: "Business Analytics",       icon: BarChart3,       group: "Grow" },
  { key: "crm",          label: "Client Relationships",     icon: Users,           group: "Workflows" },
  { key: "education",    label: "Education & Certification",icon: GraduationCap,   group: "You" },
  { key: "partners",     label: "Preferred Partners",       icon: Handshake,       group: "Brand" },
  { key: "ai",           label: "AI Assistant",             icon: Bot,             group: "Workflows" },
  { key: "profile",      label: "Profile & Settings",       icon: Settings,        group: "You" },
];

const CERT_CHECKLIST = [
  "Ownership Verified", "Property History Complete", "Roof Documentation",
  "HVAC Documentation", "Plumbing Documentation", "Electrical Documentation",
  "Appliance Documentation", "Warranty Documents", "Maintenance Records",
  "Permit Records", "Licensed Contractors Verified", "Inspection Reports",
  "Insurance Claims", "Storm History", "Utility Information",
  "Property Survey", "Closing Documents",
];

const ONBOARDING_STEPS = [
  { step: 1,  label: "Verify homeowner",            hint: "Confirm ownership via deed or tax record." },
  { step: 2,  label: "Upload documents",            hint: "Closing docs, deed, surveys." },
  { step: 3,  label: "Upload warranties",           hint: "Roof, HVAC, appliances, builder." },
  { step: 4,  label: "Upload permits",              hint: "Recent renovations and additions." },
  { step: 5,  label: "Upload inspection reports",   hint: "Pre-listing or prior buyer inspections." },
  { step: 6,  label: "Upload maintenance records",  hint: "Service receipts and tune-ups." },
  { step: 7,  label: "Upload invoices",             hint: "Improvement & repair invoices." },
  { step: 8,  label: "Upload manuals",              hint: "Appliance, HVAC, smart-home manuals." },
  { step: 9,  label: "Upload property photos",      hint: "Interior, exterior, drone." },
  { step: 10, label: "Complete Orivaz Profile",  hint: "Final review & publish." },
];

const PARTNER_LEVELS = [
  { name: "Bronze",   min: 0,    color: "bg-amber-700" },
  { name: "Silver",   min: 2500, color: "bg-slate-400" },
  { name: "Gold",     min: 7500, color: "bg-amber-400" },
  { name: "Platinum", min: 20000,color: "bg-cyan-400" },
  { name: "Elite",    min: 50000,color: "bg-gradient-to-r from-primary to-primary-glow" },
];

const ACHIEVEMENTS = [
  { id: "first_listing", label: "First Listing", target: 1 },
  { id: "first_cert",    label: "First Certified Home", target: 1 },
  { id: "ten",           label: "10 Homes", target: 10 },
  { id: "fifty",         label: "50 Homes", target: 50 },
  { id: "hundred",       label: "100 Homes", target: 100 },
  { id: "twofifty",      label: "250 Homes", target: 250 },
  { id: "fivehundred",   label: "500 Homes", target: 500 },
  { id: "thousand",      label: "1000 Homes", target: 1000 },
];

const PARTNER_CATEGORIES = [
  "Roofing", "HVAC", "Electrical", "Plumbing", "General Contractor", "Painter",
  "Flooring", "Landscaping", "Pest Control", "Cleaning", "Moving", "Insurance",
  "Mortgage", "Home Inspector", "Title Company", "Solar", "Smart Home",
];

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function RealtorSuccessCenter() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [shares, setShares] = useState<any[]>([]);
  const [loadingShares, setLoadingShares] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return setLoadingShares(false);
      const { data } = await supabase
        .from("share_links")
        .select("id,token,created_at,property_id,properties(address_line,city,state,zip)")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      setShares(data ?? []);
      setLoadingShares(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SidebarProvider>
        <div className="flex w-full">
          <RealtorSidebar view={view} setView={setView} />
          <main className="flex-1 min-w-0">
            <div className="sticky top-16 z-30 flex h-12 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">Realtor Success Center</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {NAV.find((n) => n.key === view)?.label}
              </span>
            </div>
            <div className="container max-w-7xl py-8">
              {view === "dashboard"     && <DashboardView shares={shares} loading={loadingShares} />}
              {view === "listings"      && <ListingsView shares={shares} />}
              {view === "certified"     && <CertifiedView shares={shares} />}
              {view === "onboarding"    && <OnboardingView />}
              {view === "buyer-reports" && <BuyerReportsView shares={shares} />}
              {view === "marketing"     && <MarketingView />}
              {view === "rewards"       && <RewardsView count={shares.length} />}
              {view === "analytics"     && <AnalyticsView shares={shares} />}
              {view === "crm"           && <CrmView />}
              {view === "education"     && <EducationView />}
              {view === "partners"      && <PartnersView />}
              {view === "ai"            && <AiAssistantView />}
              {view === "profile"       && <ProfileView />}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sidebar                                                                    */
/* -------------------------------------------------------------------------- */

function RealtorSidebar({ view, setView }: { view: ViewKey; setView: (v: ViewKey) => void }) {
  const groups = ["Grow", "Workflows", "Brand", "You"] as const;
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g}>
            <SidebarGroupLabel>{g}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.filter((n) => n.group === g).map((n) => (
                  <SidebarMenuItem key={n.key}>
                    <SidebarMenuButton
                      isActive={view === n.key}
                      onClick={() => setView(n.key)}
                      tooltip={n.label}
                    >
                      <n.icon className="h-4 w-4" />
                      <span>{n.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared atoms                                                               */
/* -------------------------------------------------------------------------- */

function Kpi({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: any; accent?: "primary" | "accent" | "warning";
}) {
  const tone = accent === "accent" ? "text-accent" : accent === "warning" ? "text-warning" : "text-primary";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${tone}`} />
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint, cta }: { icon: any; title: string; hint?: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function DashboardView({ shares, loading }: { shares: any[]; loading: boolean }) {
  const points = shares.length * 250 + 1200;
  const level = currentLevel(points);
  const next = nextLevel(points);
  const progress = next ? Math.min(100, ((points - level.min) / (next.min - level.min)) * 100) : 100;

  const kpis = [
    { label: "Active Listings",            value: shares.length,           icon: Home,         accent: "primary" as const, sub: "Shared via Orivaz" },
    { label: "Pending Listings",           value: 3,                       icon: Calendar,     accent: "warning" as const },
    { label: "Closed Listings",            value: 12,                      icon: BadgeCheck,   accent: "accent"  as const },
    { label: "Certified Listings",         value: Math.max(1, Math.floor(shares.length * 0.6)), icon: ShieldCheck, accent: "accent" as const },
    { label: "Homeowners Invited",         value: 28,                      icon: UserPlus,     accent: "primary" as const },
    { label: "Orivaz Accounts Created", value: 19,                      icon: Users,        accent: "primary" as const },
    { label: "Buyer Report Views",         value: 412,                     icon: FileText,     accent: "primary" as const },
    { label: "QR Code Scans",              value: 1284,                    icon: QrCode,       accent: "accent"  as const },
    { label: "Reports Generated",          value: shares.length + 7,       icon: FileCheck,    accent: "primary" as const },
    { label: "Reward Points",              value: points.toLocaleString(), icon: Trophy,       accent: "warning" as const, sub: `${level.name} partner` },
    { label: "Repeat Clients",             value: 9,                       icon: Star,         accent: "accent"  as const },
    { label: "Referral Count",             value: 14,                      icon: Share2,       accent: "primary" as const },
  ];

  return (
    <>
      <SectionHeader
        title="Welcome back"
        description="Your Orivaz business at a glance — listings, engagement, and rewards."
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/search"><Search className="mr-2 h-4 w-4" />Find property</Link></Button>
            <Button><UserPlus className="mr-2 h-4 w-4" />Invite seller</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {kpis.map((k) => <Kpi key={k.label} {...k} />)}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" />Partner level — {level.name}</CardTitle>
            <CardDescription>
              {next ? `${(next.min - points).toLocaleString()} pts to ${next.name}` : "You've reached the top tier."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progress} />
            <div className="grid grid-cols-5 gap-2 pt-1 text-center text-[11px] text-muted-foreground">
              {PARTNER_LEVELS.map((l) => (
                <div key={l.name}>
                  <div className={`mx-auto mb-1 h-2 w-2 rounded-full ${l.name === level.name ? "bg-primary" : "bg-muted"}`} />
                  {l.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Leaderboard</CardTitle>
            <CardDescription>You rank in your office this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">#3</div>
            <p className="mt-1 text-sm text-muted-foreground">Top 5% in your city · Top 12% statewide</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">View full leaderboard</Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" />Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet — share your first listing to get started.</p>
            ) : (
              <ul className="divide-y">
                {shares.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.properties?.address_line}</p>
                      <p className="text-xs text-muted-foreground">Shared {format(new Date(s.created_at), "MMM d")}</p>
                    </div>
                    <Badge variant="outline" className="gap-1"><Camera className="h-3 w-3" />{Math.floor(Math.random() * 80) + 20} views</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" />Upcoming follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                { who: "Anderson Family", when: "Tomorrow", task: "Roof inspection reminder" },
                { who: "Lopez Buyers",    when: "Fri",      task: "Send buyer report" },
                { who: "Patel Sellers",   when: "Next Mon", task: "Pre-listing walkthrough" },
              ].map((f) => (
                <li key={f.who} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{f.who}</p>
                    <p className="text-xs text-muted-foreground">{f.task}</p>
                  </div>
                  <Badge variant="secondary">{f.when}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {[
          { title: "Expiring warranties",   icon: ShieldCheck, items: ["Anderson — HVAC, 41 days", "Park Place — Roof, 67 days"] },
          { title: "Maintenance reminders", icon: Wrench,      items: ["Quarterly HVAC tune-up", "Gutter cleaning season"] },
          { title: "Market updates",        icon: TrendingUp,  items: ["Median DOM down 12%", "Inventory up 4% MoM"] },
        ].map((c) => (
          <Card key={c.title}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><c.icon className="h-4 w-4" />{c.title}</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {c.items.map((i) => <li key={i} className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-primary" />{i}</li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function currentLevel(points: number) {
  return [...PARTNER_LEVELS].reverse().find((l) => points >= l.min) ?? PARTNER_LEVELS[0];
}
function nextLevel(points: number) {
  return PARTNER_LEVELS.find((l) => l.min > points) ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Listings                                                                   */
/* -------------------------------------------------------------------------- */

function ListingsView({ shares }: { shares: any[] }) {
  const [selected, setSelected] = useState<any | null>(null);

  if (selected) return <ListingWorkspace listing={selected} onBack={() => setSelected(null)} />;

  return (
    <>
      <SectionHeader
        title="My Listings"
        description="Every listing is a complete workspace — documents, photos, timeline, invites, and reports."
        action={<Button asChild><Link to="/search"><Search className="mr-2 h-4 w-4" />Add a property</Link></Button>}
      />

      {shares.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No listings yet"
          hint="Find a property and share a Orivaz report to start a new listing workspace."
          cta={<Button asChild><Link to="/search">Find property</Link></Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shares.map((s) => (
            <Card key={s.id} className="transition hover:shadow-elevated">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.properties?.address_line}</p>
                    <p className="text-sm text-muted-foreground">{s.properties?.city}, {s.properties?.state} {s.properties?.zip}</p>
                  </div>
                  <Badge className="gap-1 bg-accent text-accent-foreground"><BadgeCheck className="h-3 w-3" />Active</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-md bg-muted/40 p-2"><div className="text-base font-bold">{Math.floor(Math.random() * 40) + 40}%</div><div className="text-muted-foreground">Complete</div></div>
                  <div className="rounded-md bg-muted/40 p-2"><div className="text-base font-bold">{Math.floor(Math.random() * 80) + 20}</div><div className="text-muted-foreground">Views</div></div>
                  <div className="rounded-md bg-muted/40 p-2"><div className="text-base font-bold">{Math.floor(Math.random() * 30) + 5}</div><div className="text-muted-foreground">QR scans</div></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => setSelected(s)}>Open workspace</Button>
                  <Button size="sm" variant="outline" asChild><Link to={`/r/${s.token}`} target="_blank">Preview report</Link></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function ListingWorkspace({ listing, onBack }: { listing: any; onBack: () => void }) {
  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back to listings</Button>
      </div>
      <SectionHeader
        title={listing.properties?.address_line}
        description={`${listing.properties?.city}, ${listing.properties?.state} ${listing.properties?.zip}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/r/${listing.token}`); toast.success("Link copied"); }}>
              <Copy className="mr-2 h-4 w-4" />Copy share link
            </Button>
            <Button size="sm" variant="outline"><QrCode className="mr-2 h-4 w-4" />QR code</Button>
            <Button size="sm"><Sparkles className="mr-2 h-4 w-4" />AI summary</Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap h-auto">
          {["overview","documents","photos","timeline","invites","activity"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-base">Orivaz Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">82</div>
              <Progress value={82} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">Add inspection and warranty to reach 90+.</p>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-base">Seller</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">Pending invite</p>
              <p className="text-muted-foreground">No homeowner connected yet.</p>
              <Button size="sm" className="mt-2"><UserPlus className="mr-2 h-3.5 w-3.5" />Invite seller</Button>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-base">Buyer</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-muted-foreground">No buyer linked yet.</p>
              <Button size="sm" variant="outline" className="mt-2"><UserPlus className="mr-2 h-3.5 w-3.5" />Invite buyer</Button>
            </CardContent>
          </Card>

          {[
            { label: "Permits", count: 3 },
            { label: "Warranties", count: 2 },
            { label: "Maintenance", count: 8 },
            { label: "Inspections", count: 1 },
            { label: "Insurance claims", count: 0 },
            { label: "Contractor history", count: 5 },
          ].map((b) => (
            <Card key={b.label}><CardContent className="p-5">
              <p className="text-xs uppercase text-muted-foreground">{b.label}</p>
              <p className="mt-1 text-2xl font-bold">{b.count}</p>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="font-medium">Uploaded documents</p><p className="text-sm text-muted-foreground">Drag files anywhere on this card.</p></div>
              <Button size="sm"><Download className="mr-2 h-4 w-4" />Upload</Button>
            </div>
            <div className="mt-6 rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">No documents uploaded yet.</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <EmptyState icon={Camera} title="No photos uploaded" hint="Upload listing photos, drone shots, and video walkthroughs." cta={<Button>Upload media</Button>} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card><CardContent className="p-6">
            <ol className="relative border-l pl-6">
              {[
                { year: "2024", title: "Roof replacement", detail: "GAF Timberline · 25-year warranty" },
                { year: "2022", title: "HVAC installed", detail: "Carrier 16 SEER · permit #54211" },
                { year: "2019", title: "Kitchen remodel", detail: "Permit #44102 · inspected" },
                { year: "2010", title: "Home built", detail: "Original construction · builder verified" },
              ].map((e, i) => (
                <li key={i} className="mb-6 ml-2">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                  <p className="text-xs text-muted-foreground">{e.year}</p>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{e.detail}</p>
                </li>
              ))}
            </ol>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="invites" className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { role: "Seller",     icon: UserPlus },
            { role: "Buyer",      icon: UserPlus },
            { role: "Contractor", icon: Wrench },
            { role: "Inspector",  icon: ShieldCheck },
          ].map((i) => (
            <Card key={i.role}><CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3"><i.icon className="h-4 w-4 text-primary" /><span className="font-medium">Invite {i.role.toLowerCase()}</span></div>
              <Button size="sm">Invite</Button>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card><CardContent className="p-6">
            <ul className="space-y-3 text-sm">
              {["Buyer report viewed 14× this week", "QR code scanned 8× yesterday", "Seller uploaded HVAC manual", "AI suggested 3 missing documents"].map((a) => (
                <li key={a} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{a}</li>
              ))}
            </ul>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Certified Listings                                                         */
/* -------------------------------------------------------------------------- */

function CertifiedView({ shares }: { shares: any[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(CERT_CHECKLIST.slice(0, 9).map((c) => [c, true])),
  );
  const total = CERT_CHECKLIST.length;
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((done / total) * 100);

  return (
    <>
      <SectionHeader
        title="Orivaz Verified Listings"
        description="Earn the Certified Listing badge by completing the full property record."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Certification checklist</span>
              <Badge variant={pct === 100 ? "default" : "secondary"}>{pct}% complete</Badge>
            </CardTitle>
            <CardDescription>{shares[0]?.properties?.address_line ?? "Select a listing to certify"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={pct} className="mb-4" />
            <div className="grid gap-2 md:grid-cols-2">
              {CERT_CHECKLIST.map((c) => (
                <label key={c} className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/40">
                  <Checkbox checked={!!checked[c]} onCheckedChange={(v) => setChecked((p) => ({ ...p, [c]: !!v }))} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Certified badge preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-primary/5 p-6 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-accent" />
              <p className="mt-3 text-lg font-bold">Orivaz Verified</p>
              <p className="text-xs text-muted-foreground">Verified property record</p>
            </div>
            <Button className="mt-4 w-full" disabled={pct < 100}>
              {pct === 100 ? "Issue badge" : "Complete checklist to issue"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Badge appears on listing, buyer report, and your profile.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Seller Onboarding                                                          */
/* -------------------------------------------------------------------------- */

function OnboardingView() {
  const [completed, setCompleted] = useState<Set<number>>(new Set([1, 2, 3]));
  const pct = Math.round((completed.size / ONBOARDING_STEPS.length) * 100);

  return (
    <>
      <SectionHeader
        title="Seller Onboarding"
        description="Guided wizard with AI that recommends the next best document to collect."
      />

      <div className="mb-6 rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Onboarding progress</span>
          <span className="text-muted-foreground">{completed.size} of {ONBOARDING_STEPS.length} complete</span>
        </div>
        <Progress value={pct} />
      </div>

      <div className="grid gap-3">
        {ONBOARDING_STEPS.map((s) => {
          const done = completed.has(s.step);
          return (
            <Card key={s.step} className={done ? "border-accent/40 bg-accent/5" : ""}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`}>
                  {done ? "✓" : s.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.hint}</p>
                </div>
                <Button size="sm" variant={done ? "outline" : "default"} onClick={() => {
                  setCompleted((p) => { const n = new Set(p); n.has(s.step) ? n.delete(s.step) : n.add(s.step); return n; });
                }}>
                  {done ? "Undo" : "Mark done"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-5">
          <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">AI recommends next</p>
            <p className="text-sm text-muted-foreground">Ask the seller for their most recent HVAC service receipt — completing this raises the Orivaz Score by an estimated +8.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Buyer Reports                                                              */
/* -------------------------------------------------------------------------- */

function BuyerReportsView({ shares }: { shares: any[] }) {
  const sections = [
    "Property Overview","Property Timeline","Improvement History","Roof Information","HVAC","Electrical",
    "Plumbing","Foundation","Storm History","Insurance Information","Warranty Information","Permit History",
    "Property Photos","Drone Photos","Neighborhood Information","Schools","Crime Statistics","Utilities",
    "Property Taxes","Flood Information","Future Maintenance Recommendations","Orivaz Score",
  ];

  return (
    <>
      <SectionHeader
        title="Buyer Reports"
        description="Professional interactive reports — share, download, print, or embed a QR code."
        action={<Button><FileText className="mr-2 h-4 w-4" />Generate new report</Button>}
      />

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Existing reports</TabsTrigger>
          <TabsTrigger value="qr">QR code generator</TabsTrigger>
          <TabsTrigger value="sections">Report sections</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4">
          {shares.length === 0 ? (
            <EmptyState icon={FileText} title="No buyer reports yet" hint="Open a listing and click Generate Buyer Report." />
          ) : (
            <div className="rounded-xl border bg-card">
              <ul className="divide-y">
                {shares.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{s.properties?.address_line}</p>
                      <p className="text-xs text-muted-foreground">Created {format(new Date(s.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild><Link to={`/r/${s.token}`} target="_blank">Web report</Link></Button>
                      <Button size="sm" variant="outline"><Download className="mr-2 h-4 w-4" />PDF</Button>
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/r/${s.token}`); toast.success("Link copied"); }}><Share2 className="mr-2 h-4 w-4" />Share</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="qr" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">QR placements</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              {["Yard signs","Flyers","Business cards","Open house signs","Email signatures","Brochures","Landing pages"].map((p) => (
                <div key={p} className="flex items-center gap-2 rounded-md border p-2"><QrCode className="h-4 w-4 text-primary" />{p}</div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Scan analytics</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-center">
                {[
                  { l: "Total scans", v: "1,284" }, { l: "Unique visitors", v: "812" },
                  { l: "Avg view time", v: "3m 12s" }, { l: "Downloads", v: "142" },
                  { l: "Shares", v: "67" }, { l: "Returning", v: "189" },
                ].map((s) => (
                  <div key={s.l} className="rounded-md bg-muted/40 p-3">
                    <p className="text-lg font-bold">{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="mt-4">
          <Card><CardContent className="p-5">
            <p className="mb-3 text-sm text-muted-foreground">Every buyer report includes:</p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {sections.map((s) => (
                <div key={s} className="flex items-center gap-2 rounded-md border p-2 text-sm"><FileCheck className="h-4 w-4 text-accent" />{s}</div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Marketing Center                                                           */
/* -------------------------------------------------------------------------- */

function MarketingView() {
  const items = [
    { t: "Social Media Graphics", i: Megaphone }, { t: "Facebook Posts", i: Megaphone },
    { t: "Instagram Posts", i: Camera }, { t: "LinkedIn Posts", i: Linkedin },
    { t: "Flyers", i: FileText }, { t: "Brochures", i: FileText },
    { t: "Open House Handouts", i: Home }, { t: "Email Campaigns", i: Mail },
    { t: "Presentation Slides", i: PlayCircle }, { t: "Yard Sign Riders", i: QrCode },
    { t: "Business Cards", i: Building2 }, { t: "Client Welcome Packets", i: Gift },
  ];

  return (
    <>
      <SectionHeader
        title="Marketing Center"
        description="Auto-branded marketing kits — your photo, brokerage, and contact info on every asset."
      />

      <Card className="mb-6 bg-muted/30">
        <CardContent className="grid gap-4 p-5 md:grid-cols-4">
          <Input placeholder="Agent name" defaultValue="Alex Morgan" />
          <Input placeholder="Brokerage" defaultValue="Summit Realty" />
          <Input placeholder="Phone" defaultValue="(555) 123-4567" />
          <Input placeholder="Website" defaultValue="alexmorganhomes.com" />
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <Card key={m.t} className="transition hover:shadow-elevated">
            <CardContent className="p-5">
              <div className="flex h-24 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-accent/10">
                <m.i className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-3 font-medium">{m.t}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">Edit</Button>
                <Button size="sm" className="flex-1"><Download className="mr-2 h-3.5 w-3.5" />PDF</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Rewards                                                                    */
/* -------------------------------------------------------------------------- */

function RewardsView({ count }: { count: number }) {
  const points = count * 250 + 1200;
  const level = currentLevel(points);
  const next = nextLevel(points);
  const progress = next ? Math.min(100, ((points - level.min) / (next.min - level.min)) * 100) : 100;

  const earn = [
    { a: "Homeowner registration", p: 150 }, { a: "Certified listing", p: 500 },
    { a: "Completed property profile", p: 300 }, { a: "Verified contractor", p: 200 },
    { a: "Uploaded document", p: 25 }, { a: "Buyer report view", p: 10 },
    { a: "Client referral", p: 400 }, { a: "Closed transaction", p: 1000 },
  ];

  const rewards = [
    { t: "Premium features",      i: Sparkles }, { t: "Featured profile", i: Star },
    { t: "Marketing credits",     i: Gift },     { t: "Exclusive badges",  i: Award },
    { t: "Discounted subscription", i: Zap },    { t: "Early feature access", i: Target },
    { t: "Recognition awards",    i: Trophy },
  ];

  return (
    <>
      <SectionHeader
        title="Rewards & Incentives"
        description="Earn points for growing the Orivaz ecosystem — level up for premium perks."
      />

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Current level</p>
              <p className="text-3xl font-bold">{level.name}</p>
              <p className="text-sm text-muted-foreground">{points.toLocaleString()} pts earned</p>
            </div>
            {next && <p className="text-sm text-muted-foreground">{(next.min - points).toLocaleString()} pts to {next.name}</p>}
          </div>
          <Progress value={progress} className="mt-4" />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            {PARTNER_LEVELS.map((l) => <span key={l.name}>{l.name}</span>)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Ways to earn points</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {earn.map((e) => (
                <li key={e.a} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{e.a}</span>
                  <Badge variant="secondary">+{e.p}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Reward catalog</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {rewards.map((r) => (
              <div key={r.t} className="rounded-md border p-3 text-center">
                <r.i className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-medium">{r.t}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Achievements</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const earned = count >= a.target;
            return (
              <div key={a.id} className={`rounded-md border p-3 text-center ${earned ? "border-accent/50 bg-accent/5" : "opacity-60"}`}>
                <Award className={`mx-auto h-6 w-6 ${earned ? "text-accent" : "text-muted-foreground"}`} />
                <p className="mt-2 text-sm font-medium">{a.label}</p>
                <p className="text-xs text-muted-foreground">{earned ? "Earned" : `${count}/${a.target}`}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                  */
/* -------------------------------------------------------------------------- */

function AnalyticsView({ shares }: { shares: any[] }) {
  const bars = [
    { l: "Listings won",        v: 18, m: 22 },
    { l: "Listings lost",       v: 4,  m: 22 },
    { l: "Avg days on market",  v: 21, m: 60 },
    { l: "Buyer engagement",    v: 78, m: 100 },
    { l: "Seller engagement",   v: 64, m: 100 },
    { l: "QR scans",            v: 88, m: 100 },
    { l: "Conversion rate",     v: 42, m: 100 },
    { l: "Repeat clients",      v: 9,  m: 30 },
  ];

  return (
    <>
      <SectionHeader title="Business Analytics" description="Listings, engagement, and how Orivaz impacts your numbers." />

      <div className="grid gap-4 md:grid-cols-2">
        {bars.map((b) => (
          <Card key={b.l}>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{b.l}</span>
                <span className="text-muted-foreground">{b.v}</span>
              </div>
              <Progress value={(b.v / b.m) * 100} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Orivaz vs standard listings</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-accent">+38%</p><p className="text-xs text-muted-foreground">Buyer engagement</p></div>
            <div><p className="text-2xl font-bold text-accent">−31%</p><p className="text-xs text-muted-foreground">Days on market</p></div>
            <div><p className="text-2xl font-bold text-accent">+22%</p><p className="text-xs text-muted-foreground">Price per sq ft</p></div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  CRM                                                                        */
/* -------------------------------------------------------------------------- */

function CrmView() {
  const reminders = [
    { type: "Home Anniversary",      who: "Anderson Family",   when: "in 12 days", icon: Gift },
    { type: "Roof Inspection",       who: "Park Place",        when: "in 23 days", icon: ShieldCheck },
    { type: "HVAC Service",          who: "Lopez Residence",   when: "in 18 days", icon: Wrench },
    { type: "Warranty Expiration",   who: "Patel Home",        when: "in 41 days", icon: BadgeCheck },
    { type: "Insurance Review",      who: "Nguyen Family",     when: "in 60 days", icon: ShieldCheck },
    { type: "Property Value Update", who: "Carter Estate",     when: "Quarterly",  icon: TrendingUp },
    { type: "Seasonal Maintenance",  who: "All clients",       when: "Next month", icon: Wrench },
    { type: "Annual Home Checkup",   who: "All clients",       when: "Yearly",     icon: Home },
    { type: "Birthday",              who: "Maria Lopez",       when: "Friday",     icon: Gift },
    { type: "Holiday Greeting",      who: "All clients",       when: "December",   icon: Mail },
  ];

  return (
    <>
      <SectionHeader
        title="Client Relationship Manager"
        description="Automated reminders, notifications, and follow-ups for every past client."
        action={<Button><Mail className="mr-2 h-4 w-4" />New campaign</Button>}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {reminders.map((r) => (
          <Card key={r.type + r.who}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <r.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.type}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.who}</p>
                </div>
              </div>
              <Badge variant="outline">{r.when}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Education                                                                  */
/* -------------------------------------------------------------------------- */

function EducationView() {
  const courses = [
    { t: "Winning Listings with Orivaz", d: "8 lessons · 45 min", i: PlayCircle },
    { t: "Mastering Buyer Confidence",      d: "5 lessons · 30 min", i: BookOpen },
    { t: "AI for Real Estate Agents",       d: "6 lessons · 40 min", i: Bot },
    { t: "Closing Faster with Documentation", d: "4 lessons · 25 min", i: FileCheck },
  ];
  const certs = [
    { t: "Orivaz Verified Realtor", earned: true },
    { t: "Certified Listing Expert",    earned: true },
    { t: "Elite Partner",                earned: false },
  ];

  return (
    <>
      <SectionHeader title="Orivaz Academy" description="Video courses, scripts, and tutorials — earn certifications visible on your profile." />

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <Card key={c.t} className="transition hover:shadow-elevated">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10"><c.i className="h-6 w-6 text-primary" /></div>
              <div className="flex-1"><p className="font-medium">{c.t}</p><p className="text-xs text-muted-foreground">{c.d}</p></div>
              <Button size="sm">Start</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Your certifications</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {certs.map((c) => (
            <div key={c.t} className={`rounded-lg border p-4 text-center ${c.earned ? "border-accent/40 bg-accent/5" : "opacity-60"}`}>
              <BadgeCheck className={`mx-auto h-7 w-7 ${c.earned ? "text-accent" : "text-muted-foreground"}`} />
              <p className="mt-2 text-sm font-medium">{c.t}</p>
              <p className="text-xs text-muted-foreground">{c.earned ? "Earned" : "Locked"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Partners                                                                   */
/* -------------------------------------------------------------------------- */

function PartnersView() {
  const [q, setQ] = useState("");
  const cats = useMemo(() => PARTNER_CATEGORIES.filter((c) => c.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <>
      <SectionHeader
        title="Preferred Partner Marketplace"
        description="Recommend verified businesses to clients — license, insurance, and reviews on every profile."
        action={<Button><Handshake className="mr-2 h-4 w-4" />Recommend a business</Button>}
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search categories…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        {cats.map((c) => (
          <Card key={c} className="cursor-pointer transition hover:shadow-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{c}</p>
                <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" />Verified</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{Math.floor(Math.random() * 40) + 8} pros in your area</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Featured partner</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Avatar className="h-14 w-14"><AvatarFallback>SR</AvatarFallback></Avatar>
          <div>
            <div className="flex items-center gap-2"><p className="font-semibold">Summit Roofing Co.</p><Badge className="gap-1 bg-accent text-accent-foreground"><ShieldCheck className="h-3 w-3" />Verified</Badge></div>
            <p className="text-sm text-muted-foreground">Licensed · Insured · 247 Orivaz projects · 12 yrs in business</p>
            <div className="mt-1 flex items-center gap-1 text-warning">{"★".repeat(5)}<span className="ml-1 text-xs text-muted-foreground">4.9 · 312 reviews</span></div>
          </div>
          <Button variant="outline">View profile</Button>
        </CardContent>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  AI Assistant                                                               */
/* -------------------------------------------------------------------------- */

function AiAssistantView() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi Alex — I can write listing descriptions, summarize property history, draft follow-ups, and more. What do you need?" },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, {
        role: "ai",
        text: "Here's a draft you can edit — I've highlighted the verified Orivaz data so buyers see exactly what's documented.",
      }]);
    }, 600);
  };

  const skills = [
    "Write listing description", "Generate social post", "Draft email campaign",
    "Summarize property history", "Find missing documents", "Buyer FAQs",
    "Open house script", "Market analysis", "Maintenance recommendations",
    "Follow-up reminder", "Transaction checklist", "Seller presentation",
  ];

  return (
    <>
      <SectionHeader title="AI Assistant" description="Your built-in copilot for listings, marketing, follow-ups, and analysis." />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="flex h-[560px] flex-col">
          <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 border-t pt-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask the assistant…"
                className="min-h-[44px] resize-none"
              />
              <Button onClick={send}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Quick skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <Button key={s} size="sm" variant="outline" onClick={() => setInput(s)} className="h-auto py-1.5 text-xs">{s}</Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Profile                                                                    */
/* -------------------------------------------------------------------------- */

function ProfileView() {
  return (
    <>
      <SectionHeader title="Profile & Settings" description="Your public Realtor profile and account preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <Avatar className="mx-auto h-24 w-24"><AvatarFallback className="text-2xl">AM</AvatarFallback></Avatar>
            <p className="mt-3 text-lg font-bold">Alex Morgan</p>
            <p className="text-sm text-muted-foreground">Summit Realty · License #RE-83721</p>
            <Badge className="mt-2 gap-1 bg-gradient-to-r from-primary to-primary-glow"><Trophy className="h-3 w-3" />Gold Partner</Badge>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div><p className="text-lg font-bold">147</p><p className="text-muted-foreground">Homes</p></div>
              <div><p className="text-lg font-bold">82</p><p className="text-muted-foreground">Certified</p></div>
              <div><p className="text-lg font-bold">4.9</p><p className="text-muted-foreground">Rating</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Public profile</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Full name" defaultValue="Alex Morgan" />
            <Input placeholder="Years experience" defaultValue="12" />
            <Input placeholder="Brokerage" defaultValue="Summit Realty" />
            <Input placeholder="License number" defaultValue="RE-83721" />
            <Input placeholder="Phone" defaultValue="(555) 123-4567" />
            <Input placeholder="Website" defaultValue="alexmorganhomes.com" />
            <Textarea placeholder="Bio" defaultValue="Specializing in family homes with verified property histories. Building trust through transparency." className="md:col-span-2" />
            <div className="md:col-span-2 flex gap-2">
              <Button><FileCheck className="mr-2 h-4 w-4" />Save changes</Button>
              <Button variant="outline"><Globe className="mr-2 h-4 w-4" />View public profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Achievements & awards</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {["Documentation Expert","Buyer Confidence Champion","Referral Master","Elite Partner"].map((a) => (
            <div key={a} className="rounded-md border p-3 text-center">
              <Award className="mx-auto h-6 w-6 text-warning" />
              <p className="mt-2 text-sm font-medium">{a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
