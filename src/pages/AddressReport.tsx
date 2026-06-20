import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LivingOutlookCard } from "@/components/address/LivingOutlookCard";
import { PropertySection, NeighborhoodSection, RiskSection, SchoolsSection, MarketSection } from "@/components/address/SectionCards";
import { useAuth } from "@/hooks/useAuth";
import { Lock, MapPin, Printer, Save } from "lucide-react";
import { toast } from "sonner";

type SectionRow = { section_key: string; status: string; data: any };

export default function AddressReport() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [sections, setSections] = useState<Record<string, SectionRow>>({});
  const [loading, setLoading] = useState(true);

  const isOwner = report && user && report.user_id === user.id;
  const isClaimable = report && !report.user_id && user;
  const teaser = !user && !isOwner;

  async function load() {
    if (!id) return;
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from("reports").select("*").eq("id", id).maybeSingle(),
      supabase.from("report_sections").select("section_key,status,data").eq("report_id", id),
    ]);
    setReport(r);
    const map: Record<string, SectionRow> = {};
    (s ?? []).forEach((row: any) => { map[row.section_key] = row; });
    setSections(map);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!report) return;
    const pending = report.status !== "complete" || Object.values(sections).some((s) => s.status === "pending");
    if (!pending) return;
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, sections]);

  async function claim() {
    if (!user || !report) return;
    const { error } = await supabase.from("reports").update({ user_id: user.id, anon_token: null } as any).eq("id", report.id).is("user_id", null);
    if (error) return toast.error(error.message);
    toast.success("Saved to your account");
    load();
  }

  const get = (k: string) => sections[k]?.data;
  const isReady = (k: string) => sections[k]?.status === "success";

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!report) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center">Report not found.<div className="mt-4"><Button asChild><Link to="/">Back home</Link></Button></div></div></div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← New search</Link>
          <div className="flex gap-2">
            {(isOwner || isClaimable) && (
              <Button variant="outline" size="sm" onClick={claim} disabled={!isClaimable}>
                <Save className="mr-2 h-4 w-4" />{isClaimable ? "Save to my account" : "Saved"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print / PDF</Button>
          </div>
        </div>

        <header className="mb-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />Address report</div>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">{report.address_normalized ?? report.address_raw}</h1>
        </header>

        <div className="mb-8">
          <LivingOutlookCard data={isReady("scorecard") ? get("scorecard") : undefined} loading={!isReady("scorecard")} />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="no-print w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="neighborhood">Neighborhood</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PropertySection data={get("overview")} loading={!isReady("overview")} />
            <div className={teaser ? "relative" : ""}>
              {teaser && <TeaserOverlay />}
              <div className={`grid gap-6 lg:grid-cols-2 ${teaser ? "pointer-events-none blur-sm" : ""}`}>
                <NeighborhoodSection data={get("amenities")} loading={!isReady("amenities")} />
                <RiskSection data={get("risk")} loading={!isReady("risk")} />
                <SchoolsSection data={get("schools")} loading={!isReady("schools")} />
                <MarketSection data={get("taxes")} loading={!isReady("taxes")} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="property"><PropertySection data={get("overview")} loading={!isReady("overview")} /></TabsContent>
          <TabsContent value="neighborhood"><Locked teaser={teaser}><NeighborhoodSection data={get("amenities")} loading={!isReady("amenities")} /></Locked></TabsContent>
          <TabsContent value="risk"><Locked teaser={teaser}><RiskSection data={get("risk")} loading={!isReady("risk")} /></Locked></TabsContent>
          <TabsContent value="schools"><Locked teaser={teaser}><SchoolsSection data={get("schools")} loading={!isReady("schools")} /></Locked></TabsContent>
          <TabsContent value="market"><Locked teaser={teaser}><MarketSection data={get("taxes")} loading={!isReady("taxes")} /></Locked></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Locked({ teaser, children }: { teaser: boolean; children: React.ReactNode }) {
  if (!teaser) return <>{children}</>;
  return (
    <div className="relative">
      <TeaserOverlay />
      <div className="pointer-events-none blur-sm">{children}</div>
    </div>
  );
}

function TeaserOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-gradient-to-b from-background/50 to-background/90 backdrop-blur-[1px]">
      <div className="max-w-sm rounded-2xl border bg-card p-6 text-center shadow-elevated">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Lock className="h-5 w-5" /></div>
        <h3 className="mt-3 font-semibold">Sign in to unlock the full report</h3>
        <p className="mt-1 text-sm text-muted-foreground">Free — see neighborhood, risk, schools, and market details for this address.</p>
        <Button asChild className="mt-4 w-full"><Link to="/auth?mode=signup">Create free account</Link></Button>
      </div>
    </div>
  );
}
