import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, Globe, Building2, ArrowRight } from "lucide-react";

function ext(url?: string | null) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `https://${url}`;
}

export function FoundingBuilderSpotlight() {
  const [c, setC] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("builder_companies")
      .select("*")
      .eq("is_founding_builder", true)
      .order("founding_builder_number", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setC(data));
  }, []);

  if (!c) return null;

  const website = ext(c.website);
  const profile = `/builders/${c.slug}`;

  return (
    <section className="container py-16">
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-muted/40 shadow-elevated">
        <div className="grid items-center gap-6 p-8 md:grid-cols-[260px_1fr]">
          <div
            className="flex aspect-square items-center justify-center rounded-2xl border-4 border-primary/20 bg-white"
            style={c.brand_primary_color ? { background: `linear-gradient(135deg, ${c.brand_primary_color}15, ${c.brand_secondary_color ?? c.brand_primary_color}25)` } : undefined}
          >
            {c.logo_url ? (
              <img src={c.logo_url} alt={`${c.name} logo`} className="max-h-[80%] max-w-[80%] object-contain" />
            ) : (
              <div className="text-center">
                <Building2 className="mx-auto h-16 w-16 text-primary" />
                <p className="mt-2 text-xs text-muted-foreground">Logo coming soon</p>
              </div>
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Trophy className="h-3.5 w-3.5" />Founding Builder · #{String(c.founding_builder_number ?? 1).padStart(3, "0")}
            </div>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Founding Builder</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed">
              <span className="font-semibold text-foreground">{c.name}</span> is the first official builder partner of the HomeFacts Builder Program.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Helping launch a new standard for new construction documentation, warranty organization, homeowner education, and long-term property history.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={profile}>Learn About {c.name.split(" ")[0]} Homes<ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              {website && (
                <Button asChild size="lg" variant="outline">
                  <a href={website} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" />Visit Builder Website</a>
                </Button>
              )}
              <Button asChild size="lg" variant="outline">
                <Link to={profile}><Building2 className="mr-2 h-4 w-4" />Explore Their Communities</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
