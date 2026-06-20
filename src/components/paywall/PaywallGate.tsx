import { ReactNode, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Props {
  title?: string;
  description?: string;
  children: ReactNode;
  /** Show a teaser of the gated content (blurred) before locking */
  teaser?: ReactNode;
}

export function PaywallGate({ title = "Pro feature", description = "Unlock full home history, fraud detail, and exportable reports.", children, teaser }: Props) {
  const { isPro, loading, startTrial } = useSubscription();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading…</div>;
  if (isPro) return <>{children}</>;

  const onStart = async () => {
    if (!user) return;
    setBusy(true);
    try { await startTrial(); toast.success("Free trial started — enjoy 7 days of Pro."); }
    catch (e: any) { toast.error(e.message ?? "Could not start trial"); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      {teaser && (
        <div className="pointer-events-none select-none opacity-40 blur-sm">{teaser}</div>
      )}
      <div className={teaser ? "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-background/60 to-background/95 p-6 text-center" : "flex flex-col items-center justify-center gap-3 p-8 text-center"}>
        <div className="rounded-full bg-primary/10 p-3 text-primary"><Lock className="h-5 w-5" /></div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        {user ? (
          <Button onClick={onStart} disabled={busy}>
            <Sparkles className="mr-2 h-4 w-4" />{busy ? "Starting…" : "Start 7-day free trial"}
          </Button>
        ) : (
          <Button asChild><Link to="/auth">Sign in to unlock</Link></Button>
        )}
        <p className="text-xs text-muted-foreground">No card required for trial.</p>
      </div>
    </div>
  );
}
