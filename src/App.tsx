import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { CookieBanner } from "@/components/legal/CookieBanner";

// Eager: landing + auth + 404 (needed on first paint or shell)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import HomeownerDashboard from "./pages/HomeownerDashboard";

// Everything else: lazy
const PropertySearch = lazy(() => import("./pages/PropertySearch"));
const PropertyView = lazy(() => import("./pages/PropertyView"));
const ContractorDashboard = lazy(() => import("./pages/ContractorDashboard"));
const RealtorSuccessCenter = lazy(() => import("./pages/RealtorSuccessCenter"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminFraudReview = lazy(() => import("./pages/AdminFraudReview"));
const DemoReport = lazy(() => import("./pages/DemoReport"));
const PropertyReport = lazy(() => import("./pages/PropertyReport"));
const PropertyHomeHistory = lazy(() => import("./pages/PropertyHomeHistory"));
const AddressReport = lazy(() => import("./pages/AddressReport"));
const MyReports = lazy(() => import("./pages/MyReports"));
const Pricing = lazy(() => import("./pages/Pricing"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
const PropertyVault = lazy(() => import("./pages/PropertyVault"));
const PropertyProjects = lazy(() => import("./pages/PropertyProjects"));
const BuilderDashboard = lazy(() => import("./pages/BuilderDashboard"));
const BuilderTemplates = lazy(() => import("./pages/BuilderTemplates"));
const BuilderTemplateDetail = lazy(() => import("./pages/BuilderTemplateDetail"));
const BuilderClones = lazy(() => import("./pages/BuilderClones"));
const BuilderCloneDetail = lazy(() => import("./pages/BuilderCloneDetail"));
const BeginnerGuide = lazy(() => import("./pages/BeginnerGuide"));
const BuilderProfile = lazy(() => import("./pages/BuilderProfile"));
const BuilderImportWizard = lazy(() => import("./pages/BuilderImportWizard"));
const BuilderPortal = lazy(() => import("./pages/BuilderPortal"));
const BuilderPropertyEditor = lazy(() => import("./pages/BuilderPropertyEditor"));
const BuilderMarketing = lazy(() => import("./pages/BuilderMarketing"));
const PropertyBoundary = lazy(() => import("./pages/PropertyBoundary"));
const HomeEngagement = lazy(() => import("./pages/HomeEngagement"));
const WhyOrivaz = lazy(() => import("./pages/WhyOrivaz"));
const MaintenanceCenter = lazy(() => import("./pages/MaintenanceCenter"));
const VacationMode = lazy(() => import("./pages/VacationMode"));
const HomeConfidenceScore = lazy(() => import("./pages/HomeConfidenceScore"));
const HomeHealth = lazy(() => import("./pages/HomeHealth"));
const PropertyTimeline = lazy(() => import("./pages/PropertyTimeline"));
const AskPropertyAI = lazy(() => import("./pages/AskPropertyAI"));
const ReportExports = lazy(() => import("./pages/ReportExports"));
const ContractorScores = lazy(() => import("./pages/ContractorScores"));
const InsuranceReview = lazy(() => import("./pages/InsuranceReview"));
const DeferredMaintenance = lazy(() => import("./pages/DeferredMaintenance"));
const DigitalTwin = lazy(() => import("./pages/DigitalTwin"));
const GovernmentPortal = lazy(() => import("./pages/GovernmentPortal"));
const NeighborhoodIntelligence = lazy(() => import("./pages/NeighborhoodIntelligence"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const InvestorDashboard = lazy(() => import("./pages/InvestorDashboard"));
const EmergencyMode = lazy(() => import("./pages/EmergencyMode"));
const DisasterVault = lazy(() => import("./pages/DisasterVault"));
const EstatePlanning = lazy(() => import("./pages/EstatePlanning"));
const NegotiationAssistant = lazy(() => import("./pages/NegotiationAssistant"));
const OwnershipPassport = lazy(() => import("./pages/OwnershipPassport"));
const PropertyRiskScore = lazy(() => import("./pages/PropertyRiskScore"));
const HazardMap = lazy(() => import("./pages/HazardMap"));
const CrimeTimeline = lazy(() => import("./pages/CrimeTimeline"));
const WeatherTimeline = lazy(() => import("./pages/WeatherTimeline"));
const InsuranceReadinessScore = lazy(() => import("./pages/InsuranceReadinessScore"));
const HomeValueProtection = lazy(() => import("./pages/HomeValueProtection"));
const FutureCostForecast = lazy(() => import("./pages/FutureCostForecast"));
const MaintenanceReminders = lazy(() => import("./pages/MaintenanceReminders"));
const RegionalEducation = lazy(() => import("./pages/RegionalEducation"));
const BuyerDecisionReport = lazy(() => import("./pages/BuyerDecisionReport"));
const Certification = lazy(() => import("./pages/Certification"));
const PropertyIntelMap = lazy(() => import("./pages/PropertyIntelMap"));
const ImprovementROI = lazy(() => import("./pages/ImprovementROI"));
const AnnualReport = lazy(() => import("./pages/AnnualReport"));
const BuilderProgram = lazy(() => import("./pages/BuilderProgram"));
const AdminBuilders = lazy(() => import("./pages/AdminBuilders"));
const ConstructionTimeline = lazy(() => import("./pages/ConstructionTimeline"));
const HomeownerHandoff = lazy(() => import("./pages/HomeownerHandoff"));
const BuilderReferrals = lazy(() => import("./pages/BuilderReferrals"));
const BuilderAnalytics = lazy(() => import("./pages/BuilderAnalytics"));
const BuilderCommunity = lazy(() => import("./pages/BuilderCommunity"));
const WarrantyHub = lazy(() => import("./pages/WarrantyHub"));
const PropertyWarranties = lazy(() => import("./pages/PropertyWarranties"));
const WarrantyPassport = lazy(() => import("./pages/WarrantyPassport"));
const EstatePlanningHub = lazy(() => import("./pages/EstatePlanningHub"));
const PropertyCommandCenter = lazy(() => import("./pages/PropertyCommandCenter"));
const ProfessionalNetwork = lazy(() => import("./pages/ProfessionalNetwork"));
const CertificationCenter = lazy(() => import("./pages/CertificationCenter"));
const PropertySystems = lazy(() => import("./pages/PropertySystems"));
const PropertyIntelligence = lazy(() => import("./pages/PropertyIntelligence"));
const ClaimProperty = lazy(() => import("./pages/ClaimProperty"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyControls = lazy(() => import("./pages/PrivacyControls"));
const MyHomeOpportunities = lazy(() => import("./pages/MyHomeOpportunities"));
const PropertyHealthScore = lazy(() => import("./pages/PropertyHealthScore"));
const RevenueIntelligence = lazy(() => import("./pages/RevenueIntelligence"));
const AdminPartners = lazy(() => import("./pages/AdminPartners"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const PartnerOfferNew = lazy(() => import("./pages/PartnerOfferNew"));
const PartnerClaimInvite = lazy(() => import("./pages/PartnerClaimInvite"));
const HomeownerOffers = lazy(() => import("./pages/HomeownerOffers"));

import { PILOT_MODE, isPilotAllowedRoute } from "@/lib/featureFlags";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>
);

const PilotGuard = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  if (PILOT_MODE && !isPilotAllowedRoute(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const DashboardRouter = () => {
  const { primaryRole, loading, roles } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (roles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">
        Your account has no role yet. Contact an Orivaz administrator to be assigned.
      </div>
    );
  }
  switch (primaryRole) {
    case "admin": return <Navigate to="/admin" replace />;
    case "builder": return <Navigate to="/builder" replace />;
    case "partner": return <Navigate to="/partner" replace />;
    case "contractor": return <Navigate to="/contractor" replace />;
    case "realtor": return <Navigate to="/realtor" replace />;
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
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <PilotGuard>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/why" element={<WhyOrivaz />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout/return" element={<CheckoutReturn />} />
                <Route path="/search" element={<PropertySearch />} />
                <Route path="/demo" element={<DemoReport />} />
                <Route path="/claim/:token" element={<ClaimProperty />} />
                <Route path="/r/:token" element={<PropertyView shared />} />
                <Route path="/home/:token" element={<BeginnerGuide />} />
                <Route path="/report/:id" element={<AddressReport />} />

                {/* All property/* routes require auth + verified email */}
                <Route path="/property/:id" element={<ProtectedRoute><PropertyView /></ProtectedRoute>} />
                <Route path="/property/:id/vault" element={<ProtectedRoute><PropertyVault /></ProtectedRoute>} />
                <Route path="/property/:id/projects" element={<ProtectedRoute><PropertyProjects /></ProtectedRoute>} />
                <Route path="/property/:id/boundary" element={<ProtectedRoute><PropertyBoundary /></ProtectedRoute>} />
                <Route path="/property/:id/engagement" element={<ProtectedRoute><HomeEngagement /></ProtectedRoute>} />
                <Route path="/property/:id/maintenance" element={<ProtectedRoute><MaintenanceCenter /></ProtectedRoute>} />
                <Route path="/property/:id/vacation" element={<ProtectedRoute><VacationMode /></ProtectedRoute>} />
                <Route path="/property/:id/confidence" element={<ProtectedRoute><HomeConfidenceScore /></ProtectedRoute>} />
                <Route path="/property/:id/health" element={<ProtectedRoute><HomeHealth /></ProtectedRoute>} />
                <Route path="/property/:id/timeline" element={<ProtectedRoute><PropertyTimeline /></ProtectedRoute>} />
                <Route path="/property/:id/systems" element={<ProtectedRoute><PropertySystems /></ProtectedRoute>} />
                <Route path="/property/:id/ask" element={<ProtectedRoute><AskPropertyAI /></ProtectedRoute>} />
                <Route path="/property/:id/reports" element={<ProtectedRoute><ReportExports /></ProtectedRoute>} />
                <Route path="/property/:id/contractors" element={<ProtectedRoute><ContractorScores /></ProtectedRoute>} />
                <Route path="/property/:id/insurance" element={<ProtectedRoute><InsuranceReview /></ProtectedRoute>} />
                <Route path="/property/:id/deferred" element={<ProtectedRoute><DeferredMaintenance /></ProtectedRoute>} />
                <Route path="/property/:id/twin" element={<ProtectedRoute><DigitalTwin /></ProtectedRoute>} />
                <Route path="/property/:id/gov" element={<ProtectedRoute><GovernmentPortal /></ProtectedRoute>} />
                <Route path="/property/:id/neighborhood" element={<ProtectedRoute><NeighborhoodIntelligence /></ProtectedRoute>} />
                <Route path="/property/:id/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                <Route path="/property/:id/emergency" element={<ProtectedRoute><EmergencyMode /></ProtectedRoute>} />
                <Route path="/property/:id/vault-dr" element={<ProtectedRoute><DisasterVault /></ProtectedRoute>} />
                <Route path="/property/:id/estate" element={<ProtectedRoute><EstatePlanning /></ProtectedRoute>} />
                <Route path="/property/:id/negotiate" element={<ProtectedRoute><NegotiationAssistant /></ProtectedRoute>} />
                <Route path="/property/:id/passport" element={<ProtectedRoute><OwnershipPassport /></ProtectedRoute>} />
                <Route path="/property/:id/risk" element={<ProtectedRoute><PropertyRiskScore /></ProtectedRoute>} />
                <Route path="/property/:id/hazards" element={<ProtectedRoute><HazardMap /></ProtectedRoute>} />
                <Route path="/property/:id/crime" element={<ProtectedRoute><CrimeTimeline /></ProtectedRoute>} />
                <Route path="/property/:id/weather" element={<ProtectedRoute><WeatherTimeline /></ProtectedRoute>} />
                <Route path="/property/:id/insurance-readiness" element={<ProtectedRoute><InsuranceReadinessScore /></ProtectedRoute>} />
                <Route path="/property/:id/value-protection" element={<ProtectedRoute><HomeValueProtection /></ProtectedRoute>} />
                <Route path="/property/:id/forecast" element={<ProtectedRoute><FutureCostForecast /></ProtectedRoute>} />
                <Route path="/property/:id/reminders" element={<ProtectedRoute><MaintenanceReminders /></ProtectedRoute>} />
                <Route path="/property/:id/regional" element={<ProtectedRoute><RegionalEducation /></ProtectedRoute>} />
                <Route path="/property/:id/buyer-report" element={<ProtectedRoute><BuyerDecisionReport /></ProtectedRoute>} />
                <Route path="/property/:id/certification" element={<ProtectedRoute><Certification /></ProtectedRoute>} />
                <Route path="/property/:id/intel-map" element={<ProtectedRoute><PropertyIntelMap /></ProtectedRoute>} />
                <Route path="/property/:id/roi" element={<ProtectedRoute><ImprovementROI /></ProtectedRoute>} />
                <Route path="/property/:id/annual-report" element={<ProtectedRoute><AnnualReport /></ProtectedRoute>} />
                <Route path="/property/:id/warranties" element={<ProtectedRoute><PropertyWarranties /></ProtectedRoute>} />
                <Route path="/property/:id/warranty-passport" element={<ProtectedRoute><WarrantyPassport /></ProtectedRoute>} />
                <Route path="/property/:id/report/:type" element={<ProtectedRoute><PropertyReport /></ProtectedRoute>} />
                <Route path="/properties/:id/home-history" element={<ProtectedRoute><PropertyHomeHistory /></ProtectedRoute>} />

                <Route path="/warranty-hub" element={<ProtectedRoute><WarrantyHub /></ProtectedRoute>} />
                <Route path="/estate-planning" element={<ProtectedRoute><EstatePlanningHub /></ProtectedRoute>} />
                <Route path="/command-center" element={<ProtectedRoute><PropertyCommandCenter /></ProtectedRoute>} />
                <Route path="/network" element={<ProtectedRoute><ProfessionalNetwork /></ProtectedRoute>} />
                <Route path="/certification" element={<ProtectedRoute><CertificationCenter /></ProtectedRoute>} />
                <Route path="/intelligence" element={<ProtectedRoute><PropertyIntelligence /></ProtectedRoute>} />
                <Route path="/investor" element={<ProtectedRoute><InvestorDashboard /></ProtectedRoute>} />
                <Route path="/negotiate" element={<ProtectedRoute><NegotiationAssistant /></ProtectedRoute>} />
                <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
                <Route path="/privacy-controls" element={<ProtectedRoute><PrivacyControls /></ProtectedRoute>} />
                <Route path="/property/:id/opportunities" element={<ProtectedRoute><MyHomeOpportunities /></ProtectedRoute>} />
                <Route path="/property/:id/health-score" element={<ProtectedRoute><PropertyHealthScore /></ProtectedRoute>} />
                <Route path="/dashboard/revenue-intelligence" element={<ProtectedRoute requireRole="admin"><RevenueIntelligence /></ProtectedRoute>} />

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
              </PilotGuard>
            </Suspense>
          </ErrorBoundary>
          <CookieBanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
