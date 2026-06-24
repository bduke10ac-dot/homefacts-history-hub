// Phase 3 — Warranty Transfer Center. Reads from existing `warranties` table
// (already has provider, expiration, is_transferable, is_registered, transfer fields).
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Mail, Phone, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Warranty {
  id: string;
  category: string;
  provider: string | null;
  product_name: string | null;
  expiration_date: string | null;
  is_transferable: boolean | null;
  is_registered: boolean | null;
  transfer_deadline_days: number | null;
  transfer_instructions: string | null;
  provider_phone: string | null;
  provider_email: string | null;
  provider_website: string | null;
  status: string;
}

function transferableLabel(v: boolean | null) {
  if (v === true) return { text: "Transferable", tone: "bg-emerald-100 text-emerald-800" };
  if (v === false) return { text: "Not transferable", tone: "bg-rose-100 text-rose-800" };
  return { text: "Unknown", tone: "bg-slate-100 text-slate-800" };
}

function requiredAction(w: Warranty): string {
  if (w.is_registered === false) return "Register warranty with provider";
  if (w.is_transferable === null) return "Confirm transferability with provider";
  if (w.is_transferable && w.transfer_deadline_days)
    return `Submit transfer within ${w.transfer_deadline_days} days of sale`;
  if (w.is_transferable) return "Notify provider at time of sale";
  return "Inform new owner this warranty does not transfer";
}

export default function WarrantyTransferCenter() {
  const { id } = useParams();
  const [items, setItems] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("warranties")
        .select("id,category,provider,product_name,expiration_date,is_transferable,is_registered,transfer_deadline_days,transfer_instructions,provider_phone,provider_email,provider_website,status")
        .eq("property_id", id)
        .order("expiration_date", { ascending: true, nullsFirst: false });
      setItems((data ?? []) as Warranty[]);
      setLoading(false);
    })();
  }, [id]);

  const active = items.filter((w) => w.status !== "expired");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container space-y-6 py-10">
        <Link to={`/property/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck className="h-7 w-7" /> Warranty Transfer Center</h1>
            <p className="text-muted-foreground">Active warranties and what's needed to transfer them at sale.</p>
          </div>
          <Button onClick={() => toast("Warranty transfer automation coming soon.")}>Prepare Warranty Transfer Package</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Active Warranties {loading ? "" : `· ${active.length}`}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : active.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active warranties on file yet.</p>
            ) : active.map((w) => {
              const tr = transferableLabel(w.is_transferable);
              return (
                <div key={w.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{w.product_name ?? w.category}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {w.category} {w.provider ? `· ${w.provider}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={tr.tone}>{tr.text}</Badge>
                      <Badge variant={w.is_registered ? "secondary" : "outline"}>
                        {w.is_registered ? "Registered" : "Not registered"}
                      </Badge>
                      {w.expiration_date && (
                        <Badge variant="outline">Expires {new Date(w.expiration_date).toLocaleDateString()}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm"><span className="font-medium">Required action:</span> {requiredAction(w)}</p>
                  {w.transfer_instructions && (
                    <p className="mt-1 text-xs text-muted-foreground">{w.transfer_instructions}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {w.provider_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{w.provider_phone}</span>}
                    {w.provider_email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{w.provider_email}</span>}
                    {w.provider_website && (
                      <a href={w.provider_website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                        <ExternalLink className="h-3 w-3" /> Provider site
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
