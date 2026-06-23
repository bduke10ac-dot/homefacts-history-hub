import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BadgeCheck, Building2, Mail, MapPin, Phone, Search, Shield, ShieldAlert,
  Sparkles, Star, Users, Wrench,
} from "lucide-react";
import { networkPros, NETWORK_TRADES, type NetworkPro } from "@/lib/professionalsNetwork";

const BADGE_META: Record<NetworkPro["badge"], { label: string; cls: string; Icon: any }> = {
  green: { label: "Verified", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300", Icon: Shield },
  yellow: { label: "Caution", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300", Icon: ShieldAlert },
  gray: { label: "Unverified", cls: "bg-muted text-muted-foreground border-border", Icon: ShieldAlert },
};

export default function ProfessionalNetwork() {
  const [trade, setTrade] = useState<string>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return networkPros.filter((p) => {
      const matchTrade = trade === "All" || p.trade === trade;
      const matchQ =
        !q ||
        [p.name, p.company, p.city, p.state, p.trade]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());
      return matchTrade && matchQ;
    });
  }, [trade, q]);

  const verifiedCount = networkPros.filter((p) => p.badge === "green").length;
  const builderCount = networkPros.filter((p) => p.trade === "Builder").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="container relative py-14">
          <Badge className="mb-4" variant="outline">
            <Sparkles className="mr-1.5 h-3 w-3" /> Orivaz Verified Network
          </Badge>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            The <span className="text-gradient">Professional Network</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Every Orivaz property is supported by a verified network of builders, trades,
            inspectors, agents, and insurers — license, insurance, and reputation checked.
          </p>

          <div className="mt-6 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Verified pros", value: verifiedCount, Icon: BadgeCheck },
              { label: "Builder partners", value: builderCount, Icon: Building2 },
              { label: "Trades covered", value: NETWORK_TRADES.length - 1, Icon: Wrench },
              { label: "Members", value: networkPros.length, Icon: Users },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="lift rounded-xl border bg-card/80 p-4 backdrop-blur">
                <Icon className="h-4 w-4 text-primary" />
                <div className="mt-2 text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-10">
        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, company, city…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {NETWORK_TRADES.map((t) => (
              <button
                key={t}
                onClick={() => setTrade(t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  trade === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const meta = BADGE_META[p.badge];
            return (
              <Card key={p.id} className="lift overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {p.trade}
                      </div>
                      <CardTitle className="mt-0.5 truncate text-base">{p.name}</CardTitle>
                      <CardDescription className="truncate">{p.company}</CardDescription>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
                      <meta.Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-1.5">
                    {p.builderApproved && (
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        <BadgeCheck className="mr-1 h-3 w-3" /> Orivaz Founding Partner
                      </Badge>
                    )}
                    {p.preferred && (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                        Preferred
                      </Badge>
                    )}
                    <Badge variant="outline">Insurance: {p.insurance}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-2 text-center text-xs">
                    <div>
                      <div className="flex items-center justify-center gap-0.5 font-semibold">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {p.rating}
                      </div>
                      <div className="text-muted-foreground">Rating</div>
                    </div>
                    <div>
                      <div className="font-semibold">{p.jobs}</div>
                      <div className="text-muted-foreground">Jobs</div>
                    </div>
                    <div>
                      <div className="font-semibold">{p.yearsActive}y</div>
                      <div className="text-muted-foreground">Active</div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{p.city}, {p.state}</div>
                    <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{p.phone}</div>
                    <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3" />{p.email}</div>
                    <div>License: <span className="font-mono">{p.license}</span></div>
                  </div>

                  {p.note && (
                    <p className="rounded-md border bg-primary/5 p-2 text-xs italic text-foreground/80">
                      {p.note}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1">Request quote</Button>
                    <Button size="sm" variant="outline">Profile</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
              No professionals match those filters.
            </div>
          )}
        </div>

        {/* CTA */}
        <Card className="mt-10 overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="p-6">
              <Badge variant="outline" className="mb-2">For Pros</Badge>
              <h3 className="text-2xl font-bold">Join the Orivaz Verified Network</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get listed in front of every Orivaz homeowner in your service area. We verify
                license, insurance, bond, and reputation — then attach your work directly to the
                property's permanent digital identity.
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild><Link to="/auth?mode=signup">Apply to join</Link></Button>
                <Button variant="outline" asChild><Link to="/why">Why Orivaz</Link></Button>
              </div>
            </div>
            <div className="bg-gradient-hero p-6 text-primary-foreground">
              <h4 className="text-lg font-bold">What you get</h4>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  "Verified badge on every property report",
                  "Direct quote requests from homeowners",
                  "Workmanship attached to the home's permanent record",
                  "Builder-Approved status for partners of Orivaz builders",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />{x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
