import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Send, Users } from "lucide-react";

export default function BuilderReferrals() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({
    referred_builder_name: "", contact_name: "", contact_email: "", contact_phone: "", website: "", region: "", notes: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("builder_company_members").select("company_id").eq("user_id", user.id).limit(1);
      const cid = data?.[0]?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: refs } = await (supabase as any).from("builder_referrals").select("*").eq("referring_company_id", cid).order("created_at", { ascending: false });
        setList(refs ?? []);
      }
    })();
  }, [user]);

  const submit = async () => {
    if (!companyId) { toast.error("No builder company linked to your account."); return; }
    if (!form.referred_builder_name) { toast.error("Builder name required."); return; }
    setBusy(true);
    const { error } = await (supabase as any).from("builder_referrals").insert({ referring_company_id: companyId, ...form, created_by: user?.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Referral submitted — our team will follow up.");
    setForm({ referred_builder_name: "", contact_name: "", contact_email: "", contact_phone: "", website: "", region: "", notes: "" });
    const { data: refs } = await (supabase as any).from("builder_referrals").select("*").eq("referring_company_id", companyId).order("created_at", { ascending: false });
    setList(refs ?? []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <Link to="/builder" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back to dashboard</Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6 text-primary" />Builder Referrals</h1>
        <p className="text-sm text-muted-foreground">Refer another builder into the HomeFacts Builder Program. Founding builders help us grow the network.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card><CardContent className="space-y-3 p-5">
            <h2 className="text-base font-semibold">Refer a builder</h2>
            <Field label="Builder / company name *"><Input value={form.referred_builder_name} onChange={(e) => setForm({ ...form, referred_builder_name: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Contact name"><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></Field>
              <Field label="Contact email"><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></Field>
              <Field label="Contact phone"><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></Field>
              <Field label="Website"><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
            </div>
            <Field label="Notes"><Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <Button onClick={submit} disabled={busy}><Send className="mr-2 h-4 w-4" />Submit referral</Button>
          </CardContent></Card>

          <Card><CardContent className="p-5">
            <h2 className="text-base font-semibold">Your referrals</h2>
            <div className="mt-3 space-y-2">
              {list.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{r.referred_builder_name}</p>
                    <Badge variant="outline" className="capitalize">{r.status}</Badge>
                  </div>
                  {r.contact_name && <p className="text-xs text-muted-foreground">{r.contact_name} · {r.contact_email}</p>}
                </div>
              ))}
              {!list.length && <p className="text-sm text-muted-foreground">No referrals yet.</p>}
            </div>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
