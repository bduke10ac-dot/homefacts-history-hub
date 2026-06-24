import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function PartnerClaimInvite() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?next=/partners/claim/${token}`);
    }
  }, [authLoading, user, token, navigate]);

  const claim = async () => {
    if (!token) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("accept_partner_invite", { _token: token, _company_name: company });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Application submitted — awaiting admin approval");
    navigate("/partner");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-lg py-16">
        <Card>
          <CardHeader>
            <CardTitle>Accept partner invite</CardTitle>
            <CardDescription>
              You've been invited to join Orivaz as a service partner. After accepting, an admin will review and approve your account.
              Make sure you're signed in with the email that received the invite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company name</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" />
            </div>
            <div className="text-xs text-muted-foreground">
              Signed in as <b>{user?.email ?? "…"}</b>. Wrong email? <Link className="text-primary hover:underline" to="/auth">Sign in differently</Link>.
            </div>
            <Button onClick={claim} disabled={!user || submitting} className="w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Accept invite
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
