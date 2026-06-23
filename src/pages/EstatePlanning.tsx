import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield, Users, Plus, Trash2, Mail, FileDown, FileText, Upload, Stethoscope,
  Scale, MessageCircle, BellRing, ShieldAlert, Sparkles, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";

/* ---------------- Static config ---------------- */

const ACCESS_LEVELS = [
  { value: "view_only", label: "View only" },
  { value: "emergency_only", label: "Emergency access" },
  { value: "property_manager", label: "Property manager access" },
  { value: "legal_documents", label: "Legal document access" },
  { value: "insurance", label: "Insurance access" },
  { value: "maintenance", label: "Maintenance history access" },
  { value: "contractors", label: "Contractor contact access" },
  { value: "full_admin", label: "Full estate administrator" },
];

const DOCUMENT_TYPES = [
  "Will","Living trust","Deed","Title document","Mortgage document","Home insurance policy",
  "Property tax record","Closing document","Power of attorney","Medical power of attorney",
  "Healthcare directive","Beneficiary document","Trust document","Probate document",
  "Safe deposit box info","Digital asset instructions","Property survey","HOA document",
  "Utility account info","Other",
];

const CHECKLIST: { key: string; label: string }[] = [
  { key: "will_uploaded", label: "Will uploaded" },
  { key: "trust_uploaded", label: "Living trust uploaded" },
  { key: "deed_uploaded", label: "Property deed uploaded" },
  { key: "title_uploaded", label: "Title documents uploaded" },
  { key: "mortgage_saved", label: "Mortgage information saved" },
  { key: "insurance_saved", label: "Home insurance policy saved" },
  { key: "poa_uploaded", label: "Power of attorney uploaded" },
  { key: "medical_poa_uploaded", label: "Medical power of attorney uploaded" },
  { key: "healthcare_directive", label: "Healthcare directive uploaded" },
  { key: "beneficiaries_documented", label: "Beneficiaries documented" },
  { key: "emergency_contacts", label: "Emergency contacts added" },
  { key: "attorney_contact", label: "Attorney contact added" },
  { key: "tax_advisor_contact", label: "Tax advisor contact added" },
  { key: "transfer_instructions", label: "Property transfer instructions completed" },
  { key: "digital_vault", label: "Digital vault completed" },
  { key: "annual_review", label: "Annual estate review completed" },
];

const PROBATE_TASKS: { key: string; label: string }[] = [
  { key: "notify_attorney", label: "Notify attorney" },
  { key: "notify_mortgage", label: "Notify mortgage company" },
  { key: "notify_insurance", label: "Notify home insurance carrier" },
  { key: "notify_hoa", label: "Notify HOA" },
  { key: "notify_utilities", label: "Notify utility companies" },
  { key: "notify_tax_office", label: "Notify property tax office" },
  { key: "review_will", label: "Review will / trust" },
  { key: "locate_deed", label: "Locate deed / title documents" },
  { key: "review_mortgage_balance", label: "Review mortgage balance" },
  { key: "secure_property", label: "Secure property" },
  { key: "continue_insurance", label: "Continue insurance coverage" },
  { key: "transfer_utilities", label: "Transfer utilities if needed" },
  { key: "schedule_inspection", label: "Schedule property inspection" },
  { key: "review_maintenance", label: "Review maintenance needs" },
  { key: "prepare_transfer_docs", label: "Prepare ownership transfer documents" },
  { key: "track_probate", label: "Track probate status if applicable" },
];

const REVIEW_TYPES = [
  "Review will","Review living trust","Review beneficiaries","Review home insurance",
  "Review mortgage information","Review property tax records","Review power of attorney",
  "Review healthcare directive","Review trusted contacts","Review emergency instructions",
  "Review digital vault","Review legal professional contacts",
];

const AI_PROMPTS = [
  "What estate documents should I have for my home?",
  "What happens to my house if I pass away without a will?",
  "Should I consider a trust?",
  "How do I prepare my family to manage my home?",
  "What documents should be reviewed annually?",
  "What should my estate administrator know about my property?",
];

const DISCLAIMER =
  "Orivaz provides educational information only and does not provide legal, tax, or financial advice. Please consult a licensed professional.";

/* ---------------- Types ---------------- */

