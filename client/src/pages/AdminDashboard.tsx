import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, TrendingUp, Users, FileText, DollarSign, Eye, CheckCircle, XCircle, CreditCard, ExternalLink, Settings, BarChart3, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import PlatformDocumentsManager from "@/components/PlatformDocumentsManager";
import { TOSAcceptanceAuditLog } from "./admin/components/TOSAcceptanceAuditLog";
import { VerificationReviewDashboard } from "./admin/components/VerificationReviewDashboard";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Analytics configuration state
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [statcounterId, setStatcounterId] = useState("");
  const [statcounterSecurity, setStatcounterSecurity] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // SEO metadata state
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [seoLoading, setSeoLoading] = useState(false);
  
  // Fetch current analytics settings
  const { data: siteSettings, refetch: refetchSettings } = trpc.admin.getSiteSettings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  
  // Update local state when settings are loaded
  useEffect(() => {
    if (siteSettings) {
      setGoogleAnalyticsId(siteSettings.googleAnalyticsId || "");
      setStatcounterId(siteSettings.statcounterId || "");
      setStatcounterSecurity(siteSettings.statcounterSecurity || "");
      setSeoTitle(siteSettings.seoTitle || "");
      setSeoDescription(siteSettings.seoDescription || "");
      setOgTitle(siteSettings.ogTitle || "");
      setOgDescription(siteSettings.ogDescription || "");
      setOgImage(siteSettings.ogImage || "");
    }
  }, [siteSettings]);
  
  // Update analytics settings mutation
  const updateAnalyticsMutation = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: () => {
      toast.success("Analytics settings saved successfully");
      refetchSettings();
      setAnalyticsLoading(false);
    },
    onError: (error) => {
      toast.error("Failed to save analytics settings: " + error.message);
      setAnalyticsLoading(false);
    },
  });
  
  const handleSaveAnalytics = () => {
    setAnalyticsLoading(true);
    updateAnalyticsMutation.mutate({
      googleAnalyticsId: googleAnalyticsId || null,
      statcounterId: statcounterId || null,
      statcounterSecurity: statcounterSecurity || null,
    });
  };
  
  // Update SEO settings mutation
  const updateSeoMutation = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: () => {
      toast.success("SEO settings saved successfully");
      refetchSettings();
      setSeoLoading(false);
    },
    onError: (error) => {
      toast.error("Failed to save SEO settings: " + error.message);
      setSeoLoading(false);
    },
  });
  
  const handleSaveSeo = () => {
    setSeoLoading(true);
    updateSeoMutation.mutate({
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || null,
    });
  };

  const { data: allListings = [], isLoading: listingsLoading, refetch } = trpc.listing.search.useQuery({}, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateListingMutation = trpc.listing.update.useMutation({
    onSuccess: () => {
      toast.success("Listing updated");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update listing: " + error.message);
    },
  });

  if (authLoading || listingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to access admin dashboard</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Access denied. Admin privileges required.</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  // Calculate analytics
  const publishedListings = allListings.filter(l => l.isPublished);
  const draftListings = allListings.filter(l => !l.isPublished);
  const totalGMV = publishedListings.reduce((sum, l) => sum + (l.askingPrice || l.estimatedValuation || 0), 0);
  const avgValuation = publishedListings.length > 0 ? totalGMV / publishedListings.length : 0;

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
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/deals">
              <Button variant="ghost">Deals</Button>
            </Link>
            <Link href="/admin">
              <Button variant="default">Admin</Button>
            </Link>
            <NotificationBell />
            <UserDropdown user={user!} />
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-7xl">
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage listings, monitor marketplace activity, and view analytics
                </p>
              </div>
              <Link href="/admin/price-plans">
                <Button variant="outline" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price Plans
                </Button>
              </Link>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allListings.length}</div>
                <p className="text-xs text-muted-foreground">
                  {publishedListings.length} published, {draftListings.length} draft
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total GMV</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(totalGMV / 1000000).toFixed(1)}M</div>
                <p className="text-xs text-muted-foreground">
                  Gross Merchandise Value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Valuation</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(avgValuation / 1000).toFixed(0)}K</div>
                <p className="text-xs text-muted-foreground">
                  Average listing value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(allListings.map(l => l.sellerId)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique sellers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stripe Configuration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Payment Configuration
              </CardTitle>
              <CardDescription>
                Manage your Stripe integration for collecting listing fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuration Status
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your Stripe API keys are automatically configured. To update them, use the <strong>Settings → Payment</strong> panel in the Management UI (accessible via the header icon).
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Stripe Secret Key: Configured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Stripe Publishable Key: Configured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Webhook Secret: Configured</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Test Mode</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use test card: <code className="bg-slate-100 px-2 py-0.5 rounded">4242 4242 4242 4242</code>
                  </p>
                  <a
                    href="https://dashboard.stripe.com/test/payments"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Test Payments
                    </Button>
                  </a>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Webhooks</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Endpoint: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">/api/stripe/webhook</code>
                  </p>
                  <a
                    href="https://dashboard.stripe.com/test/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Configure Webhooks
                    </Button>
                  </a>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">⚠️ Important Notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Claim your Stripe sandbox as soon as possible</li>
                  <li>After KYC verification, update to live keys in Settings → Payment</li>
                  <li>A 99% discount promo code is available for live mode testing</li>
                  <li>Minimum transaction: $0.50 USD (Stripe requirement)</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="default" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Stripe Dashboard
                  </Button>
                </a>
                <a
                  href="https://dashboard.stripe.com/test/products"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Manage Products
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Configuration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Configuration
              </CardTitle>
              <CardDescription>
                Configure Google Analytics and StatCounter tracking for your marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Analytics */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="googleAnalyticsId" className="text-base font-semibold">
                    Google Analytics
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your Google Analytics Measurement ID (e.g., G-XXXXXXXXXX for GA4 or UA-XXXXXXXXX-X for Universal Analytics)
                  </p>
                </div>
                <Input
                  id="googleAnalyticsId"
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                />
                {googleAnalyticsId && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Google Analytics will be loaded on all pages</span>
                  </div>
                )}
              </div>

              {/* StatCounter */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="statcounterId" className="text-base font-semibold">
                    StatCounter
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your StatCounter Project ID and Security Code
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="statcounterId" className="text-sm">
                      Project ID
                    </Label>
                    <Input
                      id="statcounterId"
                      placeholder="12345678"
                      value={statcounterId}
                      onChange={(e) => setStatcounterId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="statcounterSecurity" className="text-sm">
                      Security Code
                    </Label>
                    <Input
                      id="statcounterSecurity"
                      placeholder="abcd1234"
                      value={statcounterSecurity}
                      onChange={(e) => setStatcounterSecurity(e.target.value)}
                    />
                  </div>
                </div>
                {statcounterId && statcounterSecurity && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>StatCounter will be loaded on all pages</span>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSaveAnalytics} 
                  disabled={analyticsLoading}
                  className="w-full md:w-auto"
                >
                  {analyticsLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Analytics Settings"
                  )}
                </Button>
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📊 How to find your tracking codes:</h4>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>
                    <strong>Google Analytics:</strong> Go to Admin → Data Streams → Select your stream → Find "Measurement ID"
                  </li>
                  <li>
                    <strong>StatCounter:</strong> Log in to StatCounter → Project → Config → Find "Project ID" and "Security Code"
                  </li>
                  <li>
                    After saving, the tracking scripts will automatically load on all pages of your marketplace
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* SEO Metadata Configuration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Metadata Configuration
              </CardTitle>
              <CardDescription>
                Optimize your marketplace for search engines and social media sharing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic SEO */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-3">Basic SEO</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These settings control how your homepage appears in search engine results
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">Homepage Title</Label>
                  <Input
                    id="seoTitle"
                    placeholder="MSP M&A Marketplace - Buy & Sell MSP Businesses"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoTitle.length}/60 characters (optimal: 50-60)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">Meta Description</Label>
                  <Textarea
                    id="seoDescription"
                    placeholder="Discover MSP businesses for sale. Connect with serious buyers and sellers, get instant valuations, and close deals securely."
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoDescription.length}/160 characters (optimal: 150-160)
                  </p>
                </div>
              </div>

              {/* Open Graph / Social Media */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-base font-semibold mb-3">Open Graph / Social Media</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Control how your site appears when shared on Facebook, LinkedIn, Twitter, etc.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogTitle">Social Media Title</Label>
                  <Input
                    id="ogTitle"
                    placeholder="Buy or Sell Your MSP Business with Confidence"
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the SEO title
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogDescription">Social Media Description</Label>
                  <Textarea
                    id="ogDescription"
                    placeholder="The simplest way to connect with serious buyers and sellers. Get instant valuations, browse opportunities, and close deals."
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the meta description
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogImage">Social Media Image URL</Label>
                  <Input
                    id="ogImage"
                    placeholder="https://yourdomain.com/og-image.png"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 1200×630px (PNG or JPG)
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSaveSeo} 
                  disabled={seoLoading}
                  className="w-full md:w-auto"
                >
                  {seoLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save SEO Settings"
                  )}
                </Button>
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🔍 SEO Best Practices:</h4>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>
                    <strong>Title:</strong> Include your main keyword and keep it under 60 characters
                  </li>
                  <li>
                    <strong>Description:</strong> Write a compelling summary that encourages clicks (150-160 chars)
                  </li>
                  <li>
                    <strong>Social Image:</strong> Use a high-quality image with text overlay for better engagement
                  </li>
                  <li>
                    Test your Open Graph tags with <a href="https://www.opengraph.xyz/" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenGraph.xyz</a> or Facebook's Sharing Debugger
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Platform Documents Management */}
          <PlatformDocumentsManager />

          {/* TOS Acceptance Audit Log           <div className="space-y-6">
            <VerificationReviewDashboard />
            <TOSAcceptanceAuditLog />
          </div>
          {/* Listings Management */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Moderation</CardTitle>
              <CardDescription>
                Review and manage all marketplace listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No listings yet</p>
                ) : (
                  allListings.map((listing) => (
                    <div key={listing.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{listing.businessName}</h3>
                            <Badge variant={listing.isPublished ? "default" : "secondary"}>
                              {listing.isPublished ? "Published" : "Draft"}
                            </Badge>
                            <Badge variant="outline">{listing.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {listing.location}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Annual Revenue</p>
                          <p className="font-semibold">${listing.annualRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">EBITDA</p>
                          <p className="font-semibold">${listing.ebitda.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Asking Price</p>
                          <p className="font-semibold">
                            {listing.askingPrice ? `$${listing.askingPrice.toLocaleString()}` : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Clients</p>
                          <p className="font-semibold">{listing.clientCount}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/listing/${listing.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        
                        {!listing.isPublished && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              updateListingMutation.mutate({
                                id: listing.id,
                                isPublished: true,
                                status: "active",
                              });
                            }}
                            disabled={updateListingMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Publish
                          </Button>
                        )}

                        {listing.isPublished && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              updateListingMutation.mutate({
                                id: listing.id,
                                isPublished: false,
                                status: "withdrawn",
                              });
                            }}
                            disabled={updateListingMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Unpublish
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
