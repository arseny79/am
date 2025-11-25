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
import AdminDashboard from "./pages/AdminDashboard";
import BuyAsset from "@/pages/BuyAsset";
import AccessRequests from "@/pages/AccessRequests";
import Marketplace from "./pages/Marketplace";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import EditListing from "./pages/EditListing";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import ValuationCalculator from "./pages/ValuationCalculator";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentHistory from "./pages/PaymentHistory";
import DealPipeline from "./pages/DealPipeline";
import MyProposals from "./pages/MyProposals";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/deal/:id" component={DealRoom} />
      <Route path="/deals" component={MyDeals} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/buy-asset" component={BuyAsset} />
      <Route path="/access-requests" component={AccessRequests} />
      <Route path={"/404"} component={NotFound} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/create-listing" component={CreateListing} />
      <Route path="/my-listings" component={MyListings} />
      <Route path="/edit-listing/:id" component={EditListing} />
      <Route path="/profile" component={Profile} />
      <Route path="/messages" component={Messages} />
      <Route path="/valuation" component={ValuationCalculator} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-history" component={PaymentHistory} />
      <Route path="/deal-pipeline" component={DealPipeline} />
      <Route path="/my-proposals" component={MyProposals} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
