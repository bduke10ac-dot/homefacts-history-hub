import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Inbox, Loader2 } from "lucide-react";

interface Property { id: string; address_line: string; zip: string; }
interface Offer { id: string; title: string; body: string; cta_text: string; estimated_value: string | null; category: string; zip: string; system: string | null; expires_at: string; }
interface Response { offer_id: string; property_id: string; response: string; }

export default function HomeownerOffers() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    // Properties the user has offer_matching enabled on.
    const { data: consents } = await supabase.from("property_data_consent").select("property_id").eq("user_id", user.id).eq("allow_offer_matching", true);
    const ids = (consents ?? []).map((c) => c.property_id);
    if (ids.length === 0) { setProperties([]); setOffers([]); setLoading(false); return; }
    const [{ data: props }, { data: o }, { data: r }] = await Promise.all([
      supabase.from("properties").select("id,address_line,zip").in("id", ids),
      supabase.from("vendor_offers").select("*").eq("status", "active").gt("expires_at", new Date().toISOString()),
      supabase.from("vendor_offer_responses").select("offer_id,property_id,response").eq("homeowner_user_id", user.id),
    ]);
    setProperties((props ?? []) as Property[]);
    setOffers((o ?? []) as Offer[]);
    setResponses((r ?? []) as Response[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const respond = async (offerId: string, propertyId: string, accepted: boolean) => {
    setPending(offerId + propertyId);
    const { error } = await supabase.rpc("respond_to_vendor_offer", {
      _offer_id: offerId, _property_id: propertyId, _accepted: accepted,
    });
    setPending(null);
    if (error) { toast.error(error.message); return; }
    toast.success(accepted ? "Accepted — partner has been notified" : "Declined");
    load();
  };

  // Pair each offer with each matching property + existing response.
  const cards = offers.flatMap((o) =>
    properties.filter((p) => p.zip === o.zip).map((p) => ({
      offer: o,
      property: p,
      response: responses.find((r) => r.offer_id === o.id && r.property_id === p.id) ?? null,
    }))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-10">
        <div className="mb-6 flex items-center gap-2"><Inbox className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Offers for you</h1></div>
        <p className="mb-8 text-sm text-muted-foreground">
          Only shown when you've enabled offer matching on a property. Manage in <Link to="/privacy-controls" className="text-primary hover:underline">Privacy controls</Link>.
        </p>

        {loading ? <div className="text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</div> :
         cards.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No offers yet. Enable offer matching on a property in Privacy controls to start receiving offers.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {cards.map(({ offer, property, response }) => (
              <Card key={offer.id + property.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{offer.title}</CardTitle>
                      <CardDescription className="capitalize">{offer.category}{offer.system ? ` · ${offer.system.replace("_"," ")}` : ""} · {property.address_line}</CardDescription>
                    </div>
                    {offer.estimated_value && <Badge>{offer.estimated_value}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{offer.body}</p>
                  <p className="text-xs text-muted-foreground">Expires {new Date(offer.expires_at).toLocaleDateString()}</p>
                  {response ? (
                    <Badge variant={response.response === "accepted" ? "default" : "secondary"} className="capitalize">{response.response}</Badge>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={pending === offer.id + property.id} onClick={() => respond(offer.id, property.id, true)}>
                        {offer.cta_text}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={pending === offer.id + property.id} onClick={() => respond(offer.id, property.id, false)}>
                        Not interested
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
