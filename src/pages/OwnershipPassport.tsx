import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { BookKey, Share2, FileDown, Send, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface PassportRow { id: string; current_owner_id: string | null; transfer_status: string; transfer_to_email: string | null; full_access: boolean; share_token: string | null; expires_at: string | null; last_transferred_at: string | null; }

export default function OwnershipPassport() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pass, setPass] = useState<BookKey | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [transferEmail, setTransferEmail] = useState("");

  const load = async () => {
    if (!id) return;
    const { data: prop } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
    setProperty(prop);
    let { data } = await supabase.from("ownership_passports").select("*").eq("property_id", id).maybeSingle();
    if (!data && user) {
      const ins = await supabase.from("ownership_passports").insert({ property_id: id, current_owner_id: user.id }).select().single();
      data = ins.data;
    }
    setPass(data as PassportRow | null);

    const cnt = async (table: string) => (await supabase.from(table as any).select("id", { count: "exact", head: true }).eq("property_id", id)).count ?? 0;
    setCounts({
      records: await cnt("property_records"),
      permits: await cnt("permits"),
      timeline: await cnt("timeline_events"),
      vault: await cnt("disaster_vault_documents"),
      rooms: await cnt("digital_twin_rooms"),
      contractors: await cnt("contractor_scores"),
      health: await cnt("home_health_sections"),
      emergency: await cnt("emergency_events"),
    });
  };
  useEffect(() => { load(); }, [id, user]);

  const generateLink = async () => {
    if (!pass) return;
    const token = crypto.randomUUID().replace(/-/g, "");
    const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    await supabase.from("ownership_passports").update({ share_token: token, expires_at: expires }).eq("id", pass.id);
    toast.success("Share link active for 30 days");
    load();
  };

  const revoke = async () => {
    if (!pass) return;
    await supabase.from("ownership_passports").update({ share_token: null, expires_at: null }).eq("id", pass.id);
    load();
  };

  const toggleFull = async () => {
    if (!pass) return;
    await supabase.from("ownership_passports").update({ full_access: !pass.full_access }).eq("id", pass.id);
    load();
  };

  const transfer = async () => {
    if (!pass || !transferEmail) return;
    await supabase.from("ownership_passports").update({
      transfer_status: "pending_transfer", transfer_to_email: transferEmail,
    }).eq("id", pass.id);
    toast.success(`Transfer request logged to ${transferEmail}`);
    setTransferEmail(""); load();
  };

  const copyLink = () => {
    if (!pass?.share_token) return;
    const url = `${window.location.origin}/passport/${pass.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6 max-w-4xl">
        <div>
          <Link to={`/property/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to property</Link>
          <h1 className="mt-2 text-3xl font-bold flex items-center gap-2"><BookKey className="h-7 w-7 text-primary" />Ownership Passport</h1>
          <p className="text-muted-foreground">The complete, transferable digital identity of this home.</p>
        </div>

        {property && (
          <Card>
            <CardHeader><CardTitle>{property.address_line}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><p className="text-muted-foreground">Year</p><p className="font-semibold">{property.year_built ?? "—"}</p></div>
              <div><p className="text-muted-foreground">Sq ft</p><p className="font-semibold">{property.square_feet ?? "—"}</p></div>
              <div><p className="text-muted-foreground">Beds</p><p className="font-semibold">{property.bedrooms ?? "—"}</p></div>
              <div><p className="text-muted-foreground">Baths</p><p className="font-semibold">{property.bathrooms ?? "—"}</p></div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          {Object.entries(counts).map(([k, v]) => (
            <Card key={k}><CardContent className="py-4"><p className="text-sm text-muted-foreground capitalize">{k}</p><p className="text-2xl font-bold">{v}</p></CardContent></Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Share2 className="h-4 w-4" />Share & transfer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Full access (recipient can edit)</p>
                <p className="text-xs text-muted-foreground">When off, recipients have read-only passport access.</p>
              </div>
              <Switch checked={!!pass?.full_access} onCheckedChange={toggleFull} />
            </div>

            <div className="space-y-2">
              <Label>Limited access link</Label>
              {pass?.share_token ? (
                <div className="flex items-center gap-2">
                  <Input readOnly value={`${window.location.origin}/passport/${pass.share_token}`} />
                  <Button size="icon" variant="outline" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
                  <Button variant="outline" onClick={revoke}>Revoke</Button>
                </div>
              ) : (
                <Button onClick={generateLink}><Share2 className="mr-2 h-4 w-4" />Generate 30-day link</Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Transfer to new owner (email)</Label>
              <div className="flex gap-2">
                <Input type="email" value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="new.owner@email.com" />
                <Button onClick={transfer}><Send className="mr-2 h-4 w-4" />Request transfer</Button>
              </div>
              {pass?.transfer_status && pass.transfer_status !== "inactive" && (
                <Badge variant="outline">Status: {pass.transfer_status}{pass.transfer_to_email && ` → ${pass.transfer_to_email}`}</Badge>
              )}
            </div>

            <div className="pt-2">
              <Link to={`/property/${id}/reports`}><Button variant="outline"><FileDown className="mr-2 h-4 w-4" />Export passport PDF</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
