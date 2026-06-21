import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ShieldCheck, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface Warranty {
  id: string;
  warranty_type: string;
  title: string;
  coverage_description: string | null;
  start_date: string | null;
  expiration_date: string | null;
  issuer: string | null;
  claim_instructions: string | null;
  status?: string;
}

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  active: { label: "Active", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: ShieldCheck },
  expiring_soon: { label: "Expiring soon", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: AlertTriangle },
  expired: { label: "Expired", cls: "bg-red-500/15 text-red-700 dark:text-red-300", icon: XCircle },
  unknown: { label: "Unknown", cls: "bg-muted text-muted-foreground", icon: HelpCircle },
};

export function WarrantyCenter({ cloneId }: { cloneId: string }) {
  const [items, setItems] = useState<Warranty[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("v_nb_clone_warranty_status" as any)
        .select("*")
        .eq("clone_id", cloneId)
        .order("warranty_type");
      setItems((data ?? []) as any);
    })();
  }, [cloneId]);

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No warranties recorded yet.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((w) => {
        const meta = STATUS_META[w.status ?? "unknown"] ?? STATUS_META.unknown;
        const Icon = meta.icon;
        return (
          <Card key={w.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{w.title}</CardTitle>
                <Badge variant="outline" className={meta.cls}>
                  <Icon className="mr-1 h-3 w-3" />
                  {meta.label}
                </Badge>
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {w.warranty_type.replace(/_/g, " ")}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {w.coverage_description && <p className="text-muted-foreground">{w.coverage_description}</p>}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Starts</p>
                  <p className="font-medium">{w.start_date ? format(new Date(w.start_date), "MMM d, yyyy") : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-medium">{w.expiration_date ? format(new Date(w.expiration_date), "MMM d, yyyy") : "—"}</p>
                </div>
              </div>
              {w.issuer && <p className="text-xs"><span className="text-muted-foreground">Issued by:</span> {w.issuer}</p>}
              {w.claim_instructions && (
                <div className="rounded-md bg-muted p-2 text-xs">
                  <p className="font-semibold">How to file a claim</p>
                  <p className="text-muted-foreground">{w.claim_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
