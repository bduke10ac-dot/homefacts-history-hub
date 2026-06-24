import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, ShieldCheck, Trophy, Gem, CircleDashed } from "lucide-react";
import type { TrustGrade } from "@/lib/propertyTrustScore";
import { NEXT_LEVEL_THRESHOLDS } from "@/lib/propertyTrustScore";

interface Props {
  score: number;
  grade: TrustGrade;
  className?: string;
}

const META: Record<TrustGrade, { icon: any; tone: string; blurb: string }> = {
  Incomplete: { icon: CircleDashed, tone: "bg-muted text-muted-foreground", blurb: "Start documenting this property to unlock Bronze certification." },
  Bronze:     { icon: ShieldCheck,  tone: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200", blurb: "Foundational records on file. Good start." },
  Silver:     { icon: Award,        tone: "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100", blurb: "Solid documentation across most categories." },
  Gold:       { icon: Trophy,       tone: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200", blurb: "Strong, transferable property record." },
  Platinum:   { icon: Gem,          tone: "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-200", blurb: "Top-tier completeness — fully documented home." },
};

export function CertificationBadge({ score, grade, className }: Props) {
  const meta = META[grade];
  const Icon = meta.icon;
  const nextThreshold = NEXT_LEVEL_THRESHOLDS[grade];
  const progressTo = nextThreshold ? Math.min(100, Math.round((score / nextThreshold) * 100)) : 100;
  const pointsToNext = nextThreshold ? Math.max(0, nextThreshold - score) : 0;

  return (
    <Card className={className}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Property Trust Certification</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={meta.tone}>
                <Icon className="mr-1 h-3.5 w-3.5" />
                {grade}
              </Badge>
              <span className="text-2xl font-bold tabular-nums">{score}</span>
              <span className="text-sm text-muted-foreground">/ 1000</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{meta.blurb}</p>
        {nextThreshold ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to next level</span>
              <span>{pointsToNext} pts to go</span>
            </div>
            <Progress value={progressTo} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">You've reached the top certification level.</p>
        )}
      </CardContent>
    </Card>
  );
}
