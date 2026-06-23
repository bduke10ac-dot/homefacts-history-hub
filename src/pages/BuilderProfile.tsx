import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BuilderBadgeRow } from "@/components/builder/BuilderBadgeRow";
import { BuilderLogoUpload } from "@/components/builder/BuilderLogoUpload";
import { BuiltBy } from "@/components/builder/BuiltBy";
import { ShieldCheck, MapPin, Phone, Mail, Globe, Award, Home, Star, FileText, GraduationCap, Camera, ClipboardCheck, Building2 } from "lucide-react";
import { format } from "date-fns";

const LEVEL_CLS: Record<string, string> = {
  certified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  plus: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  elite: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

export default function BuilderProfile() {
  const { slug } = useParams();
  const { hasRole } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState({ homes: 0, communities: [] as string[], plans: [] as any[] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("builder_companies").select("*").eq("slug", slug!).eq("public_profile_enabled", true).maybeSingle();
    setCompany(data);
    if (data) {
      const [{ count }, { data: templates }] = await Promise.all([
        supabase.from("nb_property_clones").select("id", { count: "exact", head: true }).eq("company_id", data.id),
        supabase.from("nb_templates").select("id, name, subdivision, square_feet, bedrooms, bathrooms, kind").eq("company_id", data.id),
      ]);
      setStats({
        homes: count ?? 0,
        communities: Array.from(new Set((templates ?? []).map((t: any) => t.subdivision).filter(Boolean))),
        plans: (templates ?? []).filter((t: any) => t.kind !== "subdivision"),
      });
    }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!company) return (
    <div className="min-h-screen"><Navbar /><div className="container py-20 text-center"><p>Builder profile not available.</p></div></div>
  );

  const isAdmin = hasRole("admin");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <div className="bg-gradient-hero px-6 py-12 text-primary-foreground">
        <div className="container">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider opacity-85">
            <ShieldCheck className="h-4 w-4" />HomeFacts Certified Builder
            {company.is_founding_builder && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px]">
                <Star className="h-3 w-3" />Founding Builder #{company.founding_builder_number ?? "001"}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-primary-foreground/30 bg-primary-foreground/10">
              {company.logo_url
                ? <img src={company.logo_url} alt={`${company.name} logo`} className="h-full w-full object-contain" />
                : <span className="px-2 text-center text-[10px] opacity-80">Upload logo<br />in admin</span>}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold md:text-4xl">{company.name}</h1>
              {company.tagline && <p className="mt-1 opacity-90">{company.tagline}</p>}
            </div>
            <Badge variant="outline" className={`${LEVEL_CLS[company.certification_level] ?? ""} border-0 text-sm capitalize`}>
              <Award className="mr-1.5 h-3.5 w-3.5" />HomeFacts {company.certification_level}
            </Badge>
          </div>
          <div className="mt-5"><BuilderBadgeRow badges={company.badges} /></div>
        </div>
      </div>

      <div className="container py-8">
        {/* Description */}
        {company.description && (
          <Card className="mb-6"><CardContent className="p-5 text-sm leading-relaxed">{company.description}</CardContent></Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Certified homes" value={stats.homes} icon={Home} />
          <Stat label="Communities" value={stats.communities.length} icon={Building2} />
          <Stat label="Floor plans" value={stats.plans.length} icon={ClipboardCheck} />
          <Stat label="Years in business" value={company.years_in_business ?? "—"} icon={Award} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* About / Communities */}
          <Card className="md:col-span-2"><CardContent className="space-y-4 p-5 text-sm">
            <Section title="About" icon={ShieldCheck}>
              <div className="grid gap-1 text-muted-foreground">
                {company.license_number && <p><strong className="text-foreground">License:</strong> {company.license_number}</p>}
                {company.insurance_carrier && <p><strong className="text-foreground">Insurance:</strong> {company.insurance_carrier}</p>}
                {company.certified_since && <p><strong className="text-foreground">HomeFacts Certified since:</strong> {format(new Date(company.certified_since), "MMM yyyy")}</p>}
                {company.service_areas?.length > 0 && <p><strong className="text-foreground">Service areas:</strong> {company.service_areas.join(", ")}</p>}
              </div>
            </Section>

            <Section title="Communities" icon={Building2}>
              {stats.communities.length ? (
                <div className="flex flex-wrap gap-1.5">{stats.communities.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}</div>
              ) : <p className="text-muted-foreground">No communities yet.</p>}
            </Section>

            <Section title="Floor plans" icon={ClipboardCheck}>
              {stats.plans.length ? (
                <ul className="space-y-1">
                  {stats.plans.map((p) => (
                    <li key={p.id} className="flex items-center justify-between">
                      <span>{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.square_feet ?? "—"} sf · {p.bedrooms ?? "—"} bd / {p.bathrooms ?? "—"} ba</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">No floor plans yet.</p>}
            </Section>

            <Section title="Standard features" icon={ClipboardCheck}>
              <p className="text-muted-foreground">Energy-efficient HVAC · LED lighting · Smart thermostat · Tankless water heater · Builder limited warranty</p>
            </Section>

            <Section title="Warranties" icon={FileText}>
              <p className="text-muted-foreground">Structural warranty, workmanship coverage, and manufacturer warranties are organized in each home's digital record.</p>
            </Section>

            <Section title="HOA documents" icon={FileText}>
              <p className="text-muted-foreground">Available in each home's HomeFacts record after closing.</p>
            </Section>

            <Section title="Lot maps & school zones" icon={GraduationCap}>
              <p className="text-muted-foreground">Plat maps and school assignment info are attached to each home record.</p>
            </Section>

            <Section title="Construction photo history" icon={Camera}>
              <p className="text-muted-foreground">Stage-by-stage photos appear on each home's Construction Timeline.</p>
            </Section>

            <Section title="Final walkthrough documents" icon={ClipboardCheck}>
              <p className="text-muted-foreground">Stored in the Handoff packet at closing.</p>
            </Section>
          </CardContent></Card>

          {/* Contact + Admin */}
          <div className="space-y-4">
            <Card><CardContent className="space-y-2 p-5 text-sm">
              <h2 className="text-base font-semibold">Contact</h2>
              {company.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{company.phone}</p>}
              {company.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{company.email}</p>}
              {company.website && <a href={company.website} className="flex items-center gap-2 text-primary" target="_blank" rel="noreferrer"><Globe className="h-4 w-4" />{company.website.replace(/^https?:\/\//, "")}</a>}
              {(company.city || company.state) && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{[company.city, company.state].filter(Boolean).join(", ")}</p>}
            </CardContent></Card>

            {isAdmin && (
              <Card><CardContent className="space-y-3 p-5 text-sm">
                <h2 className="text-base font-semibold">Admin · Logo</h2>
                <BuilderLogoUpload companyId={company.id} currentUrl={company.logo_url} onUpdated={() => load()} />
                <Button asChild size="sm" variant="outline" className="w-full"><Link to="/admin/builders">Open admin settings</Link></Button>
              </CardContent></Card>
            )}

            <BuiltBy company={company} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</h3>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </CardContent></Card>
  );
}
