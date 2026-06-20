import { Sparkles, TrendingUp, TrendingDown, Users } from "lucide-react";
import { scoreColor } from "@/lib/outlook";
import { Skeleton } from "@/components/ui/skeleton";

interface Outlook {
  score: number; grade: string; headline: string; summary: string;
  pros: string[]; cons: string[]; best_for: string[];
}

export function LivingOutlookCard({ data, loading }: { data?: Outlook | null; loading?: boolean }) {
  if (loading || !data) {
    return (
      <div className="overflow-hidden rounded-2xl border bg-card p-6 shadow-card">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
        <Skeleton className="mt-3 h-4 w-3/4" />
      </div>
    );
  }
  const c = scoreColor(data.score);
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="grid gap-6 p-6 md:grid-cols-[auto,1fr]">
        <div className={`relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full ${c.bg} text-primary-foreground ring-8 ${c.ring}`}>
          <div className="text-center">
            <div className="text-4xl font-bold leading-none">{data.score}</div>
            <div className="mt-1 text-xs uppercase tracking-wider opacity-90">Grade {data.grade}</div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Living Outlook
          </div>
          <h2 className="mt-2 text-xl font-semibold leading-snug md:text-2xl">{data.headline}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
          {data.best_for?.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {data.best_for.map((b) => (
                <span key={b} className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium">{b}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-px border-t bg-border sm:grid-cols-2">
        <div className="bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400"><TrendingUp className="h-4 w-4" />Strengths</div>
          <ul className="mt-3 space-y-1.5">
            {data.pros.map((p, i) => <li key={i} className="flex gap-2 text-sm"><span className="text-emerald-600">•</span><span>{p}</span></li>)}
          </ul>
        </div>
        <div className="bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive"><TrendingDown className="h-4 w-4" />Watch-outs</div>
          <ul className="mt-3 space-y-1.5">
            {data.cons.map((p, i) => <li key={i} className="flex gap-2 text-sm"><span className="text-destructive">•</span><span>{p}</span></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
