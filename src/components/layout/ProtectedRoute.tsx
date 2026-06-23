import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, AppRole } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  requireRole?: AppRole;
  requireVerifiedEmail?: boolean;
}

export function ProtectedRoute({ children, requireRole, requireVerifiedEmail = true }: Props) {
  const { user, loading, hasRole, emailVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  if (requireVerifiedEmail && !emailVerified) {
    return <Navigate to="/auth?verify=1" state={{ from: location }} replace />;
  }
  if (requireRole && !hasRole(requireRole) && !hasRole("admin")) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
