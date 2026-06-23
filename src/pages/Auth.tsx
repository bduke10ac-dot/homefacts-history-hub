import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Home, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [params] = useSearchParams();
  const initial = params.get("mode") === "signup" ? "signup" : "signin";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState(initial);
  const [loading, setLoading] = useState(false);

  // signin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sRole, setSRole] = useState<AppRole>("homeowner");

  useEffect(() => { if (user) navigate("/dashboard"); }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Welcome back"); navigate("/dashboard"); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: sEmail, password: sPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: sName, role: sRole },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created — you're in!"); navigate("/dashboard"); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-glow">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>Orivaz Property Report</span>
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-elevated">
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
                <div className="space-y-2"><Label htmlFor="sp">Password</Label><Input id="sp" type="password" required minLength={6} value={sPassword} onChange={(e) => setSPassword(e.target.value)} /></div>
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
