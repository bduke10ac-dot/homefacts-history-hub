import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const FEATURES = [
  { label: "Address search & basic property facts", free: true, pro: true },
  { label: "Property map & home history timeline", free: true, pro: true },
  { label: "Full risk breakdown & system scores", free: false, pro: true },
  { label: "Professional fraud-check details", free: false, pro: true },
  { label: "Downloadable PDF reports", free: false, pro: true },
  { label: "Unlimited saved reports", free: false, pro: true },
];

export default function Pricing() {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [interval, setInterval] = useState<"month" | "year">("month");

  const priceId = interval === "month" ? "pro_monthly" : "pro_yearly";

  const handleSubscribe = () => {
    if (!user) return;
    openCheckout({ priceId, customerEmail: user.email ?? undefined, userId: user.id });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pricing — Orivaz</title>
        <meta name="description" content="Simple plans for homeowners, builders, contractors, and realtors. Start free; upgrade for unlimited reports and intelligence." />
        <link rel="canonical" href="https://homefacts-history-hub.lovable.app/pricing" />
        <meta property="og:title" content="Pricing — Orivaz" />
        <meta property="og:description" content="Simple plans for homeowners, builders, contractors, and realtors. Start free; upgrade for unlimited reports and intelligence." />
        <meta property="og:url" content="https://homefacts-history-hub.lovable.app/pricing" />
      </Helmet>
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
          <p className="mt-2 text-muted-foreground">Start free. Upgrade when you need the full report.</p>

          <div className="mt-6 inline-flex rounded-full border bg-card p-1">
            <button
              onClick={() => setInterval("month")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                interval === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("year")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                interval === "year" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Yearly · save 17%
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">Browse, search, and preview reports.</p>
            <div className="mt-4 text-3xl font-bold">$0<span className="text-base font-normal text-muted-foreground">/mo</span></div>
            <ul className="mt-6 space-y-2 text-sm">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  {f.free ? <Check className="h-4 w-4 text-primary mt-0.5" /> : <X className="h-4 w-4 text-muted-foreground mt-0.5" />}
                  <span className={f.free ? "" : "text-muted-foreground"}>{f.label}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6 w-full" asChild>
              <Link to="/search">Search a property</Link>
            </Button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-primary bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Orivaz Pro</h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Most popular</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Everything you need to evaluate a home.</p>
            <div className="mt-4 text-3xl font-bold">
              {interval === "month" ? "$19" : "$190"}
              <span className="text-base font-normal text-muted-foreground">/{interval === "month" ? "mo" : "yr"}</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button className="mt-6 w-full" disabled>You're on Pro</Button>
            ) : user ? (
              <Button className="mt-6 w-full" onClick={handleSubscribe}>
                Upgrade to Pro
              </Button>
            ) : (
              <Button className="mt-6 w-full" asChild>
                <Link to="/auth">Sign in to upgrade</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeCheckout()}>
        <DialogContent className="max-w-2xl p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Complete your purchase</DialogTitle>
          </DialogHeader>
          <div className="p-4">{checkoutElement}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
