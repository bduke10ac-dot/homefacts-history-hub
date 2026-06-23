interface Props { score: number; size?: number; label?: string; }
export function ScoreRing({ score, size = 120, label }: Props) {
  const s = Math.max(0, Math.min(100, score));
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (s / 100) * c;
  const color = s >= 80 ? "hsl(var(--accent))" : s >= 55 ? "hsl(var(--primary))" : "hsl(var(--destructive))";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(s)}</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
