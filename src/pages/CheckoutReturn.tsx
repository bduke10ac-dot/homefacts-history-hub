import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { refresh } = useSubscription();

  useEffect(() => {
    // Poll a few times — webhook may land a moment after redirect.
    let cancelled = false;
    let tries = 0;
    const tick = async () => {
      tries++;
      await refresh();
      if (!cancelled && tries < 6) setTimeout(tick, 1500);
    };
    tick();
    return () => { cancelled = true; };
  }, [refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center rounded-2xl border bg-card p-8">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Payment complete</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sessionId ? "Thanks — your Pro features are unlocking now." : "Your subscription is being processed."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild><Link to="/dashboard">Go to dashboard</Link></Button>
          <Button asChild variant="outline"><Link to="/search">Search a property</Link></Button>
        </div>
      </div>
    </div>
  );
}
