import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WarrantyCenter } from "@/components/newbuild/WarrantyCenter";
import { HomeAssistantChat } from "@/components/newbuild/HomeAssistantChat";
import { Home, ShieldCheck, BookOpen, FileText, AlertOctagon, Sparkles, Clock } from "lucide-react";
import { BuiltBy } from "@/components/builder/BuiltBy";
import { format } from "date-fns";

export default function BeginnerGuide() {
  const { token } = useParams();
  const [clone, setClone] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [guide, setGuide] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data: c } = await supabase
        .from("nb_property_clones")
        .select("*, nb_templates(name, subdivision), builder_companies(name, slug, phone, email, website, logo_url, certification_level)")
        .eq("handoff_token", token)
        .maybeSingle();
      if (!c) { setLoading(false); return; }
      setClone(c);
      const co: any = (c as any).builder_companies;
      setCompany(co);
      // Log QR scan (best-effort, fire-and-forget)
      if (co?.id) {
        (supabase as any).from("builder_qr_scans").insert({
          company_id: co.id, clone_id: c.id, user_agent: navigator.userAgent.slice(0, 200),
        });
        // Refetch full builder branding for BuiltBy
        const { data: full } = await supabase.from("builder_companies").select("*").eq("id", co.id).maybeSingle();
        if (full) setCompany(full);
      }
      const [{ data: g }, { data: d }, { data: t }] = await Promise.all([
        supabase.from("nb_template_guide_items").select("*").eq("template_id", c.template_id).order("section").order("sort_order"),
        supabase.from("nb_clone_documents").select("*").eq("clone_id", c.id).order("created_at", { ascending: false }),
        c.property_id ? supabase.from("platform_property_timeline_events").select("*").eq("property_id", c.property_id).order("event_date", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
      ]);
      // Synthesize build-history events from the clone itself
      const built: any[] = [];
      if (c.build_start_date) built.push({ id: "bs", event_date: c.build_start_date, event_type: "build_start", title: "Construction started" });
      if (c.completion_date) built.push({ id: "cd", event_date: c.completion_date, event_type: "completion", title: "Construction completed" });
      if (c.co_date) built.push({ id: "co", event_date: c.co_date, event_type: "certificate_of_occupancy", title: "Certificate of occupancy issued" });
      if (c.handed_off_at) built.push({ id: "ho", event_date: c.handed_off_at, event_type: "handoff", title: "Handed off to homeowner" });
      const merged = [...(t ?? []), ...built].sort((a, b) => (b.event_date || "").localeCompare(a.event_date || ""));
      setGuide(g ?? []); setDocs(d ?? []); setTimeline(merged);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!clone) return <div className="flex min-h-screen items-center justify-center"><p>Handoff link not found.</p></div>;

  const sections = Array.from(new Set(guide.map((g) => g.section)));

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-hero px-6 py-10 text-primary-foreground">
        <div className="container">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80"><Home className="h-4 w-4" />New Build History · Homeowner Guide</div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">{clone.address_line ?? `Lot ${clone.lot_number}`}</h1>
          <p className="opacity-90">{[clone.city, clone.state, clone.zip].filter(Boolean).join(", ")}</p>
          <p className="mt-3 text-sm opacity-90">
            Built by{" "}
            {company?.slug ? (
              <a href={`/builders/${company.slug}`} className="font-semibold underline">{company.name}</a>
            ) : (
              <span className="font-semibold">{company?.name}</span>
            )}
            {company?.certification_level && <Badge variant="outline" className="ml-2 border-white/30 bg-white/10 text-primary-foreground capitalize">Orivaz {company.certification_level}</Badge>}
            {" · "}{clone.nb_templates?.name}
            {clone.co_date ? ` · CO ${format(new Date(clone.co_date), "MMM d, yyyy")}` : ""}
          </p>
        </div>
      </div>

      <div className="container py-8 space-y-6">
        {company && <BuiltBy company={company} />}

        <Tabs defaultValue="guide">
          <TabsList className="flex-wrap">
            <TabsTrigger value="guide"><BookOpen className="mr-1.5 h-4 w-4" />Move-in & systems</TabsTrigger>
            <TabsTrigger value="warranties"><ShieldCheck className="mr-1.5 h-4 w-4" />Warranties</TabsTrigger>
            <TabsTrigger value="timeline"><Clock className="mr-1.5 h-4 w-4" />Timeline</TabsTrigger>
            <TabsTrigger value="docs"><FileText className="mr-1.5 h-4 w-4" />Documents</TabsTrigger>
            <TabsTrigger value="assistant"><Sparkles className="mr-1.5 h-4 w-4" />AI Assistant</TabsTrigger>
            <TabsTrigger value="emergency"><AlertOctagon className="mr-1.5 h-4 w-4" />Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="space-y-6">
            {sections.filter((s) => s !== "emergency").map((section) => (
              <div key={section}>
                <h2 className="mb-2 text-lg font-semibold capitalize">{section.replace(/_/g, " ")}</h2>
                <div className="grid gap-2 md:grid-cols-2">
                  {guide.filter((g) => g.section === section).map((g) => (
                    <Card key={g.id}><CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{g.title}</p>
                        {g.responsibility && (
                          <Badge variant="outline" className={g.responsibility === "homeowner" ? "bg-blue-500/15 text-blue-700" : "bg-emerald-500/15 text-emerald-700"}>
                            {g.responsibility}
                          </Badge>
                        )}
                      </div>
                      {g.body && <p className="mt-1 text-xs text-muted-foreground">{g.body}</p>}
                    </CardContent></Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="warranties"><WarrantyCenter cloneId={clone.id} /></TabsContent>

          <TabsContent value="timeline" className="space-y-2">
            {timeline.map((e) => (
              <Card key={e.id}><CardContent className="flex items-start justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{e.title}</p>
                  {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{e.event_date ? format(new Date(e.event_date), "MMM d, yyyy") : ""}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] capitalize">{e.event_type?.replace(/_/g, " ")}</Badge>
                </div>
              </CardContent></Card>
            ))}
            {!timeline.length && <p className="text-sm text-muted-foreground">No timeline events yet.</p>}
          </TabsContent>

          <TabsContent value="docs" className="space-y-2">
            {Array.from(new Set(docs.map((d) => d.category ?? "Other"))).map((cat) => (
              <div key={cat}>
                <h3 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h3>
                {docs.filter((d) => (d.category ?? "Other") === cat).map((d) => (
                  <Card key={d.id} className="mb-2"><CardContent className="flex items-center justify-between p-4 text-sm">
                    <div><p className="font-medium">{d.title}</p>{d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}</div>
                    {d.file_url && <a className="text-primary underline text-xs" href={d.file_url} target="_blank" rel="noreferrer">Open</a>}
                  </CardContent></Card>
                ))}
              </div>
            ))}
            {!docs.length && <p className="text-sm text-muted-foreground">No documents yet.</p>}
          </TabsContent>

          <TabsContent value="assistant"><HomeAssistantChat token={token!} /></TabsContent>

          <TabsContent value="emergency" className="space-y-2">
            {guide.filter((g) => g.section === "emergency").map((g) => (
              <Card key={g.id}><CardContent className="p-4">
                <p className="font-medium text-sm">{g.title}</p>
                {g.body && <p className="mt-1 text-xs text-muted-foreground">{g.body}</p>}
              </CardContent></Card>
            ))}
            {company && (
              <Card><CardContent className="p-4 text-sm">
                <p className="font-medium">Builder contact</p>
                <p className="text-xs text-muted-foreground">{company.name} · {company.phone ?? "—"} · {company.email ?? "—"}</p>
              </CardContent></Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
