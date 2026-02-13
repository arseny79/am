import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { VerificationBadgeInline } from "@/components/VerificationBadge";
import { Building2, Loader2, FileText, TrendingUp, CheckSquare, MessageSquare, Activity, User, Mail, Calendar, Shield, Briefcase, MapPin, DollarSign, CheckCircle, XCircle, ArrowRight, ChevronRight, Target } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { toast } from "sonner";
import { DealStageProgress } from "@/components/DealStageProgress";
import { StageActionCard } from "@/components/StageActionCard";
import { InviteProfessionalDialog } from "@/components/InviteProfessionalDialog";
import { Breadcrumb } from "@/components/Breadcrumb";
import { NDASigningModal } from "@/components/NDASigningModal";
import { CompactMessaging } from "@/components/CompactMessaging";
import type { DealStage } from "@/components/DealStageProgress";

// Tab content components
import { OverviewTab } from "@/components/dealroom/OverviewTab";
import { OffersTab } from "@/components/dealroom/OffersTab";
import { DueDiligenceTab } from "@/components/dealroom/DueDiligenceTab";
import { DocumentsTab } from "@/components/dealroom/DocumentsTab";
import { MessagesTab } from "@/components/dealroom/MessagesTab";

const STAGE_ORDER: { key: string; label: string }[] = [
  { key: "initial_contact", label: "Initial Contact" },
  { key: "nda_signed", label: "NDA Signed" },
  { key: "due_diligence", label: "Due Diligence" },
  { key: "negotiation", label: "Negotiation" },
  { key: "escrow", label: "Escrow" },
  { key: "closing", label: "Closing" },
  { key: "closed", label: "Closed" },
];

function getNextStage(currentStage: string): { key: string; label: string } | null {
  const idx = STAGE_ORDER.findIndex(s => s.key === currentStage);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1] || null;
}

