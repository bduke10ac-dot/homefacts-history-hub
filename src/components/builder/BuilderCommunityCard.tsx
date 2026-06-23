import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";

export function BuilderCommunityCard({ community, builderSlug }: { community: any; builderSlug: string }) {
  return (
    <Card className="overflow-hidden">
      {community.hero_image_url && (
        <img src={community.hero_image_url} alt={community.name} className="h-40 w-full object-cover" />
      )}
      <CardContent className="space-y-2 p-4">
        <h4 className="font-semibold">{community.name}</h4>
        {community.city && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {community.city}{community.state ? `, ${community.state}` : ""}
          </p>
        )}
        {community.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{community.description}</p>
        )}
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={`/builders/${builderSlug}/communities/${community.id}`}>
            View Community <ArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