interface Contact {
  id: string; contact_name: string; email: string | null; phone: string | null;
  relationship: string | null; access_level: string;
  invited_at: string | null; accepted_at: string | null; notes: string | null;
}
interface Doc {
  id: string; document_name: string; document_type: string;
  file_url: string | null; notes: string | null; review_date: string | null;
  permission_level: string; created_at: string;
}
interface ChecklistRow { id: string; item_key: string; completed: boolean; }
interface ProbateRow { id: string; task_key: string; completed: boolean; }
interface LegalPro {
  id: string; name: string; company: string | null; profession_type: string;
  service_area: string | null; phone: string | null; email: string | null;
  website: string | null; verified: boolean; license_status: string | null; notes: string | null;
}
interface Review {
  id: string; review_type: string; due_date: string | null;
  reminder_enabled: boolean; last_reviewed_at: string | null;
}
interface Incapacity {
  id?: string; property_id?: string;
  medical_poa: string | null; financial_poa: string | null; property_manager: string | null;
  attorney: string | null; insurance_agent: string | null; mortgage_company: string | null;
  hoa_contact: string | null; utility_contacts: string | null;
  maintenance_instructions: string | null; emergency_instructions: string | null;
}

/* ---------------- Page ---------------- */

export default function EstatePlanning() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [checklist, setChecklist] = useState<ChecklistRow[]>([]);
  const [probate, setProbate] = useState<ProbateRow[]>([]);
  const [pros, setPros] = useState<LegalPro[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [incap, setIncap] = useState<Incapacity>({
    medical_poa: "", financial_poa: "", property_manager: "", attorney: "",
    insurance_agent: "", mortgage_company: "", hoa_contact: "", utility_contacts: "",
    maintenance_instructions: "", emergency_instructions: "",
  });

  const load = async () => {
    if (!id) return;
    const [p, c, d, ch, pr, lp, rv, ic] = await Promise.all([
      supabase.from("properties").select("*").eq("id", id).maybeSingle(),
      supabase.from("estate_contacts").select("*").eq("property_id", id).order("created_at", { ascending: false }),
      supabase.from("estate_documents").select("*").eq("property_id", id).order("created_at", { ascending: false }),
      supabase.from("estate_checklist_items").select("*").eq("property_id", id),
      supabase.from("estate_probate_tasks").select("*").eq("property_id", id),
      supabase.from("estate_legal_professionals").select("*").order("name"),
      supabase.from("estate_reviews").select("*").eq("property_id", id),
      supabase.from("estate_incapacity_plans").select("*").eq("property_id", id).maybeSingle(),
    ]);
    setProperty(p.data);
    setContacts((c.data ?? []) as Contact[]);
    setDocs((d.data ?? []) as Doc[]);
    setChecklist((ch.data ?? []) as ChecklistRow[]);
    setProbate((pr.data ?? []) as ProbateRow[]);
    setPros((lp.data ?? []) as LegalPro[]);
    setReviews((rv.data ?? []) as Review[]);
    if (ic.data) setIncap(ic.data as Incapacity);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const readinessScore = useMemo(() => {
    const done = CHECKLIST.filter((c) => checklist.find((r) => r.item_key === c.key)?.completed).length;
    return Math.round((done / CHECKLIST.length) * 100);
  }, [checklist]);

  const toggleChecklist = async (key: string, completed: boolean) => {
    if (!id || !user) return;
    const existing = checklist.find((r) => r.item_key === key);
    if (existing) {
      await supabase.from("estate_checklist_items").update({
        completed, completed_at: completed ? new Date().toISOString() : null,
      }).eq("id", existing.id);
    } else {
      await supabase.from("estate_checklist_items").insert({
        property_id: id, created_by: user.id, item_key: key, completed,
        completed_at: completed ? new Date().toISOString() : null,
      });
    }
    load();
  };

  const toggleProbate = async (key: string, completed: boolean) => {
    if (!id || !user) return;
    const existing = probate.find((r) => r.task_key === key);
    if (existing) {
      await supabase.from("estate_probate_tasks").update({
        completed, completed_at: completed ? new Date().toISOString() : null,
      }).eq("id", existing.id);
    } else {
      await supabase.from("estate_probate_tasks").insert({
        property_id: id, created_by: user.id, task_key: key, completed,
        completed_at: completed ? new Date().toISOString() : null,
      });
    }
    load();
  };

  const exportPacket = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text("Estate & Legacy Planning Packet", 10, 15);
    pdf.setFontSize(10); pdf.text(property?.address_line ?? "Property", 10, 22);
    pdf.text(`Readiness score: ${readinessScore}/100`, 10, 28);
    let y = 38;
    pdf.setFontSize(12); pdf.text("Checklist", 10, y); y += 6;
    pdf.setFontSize(9);
    CHECKLIST.forEach((c) => {
      const done = checklist.find((r) => r.item_key === c.key)?.completed;
      pdf.text(`${done ? "[x]" : "[ ]"} ${c.label}`, 12, y); y += 5;
      if (y > 280) { pdf.addPage(); y = 15; }
    });
    pdf.addPage(); y = 15;
    pdf.setFontSize(12); pdf.text("Trusted Contacts", 10, y); y += 6;
    pdf.setFontSize(9);
    contacts.forEach((c) => {
      pdf.text(`${c.contact_name} (${c.relationship ?? "—"}) — ${ACCESS_LEVELS.find((l) => l.value === c.access_level)?.label}`, 10, y); y += 5;
      if (c.email) { pdf.text(`Email: ${c.email}`, 14, y); y += 5; }
      if (c.phone) { pdf.text(`Phone: ${c.phone}`, 14, y); y += 5; }
      y += 2;
      if (y > 280) { pdf.addPage(); y = 15; }
    });
    pdf.addPage(); y = 15;
    pdf.setFontSize(12); pdf.text("Documents on file", 10, y); y += 6;
    pdf.setFontSize(9);
    docs.forEach((d) => {
      pdf.text(`• ${d.document_name} — ${d.document_type}`, 10, y); y += 5;
      if (y > 280) { pdf.addPage(); y = 15; }
    });
    pdf.addPage(); y = 15;
    pdf.setFontSize(9);
    pdf.text(DISCLAIMER, 10, y, { maxWidth: 190 });
    pdf.save("estate-legacy-packet.pdf");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6 max-w-6xl">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
            <h1 className="mt-2 text-3xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />Estate &amp; Legacy Planning
            </h1>
            <p className="text-muted-foreground">Protect your home's records, ownership, and instructions for future generations.</p>
            {property && <p className="mt-1 text-sm font-medium">{property.address_line}, {property.city} {property.state}</p>}
          </div>
          <Button onClick={exportPacket}><FileDown className="mr-2 h-4 w-4" />Export packet</Button>
        </div>

        <Card className="border-primary/30">
          <CardContent className="py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Estate Readiness Score</p>
                <span className="text-2xl font-bold">{readinessScore}/100</span>
              </div>
              <Progress value={readinessScore} className="mt-2 h-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {CHECKLIST.filter((c) => checklist.find((r) => r.item_key === c.key)?.completed).length} of {CHECKLIST.length} checklist items complete
              </p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-3 text-center text-xs">
              <Stat label="Documents" value={docs.length} />
              <Stat label="Contacts" value={contacts.length} />
              <Stat label="Reviews" value={reviews.length} />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview"><Shield className="mr-1.5 h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="documents"><FileText className="mr-1.5 h-4 w-4" />Documents</TabsTrigger>
              <TabsTrigger value="contacts"><Users className="mr-1.5 h-4 w-4" />Trusted contacts</TabsTrigger>
              <TabsTrigger value="incapacity"><Stethoscope className="mr-1.5 h-4 w-4" />Medical incapacity</TabsTrigger>
              <TabsTrigger value="probate"><ShieldAlert className="mr-1.5 h-4 w-4" />Death &amp; probate</TabsTrigger>
              <TabsTrigger value="legal"><Scale className="mr-1.5 h-4 w-4" />Legal marketplace</TabsTrigger>
              <TabsTrigger value="reviews"><BellRing className="mr-1.5 h-4 w-4" />Annual reviews</TabsTrigger>
              <TabsTrigger value="assistant"><Sparkles className="mr-1.5 h-4 w-4" />AI assistant</TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Overview / checklist */}
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Estate Readiness Checklist</CardTitle></CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {CHECKLIST.map((c) => {
                  const done = !!checklist.find((r) => r.item_key === c.key)?.completed;
                  return (
                    <label key={c.key} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30">
                      <Checkbox checked={done} onCheckedChange={(v) => toggleChecklist(c.key, !!v)} />
                      <span className={done ? "text-sm line-through text-muted-foreground" : "text-sm"}>{c.label}</span>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
            <p className="mt-3 text-xs text-muted-foreground">{DISCLAIMER}</p>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-4">
            <DocumentsTab propertyId={id!} userId={user?.id} docs={docs} contacts={contacts} reload={load} />
          </TabsContent>

          {/* Contacts */}
          <TabsContent value="contacts" className="mt-4">
            <ContactsTab propertyId={id!} userId={user?.id} contacts={contacts} reload={load} />
          </TabsContent>

          {/* Incapacity */}
          <TabsContent value="incapacity" className="mt-4">
            <IncapacityTab propertyId={id!} userId={user?.id} value={incap} setValue={setIncap} />
          </TabsContent>

          {/* Probate */}
          <TabsContent value="probate" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Death &amp; Probate Checklist</CardTitle>
                <p className="text-xs text-muted-foreground">A guided list for family or estate administrators.</p>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {PROBATE_TASKS.map((t) => {
                  const done = !!probate.find((r) => r.task_key === t.key)?.completed;
                  return (
                    <label key={t.key} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30">
                      <Checkbox checked={done} onCheckedChange={(v) => toggleProbate(t.key, !!v)} />
                      <span className={done ? "text-sm line-through text-muted-foreground" : "text-sm"}>{t.label}</span>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
            <p className="mt-3 text-xs text-muted-foreground">{DISCLAIMER}</p>
          </TabsContent>

          {/* Legal marketplace */}
          <TabsContent value="legal" className="mt-4">
            <LegalMarketplace pros={pros} />
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="mt-4">
            <ReviewsTab propertyId={id!} userId={user?.id} reviews={reviews} reload={load} />
          </TabsContent>

          {/* AI Assistant */}
          <TabsContent value="assistant" className="mt-4">
            <EstateAssistant propertyId={id!} />
          </TabsContent>
        </Tabs>

        <Card className="bg-accent/40 border-dashed">
          <CardContent className="py-5 text-sm text-muted-foreground flex items-start gap-3">
            <Building2 className="h-5 w-5 text-primary mt-0.5" />
            <p>
              This Orivaz Verified Home includes an Estate &amp; Legacy Planning starter section to help
              protect the property's history, ownership records, warranties, documents, and transfer
              instructions for future generations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Sub-components ---------------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DocumentsTab({
  propertyId, userId, docs, contacts, reload,
}: { propertyId: string; userId?: string; docs: Doc[]; contacts: Contact[]; reload: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    document_name: "", document_type: DOCUMENT_TYPES[0], notes: "",
    review_date: "", permission_level: "private",
  });

  const upload = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const path = `estate/${propertyId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("property-files").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("property-files").getPublicUrl(path);
      const { error } = await supabase.from("estate_documents").insert({
        property_id: propertyId, created_by: userId,
        document_name: form.document_name || file.name,
        document_type: form.document_type,
        file_url: publicUrl, file_path: path,
        notes: form.notes || null,
        review_date: form.review_date || null,
        permission_level: form.permission_level,
      });
      if (error) throw error;
      toast.success("Document uploaded");
      setForm({ document_name: "", document_type: DOCUMENT_TYPES[0], notes: "", review_date: "", permission_level: "private" });
      reload();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const remove = async (d: Doc) => {
    await supabase.from("estate_documents").delete().eq("id", d.id);
    reload();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />Upload secure document</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div><Label>Document name</Label><Input value={form.document_name} onChange={(e) => setForm({ ...form, document_name: e.target.value })} placeholder="e.g. Last Will – 2026" /></div>
          <div>
            <Label>Type</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}>
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><Label>Review date</Label><Input type="date" value={form.review_date} onChange={(e) => setForm({ ...form, review_date: e.target.value })} /></div>
          <div>
            <Label>Permission level</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.permission_level} onChange={(e) => setForm({ ...form, permission_level: e.target.value })}>
              <option value="private">Private — only me</option>
              <option value="trusted_emergency">Trusted contacts — emergency</option>
              <option value="trusted_legal">Trusted contacts — legal</option>
              <option value="estate_admin">Estate administrator</option>
            </select>
          </div>
          <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <Label>File</Label>
            <Input type="file" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            <p className="text-xs text-muted-foreground mt-1">Files are stored privately and tied to this property.</p>
          </div>
        </CardContent>
      </Card>

      {docs.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No documents uploaded yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-semibold">{d.document_name}</p>
                    <p className="text-xs text-muted-foreground">{d.document_type}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(d)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-xs">
                  <Badge variant="outline">{d.permission_level.replace(/_/g, " ")}</Badge>
                  {d.review_date && <Badge variant="outline">Review {d.review_date}</Badge>}
                </div>
                {d.notes && <p className="mt-2 text-xs text-muted-foreground">{d.notes}</p>}
                {d.file_url && <a className="mt-2 inline-block text-xs text-primary hover:underline" href={d.file_url} target="_blank" rel="noreferrer">Open file →</a>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
    </div>
  );
}

function ContactsTab({
  propertyId, userId, contacts, reload,
}: { propertyId: string; userId?: string; contacts: Contact[]; reload: () => void }) {
  const [form, setForm] = useState({
    contact_name: "", email: "", phone: "", relationship: "",
    access_level: "emergency_only", notes: "",
  });
  const add = async () => {
    if (!userId || !form.contact_name) return;
    const { error } = await supabase.from("estate_contacts").insert({
      property_id: propertyId, created_by: userId, ...form,
    });
    if (error) toast.error(error.message);
    else { toast.success("Contact added"); setForm({ contact_name: "", email: "", phone: "", relationship: "", access_level: "emergency_only", notes: "" }); reload(); }
  };
  const invite = async (c: Contact) => {
    await supabase.from("estate_contacts").update({ invited_at: new Date().toISOString() }).eq("id", c.id);
    toast.success(`Invitation logged for ${c.contact_name}`); reload();
  };
  const remove = async (cid: string) => { await supabase.from("estate_contacts").delete().eq("id", cid); reload(); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Add trusted contact</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div><Label>Name</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
          <div><Label>Relationship</Label><Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Spouse, child, attorney…" /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <Label>Permission level</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.access_level} onChange={(e) => setForm({ ...form, access_level: e.target.value })}>
              {ACCESS_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="sm:col-span-2"><Button onClick={add}><Plus className="mr-2 h-4 w-4" />Add contact</Button></div>
        </CardContent>
      </Card>

      {contacts.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No trusted contacts yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {contacts.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{c.contact_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{c.relationship}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Badge variant="outline">{ACCESS_LEVELS.find((l) => l.value === c.access_level)?.label ?? c.access_level}</Badge>
                {c.email && <p>📧 {c.email}</p>}
                {c.phone && <p>📞 {c.phone}</p>}
                {c.notes && <p className="text-muted-foreground">{c.notes}</p>}
                <div className="flex gap-2 pt-1">
                  {!c.invited_at
                    ? <Button size="sm" variant="outline" onClick={() => invite(c)}><Mail className="mr-1 h-3 w-3" />Send invitation</Button>
                    : c.accepted_at
                      ? <Badge className="bg-emerald-500/15 text-emerald-700">Accepted</Badge>
                      : <Badge variant="outline">Invited {new Date(c.invited_at).toLocaleDateString()}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function IncapacityTab({
  propertyId, userId, value, setValue,
}: { propertyId: string; userId?: string; value: Incapacity; setValue: (v: Incapacity) => void }) {
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("estate_incapacity_plans")
      .upsert({ property_id: propertyId, created_by: userId, ...value }, { onConflict: "property_id" });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Incapacity plan saved");
  };
  const fields: { k: keyof Incapacity; label: string; long?: boolean }[] = [
    { k: "medical_poa", label: "Medical power of attorney" },
    { k: "financial_poa", label: "Financial power of attorney" },
    { k: "property_manager", label: "Property manager contact" },
    { k: "attorney", label: "Attorney contact" },
    { k: "insurance_agent", label: "Insurance agent contact" },
    { k: "mortgage_company", label: "Mortgage company contact" },
    { k: "hoa_contact", label: "HOA contact" },
    { k: "utility_contacts", label: "Utility provider contacts", long: true },
    { k: "maintenance_instructions", label: "Maintenance instructions", long: true },
    { k: "emergency_instructions", label: "Emergency property instructions", long: true },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Medical Incapacity Planning</CardTitle>
        <p className="text-xs text-muted-foreground">If you become unable to manage this property, who steps in and what should they know?</p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.k} className={f.long ? "md:col-span-2" : ""}>
            <Label>{f.label}</Label>
            {f.long
              ? <Textarea rows={3} value={(value[f.k] as string) ?? ""} onChange={(e) => setValue({ ...value, [f.k]: e.target.value })} />
              : <Input value={(value[f.k] as string) ?? ""} onChange={(e) => setValue({ ...value, [f.k]: e.target.value })} />}
          </div>
        ))}
        <div className="md:col-span-2">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save plan"}</Button>
          <p className="mt-2 text-xs text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LegalMarketplace({ pros }: { pros: LegalPro[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Connect with vetted professionals to help protect your home and family. {DISCLAIMER}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {pros.map((p) => (
          <Card key={p.id}>
            <CardContent className="py-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.company} · {p.profession_type.replace(/_/g, " ")}</p>
                </div>
                {p.verified && <Badge className="bg-emerald-500/15 text-emerald-700">Verified</Badge>}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {p.service_area && <p>📍 {p.service_area}</p>}
                {p.phone && <p>📞 {p.phone}</p>}
                {p.email && <p>📧 {p.email}</p>}
              </div>
              <Button size="sm" onClick={() => toast.success("Consultation request sent")}>Request consultation</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab({
  propertyId, userId, reviews, reload,
}: { propertyId: string; userId?: string; reviews: Review[]; reload: () => void }) {
  const toggle = async (type: string, enabled: boolean) => {
    if (!userId) return;
    const existing = reviews.find((r) => r.review_type === type);
    if (existing) {
      await supabase.from("estate_reviews").update({ reminder_enabled: enabled }).eq("id", existing.id);
    } else {
      const due = new Date(); due.setFullYear(due.getFullYear() + 1);
      await supabase.from("estate_reviews").insert({
        property_id: propertyId, created_by: userId, review_type: type,
        reminder_enabled: enabled, due_date: due.toISOString().slice(0, 10),
      });
    }
    reload();
  };
  const markReviewed = async (type: string) => {
    if (!userId) return;
    const existing = reviews.find((r) => r.review_type === type);
    if (existing) {
      await supabase.from("estate_reviews").update({ last_reviewed_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("estate_reviews").insert({
        property_id: propertyId, created_by: userId, review_type: type,
        last_reviewed_at: new Date().toISOString(),
      });
    }
    toast.success("Marked as reviewed"); reload();
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Annual Estate Review Reminders</CardTitle>
        <p className="text-xs text-muted-foreground">Toggle reminders for the items you want to review every year.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {REVIEW_TYPES.map((t) => {
          const r = reviews.find((x) => x.review_type === t);
          return (
            <div key={t} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{t}</p>
                <p className="text-xs text-muted-foreground">
                  {r?.last_reviewed_at ? `Last reviewed ${new Date(r.last_reviewed_at).toLocaleDateString()}` : "Not yet reviewed"}
                  {r?.due_date && ` · Next due ${r.due_date}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={() => markReviewed(t)}>Mark reviewed</Button>
                <Switch checked={!!r?.reminder_enabled} onCheckedChange={(v) => toggle(t, v)} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function EstateAssistant({ propertyId }: { propertyId: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("estate-assistant", {
        body: { messages: next, propertyId },
      });
      if (error) throw error;
      setMessages([...next, { role: "assistant", content: data?.reply ?? "I'm not sure — please consult a licensed professional." }]);
    } catch (e: any) {
      toast.error(e.message ?? "Assistant unavailable");
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4" />AI Estate Assistant</CardTitle>
        <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {AI_PROMPTS.map((p) => (
            <Button key={p} size="sm" variant="outline" onClick={() => send(p)}>{p}</Button>
          ))}
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 min-h-[180px] space-y-3 text-sm">
          {messages.length === 0 && <p className="text-muted-foreground">Ask an educational question about estate planning for your home.</p>}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-foreground" : "text-muted-foreground"}>
              <strong className="mr-1">{m.role === "user" ? "You:" : "Assistant:"}</strong>
              <span className="whitespace-pre-wrap">{m.content}</span>
            </div>
          ))}
          {loading && <p className="text-xs text-muted-foreground">Thinking…</p>}
        </div>
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" onKeyDown={(e) => e.key === "Enter" && send(input)} />
          <Button onClick={() => send(input)} disabled={loading}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}
