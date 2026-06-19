import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Calendar, ShieldCheck, FileText, Hammer, Wrench, FileSearch,
  Award, Building2, ArrowRight, Sparkles, Home, TrendingUp, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { computeHealthScore } from "@/lib/healthScore";
import { computeRiskScores } from "@/lib/riskScores";
import { HealthScoreCard } from "@/components/health/HealthScoreCard";
import { RiskBadgeGrid } from "@/components/health/RiskBadgeGrid";

const property = {
  address_line: "1428 Maple Ridge Lane",
  city: "Austin", state: "TX", zip: "78704",
  year_built: 2008, square_feet: 2480, bedrooms: 4, bathrooms: 3,
  property_type: "Single Family",
};

const records = [
  { id: "1", category: "renovation", icon: Building2, title: "Full kitchen remodel", description: "Custom shaker cabinetry, quartz countertops, new stainless appliances, recessed LED lighting, and tile backsplash. Permitted with city of Austin.", performed_by: "Hilltop Renovations LLC", cost: 38500, performed_at: "2024-08-12", verified: true },
  { id: "2", category: "repair", icon: Hammer, title: "Roof replacement — architectural shingles", description: "Full tear-off and replacement with GAF Timberline HDZ shingles. 25-year transferable warranty included.", performed_by: "Lone Star Roofing", cost: 14200, performed_at: "2024-03-22", verified: true },
  { id: "3", category: "maintenance", icon: Wrench, title: "HVAC service & coil cleaning", description: "Annual tune-up on both upstairs and downstairs units. Replaced capacitor on condenser #2.", performed_by: "Cool Breeze HVAC", cost: 385, performed_at: "2024-06-04", verified: true },
  { id: "4", category: "warranty", icon: Award, title: "Tankless water heater — 12yr warranty registered", description: "Rinnai RU199iN installed and registered to property. Warranty transfers with sale.", performed_by: "Austin Plumbing Co.", cost: 4100, performed_at: "2023-11-09", verified: true },
  { id: "5", category: "inspection", icon: FileSearch, title: "Pre-listing home inspection", description: "Comprehensive 4-point inspection. Minor items addressed prior to listing. Full report attached.", performed_by: "Capital Inspections", cost: 525, performed_at: "2025-01-18", verified: true },
  { id: "6", category: "repair", icon: Hammer, title: "Foundation drainage correction", description: "Installed French drain along east side of property to redirect runoff. Engineer-approved scope.", performed_by: "Texas Foundation Pros", cost: 6800, performed_at: "2023-05-30", verified: true },
];

const Demo = () => {
  const verifiedCount = records.filter((r) => r.verified).length;
  const totalSpent = records.reduce((s, r) => s + r.cost, 0);
  const health = computeHealthScore(property, records);
  const risks = computeRiskScores(property, records);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      {/* Demo banner */}
      <div className="border-b bg-primary/5">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">You're viewing a sample report.</span>
            <span className="hidden text-muted-foreground sm:inline">All data is fictional.</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/auth?mode=signup">Create My Report<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth?mode=signup&role=realtor">Realtor Pro Trial</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="space-y-6">
          {/* Header card */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-elevated">
            <div className="bg-gradient-hero px-8 py-10 text-primary-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-85">
                <ShieldCheck className="h-4 w-4" />HomeFacts Report
              </div>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">{property.address_line}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-primary-foreground/85">
                <MapPin className="h-4 w-4" />{property.city}, {property.state} {property.zip}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15"><CheckCircle2 className="mr-1 h-3 w-3" />Verified history</Badge>
                <Badge className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15"><Award className="mr-1 h-3 w-3" />Warranties on file</Badge>
                <Badge className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15"><TrendingUp className="mr-1 h-3 w-3" />Move-in ready</Badge>
              </div>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-4">
              {[
                { label: "Year built", value: property.year_built },
                { label: "Square feet", value: property.square_feet.toLocaleString() },
                { label: "Beds / Baths", value: `${property.bedrooms} / ${property.bathrooms}` },
                { label: "Type", value: property.property_type },
              ].map((s) => (
                <div key={s.label} className="bg-card px-6 py-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-lg font-semibold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Health + Risk */}
          <div className="grid gap-4 lg:grid-cols-2">
            <HealthScoreCard result={health} />
            <RiskBadgeGrid risks={risks} />
          </div>

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Total records" value={records.length} icon={FileText} />
            <SummaryCard label="Verified" value={verifiedCount} icon={ShieldCheck} accent />
            <SummaryCard label="Documented spend" value={`$${totalSpent.toLocaleString()}`} icon={Award} />
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Property history</h2>
              <span className="text-xs text-muted-foreground">Newest first</span>
            </div>
            <ol className="mt-6 space-y-4">
              {records.map((r) => {
                const Icon = r.icon;
                return (
                  <li key={r.id} className="flex gap-4 rounded-xl border bg-background p-5 transition-shadow hover:shadow-card">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{r.title}</h3>
                        <Badge variant="secondary" className="capitalize">{r.category}</Badge>
                        <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                          <ShieldCheck className="mr-1 h-3 w-3" />Verified
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(r.performed_at), "MMM d, yyyy")}</span>
                        <span>By {r.performed_by}</span>
                        <span className="font-medium text-foreground">${r.cost.toLocaleString()}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Bottom CTA */}
          <div className="rounded-2xl border bg-gradient-hero p-8 text-center text-primary-foreground shadow-elevated md:p-12">
            <Home className="mx-auto h-10 w-10 opacity-90" />
            <h2 className="mt-4 text-2xl font-bold md:text-3xl">Ready to build your own HomeFacts Report?</h2>
            <p className="mx-auto mt-2 max-w-xl text-primary-foreground/85">
              Document repairs, warranties, and upgrades — and sell your home faster with proof buyers trust.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth?mode=signup">Create My Report<ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/auth?mode=signup&role=realtor">Realtor Pro Trial</Link>
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Sample report generated by HomeFacts Report on {format(new Date(), "MMM d, yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
};

function SummaryCard({ label, value, icon: Icon, accent }: { label: string; value: any; icon: any; accent?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default Demo;
