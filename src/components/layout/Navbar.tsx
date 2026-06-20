import { Link, useNavigate } from "react-router-dom";
import { Home, LogOut, LayoutDashboard, Search, Shield, FileText } from "lucide-react";
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
      default: return "/dashboard";
    }
  };

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-glow">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg tracking-tight">HomeFacts</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">Report</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search"><Search className="mr-1.5 h-4 w-4" />Search</Link>
          </Button>
          {user ? (
            <>
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
