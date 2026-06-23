import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp } from "lucide-react";

interface Project {
  key: string; label: string; cost: [number, number]; valueLiftPct: number;
  insuranceSavingsPct: number; energySavingsAnnual: number; warranty: string; resale: "low" | "med" | "high";
  docs: string[];
}

const PROJECTS: Project[] = [
  { key: "roof", label: "Roof replacement", cost: [9000, 25000], valueLiftPct: 4, insuranceSavingsPct: 12, energySavingsAnnual: 150, warranty: "25–50 yr", resale: "high", docs: ["Permit","Manufacturer warranty","Inspection","Photos"] },
  { key: "windows", label: "Windows (whole house)", cost: [12000, 30000], valueLiftPct: 3, insuranceSavingsPct: 4, energySavingsAnnual: 400, warranty: "20 yr", resale: "med", docs: ["U-factor spec","Permit","Energy rebate paperwork"] },
  { key: "kitchen", label: "Kitchen remodel", cost: [25000, 80000], valueLiftPct: 7, insuranceSavingsPct: 0, energySavingsAnnual: 100, warranty: "Varies", resale: "high", docs: ["Permits","Designer plans","Receipts"] },
  { key: "bath", label: "Bathroom remodel", cost: [10000, 35000], valueLiftPct: 4, insuranceSavingsPct: 0, energySavingsAnnual: 60, warranty: "Varies", resale: "med", docs: ["Plumbing permit","Receipts"] },
  { key: "hvac", label: "HVAC replacement", cost: [6000, 14000], valueLiftPct: 2, insuranceSavingsPct: 2, energySavingsAnnual: 350, warranty: "10 yr", resale: "med", docs: ["Permit","Manual J","Manufacturer warranty"] },
  { key: "solar", label: "Solar PV system", cost: [15000, 30000], valueLiftPct: 4, insuranceSavingsPct: 0, energySavingsAnnual: 1500, warranty: "25 yr", resale: "med", docs: ["Interconnect agreement","Permit","ITC docs"] },
  { key: "siding", label: "Siding replacement", cost: [10000, 30000], valueLiftPct: 3, insuranceSavingsPct: 5, energySavingsAnnual: 80, warranty: "20–40 yr", resale: "med", docs: ["Permit","Material warranty"] },
  { key: "flooring", label: "Flooring", cost: [4000, 18000], valueLiftPct: 2, insuranceSavingsPct: 0, energySavingsAnnual: 0, warranty: "10–25 yr", resale: "med", docs: ["Receipts","Warranty"] },
  { key: "landscape", label: "Landscaping", cost: [3000, 20000], valueLiftPct: 2, insuranceSavingsPct: 0, energySavingsAnnual: 0, warranty: "1 yr", resale: "med", docs: ["Site plan","Receipts"] },
  { key: "smart", label: "Smart home upgrades", cost: [1000, 6000], valueLiftPct: 1, insuranceSavingsPct: 3, energySavingsAnnual: 120, warranty: "1–3 yr", resale: "low", docs: ["Device manifest","Receipts"] },
  { key: "insulation", label: "Insulation", cost: [1500, 7000], valueLiftPct: 1, insuranceSavingsPct: 0, energySavingsAnnual: 250, warranty: "Lifetime", resale: "low", docs: ["R-value report","Receipts"] },
  { key: "gutters", label: "Gutters & guards", cost: [1500, 5000], valueLiftPct: 1, insuranceSavingsPct: 2, energySavingsAnnual: 0, warranty: "5–20 yr", resale: "low", docs: ["Receipts","Warranty"] },
];

export default function ImprovementROI() {
  const { id } = useParams();
  const [homeValue, setHomeValue] = useState(425000);
  const [selected, setSelected] = useState<string>("roof");
  const p = useMemo(() => PROJECTS.find((x) => x.key === selected)!, [selected]);
  const midCost = (p.cost[0] + p.cost[1]) / 2;
  const valueAdd = Math.round(homeValue * (p.valueLiftPct / 100));
  const insuranceSavings = Math.round((homeValue * 0.005) * (p.insuranceSavingsPct / 100) * 100) / 100 * 100;
  const fiveYearReturn = valueAdd + p.energySavingsAnnual * 5 + insuranceSavings * 5;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back to property</Link>
        <h1 className="mt-3 text-2xl font-bold">Home Improvement ROI</h1>
        <p className="text-sm text-muted-foreground">Estimate value lift, insurance savings, and resale impact.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <Label htmlFor="hv" className="text-xs uppercase text-muted-foreground">Estimated home value</Label>
            <Input id="hv" type="number" value={homeValue} onChange={(e) => setHomeValue(Number(e.target.value) || 0)} className="mt-1" />
            <p className="mt-4 mb-2 text-xs uppercase text-muted-foreground">Projects</p>
            <div className="space-y-1">
              {PROJECTS.map((pr) => (
                <button key={pr.key} onClick={() => setSelected(pr.key)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selected === pr.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-gradient-hero p-6 text-primary-foreground shadow-card">
              <div className="flex items-center gap-2 text-xs uppercase opacity-80"><TrendingUp className="h-4 w-4" />{p.label}</div>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <div><p className="text-xs opacity-80">Project cost</p><p className="text-2xl font-bold">${p.cost[0].toLocaleString()}–${p.cost[1].toLocaleString()}</p></div>
                <div><p className="text-xs opacity-80">Estimated value add</p><p className="text-2xl font-bold">+${valueAdd.toLocaleString()}</p></div>
                <div><p className="text-xs opacity-80">5-yr total return</p><p className="text-2xl font-bold">${Math.round(fiveYearReturn).toLocaleString()}</p></div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Stat label="Value lift" value={`${p.valueLiftPct}%`} />
              <Stat label="Insurance savings / yr" value={`~$${Math.round(insuranceSavings).toLocaleString()}`} />
              <Stat label="Energy savings / yr" value={`$${p.energySavingsAnnual.toLocaleString()}`} />
              <Stat label="Warranty" value={p.warranty} />
              <Stat label="Resale impact" value={p.resale.toUpperCase()} />
              <Stat label="Midpoint cost" value={`$${Math.round(midCost).toLocaleString()}`} />
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <h3 className="font-semibold">Documentation checklist</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {p.docs.map((d) => (
                  <li key={d} className="flex items-center gap-2"><Badge variant="outline">Required</Badge>{d}</li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm"><Link to={`/property/${id}/projects`}>Save to projects</Link></Button>
                <Button asChild size="sm" variant="outline"><Link to={`/property/${id}/vault`}>Upload documents</Link></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
