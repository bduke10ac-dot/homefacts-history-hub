import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { CONTRACTOR_TIER_META, type ContractorTier } from "@/lib/certificationTiers";

export function ContractorTrustBadge({ tier, showDescription = false }: { tier: ContractorTier; showDescription?: boolean }) {
  const meta = CONTRACTOR_TIER_META[tier];
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Badge className={meta.color}>
        <Award className="mr-1 h-3 w-3" /> {tier}
      </Badge>
      {showDescription && <span className="text-xs text-muted-foreground">{meta.description}</span>}
    </div>
  );
}
