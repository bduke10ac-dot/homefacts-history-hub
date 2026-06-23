import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Maximize2, ExternalLink } from "lucide-react";

export function BuilderAvailableHomeCard({ home }: { home: any }) {
  return (
    <Card className="overflow-hidden">
      {home.hero_image_url && <img src={home.hero_image_url} alt={home.address_line} className="h-44 w-full object-cover" />}
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold">{home.address_line}</h4>
            <p className="text-xs text-muted-foreground">Lot {home.lot_number}{home.city ? ` · ${home.city}` : ""}</p>
          </div>
          <Badge variant={home.status === "completed" ? "default" : "secondary"} className="capitalize">
            {String(home.status || "draft").replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {home.bedrooms != null && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{home.bedrooms}</span>}
          {home.bathrooms != null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{home.bathrooms}</span>}
          {home.square_feet && <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{home.square_feet.toLocaleString()} sqft</span>}
        </div>
        {home.list_price && <p className="text-lg font-bold">${Number(home.list_price).toLocaleString()}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          {home.handoff_token && (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link to={`/home/${home.handoff_token}`}>Digital Home Record</Link>
            </Button>
          )}
          {home.listing_url && (
            <Button asChild size="sm" variant="ghost">
              <a href={home.listing_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
