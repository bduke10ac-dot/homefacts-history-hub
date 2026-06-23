import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function EstatePlanningHub() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("properties").select("id,address_line,city,state").eq("claimed_by", user.id);
      setProperties(data ?? []);
    })();
  }, [user]);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7 text-primary" />Estate &amp; Legacy Planning</h1>
          <p className="mt-2 text-muted-foreground">
            Protect every home you own with documents, trusted contacts, incapacity plans, probate guides,
            and annual reviews — all in one secure place.
          </p>
        </div>
        {!user ? (
          <Card><CardContent className="py-10 text-center">
            <p className="mb-3 text-muted-foreground">Sign in to access estate planning for your properties.</p>
            <Button asChild><Link to="/auth">Sign in</Link></Button>
          </CardContent></Card>
        ) : properties.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            No claimed properties yet. Claim a property to start your estate plan.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {properties.map((p) => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{p.address_line}</CardTitle>
                    <p className="text-xs text-muted-foreground">{p.city}, {p.state}</p>
                  </div>
                  <Button asChild><Link to={`/property/${p.id}/estate`}>Open <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Orivaz provides educational information only and does not provide legal, tax, or financial advice.
          Please consult a licensed professional.
        </p>
      </div>
    </div>
  );
}
