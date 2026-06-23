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
import BuilderImportWizard from "./pages/BuilderImportWizard";
import BuilderPortal from "./pages/BuilderPortal";
import BuilderPropertyEditor from "./pages/BuilderPropertyEditor";
import BuilderMarketing from "./pages/BuilderMarketing";
import PropertyBoundary from "./pages/PropertyBoundary";
import HomeEngagement from "./pages/HomeEngagement";
import WhyOrivaz from "./pages/WhyOrivaz";
import MaintenanceCenter from "./pages/MaintenanceCenter";
import VacationMode from "./pages/VacationMode";
import HomeConfidenceScore from "./pages/HomeConfidenceScore";
import HomeHealth from "./pages/HomeHealth";
import PropertyTimeline from "./pages/PropertyTimeline";
import AskPropertyAI from "./pages/AskPropertyAI";
import ReportExports from "./pages/ReportExports";
import ContractorScores from "./pages/ContractorScores";
import InsuranceReview from "./pages/InsuranceReview";
import DeferredMaintenance from "./pages/DeferredMaintenance";
import DigitalTwin from "./pages/DigitalTwin";
import GovernmentPortal from "./pages/GovernmentPortal";
import NeighborhoodIntelligence from "./pages/NeighborhoodIntelligence";
import Marketplace from "./pages/Marketplace";
import InvestorDashboard from "./pages/InvestorDashboard";
import EmergencyMode from "./pages/EmergencyMode";
import DisasterVault from "./pages/DisasterVault";
import EstatePlanning from "./pages/EstatePlanning";
import NegotiationAssistant from "./pages/NegotiationAssistant";
import OwnershipPassport from "./pages/OwnershipPassport";
import PropertyRiskScore from "./pages/PropertyRiskScore";
import HazardMap from "./pages/HazardMap";
import CrimeTimeline from "./pages/CrimeTimeline";
import WeatherTimeline from "./pages/WeatherTimeline";
import InsuranceReadinessScore from "./pages/InsuranceReadinessScore";
import HomeValueProtection from "./pages/HomeValueProtection";
import FutureCostForecast from "./pages/FutureCostForecast";
import MaintenanceReminders from "./pages/MaintenanceReminders";
import RegionalEducation from "./pages/RegionalEducation";
import BuyerDecisionReport from "./pages/BuyerDecisionReport";
import Certification from "./pages/Certification";
import PropertyIntelMap from "./pages/PropertyIntelMap";
import ImprovementROI from "./pages/ImprovementROI";
import AnnualReport from "./pages/AnnualReport";
import BuilderProgram from "./pages/BuilderProgram";
import AdminBuilders from "./pages/AdminBuilders";
import ConstructionTimeline from "./pages/ConstructionTimeline";
import HomeownerHandoff from "./pages/HomeownerHandoff";
import BuilderReferrals from "./pages/BuilderReferrals";
import BuilderAnalytics from "./pages/BuilderAnalytics";
import BuilderCommunity from "./pages/BuilderCommunity";
import WarrantyHub from "./pages/WarrantyHub";
import PropertyWarranties from "./pages/PropertyWarranties";
import WarrantyPassport from "./pages/WarrantyPassport";
import EstatePlanningHub from "./pages/EstatePlanningHub";
import PropertyCommandCenter from "./pages/PropertyCommandCenter";
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
            <Route path="/why" element={<WhyOrivaz />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<PropertySearch />} />
            <Route path="/demo" element={<DemoReport />} />
            <Route path="/property/:id" element={<PropertyView />} />
            <Route path="/property/:id/vault" element={<ProtectedRoute><PropertyVault /></ProtectedRoute>} />
            <Route path="/property/:id/projects" element={<ProtectedRoute><PropertyProjects /></ProtectedRoute>} />
            <Route path="/property/:id/boundary" element={<PropertyBoundary />} />
            <Route path="/property/:id/engagement" element={<HomeEngagement />} />
            <Route path="/property/:id/maintenance" element={<MaintenanceCenter />} />
            <Route path="/property/:id/vacation" element={<VacationMode />} />
            <Route path="/property/:id/confidence" element={<HomeConfidenceScore />} />
            <Route path="/property/:id/health" element={<HomeHealth />} />
            <Route path="/property/:id/timeline" element={<PropertyTimeline />} />
            <Route path="/property/:id/ask" element={<ProtectedRoute><AskPropertyAI /></ProtectedRoute>} />
            <Route path="/property/:id/reports" element={<ReportExports />} />
            <Route path="/property/:id/contractors" element={<ProtectedRoute><ContractorScores /></ProtectedRoute>} />
            <Route path="/property/:id/insurance" element={<ProtectedRoute><InsuranceReview /></ProtectedRoute>} />
            <Route path="/property/:id/deferred" element={<ProtectedRoute><DeferredMaintenance /></ProtectedRoute>} />
            <Route path="/property/:id/twin" element={<ProtectedRoute><DigitalTwin /></ProtectedRoute>} />
            <Route path="/property/:id/gov" element={<ProtectedRoute><GovernmentPortal /></ProtectedRoute>} />
            <Route path="/property/:id/neighborhood" element={<NeighborhoodIntelligence />} />
            <Route path="/property/:id/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/property/:id/emergency" element={<ProtectedRoute><EmergencyMode /></ProtectedRoute>} />
            <Route path="/property/:id/vault-dr" element={<ProtectedRoute><DisasterVault /></ProtectedRoute>} />
            <Route path="/property/:id/estate" element={<ProtectedRoute><EstatePlanning /></ProtectedRoute>} />
            <Route path="/property/:id/negotiate" element={<ProtectedRoute><NegotiationAssistant /></ProtectedRoute>} />
            <Route path="/property/:id/passport" element={<ProtectedRoute><OwnershipPassport /></ProtectedRoute>} />
            <Route path="/property/:id/risk" element={<PropertyRiskScore />} />
            <Route path="/property/:id/hazards" element={<HazardMap />} />
            <Route path="/property/:id/crime" element={<CrimeTimeline />} />
            <Route path="/property/:id/weather" element={<WeatherTimeline />} />
            <Route path="/property/:id/insurance-readiness" element={<ProtectedRoute><InsuranceReadinessScore /></ProtectedRoute>} />
            <Route path="/property/:id/value-protection" element={<ProtectedRoute><HomeValueProtection /></ProtectedRoute>} />
            <Route path="/property/:id/forecast" element={<ProtectedRoute><FutureCostForecast /></ProtectedRoute>} />
            <Route path="/property/:id/reminders" element={<ProtectedRoute><MaintenanceReminders /></ProtectedRoute>} />
            <Route path="/property/:id/regional" element={<RegionalEducation />} />
            <Route path="/property/:id/buyer-report" element={<BuyerDecisionReport />} />
            <Route path="/property/:id/certification" element={<ProtectedRoute><Certification /></ProtectedRoute>} />
            <Route path="/property/:id/intel-map" element={<PropertyIntelMap />} />
            <Route path="/property/:id/roi" element={<ImprovementROI />} />
            <Route path="/property/:id/annual-report" element={<ProtectedRoute><AnnualReport /></ProtectedRoute>} />
            <Route path="/property/:id/warranties" element={<ProtectedRoute><PropertyWarranties /></ProtectedRoute>} />
            <Route path="/property/:id/warranty-passport" element={<ProtectedRoute><WarrantyPassport /></ProtectedRoute>} />
            <Route path="/warranty-hub" element={<WarrantyHub />} />
            <Route path="/estate-planning" element={<EstatePlanningHub />} />
            <Route path="/command-center" element={<PropertyCommandCenter />} />
            <Route path="/investor" element={<ProtectedRoute><InvestorDashboard /></ProtectedRoute>} />
            <Route path="/negotiate" element={<ProtectedRoute><NegotiationAssistant /></ProtectedRoute>} />
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
            <Route path="/builders/:slug/communities/:id" element={<BuilderCommunity />} />
            <Route path="/builder" element={<ProtectedRoute requireRole="builder"><BuilderDashboard /></ProtectedRoute>} />
            <Route path="/builder/marketing" element={<ProtectedRoute requireRole="builder"><BuilderMarketing /></ProtectedRoute>} />
            <Route path="/builder/templates" element={<ProtectedRoute requireRole="builder"><BuilderTemplates /></ProtectedRoute>} />
            <Route path="/builder/templates/:id" element={<ProtectedRoute requireRole="builder"><BuilderTemplateDetail /></ProtectedRoute>} />
            <Route path="/builder/clones" element={<ProtectedRoute requireRole="builder"><BuilderClones /></ProtectedRoute>} />
            <Route path="/builder/clones/:id" element={<ProtectedRoute requireRole="builder"><BuilderCloneDetail /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/fraud" element={<ProtectedRoute requireRole="admin"><AdminFraudReview /></ProtectedRoute>} />
            <Route path="/admin/builders" element={<ProtectedRoute requireRole="admin"><AdminBuilders /></ProtectedRoute>} />
            <Route path="/builders" element={<BuilderProgram />} />
            <Route path="/builder/clones/:id/timeline" element={<ProtectedRoute requireRole="builder"><ConstructionTimeline /></ProtectedRoute>} />
            <Route path="/builder/clones/:id/handoff" element={<ProtectedRoute requireRole="builder"><HomeownerHandoff /></ProtectedRoute>} />
            <Route path="/builder/referrals" element={<ProtectedRoute requireRole="builder"><BuilderReferrals /></ProtectedRoute>} />
            <Route path="/builder/analytics" element={<ProtectedRoute requireRole="builder"><BuilderAnalytics /></ProtectedRoute>} />
            <Route path="/builder/import" element={<ProtectedRoute requireRole="admin"><BuilderImportWizard /></ProtectedRoute>} />
            <Route path="/builder/portal" element={<ProtectedRoute requireRole="builder"><BuilderPortal /></ProtectedRoute>} />
            <Route path="/builder/portal/:id" element={<ProtectedRoute requireRole="builder"><BuilderPropertyEditor /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
