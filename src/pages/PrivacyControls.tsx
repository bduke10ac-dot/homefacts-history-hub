import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Shield, Loader2 } from "lucide-react";

interface Row {
  property_id: string;
  address_line: string | null;
  allow_anonymized_data: boolean;
  allow_partner_outreach: boolean;
  allow_offer_matching: boolean;
}

const TOGGLES: Array<{ key: keyof Pick<Row, "allow_anonymized_data" | "allow_partner_outreach" | "allow_offer_matching">; label: string; help: string }> = [
  { key: "allow_anonymized_data", label: "Anonymized aggregate data", help: "Lets Orivaz include de-identified facts about this home in aggregate insights and reports. Never linked to your identity." },
  { key: "allow_partner_outreach", label: "Vetted partner outreach", help: "Allows vetted service providers to reach out about this home's likely needs. Off by default." },
  { key: "allow_offer_matching", label: "Personalized offer matching", help: "Lets us match this home to relevant offers/discounts based on your systems and maintenance history." },
];

export default function PrivacyControls() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: props } = await supabase
        .from("properties")
        .select("id,address_line")
        .or(`claimed_by.eq.${user.id},created_by.eq.${user.id}`);
      const ids = (props ?? []).map((p) => p.id);
      const { data: consents } = ids.length
        ? await supabase.from("property_data_consent").select("*").eq("user_id", user.id).in("property_id", ids)
        : { data: [] as any[] };
      const byProp = new Map((consents ?? []).map((c: any) => [c.property_id, c]));
      setRows((props ?? []).map((p) => {
        const c = byProp.get(p.id);
        return {
          property_id: p.id,
          address_line: p.address_line,
          allow_anonymized_data: c?.allow_anonymized_data ?? false,
          allow_partner_outreach: c?.allow_partner_outreach ?? false,
          allow_offer_matching: c?.allow_offer_matching ?? false,
        };
      }));
      setLoading(false);
    })();
  }, [user]);

  const toggle = async (row: Row, key: keyof Row, value: boolean) => {
    if (!user) return;
    setSaving(row.property_id + key);
    const patch: any = { [key]: value };
    const { error } = await supabase
      .from("property_data_consent")
      .upsert(
        { user_id: user.id, property_id: row.property_id, ...patch },
        { onConflict: "user_id,property_id" }
      );
    setSaving(null);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    setRows((rs) => rs.map((r) => r.property_id === row.property_id ? { ...r, [key]: value } : r));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-10">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Data & privacy controls</h1>
        </div>
        <p className="mb-8 text-sm text-muted-foreground">
          You decide what gets shared per property. Everything is off by default. Anonymized sharing only counts
          as "on" for a home when every active co-owner has opted in.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              You don't have any properties yet. <Button variant="link" onClick={() => navigate("/search")}>Add one →</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <Card key={r.property_id}>
                <CardHeader>
                  <CardTitle className="text-base">{r.address_line ?? "Untitled property"}</CardTitle>
                  <CardDescription>
                    <Link to={`/property/${r.property_id}`} className="text-primary hover:underline">View property →</Link>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {TOGGLES.map((t) => (
                    <div key={t.key} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.help}</p>
                      </div>
                      <Switch
                        checked={r[t.key]}
                        disabled={saving === r.property_id + t.key}
                        onCheckedChange={(v) => toggle(r, t.key, v)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