export default function DealRoom() {
  const { id } = useParams();
  const dealId = parseInt(id || "0");
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // On mobile, default to messages tab; on desktop, default to documents since messages are always visible
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      return "documents";
    }
    return "messages";
  });
  const [showBuyerProfileModal, setShowBuyerProfileModal] = useState(false);
  const [showNDASigningModal, setShowNDASigningModal] = useState(false);
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);

  const { data: deal, isLoading: dealLoading, refetch: refetchDeal } = trpc.deal.getById.useQuery({ id: dealId }, {
    enabled: isAuthenticated && dealId > 0,
  });

  // Fetch NDA status for this deal
  const { data: ndaStatus, refetch: refetchNDA } = trpc.ndaSigning.getNDAStatus.useQuery(
    { dealId },
    { enabled: isAuthenticated && dealId > 0 }
  );

  // Manual stage advancement mutation
  const advanceStageMutation = trpc.deal.updateStage.useMutation({
    onSuccess: () => {
      toast.success("Deal advanced to next stage");
      refetchDeal();
      setShowAdvanceConfirm(false);
    },
    onError: (error) => {
      toast.error(`Failed to advance stage: ${error.message}`);
    },
  });

  // Action handlers for StageActionCard
  const handleViewBuyerProfile = () => {
    setShowBuyerProfileModal(true);
  };

  const handleSendMessage = () => {
    // On mobile, switch to messages tab; on desktop, scroll to messages section
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      document.getElementById("desktop-messages-section")?.scrollIntoView({ behavior: "smooth" });
    } else {
      setActiveTab("messages");
    }
  };

  const handleViewDocuments = () => {
    setActiveTab("documents");
  };

  const handleUploadDocuments = () => {
    setActiveTab("documents");
  };

  const handleViewOffers = () => {
    setActiveTab("offers");
  };

  const handleViewDueDiligence = () => {
    setActiveTab("due-diligence");
  };

  const handleSignNDA = () => {
    setShowNDASigningModal(true);
  };

  const handleAdvanceStage = () => {
    if (!deal) return;
    const next = getNextStage(deal.stage);
    if (!next) return;
    setShowAdvanceConfirm(true);
  };

  const confirmAdvanceStage = () => {
    if (!deal) return;
    const next = getNextStage(deal.stage);
    if (!next) return;
    advanceStageMutation.mutate({
      dealId,
      stage: next.key as any,
    });
  };

  if (authLoading || dealLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to view this deal</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Deal not found</p>
        <Link href="/deals">
          <Button>View All Deals</Button>
        </Link>
      </div>
    );
  }

  const currentStageLabel = STAGE_ORDER.find(s => s.key === deal.stage)?.label || deal.stage;
  const nextStage = getNextStage(deal.stage);
  const isTerminalStage = deal.stage === "closed" || deal.stage === "cancelled";
  
  // Get the counterparty info based on user role
  const counterparty = deal.isBuyer ? deal.seller : deal.buyer;
  const counterpartyRole = deal.isBuyer ? "Seller" : "Buyer";
  const counterpartyDisplayName = deal.isBuyer 
    ? ((deal.seller as any)?.displayName || deal.seller?.name || "Unknown")
    : ((deal.buyer as any)?.displayName || deal.buyer?.name || "Unknown");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <PublicHeader />

      <main className="flex-1 py-6">
        <div className="container max-w-6xl">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: "My Deals", href: "/deals" },
              { label: deal.listing?.businessName || "Deal Room" }
            ]} 
          />

          {/* Compact Deal Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{deal.listing?.businessName || "Deal Room"}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {deal.isBuyer ? (
                    `Seller: ${(deal.seller as any)?.displayName || deal.seller?.name || "Unknown"}`
                  ) : (
                    <>
                      Buyer: {(deal.buyer as any)?.displayName || deal.buyer?.name || "Unknown"}
                      {deal.buyer?.verificationStatus && (deal.buyer as any)?.displayName !== "Anonymous Buyer" && (
                        <VerificationBadgeInline verificationStatus={deal.buyer.verificationStatus} />
                      )}
                    </>
                  )}
                  {deal.listing && (
                    <> &middot; Asking: ${deal.listing.askingPrice?.toLocaleString() || "0"}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <InviteProfessionalDialog dealId={dealId} />
                <Badge variant={deal.stage === "closed" ? "default" : "secondary"} className="text-sm px-3 py-1">
                  {currentStageLabel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <Card className="mb-4">
            <CardContent className="pt-4 pb-4">
              <DealStageProgress currentStage={deal.stage as DealStage} />
              
              {/* Manual Advance Button */}
              {!isTerminalStage && nextStage && (
                <div className="flex justify-end mt-4 pt-3 border-t">
                  <Button
                    onClick={handleAdvanceStage}
                    disabled={advanceStageMutation.isPending}
                    className="gap-2"
                  >
                    {advanceStageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Advance to {nextStage.label}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stage-Specific Action Card */}
          <StageActionCard 
            currentStage={deal.stage as DealStage}
            userRole={deal.isBuyer ? "buyer" : "seller"}
            dealId={dealId}
            hasSignedNDA={deal.stage !== "initial_contact"}
            ndaStatus={ndaStatus ? {
              buyerConfirmed: ndaStatus.buyerSigned,
              sellerConfirmed: ndaStatus.sellerSigned,
              isFullySigned: ndaStatus.status === 'fully_signed',
              isValid: ndaStatus.exists && ndaStatus.status !== 'expired' && ndaStatus.status !== 'revoked',
              isExpired: Boolean(ndaStatus.isExpired),
              isRevoked: ndaStatus.status === 'revoked',
              expiresAt: ndaStatus.expiresAt,
            } : undefined}
            className="mb-4"
            onViewBuyerProfile={handleViewBuyerProfile}
            onSendMessage={handleSendMessage}
            onViewDocuments={handleViewDocuments}
            onUploadDocuments={handleUploadDocuments}
            onViewOffers={handleViewOffers}
            onViewDueDiligence={handleViewDueDiligence}
            onSignNDA={handleSignNDA}
          />

          {/* Desktop: Always-visible Messages Section (hidden on mobile) */}
          <div id="desktop-messages-section" className="hidden lg:block mb-4">
            <CompactMessaging dealId={dealId} />
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            {/* Mobile: Show all 5 tabs including Messages */}
            <TabsList className="grid w-full grid-cols-5 lg:hidden">
              <TabsTrigger value="messages" className="gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1.5">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="gap-1.5">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="due-diligence" className="gap-1.5">
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger value="offers" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Offers</span>
              </TabsTrigger>
            </TabsList>

            {/* Desktop: Show 4 tabs (Messages hidden since it's always visible above) */}
            <TabsList className="hidden lg:inline-grid lg:grid-cols-4 lg:w-auto">
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="overview" className="gap-2">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="due-diligence" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Due Diligence
              </TabsTrigger>
              <TabsTrigger value="offers" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Offers
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab - Only shown on mobile */}
            <TabsContent value="messages" className="space-y-4 lg:hidden">
              <MessagesTab 
                dealId={dealId}
              />
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <DocumentsTab 
                dealId={dealId}
              />
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <OverviewTab 
                deal={deal} 
                dealId={dealId}
                refetchDeal={refetchDeal}
              />
            </TabsContent>

            {/* Due Diligence Tab */}
            <TabsContent value="due-diligence" className="space-y-4">
              <DueDiligenceTab 
                dealId={dealId}
                currentStage={deal.stage}
              />
            </TabsContent>

            {/* Offers Tab */}
            <TabsContent value="offers" className="space-y-4">
              <OffersTab 
                deal={deal}
                dealId={dealId}
                refetchDeal={refetchDeal}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Advance Stage Confirmation Dialog */}
      <Dialog open={showAdvanceConfirm} onOpenChange={setShowAdvanceConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Advance Deal Stage</DialogTitle>
            <DialogDescription>
              Are you sure you want to advance this deal from <strong>{currentStageLabel}</strong> to <strong>{nextStage?.label}</strong>? Both parties will be notified of the stage change.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAdvanceConfirm(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAdvanceStage}
              disabled={advanceStageMutation.isPending}
              className="gap-2"
            >
              {advanceStageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Confirm Advance
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Buyer/Seller Profile Modal */}
      <Dialog open={showBuyerProfileModal} onOpenChange={setShowBuyerProfileModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {counterpartyRole} Profile
            </DialogTitle>
            <DialogDescription>
              Review the {counterpartyRole.toLowerCase()}'s background and verification status
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{counterpartyDisplayName}</h3>
                {counterparty?.verificationStatus && (
                  <div className="flex items-center gap-1 mt-1">
                    <VerificationBadgeInline verificationStatus={counterparty.verificationStatus} />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              {counterparty?.email && counterpartyDisplayName !== "Anonymous Buyer" && counterpartyDisplayName !== "Anonymous Seller" && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{counterparty.email}</span>
                </div>
              )}
              
              {counterparty?.companyName && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{counterparty.companyName}</span>
                </div>
              )}

              {counterparty?.createdAt && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Member since {new Date(counterparty.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Verification Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Email Verified</span>
                  {counterparty?.emailVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Identity Verified</span>
                  {counterparty?.verificationStatus === "verified" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {!deal.isBuyer && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Funds Verified</span>
                    {counterparty?.verificationStatus === "verified" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Anonymous Notice */}
            {(counterpartyDisplayName === "Anonymous Buyer" || counterpartyDisplayName === "Anonymous Seller") && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <p className="font-medium mb-1">Anonymous {counterpartyRole}</p>
                <p>This {counterpartyRole.toLowerCase()} has chosen to remain anonymous until further in the deal process. Their identity will be revealed after the NDA is signed.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowBuyerProfileModal(false);
                  handleSendMessage();
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => setShowBuyerProfileModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NDA Signing Modal */}
      {showNDASigningModal && (
        <NDASigningModal
          dealId={dealId}
          ndaSigningId={ndaStatus?.id || 0}
          open={showNDASigningModal}
          onOpenChange={setShowNDASigningModal}
          onSigningComplete={() => {
            refetchNDA();
            refetchDeal();
            setShowNDASigningModal(false);
            toast.success("NDA signed successfully!");
          }}
        />
      )}
    </div>
  );
}
