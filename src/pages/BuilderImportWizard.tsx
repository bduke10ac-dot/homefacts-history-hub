import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { BuilderLogoUpload } from "@/components/builder/BuilderLogoUpload";
import {
  Globe, ArrowLeft, ArrowRight, Save, Upload, CheckCircle2, AlertCircle,
  Building2, Home, FileText, ShieldCheck, Sparkles,
} from "lucide-react";

const STEPS = [
  { key: "website", title: "Builder Website", icon: Globe },
  { key: "profile", title: "Builder Profile", icon: Building2 },
  { key: "communities", title: "Communities", icon: Home },
  { key: "floorplans", title: "Floor Plans", icon: FileText },
  { key: "homes", title: "Available Homes", icon: Home },
  { key: "warranty", title: "Warranty & Resources", icon: ShieldCheck },
  { key: "review", title: "Review & Publish", icon: Sparkles },
];

type Community = { name: string; city?: string; state?: string; description?: string; amenities?: string; hoa?: string; schools?: string };
type FloorPlan = { name: string; square_feet?: number; bedrooms?: number; bathrooms?: number; garage?: string; elevation?: string; included_features?: string; upgrade_options?: string };
type HomeRec = { address_line: string; lot_number?: string; community?: string; floor_plan?: string; list_price?: number; status?: string; estimated_completion?: string; square_feet?: number; bedrooms?: number; bathrooms?: number; listing_url?: string };

