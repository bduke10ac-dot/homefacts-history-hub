import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ScoreRing";
import {
  Sparkles, Shield, FileText, Calculator, GitCompare, Award, Clock,
  CheckCircle2, AlertTriangle, Send, Home, Wrench, Building2, Star,
  ArrowRightLeft, MapPin, Download
} from "lucide-react";
import { toast } from "sonner";

const DEMO_PROPERTY_ID = "c7ee5510-d3e5-4000-8000-000000000001";

const POSITIONING = [
  "Zillow helps you find a house. Orivaz helps you understand, own, protect, improve, and transfer the full history of that property.",
  "Orivaz is the Property Operating System for the full life of a home.",
  "Know the true story of a property before, during, and after ownership.",
];

const SAMPLE_PROMPTS = [
  "Should I buy this house?",
  "What future repairs should I expect?",
  "Which property has the lowest insurance and maintenance risk?",
  "Compare these two homes based on ownership cost, not just price.",
];

const MOCK_PROPERTIES = [
  { id: "p1", label: "123 Creekside Lane", city: "Nashville, TN", price: 525000, monthly: 3680, insRisk: "Low", maintRisk: "Low", school: 9, crime: "Improving", storm: "Moderate", flood: "Low", permits: 12, warranty: "10/10", energy: "A", repairs10y: 18500, resale: 92 },
  { id: "p2", label: "812 Oakridge Dr", city: "Franklin, TN", price: 489000, monthly: 3520, insRisk: "Med", maintRisk: "Med", school: 8, crime: "Stable", storm: "Moderate", flood: "Low", permits: 6, warranty: "4/10", energy: "B", repairs10y: 31200, resale: 78 },
  { id: "p3", label: "455 Hillview Ct", city: "Brentwood, TN", price: 612000, monthly: 4120, insRisk: "Low", maintRisk: "Low", school: 10, crime: "Improving", storm: "Low", flood: "Low", permits: 9, warranty: "7/10", energy: "A", repairs10y: 22100, resale: 88 },
];

