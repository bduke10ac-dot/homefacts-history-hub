/**
 * Pilot mode hides non-essential surfaces so Creekside Homes (and similar early builders)
 * see a focused MVP. Set `VITE_PILOT_MODE=false` to expose the full Intelligence suite.
 */
export const PILOT_MODE = (import.meta.env.VITE_PILOT_MODE ?? "true") !== "false";

/** Pages that ship in the pilot. Everything else is hidden when PILOT_MODE is on. */
export const PILOT_ROUTE_ALLOWLIST = new Set<string>([
  "/", "/auth", "/dashboard",
  "/search",
  "/builder", "/builder/portal", "/admin", "/builders",
  "/property", // generic property pages — handled by path prefix below
  "/claim",
  "/privacy-controls",
  "/dashboard/revenue-intelligence",
  "/admin/partners",
  "/partner", "/partner/offers/new",
  "/offers",
  // Legal + account recovery — always accessible
  "/privacy", "/terms", "/disclaimer",
  "/forgot-password", "/reset-password", "/unauthorized",
]);

export const isPilotAllowedRoute = (pathname: string): boolean => {
  if (!PILOT_MODE) return true;
  if (PILOT_ROUTE_ALLOWLIST.has(pathname)) return true;
  // allow /property/:id, /property/:id/vault, /property/:id/warranties, /property/:id/reminders
  if (pathname.startsWith("/property/")) {
    const allowedSuffixes = ["", "/vault", "/warranties", "/reminders", "/maintenance", "/health-score", "/opportunities"];
    return allowedSuffixes.some((s) => pathname.match(new RegExp(`^/property/[^/]+${s.replace(/\//g, "\\/")}/?$`)));
  }
  if (pathname.startsWith("/builder/portal")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/partner")) return true;
  if (pathname.startsWith("/partners/claim")) return true;
  if (pathname.startsWith("/claim/")) return true;
  return false;
};
