import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { VerificationBadgeInline } from "@/components/VerificationBadge";
import { Building2, Loader2, FileText, TrendingUp, CheckSquare, MessageSquare, Activity } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { toast } from "sonner";
import { DealStageProgress } from "@/components/DealStageProgress";
import { StageActionCard } from "@/components/StageActionCard";
import { InviteProfessionalDialog } from "@/components/InviteProfessionalDialog";
import { Breadcrumb } from "@/components/Breadcrumb";
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

  const { data: deal, isLoading: dealLoading, refetch: refetchDeal } = trpc.deal.getById.useQuery({ id: dealId }, {
    enabled: isAuthenticated && dealId > 0,
  });

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
              className="mt-4"
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
    </div>
  );
}