export default function PropertyIntelligence() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-8">
        <Hero />
        <Tabs defaultValue="advisor" className="w-full">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex h-auto w-max gap-1 bg-card border p-1 rounded-xl">
              {[
                ["advisor", "AI Advisor", Sparkles],
                ["health", "Health Score", Shield],
                ["passport", "Passport", FileText],
                ["cost", "True Cost", Calculator],
                ["compare", "Compare", GitCompare],
                ["builder", "Builder Certified", Award],
                ["timeline", "Timeline", Clock],
                ["buy", "Buy Confidence", CheckCircle2],
                ["market", "Marketplace", Wrench],
              ].map(([v, l, Icon]: any) => (
                <TabsTrigger key={v} value={v} className="gap-1.5 text-xs whitespace-nowrap">
                  <Icon className="h-3.5 w-3.5" />{l}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="advisor" className="mt-6"><AdvisorSection /></TabsContent>
          <TabsContent value="health" className="mt-6"><HealthScoreSection /></TabsContent>
          <TabsContent value="passport" className="mt-6"><PassportSection /></TabsContent>
          <TabsContent value="cost" className="mt-6"><CostCalculator /></TabsContent>
          <TabsContent value="compare" className="mt-6"><CompareSection /></TabsContent>
          <TabsContent value="builder" className="mt-6"><BuilderCertifiedSection /></TabsContent>
          <TabsContent value="timeline" className="mt-6"><TimelineSection /></TabsContent>
          <TabsContent value="buy" className="mt-6"><BuyConfidenceSection /></TabsContent>
          <TabsContent value="market" className="mt-6"><MarketplaceSection /></TabsContent>
        </Tabs>

        <PositioningStrip />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-gradient-hero p-8 text-primary-foreground shadow-card">
      <Badge variant="secondary" className="mb-3 bg-white/15 text-primary-foreground border-0">Property Intelligence</Badge>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">The Property Operating System</h1>
      <p className="mt-3 max-w-2xl text-primary-foreground/90">{POSITIONING[0]}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="secondary"><Link to={`/property/${DEMO_PROPERTY_ID}`}>View demo property</Link></Button>
        <Button asChild variant="outline" className="bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20"><Link to="/search">Search properties</Link></Button>
      </div>
    </div>
  );
}

function AdvisorSection() {
  const [q, setQ] = useState("");
  const [thinking, setThinking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const ask = (text?: string) => {
    const query = text ?? q;
    if (!query.trim()) return;
    setQ(query); setThinking(true); setAnswer(null);
    setTimeout(() => {
      setAnswer(
        `Based on the property's roof age (2 yrs), HVAC age (2 yrs), 12 verified permits, active 10-year structural warranty, low flood risk, and Nashville TN storm exposure, this property scores **Strong Buy**. Expected 10-yr repair cost: ~$18,500. Insurance posture: favorable (recent build, impact-rated roof). Main watch items: monitor termite inspections annually and budget HVAC service at year 5.`
      );
      setThinking(false);
    }, 900);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Property Advisor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about this property…" className="min-h-[88px]" />
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((p) => (
              <Button key={p} size="sm" variant="outline" onClick={() => ask(p)}>{p}</Button>
            ))}
          </div>
          <Button onClick={() => ask()} disabled={thinking}><Send className="mr-2 h-4 w-4" />{thinking ? "Analyzing…" : "Ask Orivaz AI"}</Button>
          {answer && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">{answer}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Signals analyzed</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {["Condition","Roof age","HVAC age","Permits","Warranties","Insurance risk","Storm history","Flood risk","Taxes","Schools","Crime","Utilities","Maintenance","Contractor history","Resale potential"].map((x) => (
              <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-accent" />{x}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function HealthScoreSection() {
  const score = 87;
  const factors = [
    { label: "Roof life", val: 95 }, { label: "HVAC life", val: 92 }, { label: "Plumbing / electrical", val: 88 },
    { label: "Foundation risk", val: 90 }, { label: "Water intrusion", val: 84 }, { label: "Documentation", val: 96 },
    { label: "Active warranties", val: 100 }, { label: "Permit history", val: 80 }, { label: "Verified contractor work", val: 85 },
    { label: "Insurance claims", val: 95 }, { label: "Disaster exposure", val: 70 }, { label: "Maintenance completion", val: 78 },
  ];
  const band = score >= 80 ? { label: "Strong Property", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" }
    : score >= 60 ? { label: "Needs Review", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" }
    : { label: "High Risk", cls: "bg-destructive/15 text-destructive border-destructive/30" };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardContent className="flex flex-col items-center pt-6">
          <ScoreRing score={score} size={160} label="Health" />
          <Badge variant="outline" className={`mt-4 ${band.cls}`}>{band.label}</Badge>
          <p className="mt-2 text-xs text-muted-foreground text-center">Orivaz Property Health Score combines 12 weighted signals.</p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Factor breakdown</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {factors.map((f) => (
            <div key={f.label}>
              <div className="flex justify-between text-xs mb-1"><span>{f.label}</span><span className="font-semibold">{f.val}</span></div>
              <Progress value={f.val} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PassportSection() {
  const items = [
    ["Property timeline", "11 events"], ["Builder records", "Creekside Homes"], ["Photos", "47"],
    ["Permits", "12"], ["Inspections", "8"], ["Invoices", "23"], ["Warranties", "9 active"],
    ["Insurance claims", "0"], ["Maintenance history", "16"], ["Contractor records", "11"],
    ["Appliance manuals", "14"], ["Paint colors", "Documented"], ["Utility shutoff info", "Mapped"],
    ["Property line documents", "Recorded"], ["Tax records", "5 years"], ["Transferable documents", "All"],
  ];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Verified Property Passport</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">A digital passport that travels with the home — forever.</p>
        </div>
        <Button onClick={() => toast.success("Transfer initiated — new owner will receive secure link")}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />Transfer Property Passport
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([label, val]) => (
            <div key={label} className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-semibold">{val}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CostCalculator() {
  const [price, setPrice] = useState(525000);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(6.5);
  const v = useMemo(() => {
    const principal = price * (1 - down / 100);
    const r = rate / 100 / 12;
    const n = 360;
    const mortgage = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const tax = (price * 0.0072) / 12;
    const ins = 145;
    const util = 285;
    const hoa = 45;
    const maint = (price * 0.01) / 12;
    const roof = 18000 / (25 * 12);
    const hvac = 9500 / (15 * 12);
    const wh = 1800 / (10 * 12);
    const pest = 35;
    const lawn = 120;
    const repair = (price * 0.005) / 12;
    const monthly = mortgage + tax + ins + util + hoa + maint + roof + hvac + wh + pest + lawn + repair;
    return { mortgage, tax, ins, util, hoa, maint, roof, hvac, wh, pest, lawn, repair, monthly, tenYr: monthly * 120 };
  }, [price, down, rate]);
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const rows: [string, number][] = [
    ["Mortgage (P&I)", v.mortgage], ["Property taxes", v.tax], ["Insurance", v.ins], ["Utilities", v.util],
    ["HOA", v.hoa], ["General maintenance", v.maint], ["Roof replacement reserve", v.roof],
    ["HVAC replacement reserve", v.hvac], ["Water heater reserve", v.wh], ["Pest control", v.pest],
    ["Landscaping", v.lawn], ["Expected repairs", v.repair],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader><CardTitle className="text-base">Inputs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Purchase price"><Input type="number" value={price} onChange={(e) => setPrice(+e.target.value || 0)} /></Field>
          <Field label="Down payment %"><Input type="number" value={down} onChange={(e) => setDown(+e.target.value || 0)} /></Field>
          <Field label="Interest rate %"><Input type="number" step="0.1" value={rate} onChange={(e) => setRate(+e.target.value || 0)} /></Field>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">True monthly cost</CardTitle>
          <p className="text-2xl font-bold">{fmt(v.monthly)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-xs text-muted-foreground">10-year ownership estimate: <span className="font-semibold text-foreground">{fmt(v.tenYr)}</span></p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map(([l, val]) => (
              <div key={l} className="flex justify-between border-b py-1.5 text-sm">
                <span className="text-muted-foreground">{l}</span><span className="font-medium">{fmt(val)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><label className="text-xs text-muted-foreground">{label}</label><div className="mt-1">{children}</div></div>;
}

function CompareSection() {
  const [picked, setPicked] = useState<string[]>(["p1","p2","p3"]);
  const props = MOCK_PROPERTIES.filter((p) => picked.includes(p.id));
  const rows = [
    ["Purchase price", (p: any) => `$${p.price.toLocaleString()}`],
    ["Est. monthly cost", (p: any) => `$${p.monthly.toLocaleString()}`],
    ["Insurance risk", (p: any) => p.insRisk],
    ["Maintenance risk", (p: any) => p.maintRisk],
    ["School rating", (p: any) => `${p.school}/10`],
    ["Crime trend", (p: any) => p.crime],
    ["Storm risk", (p: any) => p.storm],
    ["Flood risk", (p: any) => p.flood],
    ["Permits", (p: any) => p.permits],
    ["Warranty coverage", (p: any) => p.warranty],
    ["Energy efficiency", (p: any) => p.energy],
    ["10-yr repair cost", (p: any) => `$${p.repairs10y.toLocaleString()}`],
    ["Resale potential", (p: any) => `${p.resale}/100`],
  ] as const;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GitCompare className="h-5 w-5 text-primary" />AI Home Comparison</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOCK_PROPERTIES.map((p) => (
            <Button key={p.id} size="sm" variant={picked.includes(p.id) ? "default" : "outline"}
              onClick={() => setPicked((cur) => cur.includes(p.id) ? cur.filter((x) => x !== p.id) : cur.length < 3 ? [...cur, p.id] : cur)}>
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b">
            <th className="py-2 text-left text-xs uppercase text-muted-foreground">Metric</th>
            {props.map((p) => <th key={p.id} className="py-2 text-left">{p.label}<div className="text-xs font-normal text-muted-foreground">{p.city}</div></th>)}
          </tr></thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-b">
                <td className="py-2 text-muted-foreground">{label}</td>
                {props.map((p) => <td key={p.id} className="py-2 font-medium">{(fn as any)(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function BuilderCertifiedSection() {
  const sections = [
    ["Construction timeline", "11 milestones"], ["Foundation photos", "12"], ["Framing photos", "18"],
    ["Roof details", "GAF Timberline HDZ"], ["Material list", "Documented"], ["Warranty registration", "Active"],
    ["Appliance records", "9 items"], ["Final inspection", "Passed 12/04/2025"], ["Neighborhood / lot", "Creekside Sec. 3, Lot 14"],
    ["Maintenance schedule", "12 months"], ["Homeowner welcome guide", "Included"],
  ];
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" />Builder Certified Homes</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Approved builder uploads, verified by Orivaz.</p>
        </div>
        <Badge className="bg-accent text-accent-foreground gap-1.5"><Award className="h-3 w-3" />Orivaz Builder Certified Home</Badge>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border bg-muted/40 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>
            <div>
              <p className="font-semibold">Creekside Homes</p>
              <p className="text-xs text-muted-foreground">123 Creekside Lane, Nashville TN</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(([l, v]) => (
            <div key={l} className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="mt-0.5 text-sm font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineSection() {
  const events = [
    ["2003", "Lot platted", "Creekside subdivision recorded"],
    ["2024-03", "Permits filed", "Foundation, framing, electrical"],
    ["2024-08", "Framing complete", "Inspection passed"],
    ["2024-11", "Roof installed", "GAF Timberline HDZ — 30-yr warranty"],
    ["2025-01", "Final inspection", "CO issued"],
    ["2025-02", "Builder warranty registered", "10-year structural"],
    ["2025-04", "Initial maintenance", "HVAC commissioning"],
    ["2025-09", "Ownership transferred", "To original buyer"],
    ["2025-11", "Annual inspection", "All systems normal"],
    ["2026-02", "Termite contract", "Annual prevention plan"],
    ["2026-05", "HVAC service", "Filter + coil cleaning"],
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Property Timeline</CardTitle></CardHeader>
      <CardContent>
        <ol className="relative border-l-2 border-border ml-3 space-y-4">
          {events.map(([d, t, sub], i) => (
            <li key={i} className="ml-4">
              <div className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary" />
              <p className="text-xs text-muted-foreground">{d}</p>
              <p className="text-sm font-semibold">{t}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function BuyConfidenceSection() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" />Should I Buy This Property?</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">One-click AI buy confidence report.</p>
        </div>
        <Button variant="outline" onClick={() => toast.success("Report PDF generated")}><Download className="mr-2 h-4 w-4" />Download</Button>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col items-center">
          <ScoreRing score={87} size={140} label="Confidence" />
          <Badge className="mt-3 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" variant="outline">Strong Buy</Badge>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Block title="Top strengths" tone="good" items={["New roof + HVAC (≤2 yrs)","10-yr structural warranty active","Low flood + crime zone","Complete documentation"]} />
          <Block title="Top risks" tone="warn" items={["Moderate storm exposure (TN)","HVAC service due year 5","Tax reassessment likely 2027"]} />
          <Block title="Expected 10-yr repairs" tone="neutral" items={["~$18,500 total","Water heater year ~10 ($1.8K)","Exterior paint year 8 ($4K)"]} />
          <Block title="Insurance concerns" tone="neutral" items={["Hail rider recommended","Wind deductible — review at renewal"]} />
          <Block title="Negotiation points" tone="neutral" items={["Request transferable warranties","Ask for recent termite inspection"]} />
          <Block title="Questions to ask seller" tone="neutral" items={["Any unfiled work?","Insurance claim history?","Original builder contact?"]} />
          <Block title="Documents still needed" tone="warn" items={["Survey","Septic / sewer inspection"]} />
        </div>
      </CardContent>
    </Card>
  );
}

function Block({ title, items, tone }: { title: string; items: string[]; tone: "good"|"warn"|"neutral" }) {
  const Icon = tone === "good" ? CheckCircle2 : tone === "warn" ? AlertTriangle : FileText;
  const cls = tone === "good" ? "text-emerald-600 dark:text-emerald-400" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className={`flex items-center gap-2 text-sm font-semibold ${cls}`}><Icon className="h-4 w-4" />{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {items.map((x) => <li key={x}>• {x}</li>)}
      </ul>
    </div>
  );
}

function MarketplaceSection() {
  const pros = [
    { name: "Top Notch Roofing", trade: "Roofer", rating: 4.9, projects: 142, area: "Middle TN", license: "TN-RCC-19842", ins: "$2M GL" },
    { name: "Comfort Air HVAC", trade: "HVAC", rating: 4.8, projects: 311, area: "Nashville Metro", license: "TN-HVAC-7721", ins: "$1M GL" },
    { name: "Reliable Plumbing Co", trade: "Plumber", rating: 4.7, projects: 198, area: "Williamson Co", license: "TN-PL-3344", ins: "$1M GL" },
    { name: "Bright Spark Electric", trade: "Electrician", rating: 4.9, projects: 256, area: "Davidson Co", license: "TN-EL-9981", ins: "$2M GL" },
    { name: "Hawkeye Home Inspections", trade: "Inspector", rating: 5.0, projects: 87, area: "TN Statewide", license: "TN-HI-441", ins: "E&O" },
    { name: "Cumberland Insurance", trade: "Insurance Agent", rating: 4.7, projects: 0, area: "TN", license: "NAIC-22118", ins: "Licensed" },
    { name: "Sarah Boone Realty", trade: "Realtor", rating: 4.9, projects: 64, area: "Nashville", license: "TN-RE-5511", ins: "E&O" },
    { name: "Magnolia Estate Law", trade: "Estate Planner", rating: 4.8, projects: 0, area: "TN", license: "TN-BAR-44219", ins: "Malpractice" },
    { name: "Bug Stop Pest Control", trade: "Pest Control", rating: 4.6, projects: 412, area: "Middle TN", license: "TN-PEST-882", ins: "$1M GL" },
    { name: "GreenScape Lawn", trade: "Landscaper", rating: 4.7, projects: 220, area: "Nashville", license: "Registered", ins: "$1M GL" },
    { name: "SmartHome TN", trade: "Smart Home", rating: 4.8, projects: 96, area: "Middle TN", license: "Low-Voltage", ins: "$1M GL" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" />Marketplace Recommendations</CardTitle>
        <p className="text-sm text-muted-foreground">Verified providers matched to this property.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pros.map((p) => (
            <div key={p.name} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.trade}</p>
                </div>
                <Badge variant="outline" className="gap-1 text-xs bg-accent/10 text-accent border-accent/30"><Shield className="h-3 w-3" />Verified</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating}</div>
                <div className="text-muted-foreground">{p.projects} jobs</div>
                <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{p.area}</div>
                <div className="text-muted-foreground truncate">{p.license}</div>
                <div className="col-span-2 text-muted-foreground">Insurance: {p.ins}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PositioningStrip() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {POSITIONING.map((m) => (
        <div key={m} className="rounded-xl border bg-card p-4 text-sm text-muted-foreground shadow-sm">
          <Sparkles className="mb-2 h-4 w-4 text-primary" />{m}
        </div>
      ))}
    </div>
  );
}
