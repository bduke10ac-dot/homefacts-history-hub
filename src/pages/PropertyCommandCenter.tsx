import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Activity, AlertTriangle, ArrowRightLeft, BadgeCheck, Box, Building2, Calendar,
  Camera, CheckCircle2, ClipboardList, FileText, Filter, Hammer, Home, Image as ImageIcon,
  LayoutGrid, Plus, Receipt, Send, ShieldCheck, Sparkles, Upload, Users, Wrench, Zap,
} from "lucide-react";

const POSITIONING = "Home apps store your documents. Orivaz protects, verifies, transfers, and grows the full history of your property.";

const inventory = [
  { name: "Trane XR16 HVAC", category: "HVAC", brand: "Trane", model: "4TTR6036J", serial: "TR-2024-88142", install: "2024-03-12", warranty: "2034-03-12", value: 8200, location: "Mechanical Closet", provider: "Creekside Homes" },
  { name: "GE Profile Refrigerator", category: "Appliance", brand: "GE", model: "PFE28KYNFS", serial: "GE-991423", install: "2024-03-22", warranty: "2025-03-22", value: 3499, location: "Kitchen", provider: "Creekside Homes" },
  { name: "Owens Corning Duration Shingles", category: "Roof", brand: "Owens Corning", model: "Duration Storm", serial: "OC-LOT-44912", install: "2024-02-04", warranty: "2074-02-04", value: 19800, location: "Roof", provider: "Summit Roofing (Creekside Approved)" },
  { name: "Rheem Performance Water Heater", category: "Plumbing", brand: "Rheem", model: "XE50T10H45U0", serial: "RH-552-119", install: "2024-03-08", warranty: "2034-03-08", value: 1450, location: "Garage", provider: "Creekside Homes" },
  { name: "Andersen 400 Series Windows (x14)", category: "Windows", brand: "Andersen", model: "400 Tilt-Wash", serial: "AND-LOT-2241", install: "2024-02-19", warranty: "2044-02-19", value: 11200, location: "Whole home", provider: "Creekside Homes" },
];

const warranties = [
  { item: "Structural / Foundation", provider: "Creekside Homes 2-10 HBW", expires: "2034-02-04", transfer: "Transferable", days: 2998 },
  { item: "HVAC – Trane XR16", provider: "Trane Manufacturer", expires: "2034-03-12", transfer: "Transferable", days: 3034 },
  { item: "Roof – Owens Corning Duration", provider: "Owens Corning", expires: "2074-02-04", transfer: "Transferable", days: 17600 },
  { item: "Appliance Package", provider: "GE Appliances", expires: "2025-03-22", transfer: "Non-transferable", days: 88 },
  { item: "Windows – Andersen 400", provider: "Andersen Corp.", expires: "2044-02-19", transfer: "Transferable", days: 6630 },
  { item: "Workmanship – Year 1", provider: "Creekside Homes", expires: "2025-02-04", transfer: "Non-transferable", days: 42 },
];

const contacts = [
  { name: "Creekside Homes", company: "creeksidenewhomes.com", type: "Builder", phone: "(555) 010-2200", badges: ["Builder Approved", "Verified License", "Verified Insurance"] },
  { name: "Summit Roofing Co.", company: "Summit Roofing", type: "Roofer", phone: "(555) 311-8821", badges: ["Verified License", "Preferred Provider"] },
  { name: "ClearView Inspections", company: "ClearView", type: "Home Inspector", phone: "(555) 720-5510", badges: ["Verified License"] },
  { name: "Janet Ortiz", company: "State Farm", type: "Insurance Agent", phone: "(555) 488-1102", badges: ["Verified Insurance"] },
  { name: "Mark Daniels", company: "Daniels Realty", type: "Realtor", phone: "(555) 224-9019", badges: ["Preferred Provider"] },
  { name: "City Power & Light", company: "Utility", type: "Utility Provider", phone: "(555) 911-0000", badges: [] },
];

