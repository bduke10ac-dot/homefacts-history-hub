import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Home, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type State =
  | { kind: "loading" }
  | { kind: "need-auth" }
  | { kind: "ready"; invitee: string }
  | { kind: "claiming" }
  | { kind: "success"; propertyId: string; address: string }
  | { kind: "error"; message: string };

export default function ClaimProperty() {
  const { token = "" } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (loading) return;
    if (!user) { setState({ kind: "need-auth" }); return; }
    (async () => {
      const { data, error } = await (supabase as any)
        .from("property_invites")
        .select("invitee_email,status,expires_at")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) { setState({ kind: "error", message: "Invite not found." }); return; }
      if (data.status !== "pending") { setState({ kind: "error", message: `This invite has already been ${data.status}.` }); return; }
      if (new Date(data.expires_at) < new Date()) { setState({ kind: "error", message: "This invite has expired." }); return; }
      const myEmail = (user.email ?? "").toLowerCase();
      if ((data.invitee_email ?? "").toLowerCase() !== myEmail) {
        setState({ kind: "error", message: `This invite was sent to ${data.invitee_email}. Please sign in with that email.` });
        return;
      }
      setState({ kind: "ready", invitee: data.invitee_email });
    })();
  }, [loading, user, token]);

  const accept = async () => {
    setState({ kind: "claiming" });
    const { data, error } = await (supabase as any).rpc("claim_property_invite", { _token: token });
    if (error) { setState({ kind: "error", message: error.message }); return; }
    const row = Array.isArray(data) ? data[0] : data;
    setState({ kind: "success", propertyId: row.property_id, address: row.address_line });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-lg py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Home className="h-6 w-6" /></div>
            <CardTitle>Claim your property</CardTitle>
            <CardDescription>Your builder has invited you to take ownership of a property on Orivaz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.kind === "loading" && <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying invite…</div>}

            {state.kind === "need-auth" && (
              <>
                <Alert><AlertDescription>You need to be signed in with the email this invite was sent to.</AlertDescription></Alert>
                <Button className="w-full" onClick={() => navigate(`/auth?redirect=${encodeURIComponent(`/claim/${token}`)}`)}>Sign in to continue</Button>
              </>
            )}

            {state.kind === "ready" && (
              <>
                <p className="text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{state.invitee}</span>. Accepting will transfer the full property record — documents, warranties, timeline, and maintenance reminders — to your account.</p>
                <Button className="w-full" onClick={accept}>Accept and claim property</Button>
              </>
            )}

            {state.kind === "claiming" && <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Transferring ownership…</div>}

            {state.kind === "success" && (
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>
                <p className="text-sm">You now own <span className="font-medium">{state.address}</span>.</p>
                <Button asChild className="w-full"><Link to={`/property/${state.propertyId}`}>Open my property</Link></Button>
              </div>
            )}

            {state.kind === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
