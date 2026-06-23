import { Badge } from "@/components/ui/badge";
import { Award, ShieldCheck, FileCheck2, Wrench, CalendarClock, Star } from "lucide-react";

const ICON_MAP: Array<{ match: RegExp; icon: any }> = [
  { match: /founding/i, icon: Star },
  { match: /certified/i, icon: ShieldCheck },
  { match: /digital/i, icon: Award },
  { match: /warranty/i, icon: FileCheck2 },
  { match: /construction/i, icon: Wrench },
  { match: /handoff/i, icon: CalendarClock },
];

function iconFor(label: string) {
  return ICON_MAP.find((m) => m.match.test(label))?.icon ?? Award;
}

export function BuilderBadgeRow({ badges }: { badges?: string[] | null }) {
  if (!badges?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => {
        const Icon = iconFor(b);
        return (
          <Badge key={b} variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
            <Icon className="h-3.5 w-3.5" />
            {b}
          </Badge>
        );
      })}
    </div>
  );
}
