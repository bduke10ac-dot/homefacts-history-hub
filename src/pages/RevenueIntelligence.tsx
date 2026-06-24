import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Loader2 } from "lucide-react";

interface Stats {
  totalProperties: number;
  withIntel: number;
  withScore: number;
  avgScore: number | null;
  consentedAnon: number;
  consentedOutreach: number;
  consentedOffers: number;
  oppCounts: Record<string, number>;
  urgencyCounts: Record<string, number>;
}

const InternalBadge = () => <Badge variant="secondary" className="text-[10px]">Internal · all properties</Badge>;
const ShareableBadge = () => <Badge className="bg-accent text-accent-foreground text-[10px]">Consented · shareable</Badge>;

export default function RevenueIntelligence() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        { count: totalProperties },
        { count: withIntel },
        { data: scores },
        { data: consents },
        { data: opps },
      ] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("property_intelligence").select("id", { count: "exact", head: true }),
        supabase.from("property_health_scores").select("overall_score,property_id"),
        supabase.from("property_data_consent").select("allow_anonymized_data,allow_partner_outreach,allow_offer_matching,property_id"),
        supabase.from("property_opportunities").select("system,urgency").is("dismissed_at", null),
      ]);

      const latestByProp = new Map<string, number>();
      for (const s of scores ?? []) latestByProp.set(s.property_id, s.overall_score);
      const allScores = [...latestByProp.values()];
      const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;

      const oppCounts: Record<string, number> = {};
      const urgencyCounts: Record<string, number> = { low: 0, medium: 0, high: 0 };
      for (const o of opps ?? []) {
        oppCounts[o.system] = (oppCounts[o.system] ?? 0) + 1;
        urgencyCounts[o.urgency] = (urgencyCounts[o.urgency] ?? 0) + 1;
      }

      setStats({
        totalProperties: totalProperties ?? 0,
        withIntel: withIntel ?? 0,
        withScore: latestByProp.size,
        avgScore,
        consentedAnon: (consents ?? []).filter((c) => c.allow_anonymized_data).length,
        consentedOutreach: (consents ?? []).filter((c) => c.allow_partner_outreach).length,
        consentedOffers: (consents ?? []).filter((c) => c.allow_offer_matching).length,
        oppCounts,
        urgencyCounts,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Revenue intelligence</h1>
        </div>
        <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
          Phase 1 — internal opportunity scoring. Cards marked <InternalBadge /> are de-identified counts across all properties for ops.
          Cards marked <ShareableBadge /> only reflect homes where every active owner opted in (AND-gated).
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : !stats ? null : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Total properties" value={stats.totalProperties} badge={<InternalBadge />} />
              <StatCard label="With intelligence row" value={stats.withIntel} badge={<InternalBadge />} />
              <StatCard label="With health score" value={stats.withScore} badge={<InternalBadge />} />
              <StatCard label="Avg health score" value={stats.avgScore ?? "—"} badge={<InternalBadge />} />
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between"><CardTitle className="text-base">Consent opt-ins (per user × property)</CardTitle><ShareableBadge /></div>
                <CardDescription>Number of consent rows toggled on. Each row is one user's choice for one property.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Mini label="Anonymized data" value={stats.consentedAnon} />
                  <Mini label="Partner outreach" value={stats.consentedOutreach} />
                  <Mini label="Offer matching" value={stats.consentedOffers} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between"><CardTitle className="text-base">Active opportunities by system</CardTitle><InternalBadge /></div>
                <CardDescription>De-identified counts. Surfaces partner demand signals across the base.</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.oppCounts).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No opportunities yet.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Object.entries(stats.oppCounts).sort((a, b) => b[1] - a[1]).map(([sys, n]) => (
                      <Mini key={sys} label={sys.replace("_", " ")} value={n} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between"><CardTitle className="text-base">Opportunities by urgency</CardTitle><InternalBadge /></div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Mini label="High" value={stats.urgencyCounts.high ?? 0} />
                  <Mini label="Medium" value={stats.urgencyCounts.medium ?? 0} />
                  <Mini label="Low" value={stats.urgencyCounts.low ?? 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, badge }: { label: string; value: number | string; badge?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2"><CardDescription className="text-xs">{label}</CardDescription>{badge}</div>
      </CardHeader>
      <CardContent><p className="text-3xl font-bold tabular-nums">{value}</p></CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs capitalize text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
