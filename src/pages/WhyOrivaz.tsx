import { Link } from "react-router-dom";
import {
  Check, X, Minus, ArrowRight, ShieldCheck, FileText, Wrench, Building2, HardHat,
  ClipboardCheck, Umbrella, Landmark, Zap, Home, Users, Banknote, Cloud, Sparkles,
  Activity, Gauge, Wrench as WrenchIcon, Calendar, TrendingUp, Hammer, Award,
  CircleDot, Repeat, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";

const comparisonRows: { feature: string; values: ("full" | "partial" | "none")[] }[] = [
  { feature: "Lifetime Property History", values: ["full", "none", "none", "partial", "partial"] },
  { feature: "Digital Home Binder", values: ["full", "none", "none", "partial", "none"] },
  { feature: "Verified Contractor Records", values: ["full", "none", "partial", "none", "none"] },
  { feature: "AI Home Health Score", values: ["full", "none", "none", "none", "none"] },
  { feature: "Maintenance Timeline", values: ["full", "none", "none", "partial", "none"] },
  { feature: "Insurance Claim History", values: ["full", "none", "none", "none", "partial"] },
  { feature: "Builder Documentation", values: ["full", "none", "none", "none", "none"] },
  { feature: "Permit Tracking", values: ["full", "partial", "none", "none", "partial"] },
  { feature: "Inspection History", values: ["full", "none", "none", "none", "partial"] },
  { feature: "Warranty Storage", values: ["full", "none", "none", "partial", "none"] },
  { feature: "Storm & Weather History", values: ["full", "none", "none", "none", "partial"] },
  { feature: "Climate Risk Analysis", values: ["full", "partial", "none", "none", "partial"] },
  { feature: "AI Maintenance Suggestions", values: ["full", "none", "none", "partial", "none"] },
  { feature: "Property Timeline", values: ["full", "none", "none", "none", "none"] },
  { feature: "Government Property Data", values: ["full", "partial", "none", "none", "full"] },
  { feature: "Transferable Record to Next Owner", values: ["full", "none", "none", "none", "none"] },
];

const competitorColumns = [
  "Orivaz",
  "Real Estate Sites",
  "Contractor Marketplaces",
  "Home Management Apps",
  "Property Data Providers",
];

const competitors = [
  { name: "Zillow", focus: "Real estate listings, home estimates, sales history", weakness: "Does not manage the complete life of the home after purchase" },
  { name: "Realtor.com", focus: "MLS listings and buyer search", weakness: "Listing-focused, not a permanent home record" },
  { name: "Redfin", focus: "Brokerage and listing platform", weakness: "Transaction-focused, not lifetime documentation" },
  { name: "Angi", focus: "Finding home service contractors", weakness: "Does not preserve verified property history" },
  { name: "Thumbtack", focus: "Hiring local professionals", weakness: "Contractor marketplace only, not property intelligence" },
  { name: "HomeZada", focus: "Home maintenance and budgeting", weakness: "Mostly homeowner-entered data with limited verification" },
  { name: "Centriq", focus: "Appliance manuals and product information", weakness: "Useful for home inventory, but not complete property history" },
  { name: "BuildFax", focus: "Permit and contractor history", weakness: "Closest competitor, but limited to reported data and not consumer-first" },
  { name: "CoreLogic", focus: "Enterprise property data", weakness: "Data provider for businesses, not a homeowner-owned record" },
  { name: "ATTOM", focus: "Property and public record data", weakness: "Data source only, not an interactive home lifecycle platform" },
];

const differentiators = [
  { icon: ShieldCheck, title: "Permanent Property Identity", desc: "Orivaz creates a secure record that stays with the property forever." },
  { icon: Wrench, title: "Verified Contractor Documentation", desc: "Contractors can upload invoices, photos, warranties, permits, notes, and completion records." },
  { icon: Activity, title: "AI Home Health Score", desc: "AI analyzes home condition, maintenance history, risk factors, warranties, repairs, and future needs." },
  { icon: Umbrella, title: "Insurance & Storm Intelligence", desc: "Track claim history, hail exposure, wind events, flood risk, tornado history, and weather-related property risks." },
  { icon: HardHat, title: "Builder Portal", desc: "Builders deliver a complete digital home package with warranties, manuals, materials, plans, and finish schedules." },
  { icon: Landmark, title: "Government & Permit Integration", desc: "Connect public property data, permits, inspections, tax assessor information, property lines, and code documentation." },
  { icon: Repeat, title: "Transferable Home Record", desc: "When the property sells, the verified record transfers to the next owner." },
];

const stakeholders = [
  { icon: Home, label: "Homeowners" },
  { icon: Users, label: "Buyers" },
  { icon: TrendingUp, label: "Sellers" },
  { icon: Wrench, label: "Contractors" },
  { icon: HardHat, label: "Builders" },
  { icon: ClipboardCheck, label: "Inspectors" },
  { icon: Umbrella, label: "Insurance" },
  { icon: Banknote, label: "Lenders" },
  { icon: Landmark, label: "Government" },
  { icon: Zap, label: "Utilities" },
];

const timeline = [
  "Land Development", "Construction", "Builder Documentation", "Certificate of Occupancy",
  "First Owner", "Maintenance History", "Roof Replacement", "HVAC Installation",
  "Insurance Claim", "Kitchen Remodel", "Home Sale", "Next Owner", "Future Improvements",
];

const aiFeatures = [
  { icon: Activity, t: "Home Health Score" },
  { icon: Calendar, t: "Maintenance Forecasting" },
  { icon: WrenchIcon, t: "Repair Recommendations" },
  { icon: Gauge, t: "Component Life Expectancy" },
  { icon: Umbrella, t: "Insurance Risk Analysis" },
  { icon: Cloud, t: "Climate Risk Monitoring" },
  { icon: ShieldCheck, t: "Code Compliance Assistance" },
  { icon: Hammer, t: "Renovation Planning" },
  { icon: TrendingUp, t: "Cost Forecasting" },
  { icon: Award, t: "Home Value Insights" },
];

const phases = [
  { n: "Phase 1", t: "Digital Home Records", d: "Homeowner portal, photo uploads, document storage, warranty vault, maintenance tracking, AI organization." },
  { n: "Phase 2", t: "Verified Documentation", d: "Contractor portal, builder portal, inspection reports, permit integration, AI verification." },
  { n: "Phase 3", t: "Property Intelligence", d: "AI Home Health Score, storm history, climate risk, insurance insights, predictive maintenance, cost forecasting." },
  { n: "Phase 4", t: "Transaction Platform", d: "Buyer portal, seller portal, digital disclosures, property transfer, AI buying assistant, mortgage integrations." },
  { n: "Phase 5", t: "National Property Network", d: "Government, insurance, utility, and lender integrations. National Orivaz property standard and API platform." },
];

const CellIcon = ({ v }: { v: "full" | "partial" | "none" }) => {
  if (v === "full") return <Check className="mx-auto h-5 w-5 text-emerald-600" />;
  if (v === "partial") return <Minus className="mx-auto h-5 w-5 text-amber-500" />;
  return <X className="mx-auto h-5 w-5 text-muted-foreground/40" />;
};

const WhyOrivaz = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Headline / Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary via-primary to-primary/80">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="container relative py-20 md:py-28 text-primary-foreground">
          <Badge variant="secondary" className="mb-5">Why Orivaz</Badge>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl max-w-4xl">
            Every Home Deserves a Orivaz Record
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-primary-foreground/85 md:text-xl">
            Orivaz creates a permanent digital identity for every property — connecting homeowners, buyers, sellers, builders, contractors, inspectors, insurers, lenders, and government records into one verified home history.
          </p>

          <div className="mt-12 max-w-3xl rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-6 backdrop-blur md:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">The Operating System for Home Ownership</p>
            <p className="mt-3 text-base text-primary-foreground/90 md:text-lg">
              Most real estate platforms only help people buy, sell, or search for homes. Orivaz follows the property for its entire life — from land development and construction to every repair, inspection, insurance claim, renovation, and future sale.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <a href="#comparison">View Competitive Advantage<ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <a href="#ecosystem">Explore Orivaz Ecosystem</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Orivaz vs. Traditional Platforms</h2>
          <p className="mt-4 text-muted-foreground">A side-by-side look at what existing tools cover — and where Orivaz goes further.</p>
        </div>

        <div className="mt-12 overflow-x-auto rounded-xl border shadow-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="sticky left-0 bg-muted/40 px-4 py-4 text-left font-semibold">Feature</th>
                {competitorColumns.map((c, i) => (
                  <th key={c} className={`px-4 py-4 text-center font-semibold ${i === 0 ? "bg-primary/10 text-primary" : ""}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr key={row.feature} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="sticky left-0 bg-inherit px-4 py-3 font-medium">{row.feature}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className={`px-4 py-3 text-center ${i === 0 ? "bg-primary/5" : ""}`}>
                      <CellIcon v={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Full coverage</span>
          <span className="flex items-center gap-2"><Minus className="h-4 w-4 text-amber-500" /> Partial</span>
          <span className="flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground/40" /> Not supported</span>
        </div>
      </section>

      {/* Competitor cards */}
      <section className="border-y bg-gradient-subtle">
        <div className="container py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Current Market Competitors</h2>
            <p className="mt-4 text-muted-foreground">Each platform solves a slice of the home journey. Orivaz unites every slice into one verified record.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {competitors.map((c) => (
              <Card key={c.name} className="transition-shadow hover:shadow-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{c.name}</CardTitle>
                    <Badge variant="outline">Competitor</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">Focus</p>
                    <p className="text-muted-foreground">{c.focus}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Gap</p>
                    <p className="text-muted-foreground">{c.weakness}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">What Makes Orivaz Different</h2>
          <p className="mt-4 text-muted-foreground">The capabilities that turn a property into a verified, lifelong digital asset.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((d) => (
            <div key={d.title} className="rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <d.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{d.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem */}
      <section id="ecosystem" className="border-y bg-gradient-to-b from-background to-muted/30">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">One Property. Every Stakeholder Connected.</h2>
            <p className="mt-4 text-muted-foreground">Every stakeholder contributes to or benefits from the same verified property record, creating more transparency, accountability, and trust.</p>
          </div>

          <div className="relative mx-auto mt-16 max-w-4xl">
            {/* Center hub */}
            <div className="mx-auto mb-10 flex max-w-sm flex-col items-center justify-center rounded-2xl border-2 border-primary bg-card p-6 text-center shadow-elevated">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <p className="mt-3 text-lg font-bold">Orivaz Property Record</p>
              <p className="text-xs text-muted-foreground">The single source of truth for every home</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {stakeholders.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center shadow-card transition-shadow hover:shadow-elevated">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">The Record Never Resets</h2>
          <p className="mt-4 text-muted-foreground">
            Unlike traditional real estate data, Orivaz follows the property forever. Every repair, inspection, document, permit, warranty, and improvement strengthens the home's verified history.
          </p>
        </div>

        <div className="relative mt-14">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 md:left-1/2 md:-translate-x-1/2" />
          <div className="space-y-6">
            {timeline.map((step, i) => (
              <div key={step} className={`relative flex items-center gap-4 md:gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                <div className="absolute left-4 z-10 flex h-3 w-3 -translate-x-1/2 items-center justify-center rounded-full bg-primary ring-4 ring-background md:left-1/2">
                  <CircleDot className="h-3 w-3 text-primary" />
                </div>
                <div className={`ml-10 flex-1 md:ml-0 md:max-w-[44%] ${i % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12"}`}>
                  <div className="inline-block rounded-lg border bg-card px-4 py-3 shadow-card">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {i + 1}</p>
                    <p className="font-semibold">{step}</p>
                  </div>
                </div>
                <div className="hidden flex-1 md:block md:max-w-[44%]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI */}
      <section className="border-y bg-gradient-subtle">
        <div className="container py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4"><Sparkles className="mr-1 h-3 w-3" /> AI Intelligence</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">AI That Understands the Home</h2>
            <p className="mt-4 text-muted-foreground">
              Orivaz uses AI to turn scattered documents, photos, public records, inspections, permits, and contractor updates into clear, useful insights for homeowners and buyers.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {aiFeatures.map((a) => (
              <div key={a.t} className="rounded-xl border bg-card p-5 text-center shadow-card transition-shadow hover:shadow-elevated">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <a.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">{a.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Orivaz Growth Roadmap</h2>
          <p className="mt-4 text-muted-foreground">A staged path from homeowner records to a national property network.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {phases.map((p, i) => (
            <Card key={p.n} className={`relative overflow-hidden ${i === 0 ? "border-primary/40" : ""}`}>
              <div className="absolute right-0 top-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground bg-primary rounded-bl-lg">
                {p.n}
              </div>
              <CardHeader className="pt-12">
                <CardTitle className="text-lg">{p.t}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden border-t bg-gradient-to-br from-primary via-primary to-primary/80">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, white 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        <div className="container relative py-20 md:py-28 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold md:text-5xl">Orivaz Is More Than a Real Estate App</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-primary-foreground/85">
            Orivaz is the digital identity and lifelong operating system for every property — bringing ownership history, maintenance, insurance, contractors, inspections, warranties, public records, AI guidance, and verified documentation into one trusted platform that follows the home from construction through every owner.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth?mode=signup">Start Building Your Orivaz Record<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/auth?mode=signup&role=contractor">Join the Verified Contractor Network</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/auth?mode=signup&role=builder">Partner With Orivaz</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Orivaz Property Report. Built on trust.
      </footer>
    </div>
  );
};

export default WhyOrivaz;
