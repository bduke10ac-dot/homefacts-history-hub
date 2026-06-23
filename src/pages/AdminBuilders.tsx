import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BuilderLogoUpload } from "@/components/builder/BuilderLogoUpload";
import { Plus, Save, Loader2, Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const DEFAULT_BADGES = [
  "Founding Builder #001",
  "HomeFacts Certified Builder",
  "Digital Home Record Included",
  "Warranty Packet Included",
  "Construction Timeline Included",
];

export default function AdminBuilders() {
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("builder_companies").select("*").order("is_founding_builder", { ascending: false }).order("name");
    setList(data ?? []);
    if (data?.length && !selected) setSelected(data[0]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const create = async () => {
    const name = prompt("Builder name?");
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await supabase.from("builder_companies").insert({ name, slug }).select().single();
    if (error) { toast.error(error.message); return; }
    setSelected(data); load();
  };

  const update = async (patch: any) => {
    setSelected({ ...selected, ...patch });
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const { id, created_at, updated_at, ...payload } = selected;
    const { error } = await supabase.from("builder_companies").update(payload).eq("id", id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); load(); }
  };

  const toggleBadge = (b: string) => {
    const current: string[] = selected.badges ?? [];
    update({ badges: current.includes(b) ? current.filter((x) => x !== b) : [...current, b] });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin · Builders</h1>
            <p className="text-sm text-muted-foreground">Manage Builder Program partners, badges, and assets.</p>
          </div>
          <Button onClick={create}><Plus className="mr-2 h-4 w-4" />Add builder</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {list.map((b) => (
              <button key={b.id} onClick={() => setSelected(b)} className={`w-full rounded-lg border p-3 text-left transition ${selected?.id === b.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{b.name}</span>
                  {b.is_founding_builder && <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" />#{b.founding_builder_number ?? "?"}</Badge>}
                </div>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{b.certification_level}</p>
              </button>
            ))}
            {!list.length && <p className="text-sm text-muted-foreground">No builders yet.</p>}
          </div>

          {selected && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-card p-5 shadow-card">
                <h2 className="text-base font-semibold">Logo</h2>
                <div className="mt-3">
                  <BuilderLogoUpload
                    companyId={selected.id}
                    currentUrl={selected.logo_url}
                    onUpdated={(url) => update({ logo_url: url })}
                    size={120}
                  />
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-card">
                <h2 className="text-base font-semibold">Details</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Name"><Input value={selected.name ?? ""} onChange={(e) => update({ name: e.target.value })} /></Field>
                  <Field label="Slug"><Input value={selected.slug ?? ""} onChange={(e) => update({ slug: e.target.value })} /></Field>
                  <Field label="Website"><Input value={selected.website ?? ""} onChange={(e) => update({ website: e.target.value })} /></Field>
                  <Field label="Tagline"><Input value={selected.tagline ?? ""} onChange={(e) => update({ tagline: e.target.value })} /></Field>
                  <Field label="Phone"><Input value={selected.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} /></Field>
                  <Field label="Email"><Input value={selected.email ?? ""} onChange={(e) => update({ email: e.target.value })} /></Field>
                  <Field label="City"><Input value={selected.city ?? ""} onChange={(e) => update({ city: e.target.value })} /></Field>
                  <Field label="State"><Input value={selected.state ?? ""} onChange={(e) => update({ state: e.target.value })} /></Field>
                </div>
                <Field label="Description" className="mt-3">
                  <Textarea rows={4} value={selected.description ?? ""} onChange={(e) => update({ description: e.target.value })} />
                </Field>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-card">
                <h2 className="text-base font-semibold">Program status</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Founding Builder</p>
                      <p className="text-xs text-muted-foreground">Mark as a pilot partner.</p>
                    </div>
                    <Switch checked={!!selected.is_founding_builder} onCheckedChange={(v) => update({ is_founding_builder: v })} />
                  </div>
                  <Field label="Founding Builder #">
                    <Input type="number" value={selected.founding_builder_number ?? ""} onChange={(e) => update({ founding_builder_number: e.target.value ? Number(e.target.value) : null })} />
                  </Field>
                  <Field label="Certification level">
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={selected.certification_level ?? "certified"}
                      onChange={(e) => update({ certification_level: e.target.value })}
                    >
                      <option value="certified">Certified</option>
                      <option value="plus">Plus</option>
                      <option value="elite">Elite</option>
                    </select>
                  </Field>
                  <Field label="Certified since">
                    <Input type="date" value={selected.certified_since ?? ""} onChange={(e) => update({ certified_since: e.target.value })} />
                  </Field>
                  <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Public profile enabled</p>
                      <p className="text-xs text-muted-foreground">Show on /builders/&lt;slug&gt;.</p>
                    </div>
                    <Switch checked={!!selected.public_profile_enabled} onCheckedChange={(v) => update({ public_profile_enabled: v })} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-card">
                <h2 className="text-base font-semibold">Badges</h2>
                <p className="text-xs text-muted-foreground">Click to toggle. Custom labels: edit the text field below.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from(new Set([...DEFAULT_BADGES, ...(selected.badges ?? [])])).map((b) => (
                    <Badge
                      key={b}
                      onClick={() => toggleBadge(b)}
                      variant={selected.badges?.includes(b) ? "default" : "outline"}
                      className="cursor-pointer"
                    >
                      {b}
                    </Badge>
                  ))}
                </div>
                <Input
                  className="mt-3"
                  placeholder="Add a custom badge and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const v = e.currentTarget.value.trim();
                      update({ badges: [...(selected.badges ?? []), v] });
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2">
                {selected.slug && <Button asChild variant="outline"><Link to={`/builders/${selected.slug}`}>View public profile</Link></Button>}
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
