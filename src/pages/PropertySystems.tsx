import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Wrench, Info } from "lucide-react";

const DEMO_PROPERTY_ID = "c7ee5510-d3e5-4000-8000-000000000001";

type Section = {
  id: string;
  section: string;
  install_date: string | null;
  contractor_name: string | null;
  warranty_expires: string | null;
  lifespan_years: number | null;
  notes: string | null;
};

export default function PropertySystems() {
  const { id } = useParams();
  const [address, setAddress] = useState<string>("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = id === DEMO_PROPERTY_ID;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("properties").select("address_line,city,state").eq("id", id).maybeSingle(),
        supabase.from("home_health_sections")
          .select("id,section,install_date,contractor_name,warranty_expires,lifespan_years,notes")
          .eq("property_id", id),
      ]);
      if (p) setAddress(`${p.address_line} · ${p.city}, ${p.state}`);
      setSections((s ?? []) as Section[]);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to property
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold"><Wrench className="h-7 w-7 text-primary" />Property Systems</h1>
            <p className="mt-1 text-sm text-muted-foreground">{address || "Every system in this home — install dates, warranties, and service history."}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link to={`/property/${id}/warranties`}>View warranties</Link></Button>
            <Button size="sm" asChild><Link to={`/property/${id}/maintenance`}>Schedule service</Link></Button>
          </div>
        </div>

        {isDemo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Sample property.</strong> This is a demo home record used to showcase Orivaz. Numbers, contractors, and warranties are illustrative.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading systems…</div>
        ) : sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No systems have been documented for this property yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">A builder or homeowner can add systems from the Home Health page.</p>
              <Button asChild className="mt-4" size="sm"><Link to={`/property/${id}/health`}>Open Home Health</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => {
              const warrantyDate = s.warranty_expires ? new Date(s.warranty_expires) : null;
              const status = !warrantyDate ? "unknown"
                : warrantyDate < new Date() ? "expired"
                : warrantyDate < new Date(Date.now() + 90 * 86400000) ? "soon" : "active";
              const cls = {
                active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
                soon: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
                expired: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
                unknown: "bg-muted text-muted-foreground border-border",
              }[status];
              const label = { active: "Warranty active", soon: "Expires soon", expired: "Expired", unknown: "No warranty data" }[status];
              return (
                <Card key={s.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{s.section}</CardTitle>
                      <Badge variant="outline" className={cls}>{label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    <Row label="Installed" value={s.install_date ? new Date(s.install_date).toLocaleDateString() : "—"} />
                    <Row label="Contractor" value={s.contractor_name ?? "—"} />
                    <Row label="Warranty exp." value={s.warranty_expires ? new Date(s.warranty_expires).toLocaleDateString() : "—"} />
                    <Row label="Expected life" value={s.lifespan_years ? `${s.lifespan_years} yrs` : "—"} />
                    {s.notes && <p className="border-t pt-2 text-xs text-muted-foreground">{s.notes}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium">{value}</span>
    </div>
  );
}
