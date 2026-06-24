import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Store, AlertCircle } from "lucide-react";

interface Account { status: string; company_name: string; categories: string[]; service_zips: string[]; }
interface Subscription { status: string; plan: string | null; current_period_end: string | null; }
interface MarketRow { category: string; zip: string; system: string; property_count: number; }
interface Offer { id: string; title: string; category: string; zip: string; system: string | null; status: string; expires_at: string; }

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [market, setMarket] = useState<MarketRow[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [acceptedCounts, setAcceptedCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [{ data: a }, { data: s }, { data: m }, { data: o }, { data: r }] = await Promise.all([
        supabase.from("partner_accounts").select("status,company_name,categories,service_zips").eq("user_id", user.id).maybeSingle(),
        supabase.from("partner_subscriptions").select("status,plan,current_period_end").eq("partner_user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.rpc("partner_marketplace_for", { _user_id: user.id }),
        supabase.from("vendor_offers").select("id,title,category,zip,system,status,expires_at").eq("partner_user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vendor_offer_responses").select("offer_id").eq("response", "accepted"),
      ]);
      setAccount(a as Account | null);
      setSub(s as Subscription | null);
      setMarket((m ?? []) as MarketRow[]);
      setOffers((o ?? []) as Offer[]);
      const counts: Record<string, number> = {};
      for (const row of r ?? []) counts[row.offer_id] = (counts[row.offer_id] ?? 0) + 1;
      setAcceptedCounts(counts);
      setLoading(false);
    })();
  }, [user]);

  const approved = account?.status === "approved";
  const subActive = sub && ["trial", "active"].includes(sub.status);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Partner dashboard</h1></div>
            <p className="mt-1 text-sm text-muted-foreground">{account?.company_name ?? "—"} · {account?.categories?.join(", ") || "no categories"}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/partner/billing">Billing</Link></Button>
            <Button asChild disabled={!approved || !subActive}><Link to="/partner/offers/new"><Plus className="mr-2 h-4 w-4" />Post offer</Link></Button>
          </div>
        </div>

        {!account && !loading && (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No partner account on file. Ask the admin for an invite.</CardContent></Card>
        )}

        {account && !approved && (
          <Card className="border-warning/40">
            <CardContent className="flex items-start gap-3 py-6 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
              <div>
                <p className="font-medium">Awaiting admin approval</p>
                <p className="text-muted-foreground">Your account is <b>{account.status}</b>. You'll be able to view the marketplace and post offers after an admin approves you.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {approved && !subActive && (
          <Card className="border-warning/40">
            <CardContent className="flex items-start gap-3 py-6 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
              <p>Your subscription is <b>{sub?.status ?? "missing"}</b>. Offer posting is disabled until it's active.</p>
            </CardContent>
          </Card>
        )}

        {loading ? <div className="mt-6 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</div> :
         approved && (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Marketplace</CardTitle>
                <CardDescription>
                  Opportunity groups (by zip + system) where every active owner has opted into anonymized sharing. Groups of fewer than 5 homes are hidden for privacy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {market.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No groups meet the threshold yet. As more homeowners opt in, qualifying groups will appear here.</p>
                ) : (
                  <div className="space-y-2">
                    {market.map((m, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border p-3 text-sm">
                        <div>
                          <p className="font-medium capitalize">{m.system?.replace("_", " ")} · {m.zip}</p>
                          <p className="text-xs text-muted-foreground capitalize">Category: {m.category}</p>
                        </div>
                        <Badge>{m.property_count} homes</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your offers</CardTitle>
                <CardDescription>Max 10 active per (zip, category). Offers expire 30 days after publish.</CardDescription>
              </CardHeader>
              <CardContent>
                {offers.length === 0 ? <p className="text-sm text-muted-foreground">No offers yet.</p> : (
                  <div className="space-y-2">
                    {offers.map((o) => (
                      <div key={o.id} className="rounded-md border p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{o.title}</p>
                          <Badge variant={o.status === "active" ? "default" : "secondary"}>{o.status}</Badge>
                        </div>
                        <p className="text-xs capitalize text-muted-foreground">{o.category} · {o.zip}{o.system ? ` · ${o.system.replace("_"," ")}` : ""}</p>
                        <p className="text-xs text-muted-foreground">Accepted: {acceptedCounts[o.id] ?? 0} · expires {new Date(o.expires_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
