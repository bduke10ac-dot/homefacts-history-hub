import { Link } from "react-router-dom";
import { Search, ShieldCheck, FileText, Wrench, Award, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
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
              HomeFacts Report tracks repairs, maintenance, warranties and contractor work — so homeowners, realtors, and buyers can trust what they see.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/demo"><FileText className="mr-2 h-5 w-5" />See a sample report</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/auth?mode=signup">Create My Report<ArrowRight className="ml-2 h-4 w-4" /></Link>
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
