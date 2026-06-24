// Phase 3 — Estate Vault. Singleton per property. Owner/admin RLS only.
// SENSITIVE DATA: emergency contacts, attorney, beneficiary notes, transfer + medical
// instructions. Never exposed to partner marketplace, anonymized rollups, or admin
// dashboards — this page reads `estate_vaults` directly under RLS only.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface VaultRow {
  property_id: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_email: string | null;
  preferred_attorney: string | null;
  has_estate_documents: boolean;
  beneficiary_notes: string | null;
  transfer_instructions: string | null;
  medical_emergency_notes: string | null;
}

const EMPTY: VaultRow = {
  property_id: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_email: "",
  preferred_attorney: "",
  has_estate_documents: false,
  beneficiary_notes: "",
  transfer_instructions: "",
  medical_emergency_notes: "",
};

export default function EstateVault() {
  const { id } = useParams();
  const [row, setRow] = useState<VaultRow>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("estate_vaults").select("*").eq("property_id", id).maybeSingle();
      setRow(data ? ({ ...EMPTY, ...data, property_id: id } as VaultRow) : { ...EMPTY, property_id: id });
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...row, property_id: id, created_by: user?.id };
    const { error } = await supabase.from("estate_vaults").upsert(payload, { onConflict: "property_id" });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Estate vault saved.");
  };

  const setField = <K extends keyof VaultRow>(k: K, v: VaultRow[K]) => setRow((r) => ({ ...r, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Lock className="h-7 w-7" /> Estate Vault</h1>
          <p className="text-muted-foreground">Sensitive emergency, transfer, and estate-planning info for this property.</p>
        </div>

        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            Orivaz does not provide legal advice.
          </p>
          <p className="mt-1 pl-6">This vault helps organize property-related documents and contacts for emergency and estate planning purposes.</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1 md:col-span-1">
                  <Label>Name</Label>
                  <Input value={row.emergency_contact_name ?? ""} onChange={(e) => setField("emergency_contact_name", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={row.emergency_contact_phone ?? ""} onChange={(e) => setField("emergency_contact_phone", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={row.emergency_contact_email ?? ""} onChange={(e) => setField("emergency_contact_email", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Estate Planning</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Preferred attorney (name & contact)</Label>
                  <Input value={row.preferred_attorney ?? ""} onChange={(e) => setField("preferred_attorney", e.target.value)} placeholder="Name, firm, phone" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={row.has_estate_documents} onCheckedChange={(v) => setField("has_estate_documents", Boolean(v))} />
                  I have estate documents (will, trust, POA) stored elsewhere
                </label>
                <div className="space-y-1">
                  <Label>Beneficiary notes</Label>
                  <Textarea rows={3} value={row.beneficiary_notes ?? ""} onChange={(e) => setField("beneficiary_notes", e.target.value)} placeholder="Who should inherit or be notified about this property." />
                </div>
                <div className="space-y-1">
                  <Label>Transfer instructions</Label>
                  <Textarea rows={3} value={row.transfer_instructions ?? ""} onChange={(e) => setField("transfer_instructions", e.target.value)} placeholder="How you'd like the property handled if you can't manage it." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Medical Emergency</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Label>Medical emergency notes</Label>
                  <Textarea rows={3} value={row.medical_emergency_notes ?? ""} onChange={(e) => setField("medical_emergency_notes", e.target.value)} placeholder="Allergies, conditions, who to call. Not a substitute for medical alert systems." />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Vault"}</Button>
            </div>

            <p className="text-xs text-muted-foreground">
              This information is visible only to active owners of this property and Orivaz administrators. It is never shared with partners, vendors, or anonymized analytics.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
