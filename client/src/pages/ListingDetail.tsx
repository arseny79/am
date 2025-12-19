import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, MapPin, Shield, ArrowLeft, FileText, TrendingUp, Server, Users, Briefcase } from "lucide-react";
import { SimilarListingsWidget } from "@/components/SimilarListingsWidget";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

// Import tab components
import { OverviewTab } from "@/components/listing/OverviewTab";
import { FinancialsTab } from "@/components/listing/FinancialsTab";
import { TechnicalTab } from "@/components/listing/TechnicalTab";
import { ClientsTeamTab } from "@/components/listing/ClientsTeamTab";
import { DocumentsTab } from "@/components/listing/DocumentsTab";

export default function ListingDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const listingId = parseInt(id || "0");

  const [showAccessRequestDialog, setShowAccessRequestDialog] = useState(false);
  const [showNDADialog, setShowNDADialog] = useState(false);
  const [, setLocation] = useLocation();
  const [ndaType, setNdaType] = useState<"clickwrap" | "pdf">("clickwrap");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [accessRequestForm, setAccessRequestForm] = useState({
    companyName: "",
    contactEmail: user?.email || "",
    contactPhone: "",
    message: "",
  });

  const { data: listing, isLoading } = trpc.listing.getById.useQuery({ id: listingId });
  const { data: hasNDA } = trpc.nda.hasSigned.useQuery(
    { listingId },
    { enabled: isAuthenticated && !!listing }
  );
  const { data: hasAccess } = trpc.accessRequest.checkAccess.useQuery(
    { listingId },
    { enabled: isAuthenticated && !!listing && listing.confidentialityLevel === 'private' }
  );
  const { data: existingDeals = [] } = trpc.deal.getMyDeals.useQuery(
    undefined,
    { enabled: isAuthenticated && !!listing, staleTime: 30000 }
  );

  const signNDAMutation = trpc.nda.signClickwrap.useMutation({
    onSuccess: () => {
      toast.success("NDA signed successfully. Confidential information is now visible.");
      setShowNDADialog(false);
      window.location.reload();
    },
  });

  const uploadNDAMutation = trpc.nda.uploadPdf.useMutation({
    onSuccess: () => {
      toast.success("NDA uploaded successfully. Waiting for seller approval.");
      setShowNDADialog(false);
      setPdfFile(null);
    },
  });

  const accessRequestMutation = trpc.accessRequest.create.useMutation({
    onSuccess: () => {
      toast.success("Access request submitted. The seller will review your request.");
      setShowAccessRequestDialog(false);
      setAccessRequestForm({
        companyName: "",
        contactEmail: user?.email || "",
        contactPhone: "",
        message: "",
      });
    },
  });

  const handleNDASubmit = async () => {
    if (ndaType === "clickwrap") {
      signNDAMutation.mutate({ listingId });
    } else if (pdfFile) {
      const pdfUrl = `https://example.com/ndas/${pdfFile.name}`;
      uploadNDAMutation.mutate({ listingId, pdfUrl });
    } else {
      toast.error("Please select a PDF file to upload");
    }
  };

  const handleAccessRequest = () => {
    if (accessRequestForm.message.length < 50) {
      toast.error("Please provide a detailed message (at least 50 characters)");
      return;
    }
    accessRequestMutation.mutate({
      listingId,
      ...accessRequestForm,
    });
  };

  const createDealMutation = trpc.deal.create.useMutation({
    onSuccess: (data) => {
      toast.success("Deal initiated! You can now message the seller.");
      setLocation(`/deal/${data.dealId}`);
    },
    onError: (error) => {
      toast.error("Failed to initiate deal: " + error.message);
    },
  });

  const handleExpressInterest = () => {
    if (!listing) return;
    createDealMutation.mutate({
      listingId,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Listing Not Found</h1>
        <Link href="/marketplace">
          <Button>Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const isSeller = user && listing.sellerId === user.id;
  const showConfidential = isSeller || 
    (listing.confidentialityLevel === "public") ||
    (listing.confidentialityLevel === "nda" && hasNDA) ||
    (listing.confidentialityLevel === "private" && hasAccess);

  const sellerName = listing.isAnonymous ? "Anonymous Seller" : `Seller #${listing.sellerId}`;

  // Check if there's an existing deal
  const existingDeal = existingDeals.find(deal => deal.listingId === listingId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_TITLE}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container max-w-7xl">
          {/* Listing Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Only show logo if listing is public OR user has access */}
                {showConfidential && listing.logoUrl && (
                  <img
                    src={listing.logoUrl}
                    alt={`${listing.businessName} logo`}
                    className="h-16 w-16 object-contain rounded-lg border border-border bg-white p-2 flex-shrink-0"
                  />
                )}
                {/* Show generic icon for confidential listings without access */}
                {!showConfidential && (
                  <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {showConfidential ? listing.businessName : "Confidential MSP Business"}
                    </h1>
                    {listing.confidentialityLevel !== "public" && (
                      <Badge variant="secondary" className="flex-shrink-0">
                        <Shield className="h-3 w-3 mr-1" />
                        {listing.confidentialityLevel === "nda" ? "NDA Required" : "Private"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{listing.location}</span>
                    {showConfidential && listing.yearFounded && <span>• Founded {listing.yearFounded}</span>}
                    {showConfidential && <span>• {sellerName}</span>}
                  </div>
                </div>
              </div>
              {listing.askingPrice && (
                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-muted-foreground">Asking Price</div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">
                    {formatCurrency(listing.askingPrice)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Access Control Alerts */}
          {!isSeller && isAuthenticated && !showConfidential && (
            <>
              {listing.confidentialityLevel === "nda" && !hasNDA && (
                <Card className="mb-6 border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      NDA Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm">
                      This listing contains confidential business information protected by a Non-Disclosure Agreement (NDA).
                    </p>
                    <Button onClick={() => setShowNDADialog(true)} className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Sign NDA to View Confidential Information
                    </Button>
                  </CardContent>
                </Card>
              )}

              {listing.confidentialityLevel === "private" && !hasAccess && (
                <Card className="mb-6 border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Private Listing - Access Request Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm">
                      This is a private listing. Please submit an access request and the seller will review it.
                    </p>
                    <Button onClick={() => setShowAccessRequestDialog(true)} className="w-full">
                      Request Access
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Existing Deal Alert */}
          {existingDeal && !isSeller && (
            <Card className="mb-6 border-green-600">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">You have an active deal for this listing</p>
                    <p className="text-sm text-muted-foreground">
                      Continue your conversation in the deal room
                    </p>
                  </div>
                  <Link href={`/deal/${existingDeal.id}`}>
                    <Button>Go to Deal Room</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab-Based Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="financials" className="gap-2 py-3">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Financials</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="gap-2 py-3">
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">Technical</span>
              </TabsTrigger>
              <TabsTrigger value="clients-team" className="gap-2 py-3">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Clients & Team</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2 py-3">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab
                listing={listing}
                isSeller={!!isSeller}
                isAuthenticated={!!isAuthenticated}
                showConfidential={!!showConfidential}
                onExpressInterest={handleExpressInterest}
                onSignNDA={() => setShowNDADialog(true)}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="financials">
              <FinancialsTab
                listing={listing}
                showConfidential={!!showConfidential}
                onSignNDA={() => setShowNDADialog(true)}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="technical">
              <TechnicalTab
                listing={listing}
                showConfidential={!!showConfidential}
                onSignNDA={() => setShowNDADialog(true)}
              />
            </TabsContent>

            <TabsContent value="clients-team">
              <ClientsTeamTab
                listing={listing}
                showConfidential={!!showConfidential}
                onSignNDA={() => setShowNDADialog(true)}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsTab listingId={listingId} isOwner={!!isSeller} />
            </TabsContent>
          </Tabs>

          {/* Similar Listings */}
          <div className="mt-12">
            <SimilarListingsWidget listingId={listingId} />
          </div>
        </div>
      </main>

      {/* NDA Dialog */}
      <Dialog open={showNDADialog} onOpenChange={setShowNDADialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sign Non-Disclosure Agreement</DialogTitle>
            <DialogDescription>
              Choose how you'd like to sign the NDA to access confidential information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={ndaType === "clickwrap" ? "default" : "outline"}
                onClick={() => setNdaType("clickwrap")}
                className="flex-1"
              >
                Electronic Signature
              </Button>
              <Button
                variant={ndaType === "pdf" ? "default" : "outline"}
                onClick={() => setNdaType("pdf")}
                className="flex-1"
              >
                Upload Signed PDF
              </Button>
            </div>

            {ndaType === "clickwrap" ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto text-sm">
                  <h3 className="font-semibold mb-2">Non-Disclosure Agreement</h3>
                  <p className="mb-4">
                    This Non-Disclosure Agreement (the "Agreement") is entered into by and between the parties for the purpose of preventing the unauthorized disclosure of Confidential Information...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    [Full NDA text would be displayed here]
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="nda-accept" className="mt-1" required />
                  <label htmlFor="nda-accept" className="text-sm">
                    I have read and agree to the terms of this Non-Disclosure Agreement
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nda-pdf">Upload Signed NDA (PDF)</Label>
                  <Input
                    id="nda-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNDADialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleNDASubmit} disabled={signNDAMutation.isPending || uploadNDAMutation.isPending}>
              {signNDAMutation.isPending || uploadNDAMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Request Dialog */}
      <Dialog open={showAccessRequestDialog} onOpenChange={setShowAccessRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Access to Private Listing</DialogTitle>
            <DialogDescription>
              Provide information about your interest to help the seller evaluate your request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={accessRequestForm.companyName}
                onChange={(e) => setAccessRequestForm({ ...accessRequestForm, companyName: e.target.value })}
                placeholder="Your company name"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Contact Email *</Label>
              <Input
                id="contact-email"
                type="email"
                value={accessRequestForm.contactEmail}
                onChange={(e) => setAccessRequestForm({ ...accessRequestForm, contactEmail: e.target.value })}
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={accessRequestForm.contactPhone}
                onChange={(e) => setAccessRequestForm({ ...accessRequestForm, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="message">Message (min 50 characters) *</Label>
              <Textarea
                id="message"
                value={accessRequestForm.message}
                onChange={(e) => setAccessRequestForm({ ...accessRequestForm, message: e.target.value })}
                placeholder="Tell the seller about your interest in this business..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {accessRequestForm.message.length} / 50 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccessRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccessRequest} disabled={accessRequestMutation.isPending}>
              {accessRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
