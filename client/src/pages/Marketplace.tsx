import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, DollarSign, Loader2, MapPin, Search, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState({
    minRevenue: "",
    maxRevenue: "",
    minEbitda: "",
    maxEbitda: "",
    location: "",
  });

  const { data: listings, isLoading } = trpc.listing.search.useQuery({
    minRevenue: filters.minRevenue ? parseInt(filters.minRevenue) : undefined,
    maxRevenue: filters.maxRevenue ? parseInt(filters.maxRevenue) : undefined,
    minEbitda: filters.minEbitda ? parseInt(filters.minEbitda) : undefined,
    maxEbitda: filters.maxEbitda ? parseInt(filters.maxEbitda) : undefined,
    location: filters.location || undefined,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
              <Button variant="default">Marketplace</Button>
            </Link>
            <Link href="/valuation">
              <Button variant="ghost">Valuation Tool</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/my-listings">
                  <Button variant="ghost">My Listings</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost">Profile</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Sign In</Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Browse MSP Opportunities</h1>
            <p className="text-lg text-muted-foreground">
              Discover managed service provider businesses available for acquisition
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Annual Revenue</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minRevenue}
                        onChange={(e) => setFilters({ ...filters, minRevenue: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxRevenue}
                        onChange={(e) => setFilters({ ...filters, maxRevenue: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>EBITDA</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minEbitda}
                        onChange={(e) => setFilters({ ...filters, minEbitda: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxEbitda}
                        onChange={(e) => setFilters({ ...filters, maxEbitda: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="City or State"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setFilters({
                        minRevenue: "",
                        maxRevenue: "",
                        minEbitda: "",
                        maxEbitda: "",
                        location: "",
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </aside>

            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : listings && listings.length > 0 ? (
                <div className="grid gap-6">
                  {listings.map((listing) => (
                    <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-2xl">{listing.businessName}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {listing.location}
                            </CardDescription>
                          </div>
                          {listing.askingPrice && (
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Asking Price</div>
                              <div className="text-2xl font-bold text-primary">
                                {formatCurrency(listing.askingPrice)}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                              <DollarSign className="h-3 w-3" />
                              Annual Revenue
                            </div>
                            <div className="font-semibold">{formatCurrency(listing.annualRevenue)}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                              <TrendingUp className="h-3 w-3" />
                              EBITDA
                            </div>
                            <div className="font-semibold">{formatCurrency(listing.ebitda)}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                              <Users className="h-3 w-3" />
                              Clients
                            </div>
                            <div className="font-semibold">{listing.clientCount}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">EBITDA Margin</div>
                            <div className="font-semibold">{listing.ebitdaMargin || "N/A"}%</div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {listing.description}
                        </p>

                        <div className="flex gap-2">
                          <Link href={`/listing/${listing.id}`}>
                            <Button>View Details</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Listings Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Try adjusting your search filters or check back later for new opportunities
                    </p>
                    {isAuthenticated && (
                      <Link href="/create-listing">
                        <Button>Create First Listing</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
