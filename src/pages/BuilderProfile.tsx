import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, Phone, Mail, Globe, Award, Home } from "lucide-react";
import { format } from "date-fns";

const LEVEL_CLS: Record<string, string> = {
  certified: "bg-emerald-500/15 text-emerald-700",
  plus: "bg-blue-500/15 text-blue-700",
  elite: "bg-amber-500/15 text-amber-700",
};

export default function BuilderProfile() {
  const { slug } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState({ homes: 0, communities: [] as string[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("builder_companies")
        .select("*")
        .eq("slug", slug!)
        .eq("public_profile_enabled", true)
        .maybeSingle();
      setCompany(data);
      if (data) {
        const [{ count }, { data: templates }] = await Promise.all([
          supabase.from("nb_property_clones").select("id", { count: "exact", head: true }).eq("company_id", data.id),
          supabase.from("nb_templates").select("subdivision").eq("company_id", data.id),
        ]);
        setStats({
          homes: count ?? 0,
          communities: Array.from(new Set((templates ?? []).map((t: any) => t.subdivision).filter(Boolean))),
        });
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!company) return <div className="flex min-h-screen items-center justify-center"><p>Builder profile not available.</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-hero px-6 py-12 text-primary-foreground">
        <div className="container">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
            <ShieldCheck className="h-4 w-4" />HomeFacts Certified Builder
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{company.name}</h1>
              {company.tagline && <p className="mt-1 opacity-90">{company.tagline}</p>}
            </div>
            <Badge variant="outline" className={`${LEVEL_CLS[company.certification_level]} border-0 text-sm capitalize`}>
              <Award className="mr-1.5 h-3.5 w-3.5" />HomeFacts {company.certification_level}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container grid gap-4 py-8 md:grid-cols-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Certified homes</p>
          <p className="mt-1 text-2xl font-bold flex items-center gap-2"><Home className="h-5 w-5" />{stats.homes}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Communities</p>
          <p className="mt-1 text-2xl font-bold">{stats.communities.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Years in business</p>
          <p className="mt-1 text-2xl font-bold">{company.years_in_business ?? "—"}</p>
        </CardContent></Card>

        <Card className="md:col-span-2"><CardContent className="space-y-3 p-4 text-sm">
          <h2 className="text-base font-semibold">About</h2>
          <div className="grid gap-2 text-muted-foreground">
            {company.license_number && <p><strong className="text-foreground">License:</strong> {company.license_number}</p>}
            {company.insurance_carrier && <p><strong className="text-foreground">Insurance:</strong> {company.insurance_carrier}</p>}
            {company.certified_since && <p><strong className="text-foreground">HomeFacts Certified since:</strong> {format(new Date(company.certified_since), "MMM yyyy")}</p>}
            {company.service_areas?.length > 0 && <p><strong className="text-foreground">Service areas:</strong> {company.service_areas.join(", ")}</p>}
          </div>
          {stats.communities.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Communities built</p>
              <div className="flex flex-wrap gap-1.5">
                {stats.communities.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
              </div>
            </div>
          )}
        </CardContent></Card>

        <Card><CardContent className="space-y-2 p-4 text-sm">
          <h2 className="text-base font-semibold">Contact</h2>
          {company.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{company.phone}</p>}
          {company.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{company.email}</p>}
          {company.website && <a href={company.website} className="flex items-center gap-2 text-primary" target="_blank" rel="noreferrer"><Globe className="h-4 w-4" />{company.website}</a>}
          {(company.city || company.state) && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{[company.city, company.state].filter(Boolean).join(", ")}</p>}
        </CardContent></Card>
      </div>
    </div>
  );
}
