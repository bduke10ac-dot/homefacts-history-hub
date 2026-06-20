export function scoreColor(score: number | null | undefined) {
  if (score == null) return { tone: "muted", bg: "bg-muted", text: "text-muted-foreground", ring: "ring-muted" };
  if (score >= 80) return { tone: "good", bg: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-500/30" };
  if (score >= 65) return { tone: "ok", bg: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-500/30" };
  return { tone: "bad", bg: "bg-destructive", text: "text-destructive", ring: "ring-destructive/30" };
}

export function riskTone(level: string | undefined) {
  switch ((level ?? "").toLowerCase()) {
    case "low": return { label: "Low", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" };
    case "moderate": return { label: "Moderate", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" };
    case "high": return { label: "High", className: "bg-destructive/15 text-destructive border-destructive/30" };
    default: return { label: level ?? "—", className: "bg-muted text-muted-foreground border-border" };
  }
}