const timeline = [
  { date: "2024-02-04", title: "Final Roof Installation", category: "Roofing", verified: true, source: "Summit Roofing" },
  { date: "2024-02-19", title: "Window Package Installed", category: "Exterior", verified: true, source: "Creekside Homes" },
  { date: "2024-03-08", title: "Water Heater Commissioned", category: "Plumbing", verified: true, source: "Creekside Homes" },
  { date: "2024-03-12", title: "HVAC Startup & Test", category: "HVAC", verified: true, source: "Trane Certified Tech" },
  { date: "2024-03-22", title: "Appliance Delivery Receipt", category: "Appliances", verified: false, source: "Homeowner" },
  { date: "2024-04-01", title: "Builder Handoff Walkthrough", category: "Builder", verified: true, source: "Creekside Homes" },
  { date: "2024-05-14", title: "Certificate of Occupancy", category: "Permits", verified: true, source: "City of Cedar Springs" },
  { date: "2025-01-09", title: "Annual HVAC Service", category: "Maintenance", verified: true, source: "Summit Mechanical" },
];

const sharedAccess = [
  { name: "Jordan Avery", role: "Owner", level: "Full access", color: "bg-primary/15 text-primary" },
  { name: "Riley Avery", role: "Family", level: "View / edit household records", color: "bg-emerald-500/15 text-emerald-600" },
  { name: "Summit Roofing", role: "Contractor", level: "Upload project records only", color: "bg-amber-500/15 text-amber-700" },
  { name: "Mark Daniels (Realtor)", role: "Realtor", level: "Seller-approved report only", color: "bg-blue-500/15 text-blue-600" },
  { name: "State Farm Adjuster", role: "Insurance", level: "Claim-related files only", color: "bg-fuchsia-500/15 text-fuchsia-600" },
];

const activityLog = [
  { who: "Riley Avery", what: "uploaded HVAC service receipt", when: "2h ago" },
  { who: "Summit Roofing", what: "added drone roof inspection photos", when: "Yesterday" },
  { who: "Jordan Avery", what: "invited Mark Daniels (Realtor) to view seller report", when: "3 days ago" },
  { who: "Creekside Homes", what: "verified original warranty package", when: "Last week" },
];

const transferSteps = [
  "Confirm new owner info",
  "Select records to transfer",
  "Transfer warranties & manuals",
  "Transfer trusted contacts",
  "Generate final Home History Report",
  "Archive seller-only private documents",
];

const aiPrompts = [
  "What warranties are about to expire?",
  "What should I maintain this month?",
  "What records would help if I sell?",
  "What documents do I need for an insurance claim?",
  "Which contractor worked on my roof?",
  "What items are missing from my home inventory?",
  "Prepare a buyer-friendly property report.",
];

const quickActions = [
  { label: "Upload Receipt", icon: Receipt },
  { label: "Scan Warranty", icon: ShieldCheck },
  { label: "Add Appliance", icon: Box },
  { label: "Add Contractor", icon: Hammer },
  { label: "Start Maintenance Task", icon: Wrench },
  { label: "File Insurance Claim Prep", icon: FileText },
  { label: "Generate Buyer Report", icon: ClipboardList },
  { label: "Transfer Property", icon: ArrowRightLeft },
  { label: "Invite Access", icon: Users },
  { label: "Ask Property AI", icon: Sparkles },
];

const timelineCategories = ["All", "Roofing", "HVAC", "Plumbing", "Electrical", "Appliances", "Foundation", "Exterior", "Interior", "Insurance", "Permits", "Builder", "Maintenance", "Legal/Estate"];

