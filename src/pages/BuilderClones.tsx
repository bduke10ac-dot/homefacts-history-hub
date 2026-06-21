import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_CLS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  under_construction: "bg-blue-500/15 text-blue-700",
  ready_for_handoff: "bg-amber-500/15 text-amber-700",
  handed_off: "bg-emerald-500/15 text-emerald-700",
  transferred: "bg-purple-500/15 text-purple-700",
};

export default function BuilderClones() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: m } = await supabase.from("builder_company_members").select("company_id").eq("user_id", user.id);
      const ids = (m ?? []).map((x) => x.company_id);
      if (!ids.length) return setRows([]);
      const { data } = await supabase
        .from("nb_property_clones")
        .select("*, nb_templates(name, subdivision)")
        .in("company_id", ids)
        .order("created_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-6 text-2xl font-bold">Homes</h1>
        <div className="space-y-2">
          {rows.map((r) => (
            <Link key={r.id} to={`/builder/clones/${r.id}`}>
              <Card className="transition hover:border-primary">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">
                      {r.address_line ?? `Lot ${r.lot_number ?? "?"}`}
                      {r.city ? `, ${r.city}, ${r.state}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.nb_templates?.name} · {r.nb_templates?.subdivision ?? "—"} · CO {r.co_date ?? "—"}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_CLS[r.status] ?? ""}>{r.status.replace(/_/g, " ")}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
          {!rows.length && <p className="text-sm text-muted-foreground">No homes yet. Clone from a template to create some.</p>}
        </div>
      </div>
    </div>
  );
}