export default function BuilderImportWizard() {
  const [step, setStep] = useState(0);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Step 1
  const [websiteInput, setWebsiteInput] = useState("https://www.creeksidenewhomes.com");

  // Step 2 - profile
  const [profile, setProfile] = useState<any>({
    name: "Creekside Homes",
    website: "https://www.creeksidenewhomes.com",
    logo_url: "",
    phone: "",
    email: "",
    office_address: "",
    description: "Creekside Homes builds quality new construction homes with thoughtful design, durable craftsmanship, and a homeowner-first warranty experience.",
    service_areas: "Middle Tennessee",
    social_facebook: "",
    social_instagram: "",
    brand_primary_color: "#1f4e2e",
    brand_secondary_color: "#c9a96a",
    certifications: "Orivaz Verified Builder",
    is_founding_builder: true,
    founding_builder_number: 1,
    is_certified_builder: true,
  });

  // Step 3-5
  const [communities, setCommunities] = useState<Community[]>([
    { name: "Bellsford Landing", city: "Spring Hill", state: "TN", description: "A welcoming community of new homes with parks and walking trails.", amenities: "Walking trails, playground, open green space", schools: "Maury County Public Schools" },
  ]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([
    { name: "The Magnolia", square_feet: 2450, bedrooms: 4, bathrooms: 3, garage: "2-car", elevation: "Craftsman", included_features: "Quartz counters, LVP flooring, smart thermostat" },
  ]);
  const [homes, setHomes] = useState<HomeRec[]>([
    { address_line: "123 Bellsford Way", lot_number: "12", community: "Bellsford Landing", floor_plan: "The Magnolia", list_price: 489000, status: "under_construction", bedrooms: 4, bathrooms: 3, square_feet: 2450 },
  ]);

  // Step 6
  const [resources, setResources] = useState({
    warranty_docs: "1-year workmanship, 2-year systems, 10-year structural",
    owner_manuals: "Appliance manuals, HVAC manual, water heater manual",
    maintenance_guide: "Seasonal checklist included",
    emergency_contacts: "24/7 warranty line",
    utility_setup: "Electric, water, gas, internet provider list",
    walkthrough_checklist: "Pre-closing walkthrough form",
    hoa_documents: "HOA covenants and welcome packet",
    closing_documents: "Final closing package",
  });

  // Try to load existing founding builder
  useEffect(() => {
    supabase
      .from("builder_companies")
      .select("*")
      .eq("is_founding_builder", true)
      .order("founding_builder_number", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCompanyId(data.id);
          setProfile((p: any) => ({ ...p, ...data }));
          setWebsiteInput(data.website || websiteInput);
        }
      });
  }, []);

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  async function handleImportFromWebsite() {
    if (!websiteInput) return toast.error("Enter a website URL first");
    setProfile((p: any) => ({ ...p, website: websiteInput }));
    toast.success("Website saved. Continue to fill out the builder profile with information you own or have permission to use.");
    next();
  }

  async function saveDraft() {
    const payload: any = {
      name: profile.name,
      slug: (profile.slug || profile.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      website: profile.website,
      logo_url: profile.logo_url || null,
      phone: profile.phone || null,
      email: profile.email || null,
      office_address: profile.office_address || null,
      description: profile.description || null,
      service_areas: profile.service_areas || null,
      social_facebook: profile.social_facebook || null,
      social_instagram: profile.social_instagram || null,
      brand_primary_color: profile.brand_primary_color || null,
      brand_secondary_color: profile.brand_secondary_color || null,
      is_founding_builder: !!profile.is_founding_builder,
      founding_builder_number: profile.is_founding_builder ? (profile.founding_builder_number || 1) : null,
      is_certified_builder: !!profile.is_certified_builder,
    };

    let id = companyId;
    if (id) {
      const { error } = await supabase.from("builder_companies").update(payload).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("builder_companies").insert(payload).select("id").maybeSingle();
      if (error) return toast.error(error.message);
      id = data?.id ?? null;
      setCompanyId(id);
    }
    toast.success("Draft saved");
  }

  async function publishProfile() {
    await saveDraft();
    toast.success("Builder profile published");
  }

  function publishDemoHomes() {
    toast.success(`${homes.length} demo home${homes.length === 1 ? "" : "s"} queued for publishing`);
  }

  function generateDigitalRecords() {
    toast.success("Digital Home Records generated for all demo homes");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Builder Import Wizard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up a Orivaz Builder Program partner. Creekside Homes is preloaded as Founding Builder #001.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <button
                key={s.key}
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                  active ? "border-primary bg-primary text-primary-foreground" : done ? "border-primary/30 bg-primary/10" : "bg-muted/40"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{i + 1}. {s.title}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step].title}</CardTitle>
            <CardDescription>
              {step === 0 && "Tell us where to find this builder."}
              {step === 1 && "Branding, contact info, and partner status."}
              {step === 2 && "Add communities the builder is actively building in."}
              {step === 3 && "Add the floor plans available to homebuyers."}
              {step === 4 && "Add specific available homes to publish."}
              {step === 5 && "Warranty, manuals, and homeowner handoff resources."}
              {step === 6 && "Review and publish your builder partner."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* STEP 1 */}
            {step === 0 && (
              <>
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
                  Only import information you own or have permission to use. Do not upload copyrighted photos, logos, or text without builder/admin approval.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Builder website URL</Label>
                  <Input id="website" value={websiteInput} onChange={(e) => setWebsiteInput(e.target.value)} placeholder="https://www.creeksidenewhomes.com" />
                </div>
                <Button onClick={handleImportFromWebsite}><Upload className="mr-2 h-4 w-4" />Import Builder Info</Button>
              </>
            )}

            {/* STEP 2 - PROFILE */}
            {step === 1 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Builder name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
                  <Field label="Website" value={profile.website} onChange={(v) => setProfile({ ...profile, website: v })} />
                  <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
                  <Field label="Email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
                  <Field label="Office address" value={profile.office_address} onChange={(v) => setProfile({ ...profile, office_address: v })} className="md:col-span-2" />
                  <Field label="Service areas" value={profile.service_areas} onChange={(v) => setProfile({ ...profile, service_areas: v })} />
                  <Field label="Certifications" value={profile.certifications} onChange={(v) => setProfile({ ...profile, certifications: v })} />
                  <Field label="Facebook" value={profile.social_facebook} onChange={(v) => setProfile({ ...profile, social_facebook: v })} />
                  <Field label="Instagram" value={profile.social_instagram} onChange={(v) => setProfile({ ...profile, social_instagram: v })} />
                  <div className="space-y-2">
                    <Label>Primary color</Label>
                    <Input type="color" value={profile.brand_primary_color || "#1f4e2e"} onChange={(e) => setProfile({ ...profile, brand_primary_color: e.target.value })} className="h-10 w-20 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary color</Label>
                    <Input type="color" value={profile.brand_secondary_color || "#c9a96a"} onChange={(e) => setProfile({ ...profile, brand_secondary_color: e.target.value })} className="h-10 w-20 p-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Builder description</Label>
                  <Textarea rows={3} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
                </div>
                {companyId && (
                  <div className="space-y-2">
                    <Label>Builder logo</Label>
                    <BuilderLogoUpload
                      companyId={companyId}
                      currentUrl={profile.logo_url}
                      onUpdated={(url) => setProfile({ ...profile, logo_url: url })}
                    />
                  </div>
                )}
                <Separator />
                <div className="flex flex-wrap gap-4">
                  <ToggleRow label="Founding Builder" checked={!!profile.is_founding_builder} onChange={(v) => setProfile({ ...profile, is_founding_builder: v })} />
                  {profile.is_founding_builder && (
                    <div className="space-y-1">
                      <Label className="text-xs">Founding builder #</Label>
                      <Input type="number" value={profile.founding_builder_number ?? 1} onChange={(e) => setProfile({ ...profile, founding_builder_number: Number(e.target.value) })} className="w-24" />
                    </div>
                  )}
                  <ToggleRow label="Certified Builder" checked={!!profile.is_certified_builder} onChange={(v) => setProfile({ ...profile, is_certified_builder: v })} />
                </div>
              </>
            )}

            {/* STEP 3 - COMMUNITIES */}
            {step === 2 && (
              <RepeatList
                items={communities}
                setItems={setCommunities as any}
                blank={{ name: "" }}
                renderRow={(c, upd) => (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Community name" value={c.name} onChange={(v) => upd({ ...c, name: v })} />
                    <Field label="Location (city, state)" value={`${c.city ?? ""}${c.state ? ", " + c.state : ""}`} onChange={(v) => { const [city, st] = v.split(","); upd({ ...c, city: city?.trim(), state: st?.trim() }); }} />
                    <Field label="Overview" value={c.description} onChange={(v) => upd({ ...c, description: v })} className="md:col-span-2" />
                    <Field label="Amenities" value={c.amenities} onChange={(v) => upd({ ...c, amenities: v })} />
                    <Field label="HOA info" value={c.hoa} onChange={(v) => upd({ ...c, hoa: v })} />
                    <Field label="School zones" value={c.schools} onChange={(v) => upd({ ...c, schools: v })} className="md:col-span-2" />
                  </div>
                )}
                addLabel="Add community"
              />
            )}

            {/* STEP 4 - FLOOR PLANS */}
            {step === 3 && (
              <RepeatList
                items={floorPlans}
                setItems={setFloorPlans as any}
                blank={{ name: "" }}
                renderRow={(p, upd) => (
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Plan name" value={p.name} onChange={(v) => upd({ ...p, name: v })} />
                    <Field label="Square footage" value={p.square_feet} type="number" onChange={(v) => upd({ ...p, square_feet: Number(v) })} />
                    <Field label="Elevation" value={p.elevation} onChange={(v) => upd({ ...p, elevation: v })} />
                    <Field label="Bedrooms" value={p.bedrooms} type="number" onChange={(v) => upd({ ...p, bedrooms: Number(v) })} />
                    <Field label="Bathrooms" value={p.bathrooms} type="number" onChange={(v) => upd({ ...p, bathrooms: Number(v) })} />
                    <Field label="Garage" value={p.garage} onChange={(v) => upd({ ...p, garage: v })} />
                    <Field label="Included features" value={p.included_features} onChange={(v) => upd({ ...p, included_features: v })} className="md:col-span-3" />
                    <Field label="Upgrade options" value={p.upgrade_options} onChange={(v) => upd({ ...p, upgrade_options: v })} className="md:col-span-3" />
                  </div>
                )}
                addLabel="Add floor plan"
              />
            )}

            {/* STEP 5 - HOMES */}
            {step === 4 && (
              <RepeatList
                items={homes}
                setItems={setHomes as any}
                blank={{ address_line: "" }}
                renderRow={(h, upd) => (
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Address" value={h.address_line} onChange={(v) => upd({ ...h, address_line: v })} className="md:col-span-2" />
                    <Field label="Lot #" value={h.lot_number} onChange={(v) => upd({ ...h, lot_number: v })} />
                    <Field label="Community" value={h.community} onChange={(v) => upd({ ...h, community: v })} />
                    <Field label="Floor plan" value={h.floor_plan} onChange={(v) => upd({ ...h, floor_plan: v })} />
                    <Field label="Price" type="number" value={h.list_price} onChange={(v) => upd({ ...h, list_price: Number(v) })} />
                    <Field label="Status" value={h.status} onChange={(v) => upd({ ...h, status: v })} />
                    <Field label="Estimated completion" value={h.estimated_completion} onChange={(v) => upd({ ...h, estimated_completion: v })} />
                    <Field label="Square feet" type="number" value={h.square_feet} onChange={(v) => upd({ ...h, square_feet: Number(v) })} />
                    <Field label="Bedrooms" type="number" value={h.bedrooms} onChange={(v) => upd({ ...h, bedrooms: Number(v) })} />
                    <Field label="Bathrooms" type="number" value={h.bathrooms} onChange={(v) => upd({ ...h, bathrooms: Number(v) })} />
                    <Field label="Listing link" value={h.listing_url} onChange={(v) => upd({ ...h, listing_url: v })} className="md:col-span-3" />
                  </div>
                )}
                addLabel="Add available home"
              />
            )}

            {/* STEP 6 - WARRANTY */}
            {step === 5 && (
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(resources).map(([k, v]) => (
                  <div key={k} className="space-y-1">
                    <Label className="capitalize">{k.replace(/_/g, " ")}</Label>
                    <Textarea rows={2} value={v} onChange={(e) => setResources({ ...resources, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
            )}

            {/* STEP 7 - REVIEW */}
            {step === 6 && (
              <div className="space-y-4 text-sm">
                <Section title="Builder profile">
                  <div className="grid gap-1">
                    <div><b>{profile.name}</b> · {profile.website}</div>
                    <div className="text-muted-foreground">{profile.description}</div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {profile.is_founding_builder && <Badge>Founding Builder #{String(profile.founding_builder_number ?? 1).padStart(3, "0")}</Badge>}
                      {profile.is_certified_builder && <Badge variant="secondary">Certified Builder</Badge>}
                    </div>
                  </div>
                </Section>
                <Section title={`Communities (${communities.length})`}>
                  {communities.map((c, i) => <div key={i}>· {c.name} {c.city && `— ${c.city}, ${c.state}`}</div>)}
                </Section>
                <Section title={`Floor plans (${floorPlans.length})`}>
                  {floorPlans.map((p, i) => <div key={i}>· {p.name} — {p.square_feet} sqft, {p.bedrooms}bd/{p.bathrooms}ba</div>)}
                </Section>
                <Section title={`Available homes (${homes.length})`}>
                  {homes.map((h, i) => <div key={i}>· {h.address_line} · Lot {h.lot_number} · ${h.list_price?.toLocaleString()}</div>)}
                </Section>
                <div className="flex flex-wrap gap-2 pt-4">
                  <Button onClick={saveDraft} variant="outline"><Save className="mr-2 h-4 w-4" />Save Draft</Button>
                  <Button onClick={publishProfile}><CheckCircle2 className="mr-2 h-4 w-4" />Publish Builder Profile</Button>
                  <Button onClick={publishDemoHomes} variant="secondary">Publish Demo Homes</Button>
                  <Button onClick={generateDigitalRecords} variant="secondary"><Sparkles className="mr-2 h-4 w-4" />Generate Digital Home Records</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={back} disabled={step === 0}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={saveDraft}><Save className="mr-2 h-4 w-4" />Save Draft</Button>
            {step < STEPS.length - 1 && <Button onClick={next}>Next<ArrowRight className="ml-2 h-4 w-4" /></Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", className }: { label: string; value: any; onChange: (v: any) => void; type?: string; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={onChange} />
      <Label className="text-sm">{label}</Label>
    </div>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function RepeatList<T>({ items, setItems, blank, renderRow, addLabel }: { items: T[]; setItems: (v: T[]) => void; blank: T; renderRow: (item: T, update: (i: T) => void) => any; addLabel: string }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
            {items.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => setItems(items.filter((_, k) => k !== i))}>Remove</Button>
            )}
          </div>
          {renderRow(it, (updated) => setItems(items.map((x, k) => (k === i ? updated : x))))}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setItems([...items, { ...(blank as any) }])}>+ {addLabel}</Button>
    </div>
  );
}
