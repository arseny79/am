import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  Building2, Loader2, MapPin, Shield, FileText, TrendingUp,
  Server, Users, Briefcase, ArrowRight, Lock, CheckCircle2,
  Calendar, ShieldCheck, Gavel,
} from "lucide-react";
import { BrokerBadge } from "@/components/BrokerBadge";
import { SimilarListingsWidget } from "@/components/SimilarListingsWidget";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { type FieldVisibilityKey, isFieldVisible } from "@shared/fieldVisibility";

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
    { enabled: isAuthenticated && !!listing && listing.confidentialityLevel === "private" }
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
      toast.success("NDA uploaded successfully. You now have access to confidential listing details.");
      setShowNDADialog(false);
      setPdfFile(null);
    },
  });
  const accessRequestMutation = trpc.accessRequest.create.useMutation({
    onSuccess: () => {
      toast.success("Access request submitted. The seller will review your request.");
      setShowAccessRequestDialog(false);
      setAccessRequestForm({ companyName: "", contactEmail: user?.email || "", contactPhone: "", message: "" });
    },
  });
  const createDealMutation = trpc.deal.create.useMutation({
    onSuccess: (data) => {
      toast.success("Deal initiated! You can now message the seller.");
      setLocation(`/deal/${data.dealId}`);
    },
    onError: (error) => toast.error("Failed to initiate deal: " + error.message),
  });

  const handleNDASubmit = async () => {
    if (ndaType === "clickwrap") {
      signNDAMutation.mutate({ listingId });
    } else if (pdfFile) {
      const reader = new FileReader();
      reader.onload = () => uploadNDAMutation.mutate({ listingId, pdfUrl: reader.result as string });
      reader.onerror = () => toast.error("Failed to read PDF file. Please try again.");
      reader.readAsDataURL(pdfFile);
    } else {
      toast.error("Please select a PDF file to upload");
    }
  };

  const handleAccessRequest = () => {
    if (accessRequestForm.message.length < 50) {
      toast.error("Please provide a detailed message (at least 50 characters)");
      return;
    }
    accessRequestMutation.mutate({ listingId, ...accessRequestForm });
  };

  const handleExpressInterest = () => {
    if (!listing) return;
    createDealMutation.mutate({ listingId });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

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
        <Link href="/marketplace"><Button>Back to Marketplace</Button></Link>
      </div>
    );
  }

  const isSeller = user && listing.sellerId === user.id;
  const showConfidential =
    isSeller ||
    listing.confidentialityLevel === "public" ||
    (listing.confidentialityLevel === "nda" && hasNDA) ||
    (listing.confidentialityLevel === "private" && hasAccess);

  const isVisible = (field: FieldVisibilityKey): boolean => {
    if (isSeller) return true;
    return isFieldVisible(
      field,
      listing.confidentialityLevel as "public" | "nda" | "private",
      listing.fieldVisibility,
      !!showConfidential
    );
  };

  const sellerName = listing.isAnonymous ? "Anonymous Seller" : `Seller #${listing.sellerId}`;
  const displayName = showConfidential ? listing.businessName : "Confidential Business";
  const existingDeal = existingDeals.find((d) => d.listingId === listingId);

  // Sidebar CTA state
  const sidebarAction = (() => {
    if (isSeller) return "seller";
    if (!isAuthenticated) return "login";
    if (existingDeal) return "deal_room";
    if (!showConfidential) {
      if (listing.confidentialityLevel === "nda") return "sign_nda";
      if (listing.confidentialityLevel === "private") return "request_access";
    }
    return "express_interest";
  })();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 pt-10 pb-24 px-4 sm:px-8 max-w-[1280px] mx-auto w-full">

        {/* ── Hero Header ────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {/* Back + badges */}
              <div className="flex items-center gap-3 mb-4">
                <Link href="/marketplace" className="text-muted-foreground hover:text-primary text-sm font-medium flex items-center gap-1 transition-colors">
                  ← Marketplace
                </Link>
                <span className="text-border">|</span>
                <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                  Verified Listing
                </span>
                {listing.confidentialityLevel !== "public" && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    <Shield className="h-3 w-3" />
                    {listing.confidentialityLevel === "nda" ? "NDA Required" : "Private"}
                  </Badge>
                )}
                {listing.brokerId && listing.brokerInfo && (
                  <BrokerBadge
                    companyName={listing.brokerInfo.companyName}
                    brokerName={listing.brokerInfo.contactName || undefined}
                  />
                )}
              </div>

              {/* Title */}
              <div className="flex items-start gap-4 mb-4">
                {showConfidential && listing.logoUrl ? (
                  <img src={listing.logoUrl} alt={displayName} className="h-14 w-14 object-contain rounded-xl border border-border bg-white p-2 shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-xl border border-border bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-7 w-7 text-muted-foreground" />
                  </div>
                )}
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                  {displayName.toUpperCase()}
                </h1>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-medium text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {listing.location}
                </div>
                {isVisible("yearFounded") && listing.yearFounded && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    Founded {listing.yearFounded}
                  </div>
                )}
                {isVisible("employeeCount") && listing.employeeCount && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {listing.employeeCount} Team Members
                  </div>
                )}
                {showConfidential && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-primary" />
                    {sellerName}
                  </div>
                )}
              </div>
            </div>

            {/* Asking price card */}
            {isVisible("askingPrice") && listing.askingPrice && (
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border/30 text-right shrink-0 min-w-[240px]">
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1 font-bold">Asking Price</p>
                <p className="text-4xl font-extrabold text-primary tracking-tight">{formatCurrency(listing.askingPrice)}</p>
                {listing.annualRevenue && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {(listing.askingPrice / listing.annualRevenue).toFixed(1)}x Revenue
                  </p>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Financial Metrics Bar ──────────────────────────────── */}
        {(isVisible("annualRevenue") || isVisible("ebitda") || isVisible("clientCount")) &&
          (listing.annualRevenue || listing.ebitda || listing.clientCount) && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {isVisible("annualRevenue") && listing.annualRevenue && (
              <div className="bg-secondary p-8 rounded-xl border-l-4 border-primary">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-3 font-bold">Annual Revenue</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{formatCurrency(listing.annualRevenue)}</span>
                  {isVisible("monthlyRecurringRevenue") && listing.mrr && (
                    <span className="text-primary text-sm font-bold">MRR {formatCurrency(listing.mrr)}</span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-2 italic font-medium">Trailing Twelve Months</p>
              </div>
            )}
            {isVisible("ebitda") && listing.ebitda && (
              <div className="bg-secondary p-8 rounded-xl border-l-4 border-primary">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-3 font-bold">EBITDA</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{formatCurrency(listing.ebitda)}</span>
                  {isVisible("ebitdaMargin") && listing.annualRevenue && (
                    <span className="text-primary text-sm font-bold">
                      {((listing.ebitda / listing.annualRevenue) * 100).toFixed(1)}% Margin
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-2 italic font-medium">Normalised Operations</p>
              </div>
            )}
            {isVisible("clientCount") && listing.clientCount && (
              <div className="bg-secondary p-8 rounded-xl border-l-4 border-primary">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-3 font-bold">Client Base</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{listing.clientCount} Accounts</span>
                  {isVisible("clientRetentionRate") && listing.clientRetentionRate && (
                    <span className="text-primary text-sm font-bold">{listing.clientRetentionRate}% Retention</span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-2 italic font-medium">Active Managed Clients</p>
              </div>
            )}
          </section>
        )}

        {/* ── Access Control Banners ─────────────────────────────── */}
        {!isSeller && isAuthenticated && !showConfidential && (
          <div className="mb-8 p-6 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm font-medium text-foreground">
                {listing.confidentialityLevel === "nda"
                  ? "Sign an NDA to access confidential financials and business details."
                  : "Submit an access request — the seller will review it within 24 hours."}
              </p>
            </div>
            <Button
              onClick={() => listing.confidentialityLevel === "nda" ? setShowNDADialog(true) : setShowAccessRequestDialog(true)}
              className="shrink-0"
            >
              {listing.confidentialityLevel === "nda" ? "Sign NDA" : "Request Access"}
            </Button>
          </div>
        )}

        {/* ── Tabs + Sidebar Grid ────────────────────────────────── */}
        <Tabs defaultValue="overview">
          {/* Underline tab nav */}
          <div className="border-b border-border mb-10 overflow-x-auto">
            <TabsList className="flex w-max min-w-full bg-transparent rounded-none h-auto p-0 gap-0">
              {[
                { value: "overview", icon: <FileText className="h-4 w-4" />, label: "Overview" },
                { value: "financials", icon: <TrendingUp className="h-4 w-4" />, label: "Financials" },
                { value: "technical", icon: <Server className="h-4 w-4" />, label: "Technical Stack" },
                { value: "clients-team", icon: <Users className="h-4 w-4" />, label: "Clients & Team" },
                { value: "documents", icon: <Briefcase className="h-4 w-4" />, label: "Documents" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none text-muted-foreground hover:text-foreground font-semibold bg-transparent data-[state=active]:bg-transparent px-0 pb-4 mr-10 whitespace-nowrap text-sm transition-colors"
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* 2-column: content + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Main content */}
            <div className="lg:col-span-2">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab
                  listing={listing}
                  isSeller={!!isSeller}
                  isAuthenticated={!!isAuthenticated}
                  showConfidential={!!showConfidential}
                  isVisible={isVisible}
                  onExpressInterest={handleExpressInterest}
                  onSignNDA={() => setShowNDADialog(true)}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>
              <TabsContent value="financials" className="mt-0">
                <FinancialsTab listing={listing} showConfidential={!!showConfidential} onSignNDA={() => setShowNDADialog(true)} formatCurrency={formatCurrency} />
              </TabsContent>
              <TabsContent value="technical" className="mt-0">
                <TechnicalTab listing={listing} showConfidential={!!showConfidential} onSignNDA={() => setShowNDADialog(true)} />
              </TabsContent>
              <TabsContent value="clients-team" className="mt-0">
                <ClientsTeamTab listing={listing} showConfidential={!!showConfidential} onSignNDA={() => setShowNDADialog(true)} formatCurrency={formatCurrency} />
              </TabsContent>
              <TabsContent value="documents" className="mt-0">
                <DocumentsTab listingId={listingId} isOwner={!!isSeller} />
              </TabsContent>
            </div>

            {/* Sticky sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              {/* Main CTA card */}
              {!isSeller && (
                <div className="bg-foreground p-8 rounded-2xl shadow-xl text-background">
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">
                    {existingDeal ? "Deal in Progress" : "Interested in this business?"}
                  </h3>
                  <p className="text-background/70 text-sm mb-8 leading-relaxed">
                    {existingDeal
                      ? "You have an active deal for this listing. Continue your conversation in the deal room."
                      : isAuthenticated
                      ? showConfidential
                        ? "Request full financial access and due diligence documents."
                        : listing.confidentialityLevel === "nda"
                        ? "Sign an NDA to unlock confidential financials and begin due diligence."
                        : "Submit an access request to start the acquisition process."
                      : "Sign in to express interest and start the acquisition process."}
                  </p>
                  <div className="space-y-3">
                    {sidebarAction === "deal_room" && (
                      <Link href={`/deal/${existingDeal!.id}`}>
                        <button className="w-full bg-primary py-4 rounded-xl font-bold text-white hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                          Go to Deal Room <ArrowRight className="h-4 w-4" />
                        </button>
                      </Link>
                    )}
                    {sidebarAction === "express_interest" && (
                      <button
                        onClick={handleExpressInterest}
                        disabled={createDealMutation.isPending}
                        className="w-full bg-primary py-4 rounded-xl font-bold text-white hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {createDealMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Express Interest <ArrowRight className="h-4 w-4" /></>}
                      </button>
                    )}
                    {sidebarAction === "sign_nda" && (
                      <button
                        onClick={() => setShowNDADialog(true)}
                        className="w-full bg-primary py-4 rounded-xl font-bold text-white hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        Sign NDA to Continue <Lock className="h-4 w-4" />
                      </button>
                    )}
                    {sidebarAction === "request_access" && (
                      <button
                        onClick={() => setShowAccessRequestDialog(true)}
                        className="w-full bg-primary py-4 rounded-xl font-bold text-white hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        Request Access <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    {sidebarAction === "login" && (
                      <a href={getLoginUrl()} className="w-full bg-primary py-4 rounded-xl font-bold text-white hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 block text-center">
                        Sign In to Express Interest <ArrowRight className="h-4 w-4 inline" />
                      </a>
                    )}
                    {sidebarAction !== "login" && (
                      <button className="w-full bg-background/10 py-4 rounded-xl font-bold text-background hover:bg-background/20 transition-all active:scale-[0.98]">
                        Download Teaser PDF
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-center mt-6 uppercase tracking-widest text-background/40 font-bold">
                    Responds within 24 hours
                  </p>
                </div>
              )}

              {/* Trust signals */}
              <div className="bg-secondary p-8 rounded-2xl border border-border/30 space-y-6">
                <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground border-b border-border pb-4">
                  Transaction Protection
                </h4>
                {[
                  { icon: <ShieldCheck className="h-5 w-5 text-primary" />, title: "Escrow Protected", desc: "Funds are held in neutral third-party escrow during closing." },
                  { icon: <CheckCircle2 className="h-5 w-5 text-primary" />, title: "Verified Listing", desc: "Financial statements and documents reviewed by our team." },
                  { icon: <Gavel className="h-5 w-5 text-primary" />, title: "NDA Protection", desc: "Strict non-disclosure agreements enforced for all participants." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    {item.icon}
                    <div>
                      <p className="font-bold text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </Tabs>

        {/* Similar listings */}
        <div className="mt-16">
          <SimilarListingsWidget listingId={listingId} />
        </div>
      </main>

      {/* ── NDA Dialog ─────────────────────────────────────────── */}
      <Dialog open={showNDADialog} onOpenChange={setShowNDADialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sign Non-Disclosure Agreement</DialogTitle>
            <DialogDescription>Choose how you'd like to sign the NDA to access confidential information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button variant={ndaType === "clickwrap" ? "default" : "outline"} onClick={() => setNdaType("clickwrap")} className="flex-1">Electronic Signature</Button>
              <Button variant={ndaType === "pdf" ? "default" : "outline"} onClick={() => setNdaType("pdf")} className="flex-1">Upload Signed PDF</Button>
            </div>
            {ndaType === "clickwrap" ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto text-sm">
                  <h3 className="font-semibold mb-2">Non-Disclosure Agreement</h3>
                  <p className="mb-4">This Non-Disclosure Agreement (the "Agreement") is entered into by and between the parties for the purpose of preventing the unauthorized disclosure of Confidential Information...</p>
                  <p className="text-xs text-muted-foreground">[Full NDA text would be displayed here]</p>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="nda-accept" className="mt-1" required />
                  <label htmlFor="nda-accept" className="text-sm">I have read and agree to the terms of this Non-Disclosure Agreement</label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nda-pdf">Upload Signed NDA (PDF)</Label>
                  <Input id="nda-pdf" type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNDADialog(false)}>Cancel</Button>
            <Button onClick={handleNDASubmit} disabled={signNDAMutation.isPending || uploadNDAMutation.isPending}>
              {signNDAMutation.isPending || uploadNDAMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Access Request Dialog ───────────────────────────────── */}
      <Dialog open={showAccessRequestDialog} onOpenChange={setShowAccessRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Access to Private Listing</DialogTitle>
            <DialogDescription>Provide information about your interest to help the seller evaluate your request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company-name">Company Name *</Label>
              <Input id="company-name" value={accessRequestForm.companyName} onChange={(e) => setAccessRequestForm({ ...accessRequestForm, companyName: e.target.value })} placeholder="Your company name" />
            </div>
            <div>
              <Label htmlFor="contact-email">Contact Email *</Label>
              <Input id="contact-email" type="email" value={accessRequestForm.contactEmail} onChange={(e) => setAccessRequestForm({ ...accessRequestForm, contactEmail: e.target.value })} placeholder="your.email@example.com" />
            </div>
            <div>
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input id="contact-phone" type="tel" value={accessRequestForm.contactPhone} onChange={(e) => setAccessRequestForm({ ...accessRequestForm, contactPhone: e.target.value })} placeholder="+1 (555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="message">Message (min 50 characters) *</Label>
              <Textarea id="message" value={accessRequestForm.message} onChange={(e) => setAccessRequestForm({ ...accessRequestForm, message: e.target.value })} placeholder="Tell the seller about your interest in this business..." rows={5} />
              <p className="text-xs text-muted-foreground mt-1">{accessRequestForm.message.length} / 50 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccessRequestDialog(false)}>Cancel</Button>
            <Button onClick={handleAccessRequest} disabled={accessRequestMutation.isPending}>
              {accessRequestMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
