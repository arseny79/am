import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Search, MapPin, DollarSign, TrendingUp, Users, Building2, Heart, Loader2 } from "lucide-react";
import { isFieldVisible } from "@shared/fieldVisibility";
import { useState } from "react";
import { Link } from "wouter";
import { BrokerBadge } from "@/components/BrokerBadge";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/PublicHeader";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [revenueFilter, setRevenueFilter] = useState<string>("all");

  // Fetch all active listings and categories
  const { data: listings, isLoading } = trpc.listing.search.useQuery({});
  const { data: categories = [] } = trpc.category.list.useQuery();
  const categoryGroups = categories.reduce<Record<string, typeof categories>>((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {});

  // Fetch site settings for customizable header
  const { data: siteSettings } = trpc.admin.getSiteSettings.useQuery();

  // Filter listings based on selected filters
  const filteredListings = listings?.filter((listing: any) => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        listing.businessName?.toLowerCase().includes(searchLower) ||
        listing.description?.toLowerCase().includes(searchLower) ||
        listing.location?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    if (categoryFilter !== "all" && String(listing.categoryId) !== categoryFilter) return false;
    
    if (revenueFilter !== "all") {
      const mrr = listing.monthlyRecurringRevenue || 0;
      const annualRevenue = mrr * 12;
      
      switch (revenueFilter) {
        case "0-500k":
          if (annualRevenue >= 500000) return false;
          break;
        case "500k-1m":
          if (annualRevenue < 500000 || annualRevenue >= 1000000) return false;
          break;
        case "1m-5m":
          if (annualRevenue < 1000000 || annualRevenue >= 5000000) return false;
          break;
        case "5m+":
          if (annualRevenue < 5000000) return false;
          break;
      }
    }
    
    return true;
  });

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number | null) => {
    if (!num) return "N/A";
    return new Intl.NumberFormat("en-US").format(num);
  };

  // Structured data for marketplace
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "MSP Marketplace - Browse Businesses for Sale",
    "description": "Browse managed service provider businesses available for acquisition. Filter by revenue, location, and industry vertical.",
    "url": "https://msp.investments/marketplace"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="MSP Marketplace - Browse Businesses for Sale"
        description="Browse managed service provider businesses available for acquisition. Filter by revenue, location, and industry vertical."
        canonical="https://msp.investments/marketplace"
        structuredData={structuredData}
      />
      <PublicHeader />

      <div className="container py-8">
        <Breadcrumb items={[
          { label: "Marketplace" }
        ]} />
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {siteSettings?.marketplaceHeading || "Browse MSP Businesses"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {siteSettings?.marketplaceSubheading || "Discover managed service provider businesses available for acquisition"}
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find the perfect MSP business for your acquisition criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by business name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categoryGroups).map(([group, cats]) => (
                      <div key={group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {group}
                        </div>
                        {cats.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Annual Revenue</label>
                <Select value={revenueFilter} onValueChange={setRevenueFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Revenue Ranges" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Revenue Ranges</SelectItem>
                    <SelectItem value="0-500k">$0 - $500K</SelectItem>
                    <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                    <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                    <SelectItem value="5m+">$5M+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-[340px]">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-6 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-16 bg-muted rounded" />
                      <div className="h-16 bg-muted rounded" />
                      <div className="h-16 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredListings && filteredListings.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} categories={categories} formatCurrency={formatCurrency} formatNumber={formatNumber} />
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No listings found</p>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
              <Button onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setRevenueFilter("all");
              }}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}

// Separate component for listing cards with save functionality
function ListingCard({ listing, categories, formatCurrency, formatNumber }: { listing: any; categories: any[]; formatCurrency: (n: number | null) => string; formatNumber: (n: number | null) => string }) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: isSaved } = trpc.savedListings.isSaved.useQuery(
    { listingId: listing.id },
    { enabled: isAuthenticated }
  );

  const saveMutation = trpc.savedListings.save.useMutation({
    onSuccess: () => {
      utils.savedListings.isSaved.invalidate({ listingId: listing.id });
      toast.success("Listing saved!");
    },
    onError: (error) => {
      if (error.message.includes("already saved")) {
        toast.error("You've already saved this listing");
      } else {
        toast.error("Failed to save listing");
      }
    },
  });

  const unsaveMutation = trpc.savedListings.unsave.useMutation({
    onSuccess: () => {
      utils.savedListings.isSaved.invalidate({ listingId: listing.id });
      toast.success("Listing removed from saved");
    },
  });

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error("Please login to save listings");
      return;
    }

    if (isSaved) {
      unsaveMutation.mutate({ listingId: listing.id });
    } else {
      saveMutation.mutate({ listingId: listing.id });
    }
  };


  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="hover:shadow-lg transition-all cursor-pointer h-full group relative">
        {/* Save Button */}
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleSaveClick}
            disabled={saveMutation.isPending || unsaveMutation.isPending}
          >
            {saveMutation.isPending || unsaveMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart className={`h-5 w-5 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
            )}
          </Button>
        )}

        <CardContent className="p-6">
          {/* Header with Logo and Title */}
          <div className="flex items-start gap-4 mb-4">
            {/* Logo/Avatar - Hidden for NDA/Private listings */}
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {(listing.confidentialityLevel === "nda" || listing.confidentialityLevel === "private") ? (
                <div className="text-primary">
                  <Building2 className="h-8 w-8" />
                </div>
              ) : listing.logoUrl ? (
                <img src={listing.logoUrl} alt={listing.businessName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-primary">
                  <Building2 className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Title and Location */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1 line-clamp-2">
                {listing.isAnonymous
                  ? "Anonymous Listing"
                  : listing.businessName}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{listing.location}</span>
              </div>
              {listing.categoryId && (() => {
                const cat = categories.find((c: any) => c.id === listing.categoryId);
                return cat ? (
                  <span className="text-xs text-primary font-medium mt-1 block">{cat.label}</span>
                ) : null;
              })()}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {listing.description}
          </p>

          {/* Key Metrics - Visual Boxes */}
          {(() => {
            const conf = listing.confidentialityLevel as "public" | "nda" | "private";
            const fv = listing.fieldVisibility;
            const canSeeRevenue = isFieldVisible("annualRevenue", conf, fv, false);
            const canSeeEbitda = isFieldVisible("ebitda", conf, fv, false);
            const canSeeClients = isFieldVisible("clientCount", conf, fv, false);
            const canSeePrice = isFieldVisible("askingPrice", conf, fv, false);
            const gatedLabel = conf === "nda" ? "NDA Required" : conf === "private" ? "Private" : "—";
            return (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                    <p className="font-bold text-sm">{canSeeRevenue ? formatCurrency(listing.annualRevenue) : gatedLabel}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-1">EBITDA</p>
                    <p className="font-bold text-sm">{canSeeEbitda ? formatCurrency(listing.ebitda) : gatedLabel}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-1">Clients</p>
                    <p className="font-bold text-sm">{canSeeClients ? formatNumber(listing.clientCount) : gatedLabel}</p>
                  </div>
                </div>

                {/* Asking Price - Prominent */}
                <div className="border-t pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
                    <p className="text-2xl font-bold text-primary">{canSeePrice ? formatCurrency(listing.askingPrice) : gatedLabel}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col gap-1 items-end">
                    {listing.confidentialityLevel === "nda" && (
                      <Badge variant="outline" className="text-xs">NDA</Badge>
                    )}
                    {listing.confidentialityLevel === "private" && (
                      <Badge variant="secondary" className="text-xs">Private</Badge>
                    )}
                    {listing.listingTier === "featured" && (
                      <Badge variant="default" className="text-xs">Featured</Badge>
                    )}
                    {listing.listingTier === "premium" && (
                      <Badge variant="default" className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500">Premium</Badge>
                    )}
                    {listing.brokerId && (
                      <BrokerBadge
                        variant="compact"
                        companyName={listing.brokerInfo?.companyName}
                        brokerName={listing.brokerInfo?.contactName || undefined}
                      />
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>
    </Link>
  );
}
