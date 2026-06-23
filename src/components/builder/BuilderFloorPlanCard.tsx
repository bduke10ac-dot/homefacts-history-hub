import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Car, Maximize2 } from "lucide-react";

export function BuilderFloorPlanCard({ plan }: { plan: any }) {
  const feats = Array.isArray(plan.included_features) ? plan.included_features : [];
  return (
    <Card>
      {plan.image_url && <img src={plan.image_url} alt={plan.name} className="h-40 w-full object-cover" />}
      <CardContent className="space-y-3 p-4">
        <div>
          <h4 className="font-semibold">{plan.name}</h4>
          {plan.elevation && <p className="text-xs text-muted-foreground">Elevation: {plan.elevation}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {plan.square_feet && (
            <div className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{plan.square_feet.toLocaleString()} sqft</div>
          )}
          {plan.bedrooms != null && (
            <div className="flex items-center gap-1"><Bed className="h-3 w-3" />{plan.bedrooms} bd</div>
          )}
          {plan.bathrooms != null && (
            <div className="flex items-center gap-1"><Bath className="h-3 w-3" />{plan.bathrooms} ba</div>
          )}
          {plan.garage && (
            <div className="flex items-center gap-1"><Car className="h-3 w-3" />{plan.garage}</div>
          )}
        </div>
        {feats.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {feats.slice(0, 4).map((f: string, i: number) => (
              <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
