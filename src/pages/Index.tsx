import { Link } from "react-router-dom";
import { Search, ShieldCheck, FileText, Wrench, Award, ArrowRight, CheckCircle2, HardHat, QrCode, Sparkles, BadgeCheck } from "lucide-react";
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
