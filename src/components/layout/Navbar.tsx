import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Search, Shield, FileText, ShieldCheck, LayoutGrid, Users, Award, Sparkles, ChevronDown, UserCog, Lock, BarChart3, Inbox, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { OrivazLogo } from "@/components/brand/OrivazLogo";

export function Navbar() {
  const { user, signOut, primaryRole, hasRole } = useAuth();
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
        <OrivazLogo size={36} />

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search"><Search className="mr-1.5 h-4 w-4" />Search</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/intelligence"><Sparkles className="mr-1.5 h-4 w-4" />Intelligence</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/builders">Builders</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Platform <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild><Link to="/command-center"><LayoutGrid className="mr-2 h-4 w-4" />Command Center</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/warranty-hub"><ShieldCheck className="mr-2 h-4 w-4" />Warranty Hub</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/network"><Users className="mr-2 h-4 w-4" />Professional Network</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/certification"><Award className="mr-2 h-4 w-4" />Certification</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/estate-planning"><Shield className="mr-2 h-4 w-4" />Estate Planning</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/my-reports"><FileText className="mr-1.5 h-4 w-4" />My reports</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/offers"><Inbox className="mr-1.5 h-4 w-4" />Offers</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to={dashboardPath()}>
                  {primaryRole === "admin" ? <Shield className="mr-1.5 h-4 w-4" /> : <LayoutDashboard className="mr-1.5 h-4 w-4" />}
                  Dashboard
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="Account">
                    <UserCog className="mr-1.5 h-4 w-4" />Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/privacy-controls"><Lock className="mr-2 h-4 w-4" />Privacy & data controls</Link>
                  </DropdownMenuItem>
                  {hasRole("admin") && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard/revenue-intelligence"><BarChart3 className="mr-2 h-4 w-4" />Revenue intelligence</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/partners"><Store className="mr-2 h-4 w-4" />Partners</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {hasRole("partner") && (
                    <DropdownMenuItem asChild>
                      <Link to="/partner"><Store className="mr-2 h-4 w-4" />Partner dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }}>
                    <LogOut className="mr-2 h-4 w-4" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
