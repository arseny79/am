import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import DealRoom from "./pages/DealRoom";
import MyDeals from "./pages/MyDeals";
import AdminDashboard from "./pages/AdminDashboardModular";
import AdminEscrow from "./pages/AdminEscrow";
import BuyAsset from "@/pages/BuyAsset";
import AccessRequests from "@/pages/AccessRequests";
import Marketplace from "./pages/Marketplace";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import EditListing from "./pages/EditListing";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import ValuationTool from "./pages/ValuationTool";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentHistory from "./pages/PaymentHistory";
import DealPipeline from "./pages/DealPipeline";
import MyProposals from "./pages/MyProposals";
import SavedListings from "./pages/SavedListings";
import LegalDocument from "./pages/LegalDocument";
import BuyerDashboard from "./pages/BuyerDashboard";
import AnalyticsScripts from "./components/AnalyticsScripts";
import { TOSAcceptanceModal } from "./components/TOSAcceptanceModal";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import PricePlansManager from "./pages/admin/PricePlansManager";
import { useAuth } from "./_core/hooks/useAuth";
import { useState, useEffect } from "react";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import SignupSuccess from "./pages/SignupSuccess";
import VerifyEmail from "./pages/VerifyEmail";
import ResendVerification from "./pages/ResendVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyAccount from "./pages/VerifyAccount";
import Preparation from "./pages/Preparation";
import BuyerProfile from "./pages/BuyerProfile";
import BuyerVerification from "./pages/admin/BuyerVerification";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import ProfessionalDirectory from "./pages/ProfessionalDirectory";
import ProfessionalProfile from "./pages/ProfessionalProfile";
import ProfessionalJoin from "./pages/ProfessionalJoin";
import EditProfessionalProfile from "./pages/EditProfessionalProfile";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/signup-success" component={SignupSuccess} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/resend-verification" component={ResendVerification} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-account" component={VerifyAccount} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/deal/:id" component={DealRoom} />
      <Route path="/deals" component={MyDeals} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin/escrow" component={AdminEscrow} />
      <Route path="/admin/price-plans" component={PricePlansManager} />
      <Route path="/admin/buyer-verification" component={BuyerVerification} />
      <Route path="/buyer-dashboard" component={BuyerDashboard} />
      <Route path="/buy-asset" component={BuyAsset} />
      <Route path="/access-requests" component={AccessRequests} />
      <Route path={"/404"} component={NotFound} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/create-listing" component={CreateListing} />
      <Route path="/my-listings" component={MyListings} />
      <Route path="/edit-listing/:id" component={EditListing} />
      <Route path="/preparation/:listingId" component={Preparation} />
      <Route path="/buyer-profile" component={BuyerProfile} />
      <Route path="/profile" component={Profile} />
      <Route path="/messages" component={Messages} />
      <Route path="/valuation-tool" component={ValuationTool} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-history" component={PaymentHistory} />
      <Route path="/deal-pipeline" component={DealPipeline} />
      <Route path="/my-proposals" component={MyProposals} />
      <Route path="/saved-listings" component={SavedListings} />
      <Route path="/legal/:slug" component={LegalDocument} />
      <Route path="/affiliate" component={AffiliateDashboard} />
      <Route path="/professionals" component={ProfessionalDirectory} />
      <Route path="/professionals/join" component={ProfessionalJoin} />
      <Route path="/professionals/edit" component={EditProfessionalProfile} />
      <Route path="/professionals/:id" component={ProfessionalProfile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [showTOSModal, setShowTOSModal] = useState(false);

  useEffect(() => {
    // Show TOS modal if user is authenticated but hasn't accepted terms
    if (!loading && user && !user.tosAcceptedAt) {
      setShowTOSModal(true);
    } else {
      setShowTOSModal(false);
    }
  }, [user, loading]);

  const handleTOSAccepted = () => {
    setShowTOSModal(false);
    // Refresh the page to reload user data with accepted terms
    window.location.reload();
  };

  return (
    <>
      <Toaster />
      <AnalyticsScripts />
      <KeyboardShortcuts />
      <TOSAcceptanceModal open={showTOSModal} onAccepted={handleTOSAccepted} />
      {/* Block content if TOS not accepted */}
      {showTOSModal ? (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Welcome!</h2>
            <p className="text-muted-foreground">Please accept our terms to continue.</p>
          </div>
        </div>
      ) : (
        <Router />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
