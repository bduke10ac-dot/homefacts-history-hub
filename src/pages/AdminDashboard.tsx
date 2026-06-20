import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [verified, setVerified] = useState<any[]>([]);

  const load = useCallback(async () => {
    const base = supabase.from("property_records").select("id,title,category,verified,performed_at,created_at,property_id,properties(address_line,city,state)");
    const [{ data: p }, { data: v }] = await Promise.all([
      base.eq("verified", false).order("created_at", { ascending: false }).limit(50),
      supabase.from("property_records").select("id,title,category,verified,performed_at,created_at,property_id,properties(address_line,city,state)").eq("verified", true).order("verified_at", { ascending: false }).limit(20),
    ]);
    setPending(p ?? []); setVerified(v ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setVerify = async (id: string, val: boolean) => {
    if (!user) return;
    const { error } = await supabase.from("property_records").update({
      verified: val, verified_by: val ? user.id : null, verified_at: val ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(val ? "Verified" : "Unverified"); load(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Admin dashboard</p>
            <h1 className="mt-1 text-3xl font-bold">Verification queue</h1>
          </div>
          <Link to="/admin/fraud"><Button variant="outline" size="sm"><ShieldCheck className="mr-2 h-4 w-4" />Fraud review queue</Button></Link>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Pending ({pending.length})</h2>
          <div className="rounded-xl border bg-card shadow-card">
            {pending.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">All caught up 🎉</div>
            ) : (
              <ul className="divide-y">
                {pending.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <Link to={`/property/${r.property_id}`} className="font-semibold hover:text-primary">{r.title}</Link>
                      <p className="text-sm text-muted-foreground">{r.properties?.address_line}, {r.properties?.city}, {r.properties?.state}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="capitalize">{r.category}</Badge>
                        Submitted {format(new Date(r.created_at), "MMM d")}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setVerify(r.id, true)}><ShieldCheck className="mr-2 h-4 w-4" />Verify</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Recently verified</h2>
          <div className="rounded-xl border bg-card shadow-card">
            {verified.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No verified records yet.</div>
            ) : (
              <ul className="divide-y">
                {verified.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 p-5">
                    <div>
                      <Link to={`/property/${r.property_id}`} className="font-semibold hover:text-primary">{r.title}</Link>
                      <p className="text-sm text-muted-foreground">{r.properties?.address_line}, {r.properties?.city}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setVerify(r.id, false)}><X className="mr-2 h-4 w-4" />Unverify</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
