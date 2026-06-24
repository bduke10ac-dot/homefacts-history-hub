import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function PartnerOfferNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<{ categories: string[]; service_zips: string[] } | null>(null);
  const [form, setForm] = useState({
    title: "", body: "", cta_text: "Request quote", estimated_value: "",
    category: "", zip: "", system: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("partner_accounts").select("categories,service_zips").eq("user_id", user.id).maybeSingle();
      setAccount(data as any);
    })();
  }, [user]);

  const submit = async () => {
    if (!user) return;
    if (!form.title || !form.body || !form.category || !form.zip) {
      toast.error("Title, body, category, and zip are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("vendor_offers").insert({
      partner_user_id: user.id,
      title: form.title.trim(),
      body: form.body.trim(),
      cta_text: form.cta_text.trim() || "Request quote",
      estimated_value: form.estimated_value.trim() || null,
      category: form.category.trim().toLowerCase(),
      zip: form.zip.trim(),
      system: form.system.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Offer posted");
    navigate("/partner");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <h1 className="mb-1 text-2xl font-bold">Post a new offer</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Scoped to (category, zip, optional system). Matching homeowners with offer-matching consent on will see it.
          {" "}<Link to="/partner" className="text-primary hover:underline">Back</Link>
        </p>
        <Card>
          <CardHeader><CardTitle className="text-base">Offer details</CardTitle><CardDescription>30-day expiry. Max 10 active per (zip, category).</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Free roof inspection" /></div>
            <div><Label>Description</Label><Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>CTA text</Label><Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} /></div>
              <div><Label>Estimated value</Label><Input value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} placeholder="$200 off" /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Category</Label>
                <Input list="categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="roof" />
                <datalist id="categories">{account?.categories.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <Label>Zip</Label>
                <Input list="zips" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} placeholder="78704" />
                <datalist id="zips">{account?.service_zips.map((z) => <option key={z} value={z} />)}</datalist>
              </div>
              <div>
                <Label>System (optional)</Label>
                <Input value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} placeholder="e.g. roof" />
              </div>
            </div>
            <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish offer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
