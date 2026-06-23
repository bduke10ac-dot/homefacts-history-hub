import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Trophy, ShieldCheck } from "lucide-react";

type Props = {
  company: any;
};

export function BuilderBrandingCard({ company: c }: Props) {
  if (!c) return null;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border bg-background"
          style={c.brand_primary_color ? { borderColor: c.brand_primary_color } : undefined}
        >
          {c.logo_url ? (
            <img src={c.logo_url} alt={`${c.name} logo`} className="max-h-[80%] max-w-[80%] object-contain" />
          ) : (
            <Building2 className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold">{c.name}</h3>
            {c.is_founding_builder && (
              <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
                <Trophy className="mr-1 h-3 w-3" />
                Founding Builder #{String(c.founding_builder_number ?? 1).padStart(3, "0")}
              </Badge>
            )}
            {c.is_certified_builder && (
              <Badge variant="secondary">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Certified Builder
              </Badge>
            )}
          </div>
          {c.tagline && <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>}
          {c.description && <p className="mt-2 text-sm">{c.description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
