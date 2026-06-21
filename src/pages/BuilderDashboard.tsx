import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, Home as HomeIcon, ShieldCheck, AlertTriangle } from "lucide-react";

export default function BuilderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ templates: 0, clones: 0, expiring: 0, companies: [] as any[] });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: memberships } = await supabase
        .from("builder_company_members")
        .select("company_id, role, builder_companies(*)")
        .eq("user_id", user.id);
      const companyIds = (memberships ?? []).map((m: any) => m.company_id);
      if (!companyIds.length) {
        setStats({ templates: 0, clones: 0, expiring: 0, companies: [] });
        return;
      }
      const [{ count: tCount }, { count: cCount }, { data: warn }] = await Promise.all([
        supabase.from("nb_templates").select("id", { count: "exact", head: true }).in("company_id", companyIds),
        supabase.from("nb_property_clones").select("id", { count: "exact", head: true }).in("company_id", companyIds),
        supabase.from("v_nb_clone_warranty_status" as any).select("id, status, clone_id, nb_property_clones!inner(company_id)").eq("status", "expiring_soon"),
      ]);
      setStats({
        templates: tCount ?? 0,
        clones: cCount ?? 0,
        expiring: (warn ?? []).filter((w: any) => companyIds.includes(w.nb_property_clones?.company_id)).length,
        companies: (memberships ?? []).map((m: any) => m.builder_companies),
      });
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Builder Portal</h1>
            <p className="text-sm text-muted-foreground">
              {stats.companies[0]?.name ?? "No builder company yet"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/builder/templates">Templates</Link></Button>
            <Button asChild size="sm"><Link to="/builder/clones">Homes</Link></Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Templates" value={stats.templates} icon={LayoutTemplate} />
          <StatCard label="Homes" value={stats.clones} icon={HomeIcon} />
          <StatCard label="Warranties expiring soon" value={stats.expiring} icon={AlertTriangle} accent />
        </div>

        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold"><ShieldCheck className="h-4 w-4" />How it works</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Build a master template per model or subdivision.</li>
            <li>Bulk-clone the template for each lot.</li>
            <li>Fill in addresses, permits, inspections, and warranties as construction progresses.</li>
            <li>Generate the homeowner handoff QR at closing.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: any; icon: any; accent?: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-amber-500/15 text-amber-600" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
    </Card>
  );
}
