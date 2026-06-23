import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, Building2 } from "lucide-react";

interface Props {
  builderSlug?: string;
  builderName?: string;
  propertyId?: string;
  cloneId?: string;
}

export function CreeksideMarketingBlock({
  builderSlug = "creekside-homes",
  builderName = "Creekside",
  propertyId,
  cloneId,
}: Props) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
        <ShieldCheck className="h-4 w-4" />Orivaz Verified Digital Home Record
      </div>
      <p className="mt-3 text-base leading-relaxed">
        This {builderName} home includes a certified Orivaz Digital Home Record —
        giving homeowners organized access to warranties, builder documents, construction
        history, maintenance reminders, and important property information from day one.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {propertyId && (
          <Button asChild size="sm">
            <Link to={`/property/${propertyId}`}><FileText className="mr-2 h-4 w-4" />View Digital Home Record</Link>
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <Link to={`/builders/${builderSlug}`}><Building2 className="mr-2 h-4 w-4" />View Builder Profile</Link>
        </Button>
        {cloneId && (
          <Button asChild size="sm" variant="outline">
            <Link to={`/builder/clones/${cloneId}/handoff`}><FileText className="mr-2 h-4 w-4" />Download Homeowner Packet</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
