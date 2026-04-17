import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, AppRole } from "@/hooks/useAuth";

export function ProtectedRoute({ children, requireRole }: { children: ReactNode; requireRole?: AppRole }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireRole && !hasRole(requireRole)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
