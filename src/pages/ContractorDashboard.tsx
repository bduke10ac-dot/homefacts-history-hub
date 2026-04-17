import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hammer, Search } from "lucide-react";
import { format } from "date-fns";

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("property_records")
        .select("id,title,category,verified,performed_at,created_at,property_id,properties(address_line,city,state)")
        .eq("submitted_by", user.id).order("created_at", { ascending: false });
      setSubmitted(data ?? []);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Contractor portal</p>
            <h1 className="mt-1 text-3xl font-bold">Submitted work</h1>
          </div>
          <Button asChild><Link to="/search"><Search className="mr-2 h-4 w-4" />Find property to submit</Link></Button>
        </div>

        <div className="mt-8 rounded-xl border bg-card shadow-card">
          {submitted.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Hammer className="mx-auto h-8 w-8" />
              <p className="mt-3">No submissions yet. Search for a property and submit completed work.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {submitted.map((r) => (
                <li key={r.id}>
                  <Link to={`/property/${r.property_id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-muted/50">
                    <div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-sm text-muted-foreground">{r.properties?.address_line}, {r.properties?.city}, {r.properties?.state}</p>
                      <p className="mt-1 text-xs text-muted-foreground capitalize">{r.category} · {r.performed_at ? format(new Date(r.performed_at), "MMM d, yyyy") : "no date"}</p>
                    </div>
                    {r.verified
                      ? <Badge className="bg-accent text-accent-foreground hover:bg-accent">Verified</Badge>
                      : <Badge variant="outline">Pending</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorDashboard;
