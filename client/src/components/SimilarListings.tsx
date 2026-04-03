import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, DollarSign, MapPin, TrendingUp } from "lucide-react";
import { Link } from "wouter";

interface Listing {
  id: number;
  businessName: string;
  location: string;
  annualRevenue: number | null;
  ebitda: number | null;
  askingPrice: number | null;
  tier: "free" | "featured" | "premium_featured";
  primaryServiceCategory: string | null;
  industryVertical: string | null;
}

interface SimilarListingsProps {
  listings: Listing[];
}

export function SimilarListings({ listings }: SimilarListingsProps) {
  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Similar Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <Card key={listing.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{listing.businessName}</CardTitle>
                </div>
                {listing.tier !== "free" && (
                  <Badge variant="secondary" className="text-xs">
                    {listing.tier === "premium_featured" ? "Premium" : "Featured"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{listing.location}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Annual Revenue</span>
                  <span className="font-semibold">
                    {listing.annualRevenue != null ? `$${(listing.annualRevenue / 1000).toFixed(0)}K` : "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">EBITDA</span>
                  <span className="font-semibold">
                    {listing.ebitda != null ? `$${(listing.ebitda / 1000).toFixed(0)}K` : "N/A"}
                  </span>
                </div>
                
                {listing.askingPrice && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Asking Price
                    </span>
                    <span className="font-bold text-primary">
                      ${(listing.askingPrice / 1000).toFixed(0)}K
                    </span>
                  </div>
                )}
              </div>
              
              <Link href={`/listing/${listing.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
