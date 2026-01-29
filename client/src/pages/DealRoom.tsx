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
import { Building2, Loader2, FileText, TrendingUp, CheckSquare, MessageSquare, Activity, User, Mail, Calendar, Shield, Briefcase, MapPin, DollarSign, CheckCircle, XCircle } from "lucide-react";
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
import type { DealStage } from "@/components/DealStageProgress";

// Tab content components
import { OverviewTab } from "@/components/dealroom/OverviewTab";
import { OffersTab } from "@/components/dealroom/OffersTab";
import { DueDiligenceTab } from "@/components/dealroom/DueDiligenceTab";
import { DocumentsTab } from "@/components/dealroom/DocumentsTab";
import { MessagesTab } from "@/components/dealroom/MessagesTab";

const STAGE_ORDER = [
  { key: "initial_contact", label: "Initial Contact" },
  { key: "nda_signed", label: "NDA Signed" },
  { key: "due_diligence", label: "Due Diligence" },
  { key: "negotiation", label: "Negotiation" },
  { key: "escrow", label: "Escrow" },
  { key: "closing", label: "Closing" },
  { key: "closed", label: "Closed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function DealRoom() {
  const { id } = useParams();
  const dealId = parseInt(id || "0");
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [showBuyerProfileModal, setShowBuyerProfileModal] = useState(false);
  const [showNDASigningModal, setShowNDASigningModal] = useState(false);

  const { data: deal, isLoading: dealLoading, refetch: refetchDeal } = trpc.deal.getById.useQuery({ id: dealId }, {
    enabled: isAuthenticated && dealId > 0,
  });

  // Fetch NDA status for this deal
  const { data: ndaStatus, refetch: refetchNDA } = trpc.ndaSigning.getNDAStatus.useQuery(
    { dealId },
    { enabled: isAuthenticated && dealId > 0 }
  );

  // Action handlers for StageActionCard
  const handleViewBuyerProfile = () => {
    setShowBuyerProfileModal(true);
  };

  const handleSendMessage = () => {
    setActiveTab("messages");
    toast.info("Switched to Messages tab");
  };

  const handleViewDocuments = () => {
    setActiveTab("documents");
    toast.info("Switched to Documents tab");
  };

  const handleUploadDocuments = () => {
    setActiveTab("documents");
    toast.info("Switched to Documents tab - you can upload documents here");
  };

  const handleViewOffers = () => {
    setActiveTab("offers");
    toast.info("Switched to Offers tab");
  };

  const handleViewDueDiligence = () => {
    setActiveTab("due-diligence");
    toast.info("Switched to Due Diligence tab");
  };

  const handleSignNDA = () => {
    setShowNDASigningModal(true);
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

      <main className="flex-1 py-8">
        <div className="container max-w-7xl">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: "My Deals", href: "/deals" },
              { label: deal.listing?.businessName || "Deal Room" }
            ]} 
          />
          {/* Deal Header - Always Visible */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{deal.listing?.businessName || "Deal Room"}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>
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
                  </span>
                  {deal.listing && (
                    <>
                      <span>•</span>
                      <span>Asking Price: ${deal.listing.askingPrice?.toLocaleString() || "0"}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <InviteProfessionalDialog dealId={dealId} />
                <Badge variant={deal.stage === "closed" ? "default" : "secondary"} className="text-lg px-4 py-2">
                  {currentStageLabel}
                </Badge>
              </div>
            </div>

            {/* Progress Tracker */}
            <Card>
              <CardContent className="pt-6">
                <DealStageProgress currentStage={deal.stage as DealStage} />
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
              className="mt-4"
              onViewBuyerProfile={handleViewBuyerProfile}
              onSendMessage={handleSendMessage}
              onViewDocuments={handleViewDocuments}
              onUploadDocuments={handleUploadDocuments}
              onViewOffers={handleViewOffers}
              onViewDueDiligence={handleViewDueDiligence}
              onSignNDA={handleSignNDA}
            />
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="offers" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Offers</span>
              </TabsTrigger>
              <TabsTrigger value="due-diligence" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Due Diligence</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="overview" className="space-y-6">
              <OverviewTab 
                deal={deal} 
                dealId={dealId}
                refetchDeal={refetchDeal}
              />
            </TabsContent>

            <TabsContent value="offers" className="space-y-6">
              <OffersTab 
                deal={deal}
                dealId={dealId}
                refetchDeal={refetchDeal}
              />
            </TabsContent>

            <TabsContent value="due-diligence" className="space-y-6">
              <DueDiligenceTab 
                dealId={dealId}
                currentStage={deal.stage}
              />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <DocumentsTab 
                dealId={dealId}
              />
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <MessagesTab 
                dealId={dealId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

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
                  setActiveTab("messages");
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
      <NDASigningModal
        open={showNDASigningModal}
        onOpenChange={setShowNDASigningModal}
        ndaSigningId={ndaStatus?.id || 0}
        dealId={dealId}
        ndaExists={ndaStatus?.exists || false}
        onSigningComplete={() => {
          setShowNDASigningModal(false);
          refetchDeal();
          refetchNDA();
          toast.success("NDA signed successfully!");
        }}
      />
    </div>
  );
}
