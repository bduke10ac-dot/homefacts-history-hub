// Phase 4 — wires all Property Trust Platform features into the property dashboard.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Award, Activity, ShieldCheck, Lock, FileCheck, Bot, Globe2, ArrowRight,
} from "lucide-react";

interface Props { propertyId: string }

interface Status { label: string; tone: "ok" | "warn" | "muted" }

const TONE: Record<Status["tone"], string> = {
  ok: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-800",
  muted: "bg-slate-100 text-slate-800",
};

export function PropertyTrustPlatformCards({ propertyId }: Props) {
  const [trust, setTrust] = useState<{ score: number; grade: string } | null>(null);
  const [health, setHealth] = useState<{ overall: number | null; grade: string | null } | null>(null);
  const [warrantyCount, setWarrantyCount] = useState(0);
  const [vaultExists, setVaultExists] = useState(false);

  useEffect(() => {
    (async () => {
      const [ts, hs, wc, ev] = await Promise.all([
        supabase.from("property_trust_scores").select("score,grade").eq("property_id", propertyId).maybeSingle(),
        supabase.from("property_health_scores").select("overall_score,grade").eq("property_id", propertyId)
          .order("computed_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("warranties").select("id", { count: "exact", head: true }).eq("property_id", propertyId).neq("status", "expired"),
        supabase.from("estate_vaults").select("property_id", { head: true, count: "exact" }).eq("property_id", propertyId),
      ]);
      if (ts.data) setTrust({ score: ts.data.score, grade: ts.data.grade });
      if (hs.data) setHealth({ overall: hs.data.overall_score, grade: hs.data.grade });
      setWarrantyCount(wc.count ?? 0);
      setVaultExists((ev.count ?? 0) > 0);
    })();
  }, [propertyId]);

  const trustStatus: Status = trust
    ? { label: `${trust.grade} · ${trust.score}/1000`, tone: trust.score >= 500 ? "ok" : "warn" }
    : { label: "Not computed", tone: "muted" };

  const healthStatus: Status = health?.overall != null
    ? { label: `${health.grade ?? ""} · ${health.overall}/100`.trim(), tone: health.overall >= 75 ? "ok" : health.overall >= 50 ? "warn" : "warn" }
    : { label: "Not computed", tone: "muted" };

  const warrantyStatus: Status = warrantyCount > 0
    ? { label: `${warrantyCount} active`, tone: "ok" } : { label: "None on file", tone: "muted" };

  const vaultStatus: Status = vaultExists
    ? { label: "Set up", tone: "ok" } : { label: "Not set up", tone: "muted" };

  const cards = [
    { icon: Shield,      title: "Property Passport",      desc: "Identity, ownership, and shareable summary.",   to: `/property/${propertyId}/passport`,              status: { label: "View", tone: "muted" as const } },
    { icon: Award,       title: "Trust Score",            desc: "Documentation completeness, 0–1000.",           to: `/property/${propertyId}/passport`,              status: trustStatus },
    { icon: Activity,    title: "Property Health",        desc: "Condition across 10 home systems.",             to: `/property/${propertyId}/health`,                status: healthStatus },
    { icon: ShieldCheck, title: "Warranty Transfer",      desc: "Active warranties + transfer readiness.",       to: `/property/${propertyId}/warranty-transfer`,     status: warrantyStatus },
    { icon: Lock,        title: "Estate Vault",           desc: "Emergency contacts & transfer instructions.",   to: `/property/${propertyId}/estate-vault`,          status: vaultStatus },
    { icon: FileCheck,   title: "Value Protection",       desc: "Checklist of value-preserving actions.",        to: `/property/${propertyId}/protection-checklist`,  status: { label: "Checklist", tone: "muted" as const } },
    { icon: Bot,         title: "AI Property Assistant",  desc: "Ask about this property (preview).",            to: `/property/${propertyId}/ask`,                   status: { label: "Preview", tone: "muted" as const } },
    { icon: Globe2,      title: "Regional Intelligence",  desc: "Storm, hail, flood, hard water, more.",         to: `/property/${propertyId}/regional`,              status: { label: "View", tone: "muted" as const } },
  ];

  return (
    <div className="no-print rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold">Property Trust Platform</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Core identity, health, protection, and continuity for this home.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Badge className={TONE[c.status.tone]}>{c.status.label}</Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-auto justify-between">
                  <Link to={c.to}>Open <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
