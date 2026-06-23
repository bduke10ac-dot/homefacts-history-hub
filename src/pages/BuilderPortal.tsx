import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Copy, Archive, QrCode, Upload, FileText, MapPin } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["draft", "under_construction", "ready_for_handoff", "handed_off", "transferred"];

export default function BuilderPortal() {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Find builder company the user belongs to, or fallback to founding builder
      const { data: member } = await supabase
        .from("builder_company_members")
        .select("company_id, builder_companies(id, name)")
        .eq("user_id", user.id)
        .maybeSingle();

      let cid = (member as any)?.company_id ?? null;
      let cname = (member as any)?.builder_companies?.name ?? "";

      if (!cid) {
        const { data: founding } = await supabase
          .from("builder_companies")
          .select("id, name")
          .eq("is_founding_builder", true)
          .order("founding_builder_number", { ascending: true })
          .limit(1)
          .maybeSingle();
        cid = founding?.id ?? null;
        cname = founding?.name ?? "";
      }
      setCompanyId(cid);
      setCompanyName(cname);

      if (cid) {
        const { data } = await supabase
          .from("nb_property_clones")
          .select("*")
          .eq("company_id", cid)
          .order("created_at", { ascending: false });
        setRows(data ?? []);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q.trim()) return true;
      const hay = `${r.address_line ?? ""} ${r.lot_number ?? ""} ${r.parcel_id ?? ""} ${r.floor_plan_name ?? ""} ${r.phase ?? ""} ${r.homeowner_name ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [rows, q, status]);

  async function ensureTemplate(cid: string): Promise<string | null> {
    const { data: existing } = await supabase
      .from("nb_templates")
      .select("id")
      .eq("company_id", cid)
      .limit(1)
      .maybeSingle();
    if (existing?.id) return existing.id;
    const { data, error } = await supabase
      .from("nb_templates")
      .insert({ company_id: cid, name: "Default Template" })
      .select("id")
      .maybeSingle();
    if (error) { toast.error(error.message); return null; }
    return data?.id ?? null;
  }

  async function addProperty() {
    if (!companyId) return toast.error("No builder company found");
    const tid = await ensureTemplate(companyId);
    if (!tid) return;
    const { data, error } = await supabase
      .from("nb_property_clones")
      .insert({ company_id: companyId, template_id: tid, status: "draft" as const, address_line: "New property" })
      .select("id")
      .maybeSingle();
    if (error) return toast.error(error.message);
    navigate(`/builder/portal/${data!.id}`);
  }

  async function duplicate(row: any) {
    const { id, created_at, updated_at, handoff_token, handed_off_at, handoff_packet_url, ...rest } = row;
    const { data, error } = await supabase
      .from("nb_property_clones")
      .insert({ ...rest, status: "draft" as const, address_line: `${row.address_line} (copy)` })
      .select("id")
      .maybeSingle();
    if (error) return toast.error(error.message);
    toast.success("Duplicated");
    navigate(`/builder/portal/${data!.id}`);
  }

  async function archive(row: any) {
    // Mark transferred (closest enum to archived) and set notes flag
    const { error } = await supabase
      .from("nb_property_clones")
      .update({ status: "transferred" as const, notes: `${row.notes ?? ""}\n[archived ${new Date().toISOString()}]` })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: "transferred" } : r)));
    toast.success("Archived");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Builder Property Upload Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {companyName ? <>Managing properties for <b>{companyName}</b></> : "Builder Property Operating System"}
            </p>
          </div>
          <Button onClick={addProperty} disabled={!companyId}>
            <Plus className="mr-2 h-4 w-4" />Add Property
          </Button>
        </div>

        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search address, lot, parcel, floor plan, homeowner..." className="pl-8" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No properties yet. Click <b>Add Property</b> to create your first Digital Home Record.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{r.address_line || "Untitled property"}</CardTitle>
                    <Badge variant="secondary" className="capitalize">{String(r.status).replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {r.lot_number && <span>Lot {r.lot_number}</span>}
                    {r.phase && <span>Phase {r.phase}</span>}
                    {r.floor_plan_name && <span>{r.floor_plan_name}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />{r.city}{r.state ? `, ${r.state}` : ""}{r.zip ? ` ${r.zip}` : ""}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild size="sm" variant="default">
                      <Link to={`/builder/portal/${r.id}`}><FileText className="mr-1 h-3 w-3" />Open</Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => duplicate(r)}><Copy className="mr-1 h-3 w-3" />Duplicate</Button>
                    {r.handoff_token && (
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/home/${r.handoff_token}`}><QrCode className="mr-1 h-3 w-3" />Record</Link>
                      </Button>
                    )}
                    {r.status !== "archived" && (
                      <Button size="sm" variant="ghost" onClick={() => archive(r)}><Archive className="h-3 w-3" /></Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
