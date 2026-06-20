import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { scoreColor } from "@/lib/outlook";

export default function MyReports() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("address_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <h1 className="text-2xl font-bold md:text-3xl">My reports</h1>
        <p className="mt-1 text-muted-foreground">Every address you've researched, in one place.</p>

        {loading ? (
          <div className="mt-8 text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-2xl border bg-card p-10 text-center shadow-card">
            <p className="text-muted-foreground">No reports yet.</p>
            <Button asChild className="mt-4"><Link to="/">Run your first report</Link></Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {rows.map((r) => {
              const c = scoreColor(r.living_outlook_score);
              return (
                <Link key={r.id} to={`/report/${r.id}`} className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-elevated">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${c.bg} text-sm font-bold text-primary-foreground`}>
                      {r.living_outlook_score ?? "—"}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.formatted_address ?? r.address}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{format(new Date(r.created_at), "MMM d, yyyy")} · {r.status}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
