import { ReactNode, useState } from "react";
import { Lock, Sparkles, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface Props {
  title?: string;
  description?: string;
  children: ReactNode;
  teaser?: ReactNode;
}

export function PaywallGate({
  title = "Pro feature",
  description = "Unlock the full report: risks, system scores, fraud detail, and PDF exports.",
  children,
  teaser,
}: Props) {
  const { isPro, loading, startTrial } = useSubscription();
  const { user } = useAuth();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading…</div>;
  if (isPro) return <>{children}</>;

  const onStartTrial = async () => {
    if (!user) return;
    setBusy(true);
    try { await startTrial(); toast.success("Free trial started — enjoy 7 days of Pro."); }
    catch (e: any) { toast.error(e.message ?? "Could not start trial"); }
    finally { setBusy(false); }
  };

  const onUpgrade = () => {
    if (!user) return;
    openCheckout({ priceId: "pro_monthly", customerEmail: user.email ?? undefined, userId: user.id });
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border bg-card">
        {teaser && <div className="pointer-events-none select-none opacity-40 blur-sm">{teaser}</div>}
        <div
          className={
            teaser
              ? "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-background/60 to-background/95 p-6 text-center"
              : "flex flex-col items-center justify-center gap-3 p-8 text-center"
          }
        >
          <div className="rounded-full bg-primary/10 p-3 text-primary"><Lock className="h-5 w-5" /></div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>

          {user ? (
            <div className="flex flex-col items-center gap-2">
              <Button onClick={onUpgrade}>
                <CreditCard className="mr-2 h-4 w-4" /> Upgrade to Pro · $19/mo
              </Button>
              <button
                onClick={onStartTrial}
                disabled={busy}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                {busy ? "Starting…" : "Or start 7-day free trial — no card required"}
              </button>
              <Link to="/pricing" className="text-xs text-muted-foreground hover:text-foreground">
                Compare plans
              </Link>
            </div>
          ) : (
            <Button asChild><Link to="/auth">Sign in to unlock</Link></Button>
          )}
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
    </>
  );
}
