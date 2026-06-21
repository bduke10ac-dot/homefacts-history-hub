import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { BulkCloneDialog } from "@/components/newbuild/BulkCloneDialog";
import { Button } from "@/components/ui/button";

export default function BuilderTemplateDetail() {
  const { id } = useParams();
  const [template, setTemplate] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [guide, setGuide] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: t }, { data: s }, { data: w }, { data: d }, { data: g }] = await Promise.all([
      supabase.from("nb_templates").select("*").eq("id", id).maybeSingle(),
      supabase.from("nb_template_subcontractors").select("*").eq("template_id", id).order("trade"),
      supabase.from("nb_template_warranties").select("*").eq("template_id", id).order("warranty_type"),
      supabase.from("nb_template_documents").select("*").eq("template_id", id).order("category"),
      supabase.from("nb_template_guide_items").select("*").eq("template_id", id).order("section").order("sort_order"),
    ]);
    setTemplate(t); setSubs(s ?? []); setWarranties(w ?? []); setDocs(d ?? []); setGuide(g ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!template) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <Link to="/builder/templates" className="text-sm text-muted-foreground">← Back to templates</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{template.kind}</p>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            {template.subdivision && <p className="text-sm text-muted-foreground">{template.subdivision}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">v{template.version}</Badge>
            {template.is_locked && <Badge variant="outline" className="text-amber-700"><Lock className="mr-1 h-3 w-3" />locked</Badge>}
            <BulkCloneDialog templateId={template.id} onDone={load} />
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subs">Subcontractors ({subs.length})</TabsTrigger>
            <TabsTrigger value="warranties">Warranties ({warranties.length})</TabsTrigger>
            <TabsTrigger value="docs">Documents ({docs.length})</TabsTrigger>
            <TabsTrigger value="guide">Beginner Guide ({guide.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card><CardContent className="grid grid-cols-2 gap-3 p-6 text-sm md:grid-cols-4">
              <Field label="Square feet" value={template.square_feet} />
              <Field label="Beds" value={template.bedrooms} />
              <Field label="Baths" value={template.bathrooms} />
              <Field label="Elevation" value={template.elevation} />
            </CardContent></Card>
            {template.description && <p className="mt-3 text-sm text-muted-foreground">{template.description}</p>}
          </TabsContent>
          <TabsContent value="subs">
            <div className="space-y-2">
              {subs.map((s) => (
                <Card key={s.id}><CardContent className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-medium">{s.company_name}</p>
                    <p className="text-xs text-muted-foreground">{s.trade} · {s.license_number ?? "no license on file"}</p>
                  </div>
                  {s.warranty_months && <Badge variant="outline">{s.warranty_months} mo warranty</Badge>}
                </CardContent></Card>
              ))}
              {!subs.length && <p className="text-sm text-muted-foreground">No subcontractors yet.</p>}
            </div>
          </TabsContent>
          <TabsContent value="warranties">
            <div className="space-y-2">
              {warranties.map((w) => (
                <Card key={w.id}><CardContent className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-medium">{w.title}</p>
                    <p className="text-xs text-muted-foreground">{w.warranty_type} · {w.issuer ?? "—"}</p>
                  </div>
                  <Badge variant="outline">{w.term_months} mo</Badge>
                </CardContent></Card>
              ))}
              {!warranties.length && <p className="text-sm text-muted-foreground">No warranties yet.</p>}
            </div>
          </TabsContent>
          <TabsContent value="docs">
            <div className="space-y-2">
              {docs.map((d) => (
                <Card key={d.id}><CardContent className="flex items-center justify-between p-4 text-sm">
                  <div><p className="font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{d.category}</p></div>
                  {d.file_url && <Button asChild size="sm" variant="outline"><a href={d.file_url} target="_blank" rel="noreferrer">Open</a></Button>}
                </CardContent></Card>
              ))}
              {!docs.length && <p className="text-sm text-muted-foreground">No standard documents yet.</p>}
            </div>
          </TabsContent>
          <TabsContent value="guide">
            <div className="space-y-2">
              {guide.map((g) => (
                <Card key={g.id}><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{g.title}</p>
                    <Badge variant="outline" className="text-xs">{g.section}</Badge>
                  </div>
                  {g.body && <p className="mt-1 text-xs text-muted-foreground">{g.body}</p>}
                </CardContent></Card>
              ))}
              {!guide.length && <p className="text-sm text-muted-foreground">No guide content yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value ?? "—"}</p>
    </div>
  );
}
