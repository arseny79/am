import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import HomePreview from "./pages/HomePreview";
import HowItWorks from "./pages/HowItWorks";
import DealRoom from "./pages/DealRoom";
import MyDeals from "./pages/MyDeals";
import AdminDashboard from "./pages/AdminDashboardModular";
import BuyAsset from "@/pages/BuyAsset";
import AccessRequests from "@/pages/AccessRequests";
import Marketplace from "./pages/Marketplace";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import EditListing from "./pages/EditListing";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import DealPipeline from "./pages/DealPipeline";
import MyProposals from "./pages/MyProposals";
import SavedListings from "./pages/SavedListings";
import LegalDocument from "./pages/LegalDocument";
import BuyerDashboard from "./pages/BuyerDashboard";
import AnalyticsScripts from "./components/AnalyticsScripts";
import { TOSAcceptanceModal } from "./components/TOSAcceptanceModal";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { LivechatScript } from "./components/LivechatScript";
import { useAuth } from "./_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { trpc } from "./lib/trpc";
import ComingSoon from "./pages/ComingSoon";
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
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NDASigningPage from "./pages/NDASigningPage";
import Dashboard from "./pages/Dashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/preview"} component={HomePreview} />
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
      <Route path="/my-deals" component={MyDeals} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin/buyer-verification" component={BuyerVerification} />
      <Route path="/buyer-dashboard" component={BuyerDashboard} />
      <Route path="/buy-asset" component={BuyAsset} />
      <Route path="/my-buyer-requests" component={BuyAsset} />
      <Route path="/access-requests" component={AccessRequests} />
      <Route path={"/404"} component={NotFound} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/browse" component={Marketplace} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/create-listing" component={CreateListing} />
      <Route path="/my-listings" component={MyListings} />
      <Route path="/edit-listing/:id" component={EditListing} />
      <Route path="/preparation/:listingId" component={Preparation} />
      <Route path="/buyer-profile" component={BuyerProfile} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/messages" component={Messages} />
      <Route path="/deal-pipeline" component={DealPipeline} />
      <Route path="/my-proposals" component={MyProposals} />
      <Route path="/saved-listings" component={SavedListings} />
      <Route path="/legal/:slug" component={LegalDocument} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/nda/:dealId/:ndaSigningId" component={NDASigningPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const [showTOSModal, setShowTOSModal] = useState(false);

  const settingsQuery = trpc.admin.getSiteSettings.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const shouldShowModal = Boolean(
      !loading &&
      isAuthenticated &&
      user &&
      user.id &&
      !user.tosAcceptedAt
    );
    setShowTOSModal(shouldShowModal);
  }, [user, loading, isAuthenticated]);

  const handleTOSAccepted = () => {
    setShowTOSModal(false);
    window.location.reload();
  };

  // Pre-launch gate: show ComingSoon to non-admins when launchMode is pre_launch
  const launchMode = (settingsQuery.data as { launchMode?: string } | null | undefined)?.launchMode;
  const isPreLaunch = launchMode === "pre_launch";
  const isAdmin = user?.role === "admin";
  const currentPath = window.location.pathname;
  const isLoginPath = currentPath === "/login" || currentPath.startsWith("/login");

  if (isPreLaunch && !isAdmin && !loading && !isLoginPath) {
    return <ComingSoon />;
  }

  return (
    <>
      <Toaster />
      <AnalyticsScripts />
      <KeyboardShortcuts />
      <LivechatScript />
      <TOSAcceptanceModal open={showTOSModal} onAccepted={handleTOSAccepted} />
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
