// Phase 2 — Ownership Timeline. Merges ownership_history (transfers) with
// property_timeline_events (handoffs, repairs, remodels, warranties, inspections, claims).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Home, Wrench, FileText, ShieldCheck, ClipboardCheck, AlertTriangle } from "lucide-react";

interface TimelineItem {
  id: string;
  source: "ownership" | "event";
  event_type: string;
  title: string;
  description: string | null;
  occurred_at: string;
}

const TYPE_META: Record<string, { icon: any; label: string }> = {
  transfer: { icon: Home, label: "Ownership transfer" },
  handoff: { icon: Home, label: "Builder handoff" },
  repair: { icon: Wrench, label: "Repair" },
  remodel: { icon: Wrench, label: "Remodel" },
  contractor_work: { icon: Wrench, label: "Contractor work" },
  warranty: { icon: ShieldCheck, label: "Warranty" },
  inspection: { icon: ClipboardCheck, label: "Inspection" },
  claim: { icon: AlertTriangle, label: "Insurance claim" },
};

export function OwnershipTimeline({ propertyId }: { propertyId: string }) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: oh }, { data: ev }] = await Promise.all([
        supabase
          .from("ownership_history")
          .select("id,owner_name,transfer_date,document_type,sale_price")
          .eq("property_id", propertyId),
        supabase
          .from("property_timeline_events")
          .select("id,event_type,title,description,event_date")
          .eq("property_id", propertyId),
      ]);

      const merged: TimelineItem[] = [
        ...(oh ?? []).map((r: any) => ({
          id: `oh-${r.id}`,
          source: "ownership" as const,
          event_type: "transfer",
          title: r.owner_name ? `Transferred to ${r.owner_name}` : "Ownership transfer",
          description: [r.document_type, r.sale_price ? `$${Number(r.sale_price).toLocaleString()}` : null].filter(Boolean).join(" · "),
          occurred_at: r.transfer_date ?? new Date(0).toISOString(),
        })),
        ...(ev ?? []).map((r: any) => ({
          id: `ev-${r.id}`,
          source: "event" as const,
          event_type: r.event_type,
          title: r.title,
          description: r.description,
          occurred_at: r.event_date,
        })),
      ].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

      setItems(merged);
      setLoading(false);
    })();
  }, [propertyId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Ownership Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading timeline…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm font-medium">Start building this property's permanent history.</p>
            <p className="mt-1 text-xs text-muted-foreground">Add transfers, repairs, remodels, warranties, inspections, and claims.</p>
          </div>
        ) : (
          <ol className="relative space-y-4 border-l pl-6">
            {items.map((it) => {
              const meta = TYPE_META[it.event_type] ?? { icon: FileText, label: it.event_type };
              const Icon = meta.icon;
              return (
                <li key={it.id} className="relative">
                  <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{it.title}</p>
                      {it.description && <p className="text-xs text-muted-foreground">{it.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(it.occurred_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
