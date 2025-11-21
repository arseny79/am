import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, Users, MapPin, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SERVICE_CATEGORIES, INDUSTRY_VERTICALS } from "@shared/mspCategories";

export default function FeaturedListings() {
  // Fetch active listings and take first 6
  const { data: listings, isLoading } = trpc.listing.search.useQuery({});
  
  const featuredListings = listings?.slice(0, 6) || [];

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading || featuredListings.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Opportunities</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover MSP businesses available for acquisition right now
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featuredListings.map((listing: any) => (
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

        <div className="text-center">
          <Link href="/marketplace">
            <Button size="lg" variant="outline">
              View All Listings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
