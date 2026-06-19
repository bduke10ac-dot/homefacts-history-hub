import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Search, Share2, Copy } from "lucide-react";
import { ReportsMenu } from "@/components/reports/ReportsMenu";
import { toast } from "sonner";
import { format } from "date-fns";

const RealtorDashboard = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("share_links")
      .select("id,token,created_at,property_id,properties(address_line,city,state,zip)")
      .eq("created_by", user.id).order("created_at", { ascending: false });
    setLinks(data ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/r/${token}`;
    navigator.clipboard.writeText(url); toast.success("Link copied");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Realtor dashboard</p>
            <h1 className="mt-1 text-3xl font-bold">Shared reports</h1>
          </div>
          <Button asChild><Link to="/search"><Search className="mr-2 h-4 w-4" />Find a property to share</Link></Button>
        </div>

        <div className="mt-8 rounded-xl border bg-card shadow-card">
          {links.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Share2 className="mx-auto h-8 w-8" />
              <p className="mt-3">No shared reports yet. Open a property and click <strong>Share</strong> to generate a link.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {links.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <Link to={`/property/${l.property_id}`} className="font-semibold hover:text-primary">{l.properties?.address_line}</Link>
                    <p className="text-sm text-muted-foreground">{l.properties?.city}, {l.properties?.state} {l.properties?.zip}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Shared {format(new Date(l.created_at), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyLink(l.token)}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
                    <Button size="sm" variant="outline" asChild><Link to={`/r/${l.token}`} target="_blank">Preview</Link></Button>
                    <ReportsMenu propertyId={l.property_id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtorDashboard;
