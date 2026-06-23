import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Home, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [params] = useSearchParams();
  const initial = params.get("mode") === "signup" ? "signup" : "signin";
  const verifyNotice = params.get("verify") === "1";
  const navigate = useNavigate();
  const { user, emailVerified } = useAuth();
  const [tab, setTab] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sRole, setSRole] = useState<AppRole>("homeowner");
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => { if (user && emailVerified) navigate("/dashboard"); }, [user, emailVerified, navigate]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message ?? "Google sign-in failed"); setGoogleLoading(false); return; }
    if (result.redirected) return;
    navigate("/dashboard");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (!data.user?.email_confirmed_at) {
      toast.warning("Please verify your email before continuing.");
      return;
    }
    toast.success("Welcome back"); navigate("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: sEmail, password: sPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: sName, role: sRole },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data.user && !data.user.email_confirmed_at) {
      setSentTo(sEmail);
      toast.success("Check your inbox to verify your email.");
      return;
    }
    toast.success("Account created"); navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-glow">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>Orivaz</span>
        </Link>

        {(verifyNotice || sentTo) && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <MailCheck className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">Verify your email to continue</p>
              <p className="text-muted-foreground">
                {sentTo ? `We sent a confirmation link to ${sentTo}.` : "Please click the link we sent to your email."}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card p-6 shadow-elevated">
          <Button type="button" variant="outline" className="mb-4 w-full" disabled={googleLoading} onClick={handleGoogle}>
            {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            )}
            Continue with Google
          </Button>
          <div className="relative mb-4 text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-card px-2">or use email</span>
            <div className="absolute inset-x-0 top-1/2 -z-0 border-t" />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="p">Password</Label><Input id="p" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="n">Full name</Label><Input id="n" required value={sName} onChange={(e) => setSName(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="se">Email</Label><Input id="se" type="email" required value={sEmail} onChange={(e) => setSEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="sp">Password</Label><Input id="sp" type="password" required minLength={8} value={sPassword} onChange={(e) => setSPassword(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>I am a…</Label>
                  <RadioGroup value={sRole} onValueChange={(v) => setSRole(v as AppRole)} className="grid grid-cols-3 gap-2">
                    {(["homeowner","realtor","contractor"] as AppRole[]).map((r) => (
                      <Label key={r} htmlFor={`r-${r}`} className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background p-3 capitalize hover:bg-accent/5 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                        <RadioGroupItem id={`r-${r}`} value={r} />{r}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">By continuing you agree to our terms and privacy policy.</p>
      </div>
    </div>
  );
};

export default Auth;
