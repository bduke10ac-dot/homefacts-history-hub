import { Activity, Info, TrendingDown, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { HealthScoreResult } from "@/lib/healthScore";

interface Props {
  result: HealthScoreResult;
}

export function HealthScoreCard({ result }: Props) {
  const { score, grade, factors } = result;
  // Color band
  const color =
    score >= 80 ? "hsl(var(--accent))" : score >= 65 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Home Health Score</h2>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />Estimated
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-xs">
              Heuristic score based on records and home age. Not a substitute for a professional inspection.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-4 grid items-center gap-6 sm:grid-cols-[auto,1fr]">
        <div className="relative mx-auto h-32 w-32">
          <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 600ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums">{score}</span>
            <span className="text-xs text-muted-foreground">Grade {grade}</span>
          </div>
        </div>

        <ul className="space-y-2">
          {factors.slice(0, 5).map((f) => {
            const positive = f.impact >= 0;
            return (
              <li key={f.label} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.detail}</p>
                </div>
                <span
                  className={`inline-flex flex-none items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                    positive ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positive ? "+" : ""}
                  {f.impact}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
