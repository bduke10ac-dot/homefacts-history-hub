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
import RealtorSuccessCenter from "./pages/RealtorSuccessCenter";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFraudReview from "./pages/AdminFraudReview";
import DemoReport from "./pages/DemoReport";
import PropertyReport from "./pages/PropertyReport";
import PropertyHomeHistory from "./pages/PropertyHomeHistory";
import AddressReport from "./pages/AddressReport";
import MyReports from "./pages/MyReports";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import CheckoutReturn from "./pages/CheckoutReturn";
import PropertyVault from "./pages/PropertyVault";
import PropertyProjects from "./pages/PropertyProjects";
import BuilderDashboard from "./pages/BuilderDashboard";
import BuilderTemplates from "./pages/BuilderTemplates";
import BuilderTemplateDetail from "./pages/BuilderTemplateDetail";
import BuilderClones from "./pages/BuilderClones";
import BuilderCloneDetail from "./pages/BuilderCloneDetail";
import BeginnerGuide from "./pages/BeginnerGuide";
import BuilderProfile from "./pages/BuilderProfile";
import BuilderMarketing from "./pages/BuilderMarketing";
import PropertyBoundary from "./pages/PropertyBoundary";
import HomeEngagement from "./pages/HomeEngagement";
import WhyHomeFacts from "./pages/WhyHomeFacts";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const queryClient = new QueryClient();

const DashboardRouter = () => {
  const { primaryRole, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  switch (primaryRole) {
    case "admin": return <Navigate to="/admin" replace />;
    case "realtor": return <Navigate to="/realtor" replace />;
    case "contractor": return <Navigate to="/contractor" replace />;
    case "builder": return <Navigate to="/builder" replace />;
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
          <PaymentTestModeBanner />
          <Routes>
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/" element={<Index />} />
            <Route path="/why" element={<WhyHomeFacts />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<PropertySearch />} />
            <Route path="/demo" element={<DemoReport />} />
            <Route path="/property/:id" element={<PropertyView />} />
            <Route path="/property/:id/vault" element={<ProtectedRoute><PropertyVault /></ProtectedRoute>} />
            <Route path="/property/:id/projects" element={<ProtectedRoute><PropertyProjects /></ProtectedRoute>} />
            <Route path="/property/:id/boundary" element={<PropertyBoundary />} />
            <Route path="/property/:id/engagement" element={<HomeEngagement />} />
            <Route path="/properties/:id/home-history" element={<PropertyHomeHistory />} />
            <Route path="/property/:id/report/:type" element={<ProtectedRoute><PropertyReport /></ProtectedRoute>} />
            <Route path="/report/:id" element={<AddressReport />} />
            <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
            <Route path="/r/:token" element={<PropertyView shared />} />
            <Route path="/home/:token" element={<BeginnerGuide />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
            <Route path="/contractor" element={<ProtectedRoute requireRole="contractor"><ContractorDashboard /></ProtectedRoute>} />
            <Route path="/realtor" element={<ProtectedRoute requireRole="realtor"><RealtorSuccessCenter /></ProtectedRoute>} />
            <Route path="/builders/:slug" element={<BuilderProfile />} />
            <Route path="/builder" element={<ProtectedRoute requireRole="builder"><BuilderDashboard /></ProtectedRoute>} />
            <Route path="/builder/marketing" element={<ProtectedRoute requireRole="builder"><BuilderMarketing /></ProtectedRoute>} />
            <Route path="/builder/templates" element={<ProtectedRoute requireRole="builder"><BuilderTemplates /></ProtectedRoute>} />
            <Route path="/builder/templates/:id" element={<ProtectedRoute requireRole="builder"><BuilderTemplateDetail /></ProtectedRoute>} />
            <Route path="/builder/clones" element={<ProtectedRoute requireRole="builder"><BuilderClones /></ProtectedRoute>} />
            <Route path="/builder/clones/:id" element={<ProtectedRoute requireRole="builder"><BuilderCloneDetail /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/fraud" element={<ProtectedRoute requireRole="admin"><AdminFraudReview /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
