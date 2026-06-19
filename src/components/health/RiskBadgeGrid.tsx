import { ShieldAlert, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { RiskScore } from "@/lib/riskScores";

interface Props {
  risks: RiskScore[];
}

const BAND_STYLES: Record<RiskScore["band"], string> = {
  low: "border-accent/40 bg-accent/5 text-accent",
  medium: "border-warning/50 bg-warning/10 text-warning-foreground",
  high: "border-destructive/40 bg-destructive/10 text-destructive",
};

const BAND_DOT: Record<RiskScore["band"], string> = {
  low: "bg-accent",
  medium: "bg-warning",
  high: "bg-destructive",
};

export function RiskBadgeGrid({ risks }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Risk overview</h2>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />Estimated
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-xs">
              Heuristic risk bands from records and region. Verified data feeds (FEMA, NOAA) coming soon.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <TooltipProvider>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-9">
          {risks.map((r) => (
            <Tooltip key={r.key}>
              <TooltipTrigger asChild>
                <div
                  className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left ${BAND_STYLES[r.band]}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">{r.label}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${BAND_DOT[r.band]}`} />
                  </div>
                  <span className="text-sm font-semibold capitalize">{r.band}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{r.label} — {r.score}/100</p>
                <p className="text-muted-foreground">{r.detail}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
