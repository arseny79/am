import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Search, MapPin, DollarSign, TrendingUp, Users, Building2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { SERVICE_CATEGORIES, INDUSTRY_VERTICALS } from "@shared/mspCategories";

export default function Marketplace() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");
  const [revenueFilter, setRevenueFilter] = useState<string>("all");

  // Fetch all active listings
  const { data: listings, isLoading } = trpc.listing.search.useQuery({});

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
    
    if (categoryFilter !== "all" && listing.serviceCategory !== categoryFilter) return false;
    if (verticalFilter !== "all" && listing.industryVertical !== verticalFilter) return false;
    
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">MSP M&A Marketplace</span>
            </div>
          </Link>
          
          <nav className="flex items-center gap-8">
            <Link href="/buy-asset">
              <a className="text-foreground hover:text-primary font-medium transition-colors">Buy</a>
            </Link>
            <Link href="/marketplace">
              <a className="text-primary font-medium">Browse</a>
            </Link>
            <Link href="/create-listing">
              <a className="text-foreground hover:text-primary font-medium transition-colors">Sell</a>
            </Link>
          </nav>
          
          <div>
            {isAuthenticated ? (
              <Link href="/profile">
                <Button variant="default">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button variant="default">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse MSP Businesses</h1>
          <p className="text-muted-foreground text-lg">
            Discover managed service provider businesses available for acquisition
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Service Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(SERVICE_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Industry Vertical</label>
                <Select value={verticalFilter} onValueChange={setVerticalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Verticals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verticals</SelectItem>
                    {Object.entries(INDUSTRY_VERTICALS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading listings...</p>
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
                <Link key={listing.id} href={`/listing/${listing.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl">
                          {listing.isAnonymous ? "Anonymous Listing" : listing.businessName}
                        </CardTitle>
                        {listing.confidentialityLevel === "public" && (
                          <Badge variant="secondary">Public</Badge>
                        )}
                        {listing.confidentialityLevel === "nda" && (
                          <Badge variant="outline">NDA Required</Badge>
                        )}
                        {listing.confidentialityLevel === "private" && (
                          <Badge>Private</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {listing.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Asking Price</p>
                            <p className="font-semibold">{formatCurrency(listing.askingPrice)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">MRR</p>
                            <p className="font-semibold">{formatCurrency(listing.monthlyRecurringRevenue)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Clients</p>
                            <p className="font-semibold">{listing.clientCount || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="font-semibold">{listing.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="flex flex-wrap gap-2">
                        {listing.serviceCategory && (
                          <Badge variant="secondary" className="text-xs">
                            {SERVICE_CATEGORIES[listing.serviceCategory as keyof typeof SERVICE_CATEGORIES]}
                          </Badge>
                        )}
                        {listing.industryVertical && (
                          <Badge variant="outline" className="text-xs">
                            {INDUSTRY_VERTICALS[listing.industryVertical as keyof typeof INDUSTRY_VERTICALS]}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No listings found matching your criteria</p>
              <Button onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setVerticalFilter("all");
                setRevenueFilter("all");
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