export default function PropertyCommandCenter() {
  const [tlFilter, setTlFilter] = useState("All");
  const [search, setSearch] = useState("");

  const recordStrength = 78;
  const strengthBreakdown = [
    { label: "Documents", value: 92 },
    { label: "Warranties", value: 88 },
    { label: "Inventory", value: 71 },
    { label: "Photos", value: 64 },
    { label: "Contacts", value: 80 },
    { label: "Maintenance", value: 70 },
  ];

  const filteredTimeline = useMemo(
    () => timeline.filter((t) => tlFilter === "All" || t.category === tlFilter),
    [tlFilter],
  );

  const filteredInventory = useMemo(
    () => inventory.filter((i) => !search || `${i.name} ${i.brand} ${i.category}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" /> Property Command Center
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              <span className="text-gradient">1428 Cedar Hollow Ln</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cedar Springs, CO 80906 · New construction by <strong>Creekside Homes</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Quick Upload</Button>
            <Button className="shine-btn"><Sparkles className="mr-2 h-4 w-4" />Ask Property AI</Button>
          </div>
        </div>

        {/* Positioning band */}
        <Card className="mt-6 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
            <p className="font-medium">{POSITIONING}</p>
            <Badge variant="outline" className="border-primary/40 text-primary">Orivaz Lifecycle Platform</Badge>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {quickActions.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="lift group flex items-center gap-2 rounded-xl border bg-card p-3 text-left text-sm font-medium transition-all hover:border-primary/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/50">
            {["overview", "inventory", "documents", "warranties", "contacts", "network", "timeline", "transfer", "reports"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2 lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Property Record Strength</CardTitle>
                      <CardDescription>Score grows as you add records, warranties, photos, and contacts.</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-gradient">{recordStrength}%</div>
                      <div className="text-xs text-muted-foreground">Top 12% nationally</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={recordStrength} className="h-3" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    {strengthBreakdown.map((s) => (
                      <div key={s.label} className="rounded-lg border bg-card/50 p-3">
                        <div className="flex justify-between text-xs text-muted-foreground"><span>{s.label}</span><span>{s.value}%</span></div>
                        <Progress value={s.value} className="mt-2 h-1.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Needs Attention</CardTitle>
                  <CardDescription>Time-sensitive items.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Alert label="Workmanship warranty expires in 42 days" tone="amber" />
                  <Alert label="GE appliance warranty expires in 88 days" tone="amber" />
                  <Alert label="Annual HVAC tune-up due in March" tone="blue" />
                  <Alert label="Receipt missing: April plumbing repair" tone="red" />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Audience tone="primary" title="Homeowners" body="Most homeowners lose receipts, warranty papers, contractor records, and repair history. Orivaz keeps your property's full story protected, organized, and transferable." />
              <Audience tone="emerald" title="Builders" body="Give every buyer a smarter home handoff with warranties, manuals, maintenance guidance, and verified property history from day one." />
              <Audience tone="blue" title="Realtors" body="Help listings stand out with organized records, maintenance proof, warranty details, and a cleaner buyer handoff." />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Property Assistant</CardTitle>
                  <CardDescription>Tap a prompt to get an instant answer using your records.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {aiPrompts.map((p) => (
                    <button key={p} className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium transition-all hover:border-primary/40 hover:bg-primary/5">
                      {p}
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Recent Activity</CardTitle>
                  <CardDescription>Who's contributing to your property record.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {activityLog.map((a, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
                      <div><span className="font-medium">{a.who}</span> <span className="text-muted-foreground">{a.what}</span></div>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">{a.when}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* INVENTORY */}
          <TabsContent value="inventory" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Box className="h-5 w-5 text-primary" />Home Inventory Vault</CardTitle>
                    <CardDescription>Appliances, finishes, fixtures, roof, HVAC, plumbing, electrical, windows & more.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Search inventory…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
                    <Button variant="outline"><FileText className="mr-2 h-4 w-4" />Insurance Ready Export</Button>
                    <Button><Plus className="mr-2 h-4 w-4" />Add Item</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 pr-3">Item</th><th className="pr-3">Category</th><th className="pr-3">Brand / Model</th>
                        <th className="pr-3">Install</th><th className="pr-3">Warranty</th><th className="pr-3">Value</th><th className="pr-3">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((i) => (
                        <tr key={i.serial} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 pr-3 font-medium">{i.name}<div className="text-xs text-muted-foreground">SN {i.serial}</div></td>
                          <td className="pr-3"><Badge variant="outline">{i.category}</Badge></td>
                          <td className="pr-3">{i.brand}<div className="text-xs text-muted-foreground">{i.model}</div></td>
                          <td className="pr-3">{i.install}</td>
                          <td className="pr-3">{i.warranty}</td>
                          <td className="pr-3">${i.value.toLocaleString()}</td>
                          <td className="pr-3">{i.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Document & Manual Vault</CardTitle>
                <CardDescription>Drag, drop, scan, or forward by email. Every file lands on the timeline.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { name: "Creekside Homes – Builder Handoff Packet.pdf", tag: "Builder", icon: Building2 },
                    { name: "Owens Corning Roof Warranty.pdf", tag: "Warranty", icon: ShieldCheck },
                    { name: "Trane HVAC Manual & Registration.pdf", tag: "Manual", icon: Wrench },
                    { name: "Certificate of Occupancy.pdf", tag: "Permit", icon: BadgeCheck },
                    { name: "Lot Survey & Plat Map.pdf", tag: "Lot", icon: ImageIcon },
                    { name: "Year-1 Maintenance Schedule.pdf", tag: "Maintenance", icon: Calendar },
                  ].map((d) => (
                    <div key={d.name} className="lift flex items-start gap-3 rounded-xl border bg-card p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <d.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <Badge variant="outline" className="mt-1">{d.tag}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                  <Upload className="mx-auto h-6 w-6" /><p className="mt-2">Drop files here or click to upload</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WARRANTIES */}
          <TabsContent value="warranties" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Warranty & Manual Vault</CardTitle>
                    <CardDescription>Track coverage, transferability, and renewal reminders.</CardDescription>
                  </div>
                  <Button variant="outline"><ArrowRightLeft className="mr-2 h-4 w-4" />Update Ownership Transfer</Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {warranties.map((w) => {
                  const urgent = w.days < 120;
                  return (
                    <div key={w.item} className="lift rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{w.item}</p>
                          <p className="text-xs text-muted-foreground">{w.provider}</p>
                        </div>
                        <Badge variant={w.transfer === "Transferable" ? "default" : "outline"}>{w.transfer}</Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Expires {w.expires}</span>
                        <span className={urgent ? "font-semibold text-amber-600" : "text-emerald-600"}>
                          {urgent ? `Renew in ${w.days}d` : `${Math.round(w.days / 365)} yrs left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACTS */}
          <TabsContent value="contacts" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Trusted Contacts</CardTitle>
                    <CardDescription>Your property's verified people, in one place.</CardDescription>
                  </div>
                  <Button><Plus className="mr-2 h-4 w-4" />Add Contact</Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {contacts.map((c) => (
                  <div key={c.name} className="lift rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.company} · {c.type}</p>
                        <p className="mt-1 text-sm">{c.phone}</p>
                      </div>
                      <Hammer className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {c.badges.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {c.badges.map((b) => (
                          <Badge key={b} variant="outline" className="border-emerald-500/40 text-emerald-700">
                            <BadgeCheck className="mr-1 h-3 w-3" />{b}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" />Shared Ownership Access</CardTitle>
                <CardDescription>Invite household, professionals, and providers — with precise permission levels.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sharedAccess.map((s) => (
                  <div key={s.name} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${s.color}`}>
                        {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </span>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.level}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{s.role}</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full"><Plus className="mr-2 h-4 w-4" />Invite Access</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NETWORK */}
          <TabsContent value="network" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Professional Network</CardTitle>
                    <CardDescription>Verified pros attached to this property's record.</CardDescription>
                  </div>
                  <Button variant="outline" asChild><Link to="/network"><Sparkles className="mr-2 h-4 w-4" />Browse full network</Link></Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {networkPros.filter((p) => p.attachedTo && p.attachedTo.length > 0).map((p) => (
                  <div key={p.id} className="lift rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{p.trade}</div>
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.company} · {p.city}, {p.state}</p>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                        <BadgeCheck className="mr-1 h-3 w-3" />Verified
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.attachedTo!.map((a) => (
                        <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">Contact</Button>
                      <Button size="sm" variant="ghost">View record</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Digital Evidence Timeline</CardTitle>
                    <CardDescription>Every receipt, photo, warranty, permit, and repair — chronologically.</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    {timelineCategories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setTlFilter(c)}
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs transition ${tlFilter === c ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="relative ml-3 space-y-4 border-l-2 border-primary/20 pl-6">
                  {filteredTimeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground shadow-glow">
                        <CheckCircle2 className="h-3 w-3" />
                      </span>
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3">
                        <div>
                          <p className="font-semibold">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.date} · {t.source}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{t.category}</Badge>
                          {t.verified && <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15"><BadgeCheck className="mr-1 h-3 w-3" />Verified Record</Badge>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRANSFER */}
          <TabsContent value="transfer" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-primary" />Effortless Property Transfer</CardTitle>
                    <CardDescription>Guided workflow for sale, inheritance, gift, or trust placement.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-700">Status: Draft</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="grid gap-3 md:grid-cols-2">
                  {transferSteps.map((step, i) => (
                    <li key={step} className="lift flex items-start gap-3 rounded-xl border bg-card p-4">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-hero text-sm font-bold text-primary-foreground shadow-glow">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{step}</p>
                        <p className="text-xs text-muted-foreground">
                          {i === 0 ? "Verify buyer or trustee identity." :
                           i === 1 ? "Pick which records move to the new owner." :
                           i === 2 ? "Flag transferable warranties for re-registration." :
                           i === 3 ? "Hand off vetted contractors and providers." :
                           i === 4 ? "One-click Home History Report for the buyer." :
                           "Keep private seller-only files out of the transfer."}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button><Send className="mr-2 h-4 w-4" />Start Transfer</Button>
                  <Button variant="outline">Save Draft</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS */}
          <TabsContent value="reports" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { title: "Buyer-Friendly Property Report", desc: "Curated history, warranties, maintenance proof — ready to hand to a buyer or realtor.", icon: ClipboardList },
                { title: "Insurance Claim Prep Packet", desc: "Inventory, receipts, photos, and timeline filtered for a single event.", icon: ShieldCheck },
                { title: "Annual Home History Report", desc: "Year-over-year improvements, expenses, and verified records.", icon: Calendar },
                { title: "Estate / Legacy Packet", desc: "Documents and contacts for trustees, heirs, or probate. Not legal advice.", icon: FileText },
              ].map((r) => (
                <Card key={r.title} className="lift">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><r.icon className="h-5 w-5 text-primary" />{r.title}</CardTitle>
                    <CardDescription>{r.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full"><FileText className="mr-2 h-4 w-4" />Generate Report</Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-4 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
                <div>
                  <p className="text-sm font-semibold">Sample built from Creekside Homes new construction data.</p>
                  <p className="text-xs text-muted-foreground">Visit <a className="underline" href="https://creeksidenewhomes.com" target="_blank" rel="noreferrer">creeksidenewhomes.com</a> · First Orivaz builder partner.</p>
                </div>
                <Button asChild variant="outline"><Link to="/builders">Explore Builder Program</Link></Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Alert({ label, tone }: { label: string; tone: "amber" | "red" | "blue" }) {
  const map = {
    amber: "border-amber-500/40 bg-amber-500/5 text-amber-700",
    red: "border-red-500/40 bg-red-500/5 text-red-700",
    blue: "border-blue-500/40 bg-blue-500/5 text-blue-700",
  };
  return <div className={`rounded-lg border px-3 py-2 ${map[tone]}`}>{label}</div>;
}

function Audience({ tone, title, body }: { tone: "primary" | "emerald" | "blue"; title: string; body: string }) {
  const map = {
    primary: "from-primary/10 to-primary/0 border-primary/30",
    emerald: "from-emerald-500/10 to-emerald-500/0 border-emerald-500/30",
    blue: "from-blue-500/10 to-blue-500/0 border-blue-500/30",
  };
  return (
    <Card className={`lift bg-gradient-to-br ${map[tone]}`}>
      <CardHeader>
        <CardTitle className="text-lg">For {title}</CardTitle>
      </CardHeader>
      <CardContent><p className="text-sm text-muted-foreground">{body}</p></CardContent>
    </Card>
  );
}
