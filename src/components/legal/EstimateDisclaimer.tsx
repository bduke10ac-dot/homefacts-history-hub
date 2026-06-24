import { Info } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Inline disclaimer for any surface that shows scores, risk levels,
 * value estimates, insurance readiness, crime data, or forecasts.
 * Keep this on every modeled/estimated data view for liability cover.
 */
export function EstimateDisclaimer({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Estimates only — based on modeled data, not verified by a licensed professional.{" "}
        <Link to="/terms" className="underline underline-offset-2">Terms</Link>
      </p>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p className="leading-relaxed">
        <span className="font-medium">Estimates only.</span> Scores, risk levels, and values shown
        here are generated from modeled and third-party data for informational purposes. They are
        not a substitute for a professional inspection, appraisal, insurance underwriting, or
        legal advice. See our{" "}
        <Link to="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
        <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </div>
  );
}
