import { Link, useNavigate } from "react-router-dom";
import { Home, LogOut, LayoutDashboard, Search, Shield, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, signOut, primaryRole } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = () => {
    switch (primaryRole) {
      case "admin": return "/admin";
      case "realtor": return "/realtor";
      case "contractor": return "/contractor";
      case "builder": return "/builder";
      default: return "/dashboard";
    }
  };

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center gap-3 font-semibold">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-gradient-hero opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-100 logo-pulse" />
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-hero shadow-glow ring-1 ring-primary/30 transition-transform duration-700 group-hover:rotate-[360deg]">
              <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_30%,hsl(0_0%_100%/0.55)_50%,transparent_70%)] group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative text-sm font-black tracking-tighter text-primary-foreground">O</span>
            </div>
          </div>
          <span className="logo-word text-lg font-black tracking-[0.18em]">
            {"ORIVAZ".split("").map((c, i) => (
              <span key={i} className="inline-block logo-letter" style={{ animationDelay: `${i * 0.12}s` }}>{c}</span>
            ))}
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search"><Search className="mr-1.5 h-4 w-4" />Search</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/builders">Builders</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/warranty-hub"><ShieldCheck className="mr-1.5 h-4 w-4" />Warranty Hub</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/estate-planning"><Shield className="mr-1.5 h-4 w-4" />Estate Planning</Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/my-reports"><FileText className="mr-1.5 h-4 w-4" />My reports</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to={dashboardPath()}>
                  {primaryRole === "admin" ? <Shield className="mr-1.5 h-4 w-4" /> : <LayoutDashboard className="mr-1.5 h-4 w-4" />}
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
                <LogOut className="mr-1.5 h-4 w-4" />Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign in</Link></Button>
              <Button size="sm" asChild><Link to="/auth?mode=signup">Get started</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
