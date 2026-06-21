import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, LayoutTemplate, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function BuilderTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: m } = await supabase.from("builder_company_members").select("company_id").eq("user_id", user.id).limit(1).maybeSingle();
    const cid = m?.company_id ?? null;
    setCompanyId(cid);
    if (!cid) return setTemplates([]);
    const { data } = await supabase.from("nb_templates").select("*").eq("company_id", cid).order("created_at", { ascending: false });
    setTemplates(data ?? []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Templates</h1>
          {companyId && <NewTemplateDialog companyId={companyId} onCreated={load} />}
        </div>

        {!companyId && <p className="text-sm text-muted-foreground">Your account is not linked to a builder company yet.</p>}

        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <Link key={t.id} to={`/builder/templates/${t.id}`}>
              <Card className="transition hover:border-primary">
                <CardContent className="flex items-start justify-between p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.kind}</p>
                    <p className="mt-1 flex items-center gap-2 font-semibold">
                      <LayoutTemplate className="h-4 w-4" />{t.name}
                    </p>
                    {t.subdivision && <p className="text-xs text-muted-foreground">{t.subdivision}{t.elevation ? ` · Elev. ${t.elevation}` : ""}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline">v{t.version}</Badge>
                    {t.is_locked && <Badge variant="outline" className="text-amber-700"><Lock className="mr-1 h-3 w-3" />locked</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewTemplateDialog({ companyId, onCreated }: { companyId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"subdivision" | "model" | "series" | "custom">("model");
  const [description, setDescription] = useState("");

  const save = async () => {
    if (!name) return toast.error("Name is required");
    const { error } = await supabase.from("nb_templates").insert({ company_id: companyId, kind, name, description });
    if (error) return toast.error(error.message);
    toast.success("Template created");
    setOpen(false); setName(""); setDescription("");
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />New template</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New template</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="The Hill Country" /></div>
          <div>
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="subdivision">Subdivision</SelectItem>
                <SelectItem value="model">Model / Floor plan</SelectItem>
                <SelectItem value="series">Series</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
