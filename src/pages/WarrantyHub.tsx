import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ChevronRight, Home as HomeIcon } from "lucide-react";

type Prop = { id: string; address_line: string | null; city: string | null; state: string | null };

export default function WarrantyHub() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Prop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, address_line, city, state")
        .or(`claimed_by.eq.${user.id},created_by.eq.${user.id}`)
        .order("created_at", { ascending: false });
      setProperties((data ?? []) as unknown as Prop[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-5xl py-10">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero shadow-glow">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warranty Hub</h1>
            <p className="mt-1 text-muted-foreground">
              One-stop shop for every warranty on every home you own. Track, register, transfer, and claim — all in one place.
            </p>
          </div>
        </div>

        {!user ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mb-4 text-muted-foreground">Sign in to manage warranties for your homes.</p>
              <Button asChild><Link to="/auth">Sign in</Link></Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <p className="text-muted-foreground">Loading your homes…</p>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mb-4 text-muted-foreground">You don't have any homes linked yet.</p>
              <Button asChild><Link to="/search">Find your home</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            <h2 className="text-lg font-semibold">Choose a home</h2>
            {properties.map((p) => (
              <Link key={p.id} to={`/property/${p.id}/warranties`}>
                <Card className="transition hover:border-primary hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <HomeIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{p.address_line ?? "Untitled property"}</p>
                        <p className="text-sm text-muted-foreground">
                          {[p.city, p.state].filter(Boolean).join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
