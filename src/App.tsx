import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PropertySearch from "./pages/PropertySearch";
import PropertyView from "./pages/PropertyView";
import HomeownerDashboard from "./pages/HomeownerDashboard";
import ContractorDashboard from "./pages/ContractorDashboard";
import RealtorDashboard from "./pages/RealtorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const DashboardRouter = () => {
  const { primaryRole, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  switch (primaryRole) {
    case "admin": return <Navigate to="/admin" replace />;
    case "realtor": return <Navigate to="/realtor" replace />;
    case "contractor": return <Navigate to="/contractor" replace />;
    default: return <HomeownerDashboard />;
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<PropertySearch />} />
            <Route path="/property/:id" element={<PropertyView />} />
            <Route path="/r/:token" element={<PropertyView shared />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
            <Route path="/contractor" element={<ProtectedRoute requireRole="contractor"><ContractorDashboard /></ProtectedRoute>} />
            <Route path="/realtor" element={<ProtectedRoute requireRole="realtor"><RealtorDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
