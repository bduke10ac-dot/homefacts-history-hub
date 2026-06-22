import { Link } from "react-router-dom";
import { Search, ShieldCheck, FileText, Wrench, Award, ArrowRight, CheckCircle2, HardHat, QrCode, Sparkles, BadgeCheck, Home, TrendingUp, Users, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { AddressSearch } from "@/components/address/AddressSearch";
import heroImage from "@/assets/hero-home.jpg";

const features = [
  { icon: ShieldCheck, title: "Verified history", desc: "Every record reviewed and confirmed by our admin team for accuracy you can trust." },
  { icon: Wrench, title: "Contractor-submitted work", desc: "Licensed contractors log completed jobs directly — no more lost receipts." },
  { icon: FileText, title: "Shareable reports", desc: "Realtors generate beautiful, printable PDF reports for buyers in one click." },
  { icon: Award, title: "Boost home value", desc: "A documented home sells faster and for more. Show buyers exactly what they're getting." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <img src={heroImage} alt="Modern home exterior" className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-40" />
        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
              <CheckCircle2 className="h-3.5 w-3.5" /> The Carfax for homes
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
              Know the full story behind every home.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-primary-foreground/85 md:text-xl">
              Get an instant property history, neighborhood intelligence, and risk report on any U.S. address.
            </p>
            <div className="mt-8 max-w-2xl rounded-2xl bg-background/95 p-3 shadow-elevated backdrop-blur">
              <AddressSearch />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button size="sm" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/why">Why HomeFacts? →</Link>
              </Button>
              <Button size="sm" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/demo"><FileText className="mr-2 h-4 w-4" />See a sample report</Link>
              </Button>
              <Button size="sm" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/properties/22222222-2222-2222-2222-222222222222/home-history">See contractor fraud demo →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Everything a home's history should be.</h2>
          <p className="mt-4 text-muted-foreground">Built for homeowners, realtors, contractors, and the buyers who trust them.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-subtle border-y">
        <div className="container py-20">
          <h2 className="text-center text-3xl font-bold md:text-4xl">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { n: "1", t: "Search any address", d: "Find a home and see its public report instantly." },
              { n: "2", t: "Add or claim records", d: "Homeowners log work, contractors submit jobs." },
              { n: "3", t: "Share with confidence", d: "Realtors generate a printable PDF for buyers." },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-glow">{s.n}</div>
                <h3 className="mt-4 font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certified Builder Program */}
      <section className="relative overflow-hidden border-y bg-gradient-to-br from-primary via-primary to-primary/80">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="container relative py-20 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <HardHat className="h-3.5 w-3.5" /> For Home Builders & Developers
              </span>
              <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
                Become a HomeFacts Certified Builder.
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/85">
                Hand every buyer a digital birth certificate for their new home — a permanent, transferable record that travels with the property forever.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: BadgeCheck, t: "Certified badge & public profile", d: "Display your verified Certified, Plus, or Elite tier on yard signs, MLS, and your website." },
                  { icon: QrCode, t: "QR handoff at closing", d: "One scan delivers warranties, manuals, subs, and inspections — no login required." },
                  { icon: Sparkles, t: "AI Home Assistant included", d: "Buyers get instant answers about their home, branded by you. Fewer warranty calls." },
                  { icon: Award, t: "Differentiate & sell faster", d: "Documented homes resell for more. Your brand shows up every time the home changes hands." },
                ].map((b) => (
                  <li key={b.t} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 text-primary-foreground"><b.icon className="h-4 w-4" /></div>
                    <div>
                      <p className="font-semibold">{b.t}</p>
                      <p className="text-sm text-primary-foreground/75">{b.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/auth?mode=signup&role=builder">Apply for Certification<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                  <Link to="/builders/lone-star-homes">See a Certified Builder</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="mx-auto max-w-sm rounded-2xl bg-background p-6 shadow-elevated">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Digital Home Passport</p>
                    <p className="mt-1 text-sm font-semibold">1247 Bluebonnet Ln</p>
                    <p className="text-xs text-muted-foreground">Austin, TX · Built 2026</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary bg-card">
                    <div className="text-center">
                      <ShieldCheck className="mx-auto h-5 w-5 text-primary" />
                      <p className="text-[7px] font-bold uppercase">Certified</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { l: "HVAC · 10-yr warranty", c: "bg-emerald-500" },
                    { l: "Roof · 30-yr warranty", c: "bg-emerald-500" },
                    { l: "Appliances · 1-yr warranty", c: "bg-amber-500" },
                    { l: "Foundation · transferable", c: "bg-emerald-500" },
                  ].map((r) => (
                    <div key={r.l} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${r.c}`} />
                      <span className="flex-1">{r.l}</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg bg-gradient-subtle p-3 text-center text-[11px] text-muted-foreground">
                  Built by <span className="font-semibold text-foreground">Lone Star Homes</span> · HomeFacts Elite Builder
                </div>
              </div>
              <div className="absolute -bottom-4 -right-2 rotate-6 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-amber-950 shadow-elevated">
                Transferable for life
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Realtor Success Center — Spotlight */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background flourish */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-background to-primary/5 dark:from-amber-950/20 dark:via-background dark:to-primary/10" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-current" /> Built for Real Estate Pros
            </span>
            <h2 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              Win more listings.{" "}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-primary bg-clip-text text-transparent">
                Close them faster.
              </span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground md:text-xl">
              The Realtor Success Center turns every listing into a verified, buyer-ready digital property — and keeps clients for life.
            </p>
          </div>

          {/* Stat strip */}
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { v: "3x", l: "More listing wins" },
              { v: "32%", l: "Faster to close" },
              { v: "100%", l: "Verified records" },
              { v: "Lifetime", l: "Client retention" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border bg-background/70 p-4 text-center shadow-sm backdrop-blur">
                <p className="text-2xl font-bold text-primary md:text-3xl">{s.v}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Home, t: "Branded Listing Workspace", d: "Every listing becomes a polished, shareable property profile with verified history, photos, and documents." },
              { icon: Sparkles, t: "AI Listing Assistant", d: "Generate listing descriptions, social posts, and property history summaries in seconds." },
              { icon: TrendingUp, t: "Earn Rewards & Status", d: "Climb from Bronze to Elite Partner. Earn points on every certified listing and closing." },
              { icon: Users, t: "Lifetime Client CRM", d: "Automated check-ins for warranties, anniversaries, and maintenance keep you top-of-mind." },
              { icon: BadgeCheck, t: "HomeFacts Certified Badge", d: "Stand out on MLS with the trust badge buyers recognize and lenders respect." },
              { icon: Zap, t: "Marketing Center", d: "On-brand flyers, social graphics, and QR codes — generated for every property, instantly." },
            ].map((f) => (
              <div key={f.t} className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated">
                <div className="absolute right-0 top-0 h-24 w-24 -translate-y-12 translate-x-12 rounded-full bg-gradient-to-br from-amber-400/20 to-primary/20 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-glow">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="relative mt-4 text-lg font-semibold">{f.t}</h3>
                <p className="relative mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>

          {/* CTA bar */}
          <div className="mx-auto mt-12 max-w-4xl rounded-2xl border bg-gradient-to-r from-primary to-primary/80 p-6 shadow-elevated md:p-8">
            <div className="flex flex-col items-center justify-between gap-5 md:flex-row md:text-left">
              <div className="text-center text-primary-foreground md:text-left">
                <p className="text-xl font-bold md:text-2xl">Ready to grow your real estate business?</p>
                <p className="mt-1 text-sm text-primary-foreground/85">Free 30-day Pro trial. No credit card required.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg" variant="secondary" className="font-semibold" asChild>
                  <Link to="/realtor">Open Success Center<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                  <Link to="/auth?mode=signup&role=realtor">Start Free Trial</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="container py-20 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Start documenting your home today.</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Free for homeowners. Trusted by realtors and contractors.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/auth?mode=signup">Create My Report<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/auth?mode=signup&role=realtor">Realtor Pro Trial</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} HomeFacts Report. Built on trust.
      </footer>
    </div>
  );
};

export default Index;
