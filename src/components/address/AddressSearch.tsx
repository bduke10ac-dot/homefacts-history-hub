import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getAnonToken, hasUsedAnonReport, markAnonReportUsed, anonReportsRemaining, FREE_DAILY_LIMIT } from "@/lib/anonReport";

interface Prediction { description: string; place_id: string; }

export function AddressSearch({ size = "lg" }: { size?: "default" | "lg" }) {
  const [q, setQ] = useState("");
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const sessionToken = useRef(crypto.randomUUID?.() ?? `${Date.now()}`);
  const debounceRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 3) { setPreds([]); return; }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("places-autocomplete", {
          body: { input: q, sessionToken: sessionToken.current },
        });
        if (error) throw error;
        setConfigured(data?.configured ?? false);
        setPreds(data?.predictions ?? []);
        setOpen(true);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [q]);

  function showSignupCta(msg?: string) {
    toast.error(msg ?? `You've used your ${FREE_DAILY_LIMIT} free reports for today.`, {
      action: { label: "Sign up — free", onClick: () => navigate("/auth?mode=signup") },
      duration: 8000,
    });
  }

  async function submit(opts?: { placeId?: string; description?: string }) {
    if (submitting) return;
    if (!user && hasUsedAnonReport()) {
      showSignupCta();
      return;
    }
    setSubmitting(true);
    try {
      let placeDetails: any = null;
      if (opts?.placeId && configured) {
        const { data } = await supabase.functions.invoke("places-autocomplete", {
          body: { action: "details", placeId: opts.placeId, sessionToken: sessionToken.current },
        });
        placeDetails = data?.place;
      }
      const address = opts?.description ?? q.trim();
      if (!address) { toast.error("Enter an address"); return; }

      const { data, error } = await supabase.functions.invoke("start-address-report", {
        body: {
          address,
          formatted_address: placeDetails?.formatted_address ?? address,
          place_id: placeDetails?.place_id ?? opts?.placeId ?? null,
          lat: placeDetails?.lat ?? null,
          lng: placeDetails?.lng ?? null,
          anon_token: user ? null : getAnonToken(),
        },
      });
      if (error) {
        // supabase.functions.invoke surfaces non-2xx as an error. Try to read body.
        const ctx: any = (error as any).context;
        let payload: any = null;
        try { payload = ctx?.json ? await ctx.json() : (ctx?.body ? JSON.parse(ctx.body) : null); } catch {}
        if (payload?.error === "free_limit_reached" || ctx?.status === 429) {
          // Sync local counter to the wall so we stop hitting the backend
          while (!hasUsedAnonReport()) markAnonReportUsed();
          showSignupCta(payload?.message);
          return;
        }
        throw error;
      }
      if (!user) markAnonReportUsed();
      navigate(`/report/${data.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't start the report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative w-full">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => preds.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Enter any U.S. address"
            className={size === "lg" ? "h-14 pl-10 text-base" : "pl-10"}
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
          {open && preds.length > 0 && (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-elevated">
              {preds.map((p) => (
                <button
                  type="button"
                  key={p.place_id}
                  onMouseDown={(e) => { e.preventDefault(); submit({ placeId: p.place_id, description: p.description }); }}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{p.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" size={size === "lg" ? "lg" : "default"} disabled={submitting || !q.trim()}>
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Building…</> : "Get the report"}
        </Button>
      </form>
      {configured === false && (
        <p className="mt-2 text-xs text-muted-foreground">Autocomplete is off — type a full address and hit enter.</p>
      )}
      {!user && !hasUsedAnonReport() && (
        <p className="mt-2 text-xs text-muted-foreground">
          {anonReportsRemaining()} of {FREE_DAILY_LIMIT} free previews left today — no sign-up required.
        </p>
      )}
    </div>
  );
}
