import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, ArrowLeftRight, Plus, AlertTriangle, CheckCircle2, Clock, FileText,
  Phone, Globe, Wrench, Calendar, Sparkles, ClipboardCheck, ChevronLeft, ArrowRight,
} from "lucide-react";
import { computeWarrantyHealth, categoryLabel, statusFor, type WarrantyLike } from "@/lib/warrantyHealth";

const CATEGORIES = [
  "roof","hvac","appliance","windows","doors","flooring","foundation","water_heater",
  "electrical","plumbing","solar","smart_home","garage_door","septic","pool","builder",
  "home_warranty","extended_service","other",
] as const;

type Warranty = {
  id: string;
  property_id: string;
  category: string;
  provider: string | null;
  product_name: string | null;
  model_number: string | null;
  serial_number: string | null;
  install_date: string | null;
  purchase_date: string | null;
  warranty_start_date: string | null;
  expiration_date: string | null;
  is_registered: boolean;
  is_transferable: boolean;
  transfer_deadline_days: number | null;
  transfer_fee: number | null;
  required_documents: string[] | null;
  claim_instructions: string | null;
  transfer_instructions: string | null;
  provider_phone: string | null;
  provider_email: string | null;
  provider_website: string | null;
  claim_phone: string | null;
  claim_website: string | null;
  installer_name: string | null;
  installer_phone: string | null;
  installer_license: string | null;
  notes: string | null;
  status: string;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300" },
  expiring_soon: { label: "Expiring Soon", className: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300" },
  needs_registration: { label: "Needs Registration", className: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300" },
  transfer_required: { label: "Transfer Required", className: "bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-300" },
  expired: { label: "Expired", className: "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300" },
};

function monthsRemaining(exp: string | null): string {
  if (!exp) return "—";
  const diff = new Date(exp).getTime() - Date.now();
  if (diff < 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 31) return `${days} days`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rm = months - years * 12;
  return rm ? `${years}y ${rm}mo` : `${years} years`;
}

export default function PropertyWarranties() {
  const { id: propertyId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<{ address_line: string | null; city: string | null; state: string | null } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [annualOpen, setAnnualOpen] = useState(false);
  const [regWarranty, setRegWarranty] = useState<Warranty | null>(null);

  async function load() {
    if (!propertyId) return;
    setLoading(true);
    const [{ data: ws }, { data: p }] = await Promise.all([
      supabase.from("warranties").select("*").eq("property_id", propertyId).order("created_at", { ascending: false }),
      supabase.from("properties").select("address_line, city, state").eq("id", propertyId).maybeSingle(),
    ]);
    setWarranties((ws ?? []) as Warranty[]);
    setProperty(p as any);
    setLoading(false);
  }
  useEffect(() => { load(); }, [propertyId]);

  const stats = useMemo(() => {
    const total = warranties.length;
    const active = warranties.filter((w) => w.status === "active").length;
    const expiringSoon = warranties.filter((w) => w.status === "expiring_soon").length;
    const transferable = warranties.filter((w) => w.is_transferable).length;
    const missingReg = warranties.filter((w) => !w.is_registered).length;
    const expired = warranties.filter((w) => w.status === "expired").length;
    const { score, recs } = computeWarrantyHealth(warranties as WarrantyLike[]);
    return { total, active, expiringSoon, transferable, missingReg, expired, score, recs };
  }, [warranties]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-6xl py-8">
        <Link to="/warranty-hub" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" /> All homes
        </Link>

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero shadow-glow">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Warranty Hub</h1>
              <p className="text-muted-foreground">
                {property?.address_line ? `${property.address_line}, ${property.city ?? ""} ${property.state ?? ""}` : "Manage every warranty for this home"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" className="shadow-glow" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer & Update All Warranties
            </Button>
            <Button variant="outline" onClick={() => setAnnualOpen(true)}>
              <ClipboardCheck className="mr-2 h-4 w-4" /> Annual Checkup
            </Button>
            <Button variant="outline" onClick={() => setAiOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> Ask AI
            </Button>
          </div>
        </header>

        {/* Overview */}
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.active} accent="text-emerald-600" />
          <StatCard label="Expiring Soon" value={stats.expiringSoon} accent="text-amber-600" />
          <StatCard label="Transferable" value={stats.transferable} accent="text-purple-600" />
          <StatCard label="Missing Reg." value={stats.missingReg} accent="text-blue-600" />
          <StatCard label="Expired" value={stats.expired} accent="text-rose-600" />
          <Card className="col-span-2 md:col-span-4 lg:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Warranty Health</p>
              <p className="mt-1 text-2xl font-bold">{stats.score}%</p>
              <Progress value={stats.score} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </section>

        {/* Health recommendations */}
        {stats.recs.length > 0 && (
          <Card className="mb-6 border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1.5 text-sm">
                {stats.recs.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Add */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">All warranties</h2>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add warranty</Button>
            </DialogTrigger>
            <AddWarrantyDialog propertyId={propertyId!} onSaved={() => { setAddOpen(false); load(); }} />
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : warranties.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No warranties yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Add roof, HVAC, appliances, builder warranty, and more.</p>
              <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add your first warranty</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {warranties.map((w) => (
              <WarrantyCard key={w.id} w={w} onRegister={() => setRegWarranty(w)} onChanged={load} />
            ))}
          </div>
        )}

        {/* Dialogs */}
        <TransferWizard open={transferOpen} onOpenChange={setTransferOpen} warranties={warranties} property={property} propertyId={propertyId!} onComplete={load} />
        <AnnualCheckupDialog open={annualOpen} onOpenChange={setAnnualOpen} warranties={warranties} />
        <AIAssistantDialog open={aiOpen} onOpenChange={setAiOpen} propertyId={propertyId!} />
        <RegistrationDialog warranty={regWarranty} onClose={() => setRegWarranty(null)} onComplete={() => { setRegWarranty(null); load(); }} />
      </main>
    </div>
  );
}

// ---------------------- Stat ----------------------
function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${accent ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

// ---------------------- Warranty Card ----------------------
function WarrantyCard({ w, onRegister, onChanged }: { w: Warranty; onRegister: () => void; onChanged: () => void }) {
  const meta = STATUS_META[w.status] ?? STATUS_META.active;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{w.product_name ?? categoryLabel(w.category)}</CardTitle>
            <CardDescription className="mt-0.5">
              {categoryLabel(w.category)}{w.provider ? ` · ${w.provider}` : ""}
            </CardDescription>
          </div>
          <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          <Field label="Model" value={w.model_number} />
          <Field label="Serial" value={w.serial_number} />
          <Field label="Installed" value={w.install_date} />
          <Field label="Expires" value={w.expiration_date} />
          <Field label="Remaining" value={monthsRemaining(w.expiration_date)} />
          <Field label="Installer" value={w.installer_name} />
        </dl>
        <div className="flex flex-wrap gap-1.5">
          {w.is_registered ? <Badge variant="secondary">Registered</Badge> : <Badge variant="outline">Not registered</Badge>}
          {w.is_transferable ? <Badge variant="secondary">Transferable</Badge> : <Badge variant="outline">Non-transferable</Badge>}
          {w.transfer_fee != null && <Badge variant="outline">${w.transfer_fee} fee</Badge>}
          {w.transfer_deadline_days != null && <Badge variant="outline">{w.transfer_deadline_days}d transfer window</Badge>}
        </div>
        {(w.claim_phone || w.claim_website) && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {w.claim_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{w.claim_phone}</span>}
            {w.claim_website && <a href={w.claim_website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground"><Globe className="h-3 w-3" />Claim site</a>}
          </div>
        )}
        {!w.is_registered && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" /> Not fully protected
            </p>
            <p className="mt-1 text-muted-foreground">This warranty may not be fully protected because it has not been registered.</p>
            <Button size="sm" className="mt-2" onClick={onRegister}>Start Registration</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </>
  );
}

// ---------------------- Add Dialog ----------------------
function AddWarrantyDialog({ propertyId, onSaved }: { propertyId: string; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    category: "appliance", provider: "", product_name: "", model_number: "", serial_number: "",
    install_date: "", purchase_date: "", warranty_start_date: "", expiration_date: "",
    is_registered: false, is_transferable: true, transfer_deadline_days: 30, transfer_fee: 0,
    claim_instructions: "", transfer_instructions: "",
    provider_phone: "", provider_email: "", provider_website: "",
    claim_phone: "", claim_website: "",
    installer_name: "", installer_phone: "", installer_license: "", notes: "",
  });

  function update<K extends string>(k: K, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function submit() {
    setSaving(true);
    const payload: any = { ...form, property_id: propertyId };
    ["install_date","purchase_date","warranty_start_date","expiration_date"].forEach((k) => {
      if (!payload[k]) payload[k] = null;
    });
    payload.transfer_fee = payload.transfer_fee === "" ? null : Number(payload.transfer_fee);
    payload.transfer_deadline_days = payload.transfer_deadline_days === "" ? null : Number(payload.transfer_deadline_days);
    // derive status
    const status = statusFor({
      status: "active",
      is_registered: payload.is_registered,
      is_transferable: payload.is_transferable,
      expiration_date: payload.expiration_date,
      claim_instructions: payload.claim_instructions,
      provider_phone: payload.provider_phone,
      installer_name: payload.installer_name,
    });
    payload.status = status;
    const { error } = await supabase.from("warranties").insert(payload);
    setSaving(false);
    if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Warranty added" });
    onSaved();
  }

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>Add warranty</DialogTitle></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field2 label="Category">
          <Select value={form.category} onValueChange={(v) => update("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field2>
        <Field2 label="Provider"><Input value={form.provider} onChange={(e) => update("provider", e.target.value)} /></Field2>
        <Field2 label="Product name"><Input value={form.product_name} onChange={(e) => update("product_name", e.target.value)} /></Field2>
        <Field2 label="Model number"><Input value={form.model_number} onChange={(e) => update("model_number", e.target.value)} /></Field2>
        <Field2 label="Serial number"><Input value={form.serial_number} onChange={(e) => update("serial_number", e.target.value)} /></Field2>
        <Field2 label="Install date"><Input type="date" value={form.install_date} onChange={(e) => update("install_date", e.target.value)} /></Field2>
        <Field2 label="Purchase date"><Input type="date" value={form.purchase_date} onChange={(e) => update("purchase_date", e.target.value)} /></Field2>
        <Field2 label="Warranty start"><Input type="date" value={form.warranty_start_date} onChange={(e) => update("warranty_start_date", e.target.value)} /></Field2>
        <Field2 label="Expiration date"><Input type="date" value={form.expiration_date} onChange={(e) => update("expiration_date", e.target.value)} /></Field2>
        <Field2 label="Transfer deadline (days)"><Input type="number" value={form.transfer_deadline_days} onChange={(e) => update("transfer_deadline_days", e.target.value)} /></Field2>
        <Field2 label="Transfer fee ($)"><Input type="number" value={form.transfer_fee} onChange={(e) => update("transfer_fee", e.target.value)} /></Field2>
        <Field2 label="Provider phone"><Input value={form.provider_phone} onChange={(e) => update("provider_phone", e.target.value)} /></Field2>
        <Field2 label="Provider email"><Input value={form.provider_email} onChange={(e) => update("provider_email", e.target.value)} /></Field2>
        <Field2 label="Provider website"><Input value={form.provider_website} onChange={(e) => update("provider_website", e.target.value)} /></Field2>
        <Field2 label="Claim phone"><Input value={form.claim_phone} onChange={(e) => update("claim_phone", e.target.value)} /></Field2>
        <Field2 label="Claim website"><Input value={form.claim_website} onChange={(e) => update("claim_website", e.target.value)} /></Field2>
        <Field2 label="Installer / contractor"><Input value={form.installer_name} onChange={(e) => update("installer_name", e.target.value)} /></Field2>
        <Field2 label="Installer license #"><Input value={form.installer_license} onChange={(e) => update("installer_license", e.target.value)} /></Field2>
        <Field2 label="Installer phone"><Input value={form.installer_phone} onChange={(e) => update("installer_phone", e.target.value)} /></Field2>
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={form.is_registered} onCheckedChange={(v) => update("is_registered", v)} id="reg" />
          <Label htmlFor="reg">Registered with provider</Label>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={form.is_transferable} onCheckedChange={(v) => update("is_transferable", v)} id="trf" />
          <Label htmlFor="trf">Transferable on sale</Label>
        </div>
        <Field2 label="Claim instructions" className="sm:col-span-2"><Textarea rows={2} value={form.claim_instructions} onChange={(e) => update("claim_instructions", e.target.value)} /></Field2>
        <Field2 label="Transfer instructions" className="sm:col-span-2"><Textarea rows={2} value={form.transfer_instructions} onChange={(e) => update("transfer_instructions", e.target.value)} /></Field2>
        <Field2 label="Notes" className="sm:col-span-2"><Textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></Field2>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save warranty"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field2({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

// ---------------------- Transfer Wizard ----------------------
function TransferWizard({
  open, onOpenChange, warranties, property, propertyId, onComplete,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  warranties: Warranty[]; property: any; propertyId: string; onComplete: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [info, setInfo] = useState({
    seller_name: "", seller_email: "", buyer_name: "", buyer_email: "", closing_date: "",
  });
  const [transferId, setTransferId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({
    submitted: false, fee_paid: false, buyer_registered: false,
    confirmation_received: false, updated_in_homefacts: false, reminder_scheduled: false,
  });

  const buckets = useMemo(() => ({
    transferable: warranties.filter((w) => w.is_transferable && w.status !== "expired"),
    nonTransferable: warranties.filter((w) => !w.is_transferable),
    registered: warranties.filter((w) => w.is_registered),
    missingReg: warranties.filter((w) => !w.is_registered),
    expired: warranties.filter((w) => w.status === "expired"),
  }), [warranties]);

  async function createTransfer() {
    const address = property ? [property.address_line, property.city, property.state].filter(Boolean).join(", ") : null;
    const { data, error } = await supabase.from("warranty_transfers").insert({
      property_id: propertyId,
      seller_name: info.seller_name || null,
      seller_email: info.seller_email || null,
      buyer_name: info.buyer_name || null,
      buyer_email: info.buyer_email || null,
      closing_date: info.closing_date || null,
      property_address: address,
      status: "in_progress",
      warranty_ids: buckets.transferable.map((w) => w.id),
    }).select().single();
    if (error) { toast({ title: "Couldn't start transfer", description: error.message, variant: "destructive" }); return false; }
    setTransferId(data.id);
    return true;
  }

  async function saveChecklist(next: typeof checklist) {
    setChecklist(next);
    if (transferId) {
      await supabase.from("warranty_transfers").update({ checklist: next }).eq("id", transferId);
    }
  }

  async function finish() {
    if (transferId) {
      await supabase.from("warranty_transfers").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", transferId);
    }
    toast({ title: "Transfer package ready", description: "Buyer is now protected." });
    onOpenChange(false);
    setStep(1);
    onComplete();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Warranty Transfer Wizard — Step {step} of 5</DialogTitle>
        </DialogHeader>
        <Progress value={(step / 5) * 100} className="h-1.5" />

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field2 label="Seller name"><Input value={info.seller_name} onChange={(e) => setInfo({ ...info, seller_name: e.target.value })} /></Field2>
            <Field2 label="Seller email"><Input value={info.seller_email} onChange={(e) => setInfo({ ...info, seller_email: e.target.value })} /></Field2>
            <Field2 label="Buyer name"><Input value={info.buyer_name} onChange={(e) => setInfo({ ...info, buyer_name: e.target.value })} /></Field2>
            <Field2 label="Buyer email"><Input value={info.buyer_email} onChange={(e) => setInfo({ ...info, buyer_email: e.target.value })} /></Field2>
            <Field2 label="Closing date"><Input type="date" value={info.closing_date} onChange={(e) => setInfo({ ...info, closing_date: e.target.value })} /></Field2>
            <Field2 label="Property address"><Input disabled value={property?.address_line ?? ""} /></Field2>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <ScanRow label="Transferable" count={buckets.transferable.length} tone="emerald" />
            <ScanRow label="Non-transferable" count={buckets.nonTransferable.length} tone="muted" />
            <ScanRow label="Already registered" count={buckets.registered.length} tone="blue" />
            <ScanRow label="Missing registration" count={buckets.missingReg.length} tone="amber" />
            <ScanRow label="Expired" count={buckets.expired.length} tone="rose" />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Required actions per transferable warranty:</p>
            {buckets.transferable.length === 0 && <p className="text-sm">No transferable warranties found.</p>}
            {buckets.transferable.map((w) => (
              <Card key={w.id}>
                <CardContent className="space-y-1.5 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{w.product_name ?? categoryLabel(w.category)}</p>
                    <Badge variant="outline">{w.provider ?? "Provider TBD"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
                    <span>Fee: {w.transfer_fee != null ? `$${w.transfer_fee}` : "—"}</span>
                    <span>Deadline: {w.transfer_deadline_days ? `${w.transfer_deadline_days} days` : "—"}</span>
                    <span>Proof of purchase: required</span>
                    <span>Closing doc: required</span>
                  </div>
                  {(w.provider_website || w.provider_phone) && (
                    <p className="text-xs">
                      Contact:{" "}
                      {w.provider_website && <a className="text-primary hover:underline" href={w.provider_website} target="_blank" rel="noreferrer">website</a>}
                      {w.provider_website && w.provider_phone && " · "}
                      {w.provider_phone}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 4 && (
          <Card>
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="font-medium">Warranty Transfer Package</p>
              <ul className="ml-5 list-disc space-y-0.5 text-muted-foreground">
                <li>{buckets.transferable.length} warranty certificate{buckets.transferable.length === 1 ? "" : "s"}</li>
                <li>Provider contact info & claim instructions</li>
                <li>Original invoices & serial/model numbers</li>
                <li>Product manuals & maintenance records</li>
                <li>Contractor info & permits</li>
                <li>Transfer instructions per provider</li>
              </ul>
              <p className="text-xs text-muted-foreground">The package will be saved to this property's record and emailed to the buyer.</p>
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <div className="space-y-2">
            {([
              ["submitted","Submitted to provider"],
              ["fee_paid","Transfer fee paid"],
              ["buyer_registered","Buyer registered"],
              ["confirmation_received","Confirmation received"],
              ["updated_in_homefacts","Warranty updated in Orivaz"],
              ["reminder_scheduled","Reminder scheduled"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 rounded-md border p-3">
                <Checkbox checked={checklist[k]} onCheckedChange={(v) => saveChecklist({ ...checklist, [k]: !!v })} />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
          {step < 5 && (
            <Button onClick={async () => {
              if (step === 1 && !transferId) {
                const ok = await createTransfer();
                if (!ok) return;
              }
              setStep(step + 1);
            }}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === 5 && <Button onClick={finish}>Complete transfer</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScanRow({ label, count, tone }: { label: string; count: number; tone: "emerald"|"muted"|"blue"|"amber"|"rose" }) {
  const cls = {
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
    rose: "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300",
    muted: "border-border bg-muted/30",
  }[tone];
  return (
    <div className={`flex items-center justify-between rounded-md border p-3 text-sm ${cls}`}>
      <span>{label}</span>
      <span className="font-semibold">{count}</span>
    </div>
  );
}

// ---------------------- Registration Dialog ----------------------
function RegistrationDialog({ warranty, onClose, onComplete }: { warranty: Warranty | null; onClose: () => void; onComplete: () => void }) {
  const { toast } = useToast();
  const [owner, setOwner] = useState({ name: "", email: "", phone: "" });
  const [confirmation, setConfirmation] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => { if (warranty) { setStep(1); setOwner({ name: "", email: "", phone: "" }); setConfirmation(""); } }, [warranty?.id]);

  if (!warranty) return null;

  async function submit() {
    await supabase.from("warranty_registrations").insert({
      warranty_id: warranty!.id,
      owner_name: owner.name || null,
      owner_email: owner.email || null,
      owner_phone: owner.phone || null,
      confirmation_number: confirmation || null,
      status: confirmation ? "registered" : "submitted",
      submitted_at: new Date().toISOString(),
      confirmed_at: confirmation ? new Date().toISOString() : null,
    });
    if (confirmation) {
      await supabase.from("warranties").update({ is_registered: true, status: "active" }).eq("id", warranty!.id);
    }
    toast({ title: confirmation ? "Marked as registered" : "Registration submitted" });
    onComplete();
  }

  return (
    <Dialog open={!!warranty} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registration Assistant — {warranty.product_name ?? categoryLabel(warranty.category)}</DialogTitle></DialogHeader>
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Confirm owner info to register this warranty with {warranty.provider ?? "the provider"}.</p>
            <Field2 label="Owner name"><Input value={owner.name} onChange={(e) => setOwner({ ...owner, name: e.target.value })} /></Field2>
            <Field2 label="Owner email"><Input value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} /></Field2>
            <Field2 label="Owner phone"><Input value={owner.phone} onChange={(e) => setOwner({ ...owner, phone: e.target.value })} /></Field2>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Product</p>
              <p className="text-muted-foreground">{warranty.product_name ?? "—"} · Model {warranty.model_number ?? "—"} · Serial {warranty.serial_number ?? "—"}</p>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm">Open the provider's registration page, complete the form, then return here.</p>
            {warranty.provider_website ? (
              <Button asChild><a href={warranty.provider_website} target="_blank" rel="noreferrer">Open provider registration</a></Button>
            ) : (
              <p className="text-sm text-muted-foreground">No provider website on file — call {warranty.provider_phone ?? "the provider"}.</p>
            )}
            <Field2 label="Confirmation # (optional)"><Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></Field2>
          </div>
        )}
        <DialogFooter className="gap-2">
          {step > 1 && <Button variant="outline" onClick={() => setStep(1)}>Back</Button>}
          {step === 1 && <Button onClick={() => setStep(2)}>Continue</Button>}
          {step === 2 && <Button onClick={submit}>{confirmation ? "Mark registered" : "Mark submitted"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------- Annual Checkup ----------------------
function AnnualCheckupDialog({ open, onOpenChange, warranties }: { open: boolean; onOpenChange: (v: boolean) => void; warranties: Warranty[] }) {
  const findings = useMemo(() => {
    const out: { tone: "ok"|"warn"|"bad"; label: string }[] = [];
    const expiring = warranties.filter((w) => w.status === "expiring_soon");
    const missing = warranties.filter((w) => !w.is_registered);
    const noClaim = warranties.filter((w) => !w.claim_instructions && !w.claim_phone);
    const noInstaller = warranties.filter((w) => !w.installer_name);
    const expired = warranties.filter((w) => w.status === "expired");

    out.push(expiring.length
      ? { tone: "warn", label: `${expiring.length} warranty${expiring.length>1?"ies":""} expiring soon` }
      : { tone: "ok", label: "No warranties expiring in next 90 days" });
    out.push(missing.length
      ? { tone: "warn", label: `${missing.length} warranty${missing.length>1?"ies":""} missing registration` }
      : { tone: "ok", label: "All warranties are registered" });
    out.push(noClaim.length
      ? { tone: "warn", label: `${noClaim.length} warranty${noClaim.length>1?"ies":""} missing claim contact` }
      : { tone: "ok", label: "Claim info present for all warranties" });
    out.push(noInstaller.length
      ? { tone: "warn", label: `${noInstaller.length} warranty${noInstaller.length>1?"ies":""} missing installer info` }
      : { tone: "ok", label: "Installer info captured" });
    out.push(expired.length
      ? { tone: "bad", label: `${expired.length} expired warranty${expired.length>1?"ies":""} — consider extended service plans` }
      : { tone: "ok", label: "No expired warranties" });
    return out;
  }, [warranties]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Annual Warranty Checkup</DialogTitle></DialogHeader>
        <ul className="space-y-2">
          {findings.map((f, i) => (
            <li key={i} className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
              f.tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5" :
              f.tone === "warn" ? "border-amber-500/30 bg-amber-500/5" : "border-rose-500/30 bg-rose-500/5"
            }`}>
              {f.tone === "ok" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
               f.tone === "warn" ? <Clock className="h-4 w-4 text-amber-600" /> :
               <AlertTriangle className="h-4 w-4 text-rose-600" />}
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------- AI Assistant ----------------------
function AIAssistantDialog({ open, onOpenChange, propertyId }: { open: boolean; onOpenChange: (v: boolean) => void; propertyId: string }) {
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<{ role: "user"|"assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function ask() {
    if (!q.trim()) return;
    const userMsg = { role: "user" as const, content: q };
    setHistory((h) => [...h, userMsg]);
    setQ("");
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/warranty-assistant`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          propertyId,
          messages: [...history, userMsg].map((m) => ({
            id: crypto.randomUUID(), role: m.role, parts: [{ type: "text", text: m.content }],
          })),
        }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      setHistory((h) => [...h, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        // Stream is AI SDK UI-message protocol; extract text deltas crudely.
        chunk.split("\n").forEach((line) => {
          const m = line.match(/"delta":"([^"]*)"/);
          if (m) text += m[1].replace(/\\n/g, "\n");
        });
        setHistory((h) => {
          const copy = [...h];
          copy[copy.length - 1] = { role: "assistant", content: text };
          return copy;
        });
      }
    } catch (e: any) {
      toast({ title: "Assistant error", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "Which warranties transfer to a new buyer?",
    "What warranties need attention before selling?",
    "Which warranties are expiring soon?",
    "What documents are missing?",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Warranty Assistant</DialogTitle></DialogHeader>
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto rounded-md border p-3 text-sm">
          {history.length === 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground">Try one of these:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => setQ(s)}>{s}</Button>
                ))}
              </div>
            </div>
          )}
          {history.map((m, i) => (
            <div key={i} className={m.role === "user" ? "self-end rounded-lg bg-primary px-3 py-2 text-primary-foreground" : "self-start rounded-lg bg-muted px-3 py-2"}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about your warranties…"
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) ask(); }} />
          <Button onClick={ask} disabled={loading || !q.trim()}>{loading ? "…" : "Ask"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
