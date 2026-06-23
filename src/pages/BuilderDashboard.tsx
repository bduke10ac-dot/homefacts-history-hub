import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuilderBadgeRow } from "@/components/builder/BuilderBadgeRow";
import { LayoutTemplate, Home as HomeIcon, ShieldCheck, AlertTriangle, Hammer, PackageCheck, FileText, Users, Star, Wrench, Megaphone, Settings, ClipboardList, Building2 } from "lucide-react";

const TABS: Array<{ label: string; href: string; icon: any }> = [
  { label: "Homes", href: "/builder/clones", icon: HomeIcon },
  { label: "Communities", href: "/builder/templates", icon: Building2 },
  { label: "Documents", href: "/builder/templates", icon: FileText },
  { label: "Warranties", href: "/builder/clones", icon: ShieldCheck },
  { label: "Contractors", href: "/builder/clones", icon: Users },
  { label: "Handoff", href: "/builder/clones", icon: PackageCheck },
  { label: "Marketing", href: "/builder/marketing", icon: Megaphone },
  { label: "Settings", href: "/admin/builders", icon: Settings },
];

export default function BuilderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    templates: 0, homes: 0, underConstruction: 0, readyForHandoff: 0, handedOff: 0,
    expiringWarranties: 0, documents: 0, communities: 0, companies: [] as any[],
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: memberships } = await supabase
        .from("builder_company_members")
        .select("company_id, role, builder_companies(*)")
        .eq("user_id", user.id);
      const companyIds = (memberships ?? []).map((m: any) => m.company_id);
      if (!companyIds.length) {
        // fallback: if user has no membership but the founding builder exists, surface it for demo
        const { data: founding } = await supabase.from("builder_companies").select("*").eq("is_founding_builder", true).limit(1);
        setStats((s) => ({ ...s, companies: founding ?? [] }));
        return;
      }
      const [{ count: tCount }, { data: clones }, { data: comms }, { data: warn }, { count: docCount }] = await Promise.all([
        supabase.from("nb_templates").select("id", { count: "exact", head: true }).in("company_id", companyIds),
        supabase.from("nb_property_clones").select("id, status").in("company_id", companyIds),
        supabase.from("nb_templates").select("subdivision").in("company_id", companyIds),
        supabase.from("v_nb_clone_warranty_status" as any).select("id, status, clone_id, nb_property_clones!inner(company_id)").eq("status", "expiring_soon"),
        supabase.from("nb_clone_documents").select("id", { count: "exact", head: true }),
      ]);
      const homes = clones ?? [];
      setStats({
        templates: tCount ?? 0,
        homes: homes.length,
        underConstruction: homes.filter((c: any) => c.status === "under_construction").length,
        readyForHandoff: homes.filter((c: any) => c.status === "ready_for_handoff").length,
        handedOff: homes.filter((c: any) => c.status === "handed_off" || c.status === "transferred").length,
        expiringWarranties: (warn ?? []).filter((w: any) => companyIds.includes(w.nb_property_clones?.company_id)).length,
        documents: docCount ?? 0,
        communities: new Set((comms ?? []).map((c: any) => c.subdivision).filter(Boolean)).size,
        companies: (memberships ?? []).map((m: any) => m.builder_companies),
      });
    })();
  }, [user]);

  const co = stats.companies[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {co?.logo_url ? (
              <img src={co.logo_url} alt={`${co.name} logo`} className="h-14 w-14 rounded-xl border bg-card object-contain p-1" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>
            )}
            <div>
              <h1 className="text-2xl font-bold">Builder Portal</h1>
              <p className="text-sm text-muted-foreground">{co?.name ?? "No builder company yet"}</p>
              {co?.badges?.length > 0 && <div className="mt-2"><BuilderBadgeRow badges={co.badges} /></div>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {co?.slug && <Button asChild size="sm"><Link to={`/builders/${co.slug}`}>Public profile</Link></Button>}
            <Button asChild size="sm" variant="outline"><Link to="/builders">Builder Program</Link></Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="-mx-4 mb-6 overflow-x-auto px-4">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <Button key={t.label} asChild size="sm" variant="outline" className="whitespace-nowrap">
                <Link to={t.href}><t.icon className="mr-1.5 h-4 w-4" />{t.label}</Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total homes added" value={stats.homes} icon={HomeIcon} />
          <StatCard label="Active communities" value={stats.communities} icon={Building2} />
          <StatCard label="Homes under construction" value={stats.underConstruction} icon={Hammer} />
          <StatCard label="Ready for handoff" value={stats.readyForHandoff} icon={PackageCheck} />
          <StatCard label="Warranty requests" value={stats.expiringWarranties} icon={AlertTriangle} accent />
          <StatCard label="Documents uploaded" value={stats.documents} icon={FileText} />
          <StatCard label="Homeowner activations" value={stats.handedOff} icon={Users} />
          <StatCard label="Templates" value={stats.templates} icon={LayoutTemplate} />
        </div>

        {/* How it works */}
        <div className="mt-6 rounded-xl border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-base font-semibold"><ShieldCheck className="h-4 w-4" />How it works</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Build a master template per model or subdivision.</li>
            <li>Bulk-clone the template for each lot.</li>
            <li>Track each home's construction timeline through 18 stages.</li>
            <li>Generate the homeowner handoff packet + QR at closing.</li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/builder/templates">Manage templates</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/builder/clones">Manage homes</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/builder/marketing">Marketing</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: any; icon: any; accent?: boolean }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
    </Card>
  );
}
