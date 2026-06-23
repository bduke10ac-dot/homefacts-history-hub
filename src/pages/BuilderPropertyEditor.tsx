import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Upload, QrCode, Send, FileText, Plus, Trash2,
  MapPin, Home, Wrench, ShieldCheck, Users, Camera, Building2,
} from "lucide-react";

const STATUSES = ["draft", "under_construction", "ready_for_handoff", "handed_off", "transferred"] as const;
type StatusT = typeof STATUSES[number];

const STAGES = [
  "Lot preparation", "Grading", "Foundation", "Framing", "Roofing",
  "Windows and doors", "Rough plumbing", "Rough electrical", "HVAC rough-in",
  "Insulation", "Drywall", "Cabinets", "Countertops", "Flooring", "Paint",
  "Fixtures", "Landscaping", "Final inspection", "Final walkthrough", "Closing", "Homeowner handoff",
];

const TRADES = ["Excavation","Foundation","Framing","Roofing","HVAC","Plumbing","Electrical","Insulation","Drywall","Paint","Flooring","Cabinets","Countertops","Landscaping","Irrigation","Final cleaning"];

const ACCEPT_FILES = ".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx,.xls,.xlsx,.csv";

export default function BuilderPropertyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [stages, setStages] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, [id]);

  async function load() {
    if (!id) return;
    const [{ data: r }, { data: d }, { data: s }, { data: w }] = await Promise.all([
      supabase.from("nb_property_clones").select("*").eq("id", id).maybeSingle(),
      supabase.from("nb_clone_documents").select("*").eq("clone_id", id).order("created_at", { ascending: false }),
      supabase.from("nb_clone_subcontractors").select("*").eq("clone_id", id),
      supabase.from("nb_clone_warranties").select("*").eq("clone_id", id),
    ]);
    setRow(r);
    setDocs(d ?? []);
    setSubs(s ?? []);
    setWarranties(w ?? []);
    setStages((r?.construction_stages as Record<string, any>) ?? {});
  }

  function patch(p: any) { setRow((r: any) => ({ ...r, ...p })); }
  function patchJson(field: string, key: string, value: any) {
    setRow((r: any) => ({ ...r, [field]: { ...(r?.[field] ?? {}), [key]: value } }));
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    const { id: _id, created_at, updated_at, handoff_token, ...rest } = row;
    const { error } = await supabase
      .from("nb_property_clones")
      .update({ ...rest, construction_stages: stages })
      .eq("id", id!);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  }

  async function uploadFile(file: File, category: string) {
    if (!id || !row?.company_id) return;
    const path = `clones/${id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("property-files").upload(path, file, { upsert: false });
    if (upErr) return toast.error(upErr.message);
    const { data: pub } = supabase.storage.from("property-files").getPublicUrl(path);
    const { error } = await supabase.from("nb_clone_documents").insert([{
      clone_id: id, file_name: file.name, file_url: pub.publicUrl, category: category as any, mime_type: file.type,
    }]);
    if (error) return toast.error(error.message);
    toast.success(`${file.name} uploaded`);
    load();
  }

  async function removeDoc(docId: string) {
    const { error } = await supabase.from("nb_clone_documents").delete().eq("id", docId);
    if (error) return toast.error(error.message);
    setDocs((d) => d.filter((x) => x.id !== docId));
  }

  async function addSub() {
    const { data, error } = await supabase.from("nb_clone_subcontractors").insert([{ clone_id: id!, trade: "Framing", company_name: "" }]).select("*").maybeSingle();
    if (error) return toast.error(error.message);
    setSubs((s) => [...s, data]);
  }
  async function updSub(sid: string, patch: any) {
    await supabase.from("nb_clone_subcontractors").update(patch).eq("id", sid);
    setSubs((s) => s.map((x) => (x.id === sid ? { ...x, ...patch } : x)));
  }
  async function delSub(sid: string) {
    await supabase.from("nb_clone_subcontractors").delete().eq("id", sid);
    setSubs((s) => s.filter((x) => x.id !== sid));
  }

  async function addWarranty() {
    const { data, error } = await supabase.from("nb_clone_warranties").insert([{
      clone_id: id!, warranty_type: "workmanship" as any, title: "New warranty",
    }]).select("*").maybeSingle();
    if (error) return toast.error(error.message);
    setWarranties((w) => [...w, data]);
  }
  async function updWarranty(wid: string, patch: any) {
    await supabase.from("nb_clone_warranties").update(patch).eq("id", wid);
    setWarranties((w) => w.map((x) => (x.id === wid ? { ...x, ...patch } : x)));
  }
  async function delWarranty(wid: string) {
    await supabase.from("nb_clone_warranties").delete().eq("id", wid);
    setWarranties((w) => w.filter((x) => x.id !== wid));
  }

  function patchStage(name: string, p: any) {
    setStages((s) => ({ ...s, [name]: { ...(s[name] ?? {}), ...p } }));
  }

  async function generateHandoff() {
    await save();
    const { error } = await supabase
      .from("nb_property_clones")
      .update({ status: "ready_for_handoff" as const })
      .eq("id", id!);
    if (error) return toast.error(error.message);
    toast.success("Homeowner Handoff package generated");
    navigate(`/builder/clones/${id}/handoff`);
  }

  if (!row) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const lot = row.lot_info ?? {};
  const nbr = row.neighbor_info ?? {};
  const build = row.build_info ?? {};
  const finishes = row.finish_selections ?? {};
  const community = row.community_info ?? {};
  const handoffUrl = row.handoff_token ? `${window.location.origin}/home/${row.handoff_token}` : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/builder/portal"><ArrowLeft className="mr-1 h-4 w-4" />All properties</Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-bold">{row.address_line || "Untitled property"}</h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {row.lot_number && <span>Lot {row.lot_number}</span>}
                {row.parcel_id && <span>Parcel {row.parcel_id}</span>}
                <Badge variant="secondary" className="capitalize">{String(row.status).replace(/_/g, " ")}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save"}</Button>
            {row.handoff_token && (
              <Button asChild variant="outline"><Link to={`/home/${row.handoff_token}`}><QrCode className="mr-2 h-4 w-4" />View Record</Link></Button>
            )}
            <Button onClick={generateHandoff} variant="default"><Send className="mr-2 h-4 w-4" />Generate Homeowner Handoff</Button>
          </div>
        </div>

        <Tabs defaultValue="intake" className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="intake"><Home className="mr-1 h-3 w-3" />Intake</TabsTrigger>
            <TabsTrigger value="lot"><MapPin className="mr-1 h-3 w-3" />Lot</TabsTrigger>
            <TabsTrigger value="neighbors">Neighbors</TabsTrigger>
            <TabsTrigger value="community"><Building2 className="mr-1 h-3 w-3" />Community</TabsTrigger>
            <TabsTrigger value="build"><Wrench className="mr-1 h-3 w-3" />Build</TabsTrigger>
            <TabsTrigger value="finishes">Finishes</TabsTrigger>
            <TabsTrigger value="timeline"><Camera className="mr-1 h-3 w-3" />Timeline</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="mr-1 h-3 w-3" />Documents</TabsTrigger>
            <TabsTrigger value="contractors"><Users className="mr-1 h-3 w-3" />Contractors</TabsTrigger>
            <TabsTrigger value="warranty"><ShieldCheck className="mr-1 h-3 w-3" />Warranty</TabsTrigger>
            <TabsTrigger value="handoff"><Send className="mr-1 h-3 w-3" />Handoff</TabsTrigger>
          </TabsList>

          {/* INTAKE */}
          <TabsContent value="intake">
            <Card>
              <CardHeader><CardTitle>Property Intake</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <F label="Status" className="md:col-span-1">
                  <Select value={row.status} onValueChange={(v) => patch({ status: v as StatusT })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </F>
                <F label="Address" className="md:col-span-2"><Input value={row.address_line ?? ""} onChange={(e) => patch({ address_line: e.target.value })} /></F>
                <F label="Lot #"><Input value={row.lot_number ?? ""} onChange={(e) => patch({ lot_number: e.target.value })} /></F>
                <F label="Parcel ID"><Input value={row.parcel_id ?? ""} onChange={(e) => patch({ parcel_id: e.target.value })} /></F>
                <F label="Phase"><Input value={row.phase ?? ""} onChange={(e) => patch({ phase: e.target.value })} /></F>
                <F label="Section"><Input value={row.section ?? ""} onChange={(e) => patch({ section: e.target.value })} /></F>
                <F label="Block"><Input value={row.block ?? ""} onChange={(e) => patch({ block: e.target.value })} /></F>
                <F label="Street"><Input value={row.street ?? ""} onChange={(e) => patch({ street: e.target.value })} /></F>
                <F label="City"><Input value={row.city ?? ""} onChange={(e) => patch({ city: e.target.value })} /></F>
                <F label="County"><Input value={row.county ?? ""} onChange={(e) => patch({ county: e.target.value })} /></F>
                <F label="State"><Input value={row.state ?? ""} onChange={(e) => patch({ state: e.target.value })} /></F>
                <F label="ZIP"><Input value={row.zip ?? ""} onChange={(e) => patch({ zip: e.target.value })} /></F>
                <F label="GPS lat"><Input type="number" value={row.gps_lat ?? ""} onChange={(e) => patch({ gps_lat: e.target.value ? Number(e.target.value) : null })} /></F>
                <F label="GPS lng"><Input type="number" value={row.gps_lng ?? ""} onChange={(e) => patch({ gps_lng: e.target.value ? Number(e.target.value) : null })} /></F>
                <F label="Sold date"><Input type="date" value={row.sold_date ?? ""} onChange={(e) => patch({ sold_date: e.target.value || null })} /></F>
                <F label="Closed date"><Input type="date" value={row.closed_date ?? ""} onChange={(e) => patch({ closed_date: e.target.value || null })} /></F>
                <F label="C.O. date"><Input type="date" value={row.co_date ?? ""} onChange={(e) => patch({ co_date: e.target.value || null })} /></F>
                <Separator className="md:col-span-3" />
                <F label="Homeowner name"><Input value={row.homeowner_name ?? ""} onChange={(e) => patch({ homeowner_name: e.target.value })} /></F>
                <F label="Homeowner email"><Input value={row.homeowner_email ?? ""} onChange={(e) => patch({ homeowner_email: e.target.value })} /></F>
                <F label="Homeowner phone"><Input value={row.homeowner_phone ?? ""} onChange={(e) => patch({ homeowner_phone: e.target.value })} /></F>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LOT */}
          <TabsContent value="lot">
            <Card>
              <CardHeader><CardTitle>Lot & Plot Information</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {[
                  ["setback_lines","Setback lines"],["easements","Easements"],["drainage_areas","Drainage areas"],
                  ["utility_easements","Utility easements"],["fence_restrictions","Fence restrictions"],
                  ["driveway_location","Driveway location"],["sidewalk_info","Sidewalk information"],
                  ["mailbox_location","Mailbox location"],["trash_pickup","Trash pickup location"],
                  ["streetlight_location","Streetlight location"],["stormwater_notes","Stormwater drainage notes"],
                  ["hoa_lot_restrictions","HOA lot restrictions"],["zoning","Zoning information"],
                  ["lot_dimensions","Lot dimensions"],["lot_sqft","Lot square footage"],["lot_acreage","Lot acreage"],
                  ["buildable_area","Buildable area"],["flood_zone","Flood zone status"],["soil_info","Soil information"],
                  ["grading_notes","Grading notes"],["retaining_wall","Retaining wall notes"],["landscape_buffer","Landscape buffer notes"],
                ].map(([k, label]) => (
                  <F key={k} label={label}><Input value={lot[k] ?? ""} onChange={(e) => patchJson("lot_info", k, e.target.value)} /></F>
                ))}
                <Separator className="md:col-span-2" />
                <UploadRow label="Plat map" category="plat_map" onPick={(f) => uploadFile(f, "plat_map")} />
                <UploadRow label="Plot plan" category="plot_plan" onPick={(f) => uploadFile(f, "plot_plan")} />
                <UploadRow label="Survey" category="survey" onPick={(f) => uploadFile(f, "survey")} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEIGHBORS */}
          <TabsContent value="neighbors">
            <Card>
              <CardHeader><CardTitle>Neighboring Plot Information</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {[
                  ["neighbor_lot_numbers","Neighboring lot numbers"],["adjacent_parcels","Adjacent parcel IDs"],
                  ["left_lot","Left-side lot"],["right_lot","Right-side lot"],["rear_lot","Rear lot"],
                  ["across_lot","Across-street lot"],["adjacent_status","Adjacent home status"],
                  ["common_areas","Common areas / green space / pond / trail"],
                  ["neighboring_builder","Neighboring builder notes"],["privacy_notes","Privacy notes"],
                  ["drainage_relation","Drainage relationship to neighbors"],
                  ["shared_fence","Shared fence notes"],["shared_driveway","Shared driveway notes"],
                  ["slope_runoff","Slope or runoff notes"],["future_development","Future development notes"],
                ].map(([k, label]) => (
                  <F key={k} label={label}><Textarea rows={2} value={nbr[k] ?? ""} onChange={(e) => patchJson("neighbor_info", k, e.target.value)} /></F>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMMUNITY */}
          <TabsContent value="community">
            <Card>
              <CardHeader><CardTitle>Community & Neighborhood</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {[
                  ["community_name","Community name"],["community_phase","Community phase"],
                  ["hoa_name","HOA name"],["hoa_contact","HOA contact"],
                  ["amenities","Amenities (trails, playground, pond, etc.)"],
                  ["mailbox_cluster","Mailbox cluster"],["trash_service","Trash service"],
                  ["street_parking","Street parking rules"],["school_zones","School zones"],
                  ["utility_providers","Utility providers"],["internet_providers","Internet providers"],
                  ["emergency_services","Emergency services"],["local_shopping","Local shopping"],
                  ["nearby_parks","Nearby parks"],
                ].map(([k, label]) => (
                  <F key={k} label={label}><Input value={community[k] ?? ""} onChange={(e) => patchJson("community_info", k, e.target.value)} /></F>
                ))}
                <F label="Community description" className="md:col-span-2">
                  <Textarea rows={3} value={community.description ?? ""} onChange={(e) => patchJson("community_info", "description", e.target.value)} />
                </F>
                <Separator className="md:col-span-2" />
                <UploadRow label="HOA documents" category="hoa" onPick={(f) => uploadFile(f, "hoa")} />
                <UploadRow label="Covenants" category="covenants" onPick={(f) => uploadFile(f, "covenants")} />
                <UploadRow label="Design guidelines" category="design_guidelines" onPick={(f) => uploadFile(f, "design_guidelines")} />
                <UploadRow label="Community map" category="community_map" onPick={(f) => uploadFile(f, "community_map")} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* BUILD */}
          <TabsContent value="build">
            <Card>
              <CardHeader><CardTitle>Home Build Information</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <F label="Floor plan"><Input value={row.floor_plan_name ?? ""} onChange={(e) => patch({ floor_plan_name: e.target.value })} /></F>
                <F label="Elevation"><Input value={row.elevation ?? ""} onChange={(e) => patch({ elevation: e.target.value })} /></F>
                <F label="Square footage"><Input type="number" value={row.square_feet ?? ""} onChange={(e) => patch({ square_feet: e.target.value ? Number(e.target.value) : null })} /></F>
                <F label="Bedrooms"><Input type="number" value={row.bedrooms ?? ""} onChange={(e) => patch({ bedrooms: e.target.value ? Number(e.target.value) : null })} /></F>
                <F label="Bathrooms"><Input type="number" step="0.5" value={row.bathrooms ?? ""} onChange={(e) => patch({ bathrooms: e.target.value ? Number(e.target.value) : null })} /></F>
                <F label="Garage"><Input value={row.garage ?? ""} onChange={(e) => patch({ garage: e.target.value })} /></F>
                {[
                  ["stories","Stories"],["foundation","Foundation type"],["framing","Framing type"],
                  ["roof","Roof type"],["exterior_material","Exterior material"],["siding","Siding"],
                  ["brick_stone","Brick/stone selections"],["windows","Window manufacturer"],
                  ["doors","Door manufacturer"],["hvac","HVAC system"],["water_heater","Water heater"],
                  ["plumbing_fixtures","Plumbing fixtures"],["electrical_panel","Electrical panel"],
                  ["insulation","Insulation package"],["attic_access","Attic access location"],
                  ["crawlspace_access","Crawlspace access"],["main_water_shutoff","Main water shutoff"],
                  ["gas_shutoff","Gas shutoff"],["panel_location","Electrical panel location"],
                  ["sewer_cleanout","Sewer cleanout"],["irrigation_shutoff","Irrigation shutoff"],
                ].map(([k, label]) => (
                  <F key={k} label={label}><Input value={build[k] ?? ""} onChange={(e) => patchJson("build_info", k, e.target.value)} /></F>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FINISHES */}
          <TabsContent value="finishes">
            <Card>
              <CardHeader><CardTitle>Finish Selections</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {[
                  ["exterior_paint","Exterior paint colors"],["interior_paint","Interior paint colors"],
                  ["flooring","Flooring selections"],["cabinets","Cabinet selections"],
                  ["countertops","Countertop selections"],["tile","Tile selections"],
                  ["lighting","Lighting package"],["plumbing","Plumbing fixture package"],
                  ["appliances","Appliance package"],["hardware","Hardware selections"],
                  ["door_style","Door style"],["trim","Trim package"],
                  ["fireplace","Fireplace information"],["garage_door","Garage door selection"],
                  ["landscaping","Landscaping package"],
                ].map(([k, label]) => (
                  <F key={k} label={label}><Textarea rows={2} value={finishes[k] ?? ""} onChange={(e) => patchJson("finish_selections", k, e.target.value)} /></F>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Construction Timeline</CardTitle>
                <CardDescription>Track every stage from lot prep through homeowner handoff.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {STAGES.map((s) => {
                  const st = stages[s] ?? {};
                  return (
                    <div key={s} className="rounded-md border p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="font-medium">{s}</div>
                        <Badge variant={st.approved ? "default" : "secondary"}>{st.approved ? "Approved" : "Pending"}</Badge>
                      </div>
                      <div className="grid gap-2 md:grid-cols-4">
                        <Input type="date" value={st.completed_at ?? ""} onChange={(e) => patchStage(s, { completed_at: e.target.value })} placeholder="Completed" />
                        <Input value={st.contractor ?? ""} onChange={(e) => patchStage(s, { contractor: e.target.value })} placeholder="Contractor" />
                        <Input value={st.permit ?? ""} onChange={(e) => patchStage(s, { permit: e.target.value })} placeholder="Permit #" />
                        <Input value={st.inspection ?? ""} onChange={(e) => patchStage(s, { inspection: e.target.value })} placeholder="Inspection result" />
                      </div>
                      <Textarea rows={2} className="mt-2" value={st.notes ?? ""} onChange={(e) => patchStage(s, { notes: e.target.value })} placeholder="Notes" />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline">
                          <Upload className="h-3 w-3" /> Upload photo/document
                          <input type="file" accept={ACCEPT_FILES} className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], `stage:${s}`)} />
                        </label>
                        <Button size="sm" variant={st.approved ? "outline" : "default"} onClick={() => patchStage(s, { approved: !st.approved })}>
                          {st.approved ? "Unapprove" : "Builder approve"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <div className="text-right">
                  <Button onClick={save}><Save className="mr-2 h-4 w-4" />Save timeline</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Upload Center</CardTitle>
                <CardDescription>Plats, surveys, permits, manuals, warranties, closing docs (PDF/JPG/PNG/HEIC/DOC/XLS/CSV)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <UploadRow label="Upload document" category="general" onPick={(f) => uploadFile(f, "general")} />
                <div className="divide-y rounded-md border">
                  {docs.length === 0 && <div className="p-4 text-sm text-muted-foreground">No documents uploaded yet.</div>}
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{d.file_name}</div>
                        <div className="text-xs text-muted-foreground">{d.category}</div>
                      </div>
                      <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open</a>
                      <Button size="sm" variant="ghost" onClick={() => removeDoc(d.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTRACTORS */}
          <TabsContent value="contractors">
            <Card>
              <CardHeader>
                <CardTitle>Contractors & Trades</CardTitle>
                <CardDescription>Verified contractor records for every trade involved in this build.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button size="sm" onClick={addSub}><Plus className="mr-1 h-3 w-3" />Add contractor</Button>
                {subs.length === 0 && <div className="text-sm text-muted-foreground">No contractors added yet.</div>}
                {subs.map((s) => (
                  <div key={s.id} className="rounded-md border p-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      <Select value={s.trade ?? "Framing"} onValueChange={(v) => updSub(s.id, { trade: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input placeholder="Company" defaultValue={s.company_name ?? ""} onBlur={(e) => updSub(s.id, { company_name: e.target.value })} />
                      <Input placeholder="Contact name" defaultValue={s.contact_name ?? ""} onBlur={(e) => updSub(s.id, { contact_name: e.target.value })} />
                      <Input placeholder="Phone" defaultValue={s.phone ?? ""} onBlur={(e) => updSub(s.id, { phone: e.target.value })} />
                      <Input placeholder="Email" defaultValue={s.email ?? ""} onBlur={(e) => updSub(s.id, { email: e.target.value })} />
                      <Input placeholder="License #" defaultValue={s.license_number ?? ""} onBlur={(e) => updSub(s.id, { license_number: e.target.value })} />
                      <Input placeholder="Insurance carrier" defaultValue={s.insurance_carrier ?? ""} onBlur={(e) => updSub(s.id, { insurance_carrier: e.target.value })} />
                      <Input placeholder="Warranty months" type="number" defaultValue={s.warranty_months ?? ""} onBlur={(e) => updSub(s.id, { warranty_months: e.target.value ? Number(e.target.value) : null })} />
                      <Textarea placeholder="Scope of work" rows={1} defaultValue={s.scope_of_work ?? ""} onBlur={(e) => updSub(s.id, { scope_of_work: e.target.value })} className="md:col-span-3" />
                    </div>
                    <div className="mt-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => delSub(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WARRANTY */}
          <TabsContent value="warranty">
            <Card>
              <CardHeader>
                <CardTitle>Warranty & Maintenance Setup</CardTitle>
                <CardDescription>Builder, structural, systems, and manufacturer warranties. Maintenance reminders auto-created at handoff.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button size="sm" onClick={addWarranty}><Plus className="mr-1 h-3 w-3" />Add warranty</Button>
                {warranties.length === 0 && <div className="text-sm text-muted-foreground">No warranties added yet.</div>}
                {warranties.map((w) => (
                  <div key={w.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-3">
                    <Input placeholder="Title" defaultValue={w.title ?? ""} onBlur={(e) => updWarranty(w.id, { title: e.target.value })} />
                    <Input placeholder="Type (structural/workmanship/systems/...)" defaultValue={w.warranty_type ?? ""} onBlur={(e) => updWarranty(w.id, { warranty_type: e.target.value })} />
                    <Input placeholder="Issuer" defaultValue={w.issuer ?? ""} onBlur={(e) => updWarranty(w.id, { issuer: e.target.value })} />
                    <Input type="date" defaultValue={w.start_date ?? ""} onBlur={(e) => updWarranty(w.id, { start_date: e.target.value || null })} />
                    <Input type="date" defaultValue={w.expiration_date ?? ""} onBlur={(e) => updWarranty(w.id, { expiration_date: e.target.value || null })} />
                    <Input placeholder="Document URL" defaultValue={w.document_url ?? ""} onBlur={(e) => updWarranty(w.id, { document_url: e.target.value })} />
                    <Textarea placeholder="Coverage description" rows={2} defaultValue={w.coverage_description ?? ""} onBlur={(e) => updWarranty(w.id, { coverage_description: e.target.value })} className="md:col-span-3" />
                    <div className="md:col-span-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => delWarranty(w.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Auto-reminders generated at handoff: change air filters, smoke detectors, gutters, roof inspection, HVAC service, water heater flush, caulking, pest/termite, warranty review, HOA renewal.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HANDOFF */}
          <TabsContent value="handoff">
            <Card>
              <CardHeader>
                <CardTitle>Homeowner Handoff</CardTitle>
                <CardDescription>Transfer the complete Digital Home Record to the new homeowner.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Handoff package includes</div>
                  <ul className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
                    {[
                      "Digital Home Record","QR code","Warranty packet","Maintenance checklist",
                      "Emergency contacts","Utility setup guide","Contractor list",
                      "Final walkthrough checklist","Owner manuals","Community guide",
                      "HOA documents","Lot & plot information","Neighboring plot information",
                    ].map((x) => <li key={x}>· {x}</li>)}
                  </ul>
                </div>
                {handoffUrl && (
                  <div>
                    <Label className="text-xs">Handoff URL (QR code target)</Label>
                    <Input readOnly value={handoffUrl} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={generateHandoff}><Send className="mr-2 h-4 w-4" />Generate Homeowner Handoff</Button>
                  {row.handoff_token && (
                    <Button asChild variant="outline"><Link to={`/home/${row.handoff_token}`}><QrCode className="mr-2 h-4 w-4" />Open Digital Home Record</Link></Button>
                  )}
                  <Button asChild variant="ghost"><Link to={`/builder/clones/${id}/handoff`}>Open handoff workflow</Link></Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function F({ label, children, className }: { label: string; children: any; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function UploadRow({ label, category, onPick }: { label: string; category: string; onPick: (f: File) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 p-3">
      <div className="text-sm">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">Category: {category}</div>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent">
        <Upload className="h-3 w-3" />Upload
        <input type="file" accept={ACCEPT_FILES} className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      </label>
    </div>
  );
}
