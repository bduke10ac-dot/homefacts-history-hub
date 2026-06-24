import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const KEY = "orivaz.cookie_consent";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setOpen(true); } catch { /* no-op */ }
  }, []);

  const accept = (value: "accepted" | "dismissed") => {
    try { localStorage.setItem(KEY, value); } catch { /* no-op */ }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-2 bottom-2 z-[60] mx-auto max-w-3xl rounded-lg border bg-card p-4 shadow-elevated md:inset-x-auto md:right-4 md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm">
          <p className="font-medium">We use cookies</p>
          <p className="mt-1 text-muted-foreground">
            We use essential cookies to keep you signed in and remember preferences.
            See our <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => accept("dismissed")}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => accept("accepted")}>Accept</Button>
        <Button size="sm" variant="ghost" onClick={() => accept("dismissed")}>Only essential</Button>
      </div>
    </div>
  );
}

export function hasCookieConsent(): boolean {
  try { return localStorage.getItem(KEY) === "accepted"; } catch { return false; }
}
