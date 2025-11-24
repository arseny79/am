import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, DollarSign, Loader2, MapPin, Shield, TrendingUp, Users, Upload, FileText, MessageSquare } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

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
  const { data: hasNDA } = trpc.nda.hasSigned.useQuery({ listingId }, { enabled: isAuthenticated });
  const { data: hasAccess } = trpc.accessRequest.checkAccess.useQuery({ listingId }, { enabled: isAuthenticated });
  const { data: existingDeals = [] } = trpc.deal.getMyDeals.useQuery(undefined, { enabled: isAuthenticated });

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
      // In a real implementation, you would upload the file to S3 first
      // For now, we'll use a placeholder URL
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
      setLocation(`/dashboard/deals/${data.dealId}`);
    },
    onError: (error) => {
      toast.error("Failed to initiate deal: " + error.message);
    },
  });

  const handleStartConversation = () => {
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
            <Link href="/marketplace">
              <Button variant="ghost">Back to Marketplace</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{listing.businessName}</h1>
                  {listing.confidentialityLevel !== "public" && (
                    <Badge variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      {listing.confidentialityLevel === "nda" ? "NDA Required" : "Private"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                  {listing.yearFounded && <span>• Founded {listing.yearFounded}</span>}
                  <span>• {sellerName}</span>
                </div>
              </div>
              {listing.askingPrice && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Asking Price</div>
                  <div className="text-4xl font-bold text-primary">
                    {formatCurrency(listing.askingPrice)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Access Control Cards */}
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
                    <p className="mb-4">
                      This listing requires an NDA to view confidential information. You can either sign our standard NDA or upload a signed copy of the seller's NDA template.
                    </p>
                    <Button onClick={() => setShowNDADialog(true)}>
                      Sign NDA
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
                    <p className="mb-4">
                      This is a private listing. Please submit an access request with information about your interest and the seller will review your request.
                    </p>
                    <Button onClick={() => setShowAccessRequestDialog(true)}>
                      Request Access
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {showConfidential && (
            <>
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5" />
                      Annual Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(listing.annualRevenue)}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      MRR: {formatCurrency(listing.monthlyRecurringRevenue)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5" />
                      EBITDA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(listing.ebitda)}</div>
                    {listing.ebitdaMargin && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Margin: {listing.ebitdaMargin}%
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{listing.clientCount}</div>
                    {listing.clientRetentionRate && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Retention: {listing.clientRetentionRate}%
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Business Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{listing.description}</p>
                </CardContent>
              </Card>

              {(listing.clientList || listing.financialDetails) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Confidential Information
                      <Badge variant="default">Protected</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {listing.clientList && (
                      <div>
                        <h4 className="font-semibold mb-2">Client List</h4>
                        <p className="whitespace-pre-wrap text-sm">{listing.clientList}</p>
                      </div>
                    )}
                    {listing.financialDetails && (
                      <div>
                        <h4 className="font-semibold mb-2">Financial Details</h4>
                        <p className="whitespace-pre-wrap text-sm">{listing.financialDetails}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!isAuthenticated && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="mb-4">Sign in to view listing details and contact the seller</p>
                <a href={getLoginUrl()}>
                  <Button size="lg">Sign In</Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Start Conversation CTA (for authenticated buyers) */}
          {isAuthenticated && !isSeller && showConfidential && (
            <Card className="mt-6 border-primary">
              <CardContent className="py-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Interested in this business?</h3>
                    <p className="text-muted-foreground">
                      {existingDeals.some((d: any) => d.listingId === listingId)
                        ? "You already have an active conversation with this seller."
                        : "Start a conversation with the seller to discuss this opportunity."}
                    </p>
                  </div>
                  {existingDeals.some((d: any) => d.listingId === listingId) ? (
                    <Link href={`/dashboard/deals/${existingDeals.find((d: any) => d.listingId === listingId)?.id}`}>
                      <Button size="lg">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Conversation
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={handleStartConversation}
                      disabled={createDealMutation.isPending}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {createDealMutation.isPending ? "Starting..." : "Start Conversation"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* NDA Dialog */}
      <Dialog open={showNDADialog} onOpenChange={setShowNDADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign NDA</DialogTitle>
            <DialogDescription>
              Choose how you would like to sign the NDA for this listing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={ndaType === "clickwrap" ? "default" : "outline"}
                onClick={() => setNdaType("clickwrap")}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Click-wrap NDA
              </Button>
              <Button
                variant={ndaType === "pdf" ? "default" : "outline"}
                onClick={() => setNdaType("pdf")}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Signed PDF
              </Button>
            </div>

            {ndaType === "clickwrap" && (
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto text-sm">
                <h4 className="font-semibold mb-2">Non-Disclosure Agreement</h4>
                <p className="text-muted-foreground">
                  This Non-Disclosure Agreement ("Agreement") is entered into by and between the parties
                  for the purpose of preventing the unauthorized disclosure of Confidential Information.
                  The parties agree to enter into a confidential relationship concerning the disclosure
                  of certain proprietary and confidential information...
                </p>
              </div>
            )}

            {ndaType === "pdf" && (
              <div>
                <Label>Upload Signed NDA PDF</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="mt-2"
                />
                {pdfFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {pdfFile.name}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNDADialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleNDASubmit}
              disabled={signNDAMutation.isPending || uploadNDAMutation.isPending || (ndaType === "pdf" && !pdfFile)}
            >
              {(signNDAMutation.isPending || uploadNDAMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {ndaType === "clickwrap" ? "Sign NDA" : "Upload NDA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Request Dialog */}
      <Dialog open={showAccessRequestDialog} onOpenChange={setShowAccessRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Access to Private Listing</DialogTitle>
            <DialogDescription>
              Please provide information about yourself and your interest in this business.
              The seller will review your request and respond accordingly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                value={accessRequestForm.companyName}
                onChange={(e) => setAccessRequestForm({ ...accessRequestForm, companyName: e.target.value })}
                placeholder="Your company name"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={accessRequestForm.contactEmail}
                onChange={(e) => setAccessRequestForm({ ...accessRequestForm, contactEmail: e.target.value })}
                placeholder="your.email@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={accessRequestForm.contactPhone}
                onChange={(e) => setAccessRequestForm({ ...accessRequestForm, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={accessRequestForm.message}
                onChange={(e) => setAccessRequestForm({ ...accessRequestForm, message: e.target.value })}
                placeholder="Please describe your interest in this business, your acquisition criteria, and why you would be a good fit... (minimum 50 characters)"
                rows={6}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                {accessRequestForm.message.length} / 50 characters minimum
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccessRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAccessRequest}
              disabled={accessRequestMutation.isPending || accessRequestForm.message.length < 50}
            >
              {accessRequestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
