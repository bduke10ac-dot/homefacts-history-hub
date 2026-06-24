import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  return (
    <>
      <Helmet>
        <title>Forgot password — Orivaz</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-glow">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span>Orivaz</span>
          </Link>

          <div className="rounded-xl border bg-card p-6 shadow-elevated">
            {sent ? (
              <div className="flex items-start gap-3 text-sm">
                <MailCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Check your inbox</p>
                  <p className="mt-1 text-muted-foreground">
                    If an account exists for {email}, we sent a password reset link. The link expires shortly — use it soon.
                  </p>
                  <Link to="/auth" className="mt-3 inline-block text-sm underline underline-offset-2">Back to sign in</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <h1 className="text-lg font-semibold">Reset your password</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter the email you signed up with and we'll send a reset link.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send reset link
                </Button>
                <p className="text-center text-sm">
                  <Link to="/auth" className="text-muted-foreground hover:text-foreground">Back to sign in</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
