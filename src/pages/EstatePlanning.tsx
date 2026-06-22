import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, Mail, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";

const LEVELS = [
  { value: "emergency_only", label: "Emergency only" },
  { value: "view_documents", label: "View documents" },
  { value: "manage_property", label: "Manage property" },
  { value: "transfer_passport", label: "Transfer ownership passport" },
  { value: "full_access", label: "Full access (after approval)" },
];

interface Contact {
  id: string; contact_name: string; email: string | null; phone: string | null;
  relationship: string | null; access_level: string;
  invited_at: string | null; accepted_at: string | null; notes: string | null;
}

export default function EstatePlanning() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ contact_name: "", email: "", phone: "", relationship: "", access_level: "emergency_only", notes: "" });

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("estate_contacts").select("*").eq("property_id", id).order("created_at", { ascending: false });
    setContacts((data ?? []) as Contact[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const add = async () => {
    if (!id || !user || !form.contact_name) return;
    const { error } = await supabase.from("estate_contacts").insert({ property_id: id, created_by: user.id, ...form });
    if (error) toast.error(error.message);
    else { toast.success("Contact added"); setForm({ contact_name: "", email: "", phone: "", relationship: "", access_level: "emergency_only", notes: "" }); load(); }
  };

  const invite = async (c: Contact) => {
    await supabase.from("estate_contacts").update({ invited_at: new Date().toISOString() }).eq("id", c.id);
    toast.success(`Invitation logged for ${c.contact_name}`);
    load();
  };

  const remove = async (cid: string) => { await supabase.from("estate_contacts").delete().eq("id", cid); load(); };

  const exportPacket = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text("Estate Property Packet", 10, 15);
    pdf.setFontSize(11); let y = 28;
    pdf.text("Trusted Contacts", 10, y); y += 7;
    pdf.setFontSize(10);
    contacts.forEach((c) => {
      pdf.text(`${c.contact_name} (${c.relationship ?? "—"}) — ${LEVELS.find((l) => l.value === c.access_level)?.label}`, 10, y); y += 5;
      if (c.email) { pdf.text(`Email: ${c.email}`, 14, y); y += 5; }
      if (c.phone) { pdf.text(`Phone: ${c.phone}`, 14, y); y += 5; }
      y += 3;
    });
    pdf.save("estate-packet.pdf");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
            <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><Users className="h-7 w-7 text-primary" />Estate Planning Mode</h1>
            <p className="text-muted-foreground">Trusted contacts, access levels, and transfer planning.</p>
          </div>
          <Button onClick={exportPacket}><FileDown className="mr-2 h-4 w-4" />Export packet</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Add trusted contact</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Name</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div><Label>Relationship</Label><Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Spouse, child, attorney…" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <Label>Access level</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.access_level} onChange={(e) => setForm({ ...form, access_level: e.target.value })}>
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button onClick={add}><Plus className="mr-2 h-4 w-4" />Add contact</Button></div>
          </CardContent>
        </Card>

        {loading ? <p>Loading…</p> : contacts.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No trusted contacts yet.</CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {contacts.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{c.contact_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{c.relationship}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Badge variant="outline">{LEVELS.find((l) => l.value === c.access_level)?.label}</Badge>
                  {c.email && <p>📧 {c.email}</p>}
                  {c.phone && <p>📞 {c.phone}</p>}
                  {c.notes && <p className="text-muted-foreground">{c.notes}</p>}
                  <div className="flex gap-2 pt-1">
                    {!c.invited_at ? <Button size="sm" variant="outline" onClick={() => invite(c)}><Mail className="mr-1 h-3 w-3" />Send invitation</Button>
                      : c.accepted_at ? <Badge className="bg-emerald-500/15 text-emerald-700">Accepted</Badge>
                      : <Badge variant="outline">Invited {new Date(c.invited_at).toLocaleDateString()}</Badge>}
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
