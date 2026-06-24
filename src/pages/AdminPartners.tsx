import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Copy, Loader2, ShieldCheck, X } from "lucide-react";

interface Invite { id: string; token: string; invitee_email: string; status: string; expires_at: string; company_name: string | null; }
interface Partner { id: string; user_id: string; company_name: string; contact_email: string | null; status: string; categories: string[]; service_zips: string[]; rejection_reason: string | null; }

const randomToken = () => {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
};

export default function AdminPartners() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // invite form
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [categories, setCategories] = useState("");
  const [zips, setZips] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: inv }, { data: pa }] = await Promise.all([
      supabase.from("partner_invites").select("*").order("created_at", { ascending: false }),
      supabase.from("partner_accounts").select("*").order("created_at", { ascending: false }),
    ]);
    setInvites((inv ?? []) as Invite[]);
    setPartners((pa ?? []) as Partner[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createInvite = async () => {
    if (!user || !email.trim()) return;
    setCreating(true);
    const token = randomToken();
    const { error } = await supabase.from("partner_invites").insert({
      token,
      invitee_email: email.trim().toLowerCase(),
      company_name: company.trim() || null,
      categories: categories.split(",").map((s) => s.trim()).filter(Boolean),
      service_zips: zips.split(",").map((s) => s.trim()).filter(Boolean),
      invited_by: user.id,
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    setEmail(""); setCompany(""); setCategories(""); setZips("");
    toast.success("Invite created");
    load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/partners/claim/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  const revoke = async (id: string) => {
    await supabase.from("partner_invites").update({ status: "revoked" }).eq("id", id);
    load();
  };

  const setStatus = async (p: Partner, status: "approved" | "rejected" | "suspended", reason?: string) => {
    const patch: any = { status, approved_by: user?.id, approved_at: new Date().toISOString() };
    if (status === "rejected") patch.rejection_reason = reason ?? null;
    const { error } = await supabase.from("partner_accounts").update(patch).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    if (status === "approved") {
      // Seed a trial subscription so they can post offers.
      await supabase.from("partner_subscriptions").insert({
        partner_user_id: p.user_id, status: "trial", plan: "trial",
      });
    }
    toast.success(`Partner ${status}`);
    load();
  };

  const pending = partners.filter((p) => p.status === "pending");
  const approved = partners.filter((p) => p.status === "approved");
  const other = partners.filter((p) => !["pending", "approved"].includes(p.status));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl py-10">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Partners</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Invite a partner</CardTitle>
            <CardDescription>Generates a single-use link valid for 14 days. Share it directly with the partner.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@example.com" /></div>
            <div><Label>Company (optional)</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
            <div><Label>Categories (comma-separated)</Label><Input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="roof, hvac" /></div>
            <div><Label>Service zips (comma-separated)</Label><Input value={zips} onChange={(e) => setZips(e.target.value)} placeholder="78704, 78705" /></div>
            <div className="sm:col-span-2"><Button onClick={createInvite} disabled={creating || !email.trim()}>{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create invite</Button></div>
          </CardContent>
        </Card>

        {loading ? <div className="text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</div> : (
          <div className="space-y-8">
            <Section title={`Pending approval (${pending.length})`}>
              {pending.length === 0 ? <p className="text-sm text-muted-foreground">No pending partners.</p> :
                pending.map((p) => (
                  <PartnerRow key={p.id} p={p}
                    actions={<>
                      <Button size="sm" onClick={() => setStatus(p, "approved")}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => { const r = prompt("Reason?") ?? undefined; setStatus(p, "rejected", r); }}>Reject</Button>
                    </>} />
                ))}
            </Section>

            <Section title={`Approved (${approved.length})`}>
              {approved.length === 0 ? <p className="text-sm text-muted-foreground">No approved partners.</p> :
                approved.map((p) => (
                  <PartnerRow key={p.id} p={p}
                    actions={<Button size="sm" variant="outline" onClick={() => setStatus(p, "suspended")}>Suspend</Button>} />
                ))}
            </Section>

            {other.length > 0 && (
              <Section title="Other">
                {other.map((p) => <PartnerRow key={p.id} p={p} />)}
              </Section>
            )}

            <Section title="Invites">
              {invites.length === 0 ? <p className="text-sm text-muted-foreground">No invites yet.</p> :
                <div className="space-y-2">
                  {invites.map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{i.invitee_email}</p>
                        <p className="text-xs text-muted-foreground">{i.company_name ?? "—"} · expires {new Date(i.expires_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={i.status === "pending" ? "default" : "secondary"}>{i.status}</Badge>
                        {i.status === "pending" && <>
                          <Button size="sm" variant="ghost" onClick={() => copyLink(i.token)}><Copy className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => revoke(i.id)}><X className="h-4 w-4" /></Button>
                        </>}
                      </div>
                    </div>
                  ))}
                </div>}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="mb-3 text-lg font-semibold">{title}</h2><div className="space-y-2">{children}</div></div>;
}

function PartnerRow({ p, actions }: { p: Partner; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="min-w-0">
        <p className="font-medium">{p.company_name}</p>
        <p className="text-xs text-muted-foreground">{p.contact_email} · {p.categories.join(", ") || "no categories"} · zips: {p.service_zips.join(", ") || "any"}</p>
        {p.rejection_reason && <p className="text-xs text-destructive">Rejected: {p.rejection_reason}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={p.status === "approved" ? "default" : p.status === "pending" ? "secondary" : "outline"}>{p.status}</Badge>
        {actions}
      </div>
    </div>
  );
}
