import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { VerificationBadgeInline } from "@/components/VerificationBadge";
import { Building2, Loader2, Upload, FileText, Download, MessageSquare, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { ActionItems } from "@/components/ActionItems";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { DealMessaging } from "@/components/DealMessaging";
import { DealStageProgress } from "@/components/DealStageProgress";
import { StageActionCard } from "@/components/StageActionCard";
import { DealTimeline } from "@/components/DealTimeline";
import { GuidedWorkflow } from "@/components/GuidedWorkflow";
import { AcceptAskingPriceButton } from "@/components/AcceptAskingPriceButton";
import { MilestoneTracker } from "@/components/MilestoneTracker";
import type { DealStage } from "@/components/DealStageProgress";

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
  
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: deal, isLoading: dealLoading, refetch: refetchDeal } = trpc.deal.getById.useQuery({ id: dealId }, {
    enabled: isAuthenticated && dealId > 0,
  });

  const { data: documents = [], refetch: refetchDocs } = trpc.document.getByDeal.useQuery({ dealId, latestOnly: true }, {
    enabled: isAuthenticated && dealId > 0,
  });

  const updateStageMutation = trpc.deal.updateStage.useMutation({
    onSuccess: () => {
      toast.success("Deal stage updated");
      refetchDeal();
    },
    onError: (error) => {
      toast.error("Failed to update stage: " + error.message);
    },
  });

  const uploadDocMutation = trpc.document.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      refetchDocs();
      setUploadingFile(false);
    },
    onError: (error) => {
      toast.error("Failed to upload document: " + error.message);
      setUploadingFile(false);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(",")[1];
        if (!base64) {
          setUploadingFile(false);
          return;
        }

        uploadDocMutation.mutate({
          dealId,
          fileName: file.name,
          fileData: base64,
          category: "general",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload document");
      setUploadingFile(false);
    }
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_TITLE}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/deals">
              <Button variant="ghost">My Deals</Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container max-w-7xl">
          {/* Deal Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{deal.listing?.businessName}</h1>
                <p className="text-muted-foreground">
                  {deal.isBuyer ? (
                    `Seller: ${deal.seller?.name}`
                  ) : (
                    <>
                      Buyer: {deal.buyer?.name}
                      <VerificationBadgeInline verificationStatus={deal.buyer?.verificationStatus} />
                    </>
                  )}
                </p>
              </div>
              <Badge variant={deal.stage === "closed" ? "default" : "secondary"} className="text-lg px-4 py-2">
                {STAGE_ORDER.find(s => s.key === deal.stage)?.label}
              </Badge>
            </div>

            {/* Deal Stage Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <DealStageProgress currentStage={deal.stage as DealStage} />
              </CardContent>
            </Card>

            {/* Stage Action Card */}
            <StageActionCard 
              currentStage={deal.stage as DealStage}
              userRole={deal.isBuyer ? "buyer" : "seller"}
              dealId={dealId}
              hasSignedNDA={deal.stage !== "initial_contact"}
              className="mt-6"
            />

            {/* Quick Action: Accept Asking Price (Buyer Only) */}
            {deal.isBuyer && deal.listing && (
              <div className="mt-6">
                <AcceptAskingPriceButton
                  dealId={dealId}
                  askingPrice={deal.listing.askingPrice || 0}
                  currentStage={deal.stage}
                  onSuccess={() => refetchDeal()}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Guided Workflow */}
            <GuidedWorkflow 
              currentStage={deal.stage as DealStage}
              userRole={deal.isBuyer ? "buyer" : "seller"}
            />

            {/* Deal Timeline */}
            <DealTimeline 
              events={[
                {
                  id: 1,
                  type: "stage_change",
                  title: "Deal Created",
                  description: "Buyer requested access to listing",
                  timestamp: new Date(deal.createdAt),
                  actor: deal.buyer?.name || undefined,
                },
                ...(deal.stage !== "initial_contact" ? [{
                  id: 2,
                  type: "nda_signed" as const,
                  title: "NDA Signed",
                  description: "Mutual NDA executed",
                  timestamp: new Date(deal.updatedAt),
                }] : []),
              ]}
            />
          </div>

          {/* Action Items Section */}
          <ActionItems 
            dealId={dealId} 
            isBuyer={deal.isBuyer} 
            isSeller={deal.isOwner} 
          />

          {/* Activity Timeline */}
          <ActivityTimeline dealId={dealId} />

          {/* Milestone Tracker */}
          <MilestoneTracker dealId={dealId} className="mt-8" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Vault
                </CardTitle>
                <CardDescription>
                  Upload and manage deal documents with automatic version control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploadingFile ? "Uploading..." : "Click to upload document"}
                        </p>
                      </div>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </Label>
                  </div>

                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No documents uploaded yet
                      </p>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              v{doc.version} • Uploaded by {doc.uploader?.name} •{" "}
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages Section */}
            <DealMessaging dealId={dealId} />
          </div>

          {/* Listing Details */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Revenue</p>
                  <p className="text-lg font-semibold">
                    ${deal.listing?.annualRevenue?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">EBITDA</p>
                  <p className="text-lg font-semibold">
                    ${deal.listing?.ebitda?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clients</p>
                  <p className="text-lg font-semibold">{deal.listing?.clientCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-lg font-semibold">{deal.listing?.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
