import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { BuilderBadgeRow } from "@/components/builder/BuilderBadgeRow";
import { ShieldCheck, FileCheck2, Wrench, Star, Building2, Users, Home, Award } from "lucide-react";

export default function BuilderProgram() {
  const [founding, setFounding] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("builder_companies")
        .select("*")
        .eq("is_founding_builder", true)
        .order("founding_builder_number", { ascending: true })
        .limit(1)
        .maybeSingle();
      setFounding(data);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-hero px-6 py-16 text-primary-foreground">
        <div className="container">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-85">
            <ShieldCheck className="h-4 w-4" />Orivaz Builder Program
          </div>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl">Orivaz Builder Program</h1>
          <p className="mt-3 max-w-2xl text-lg opacity-90">
            Give every new home a verified digital record from day one.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth?mode=signup&role=builder">Join the Builder Program</Link>
            </Button>
            {founding && (
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <Link to={`/builders/${founding.slug}`}>See Founding Builder #001 →</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* What it is */}
      <section className="container py-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">What the Builder Program is</h2>
            <p className="mt-3 text-muted-foreground">
              A partnership between Orivaz and forward-thinking home builders to deliver
              every new home with a verified, lifelong digital record — warranties, construction
              history, contractor info, maintenance plans, and homeowner education in one place.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Why builders should use it</h2>
            <p className="mt-3 text-muted-foreground">
              Reduce warranty calls, organize subcontractor documentation, build trust with
              buyers, differentiate your communities, and give every homeowner an unmatched
              ownership experience from closing day forward.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted/30 py-12">
        <div className="container grid gap-6 md:grid-cols-2">
          <Card title="Benefits for homeowners" icon={Home} items={[
            "Verified digital record from day one",
            "All warranties in one place",
            "Construction history with photos",
            "Maintenance reminders tied to the home",
            "Easy transfer to the next owner",
          ]} />
          <Card title="Benefits for builders" icon={Building2} items={[
            "Orivaz Verified Builder badge",
            "Reduced warranty inquiries",
            "Marketing block for every listing",
            "Bulk-clone home records per lot",
            "Public builder profile + community pages",
          ]} />
        </div>
      </section>

      {/* Founding Builder Spotlight */}
      {founding && (
        <section className="container py-12">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
            <div className="grid gap-0 md:grid-cols-[1fr_320px]">
              <div className="p-8">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                  <Star className="h-4 w-4" />Founding Builder Spotlight
                </div>
                <h3 className="mt-2 text-2xl font-bold">{founding.name}</h3>
                {founding.tagline && <p className="mt-1 text-muted-foreground">{founding.tagline}</p>}
                <p className="mt-3 text-sm leading-relaxed">{founding.description}</p>
                <div className="mt-4">
                  <BuilderBadgeRow badges={founding.badges} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild><Link to={`/builders/${founding.slug}`}>View Builder Profile</Link></Button>
                  {founding.website && (
                    <Button asChild variant="outline">
                      <a href={founding.website} target="_blank" rel="noreferrer">{founding.website.replace(/^https?:\/\//, "")}</a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center bg-muted/40 p-8">
                {founding.logo_url ? (
                  <img src={founding.logo_url} alt={`${founding.name} logo`} className="max-h-40 w-auto object-contain" />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed text-center text-xs text-muted-foreground">
                    {founding.name}<br />logo
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-hero py-12 text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to join?</h2>
          <p className="mx-auto mt-2 max-w-xl opacity-90">
            Become a Orivaz Verified Builder and start delivering homes with verified digital records.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-5">
            <Link to="/auth?mode=signup&role=builder">Join the Builder Program</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Card({ title, icon: Icon, items }: { title: string; icon: any; items: string[] }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{i}
          </li>
        ))}
      </ul>
    </div>
  );
}
