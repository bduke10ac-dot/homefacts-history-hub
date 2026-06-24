import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, MapPin, LocateFixed } from "lucide-react";
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
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const sessionToken = useRef(crypto.randomUUID?.() ?? `${Date.now()}`);
  const debounceRef = useRef<number | null>(null);
  const skipNextLookup = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (skipNextLookup.current) { skipNextLookup.current = false; return; }
    if (q.trim().length < 3) { setPreds([]); setHighlight(-1); return; }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("places-autocomplete", {
          body: { input: q, sessionToken: sessionToken.current },
        });
        if (error) throw error;
        setConfigured(data?.configured ?? false);
        setPreds(data?.predictions ?? []);
        setHighlight(-1);
        setOpen(true);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 275);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [q]);

  function showSignupCta(msg?: string) {
    toast.error(msg ?? `You've used your ${FREE_DAILY_LIMIT} free reports for today.`, {
      action: { label: "Sign up — free", onClick: () => navigate("/auth?mode=signup") },
      duration: 8000,
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || preds.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % preds.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + preds.length) % preds.length);
    } else if (e.key === "Enter") {
      if (highlight >= 0 && highlight < preds.length) {
        e.preventDefault();
        const p = preds[highlight];
        submit({ placeId: p.place_id, description: p.description });
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  async function useMyLocation() {
    setGeoMessage(null);
    if (!("geolocation" in navigator)) {
      setGeoMessage("Location not supported in this browser — please type your address.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const { data, error } = await supabase.functions.invoke("reverse-geocode", {
            body: { lat: latitude, lng: longitude },
          });
          if (error) throw error;
          const addr = (data as any)?.formatted_address as string | null;
          if (addr) {
            skipNextLookup.current = true;
            setQ(addr);
            setOpen(false);
            setGeoMessage("Address filled in — review and submit when ready.");
          } else {
            setGeoMessage("Couldn't resolve your location to an address — please type it in.");
          }
        } catch {
          setGeoMessage("Couldn't resolve your location — please type your address.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoMessage("Location access denied — please type your address.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoMessage("Location unavailable right now — please type your address.");
        } else {
          setGeoMessage("Couldn't get your location — please type your address.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
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
        const ctx: any = (error as any).context;
        let payload: any = null;
        try { payload = ctx?.json ? await ctx.json() : (ctx?.body ? JSON.parse(ctx.body) : null); } catch {}
        if (payload?.error === "free_limit_reached" || ctx?.status === 429) {
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
            onKeyDown={onKeyDown}
            placeholder="Enter any U.S. address"
            className={size === "lg" ? "h-14 pl-10 pr-20 text-base" : "pl-10 pr-12"}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="address-suggestions"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={useMyLocation}
              disabled={locating}
              aria-label="Use my current location"
              title="Use my current location"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            </Button>
          </div>
          {open && preds.length > 0 && (
            <div
              id="address-suggestions"
              role="listbox"
              className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-elevated"
            >
              {preds.map((p, i) => (
                <button
                  type="button"
                  key={p.place_id}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => { e.preventDefault(); submit({ placeId: p.place_id, description: p.description }); }}
                  className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm ${i === highlight ? "bg-muted" : "hover:bg-muted"}`}
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
      {geoMessage && <p className="mt-2 text-xs text-muted-foreground">{geoMessage}</p>}
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
