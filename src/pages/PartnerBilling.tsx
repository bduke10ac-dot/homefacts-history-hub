import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";

interface PartnerSub {
  status: string | null;
  plan: string | null;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_customer_id: string | null;
  external_subscription_id: string | null;
}

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    priceId: "partner_starter_monthly",
    price: "$99/mo",
    blurb: "Up to 25 active offers across your approved zip + category combinations.",
    features: ["25 active offers", "Marketplace access", "Homeowner acceptance reveals contact"],
  },
  {
    id: "growth",
    name: "Growth",
    priceId: "partner_growth_monthly",
    price: "$299/mo",
    blurb: "Higher quota and multi-zip coverage for established partners.",
    features: ["100 active offers", "Multi-zip coverage", "Priority marketplace placement"],
    highlight: true,
  },
];

export default function PartnerBilling() {
  const { user } = useAuth();
  const [sub, setSub] = useState<PartnerSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("partner_subscriptions")
      .select("status,plan,price_id,current_period_end,cancel_at_period_end,stripe_customer_id,external_subscription_id")
      .eq("partner_user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSub(data as PartnerSub | null);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const paymentsReady = useMemo(() => isPaymentsConfigured(), []);

  const startCheckout = (priceId: string) => {
    if (!paymentsReady) {
      toast.error("Payments are not configured in this build.");
      return;
    }
    setCheckoutPriceId(priceId);
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-partner-portal", {
        body: { returnUrl: window.location.origin + "/partner/billing", environment: getStripeEnvironment() },
      });
      if (error || !data?.url) throw new Error(error?.message || "Could not open billing portal");
      window.open(data.url as string, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPriceId = sub?.price_id;
  const statusLabel = sub?.status ?? "no plan";
  const statusVariant: "default" | "secondary" | "outline" | "destructive" =
    sub?.status === "active" ? "default"
    : sub?.status === "trial" || sub?.status === "trialing" ? "secondary"
    : sub?.status === "past_due" ? "destructive"
    : "outline";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/partner"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link></Button>
        <h1 className="text-2xl font-bold mb-1">Billing</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose the plan that fits how many opportunities you want to reach.</p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Current plan</CardTitle>
            <CardDescription>Subscription status is synced from Stripe.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={statusVariant}>{statusLabel}</Badge>
                <span className="text-sm">{sub?.plan ? `Plan: ${sub.plan}` : "No paid plan yet"}</span>
                {sub?.current_period_end && (
                  <span className="text-xs text-muted-foreground">
                    {sub.cancel_at_period_end ? "Cancels" : "Renews"} {new Date(sub.current_period_end).toLocaleDateString()}
                  </span>
                )}
                {sub?.stripe_customer_id && (
                  <Button size="sm" variant="outline" onClick={openPortal} disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                    Manage in Stripe
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {TIERS.map((t) => {
            const isCurrent = currentPriceId === t.priceId && (sub?.status === "active" || sub?.status === "trialing");
            return (
              <Card key={t.id} className={t.highlight ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {t.name}
                    {t.highlight && <Badge variant="secondary">Popular</Badge>}
                  </CardTitle>
                  <CardDescription>{t.blurb}</CardDescription>
                  <p className="text-2xl font-bold mt-2">{t.price}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1.5 text-sm">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />{f}</li>
                    ))}
                  </ul>
                  <Button className="w-full" disabled={isCurrent} onClick={() => startCheckout(t.priceId)}>
                    {isCurrent ? "Current plan" : currentPriceId ? "Switch to this plan" : "Subscribe"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Territory</CardTitle>
              <CardDescription>Exclusive coverage and custom volume. Pricing is configured per partner.</CardDescription>
              <p className="text-2xl font-bold mt-2">$999+/mo</p>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <a href="mailto:partners@orivaz.com?subject=Territory%20plan%20inquiry">Contact us</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Dialog open={!!checkoutPriceId} onOpenChange={(o) => !o && setCheckoutPriceId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Complete your subscription</DialogTitle></DialogHeader>
            {checkoutPriceId && user && (
              <StripeEmbeddedCheckoutPartner
                priceId={checkoutPriceId}
                userId={user.id}
                customerEmail={user.email ?? undefined}
                onClose={() => { setCheckoutPriceId(null); setTimeout(load, 1500); }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function StripeEmbeddedCheckoutPartner({
  priceId, userId, customerEmail, onClose,
}: { priceId: string; userId: string; customerEmail?: string; onClose: () => void }) {
  // Mount the existing embedded checkout component but pass partnerUserId via a custom invoke
  // by overriding through a thin wrapper that calls create-checkout directly.
  return (
    <PartnerCheckoutInner
      priceId={priceId}
      userId={userId}
      customerEmail={customerEmail}
      onClose={onClose}
    />
  );
}

function PartnerCheckoutInner({
  priceId, userId, customerEmail, onClose,
}: { priceId: string; userId: string; customerEmail?: string; onClose: () => void }) {
  return (
    <div>
      <StripeEmbeddedCheckout priceId={priceId} userId={userId} customerEmail={customerEmail}
        returnUrl={`${window.location.origin}/partner/billing?session_id={CHECKOUT_SESSION_ID}`} />
      <div className="mt-3 text-right">
        <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
