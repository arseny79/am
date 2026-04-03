import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, TrendingUp, Users, MapPin } from "lucide-react";
import { Link } from "wouter";

interface PremiumListingCardProps {
  listing: {
    id: number;
    businessName: string;
    logoUrl: string | null;
    location: string;
    description: string;
    annualRevenue: number | null;
    ebitda: number | null;
    clientCount: number | null;
    askingPrice: number | null;
    confidentialityLevel: string;
  };
}

export function PremiumListingCard({ listing }: PremiumListingCardProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border border-primary/20 hover:border-primary/40 bg-gradient-to-br from-white to-primary/5">
        <CardContent className="p-6">
          {/* Header with Logo and Name */}
          <div className="flex items-start gap-4 mb-4">
            {listing.logoUrl ? (
              <img
                src={listing.logoUrl}
                alt={`${listing.businessName} logo`}
                className="h-16 w-16 object-contain rounded-lg border border-border bg-white p-2"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">
                  {(listing.confidentialityLevel === "nda" || listing.confidentialityLevel === "private")
                    ? "Confidential MSP Business"
                    : listing.businessName}
                </h3>
                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                  Premium
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{listing.location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {listing.description}
          </p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3 w-3" />
                <span>Revenue</span>
              </div>
              <div className="font-bold text-sm">
                {(listing.confidentialityLevel === "nda" || listing.confidentialityLevel === "private")
                  ? "NDA Required"
                  : formatCurrency(listing.annualRevenue)}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                <span>EBITDA</span>
              </div>
              <div className="font-bold text-sm">
                {(listing.confidentialityLevel === "nda" || listing.confidentialityLevel === "private")
                  ? "NDA Required"
                  : formatCurrency(listing.ebitda)}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                <span>Clients</span>
              </div>
              <div className="font-bold text-sm">
                {(listing.confidentialityLevel === "nda" || listing.confidentialityLevel === "private")
                  ? "NDA Required"
                  : listing.clientCount}
              </div>
            </div>
          </div>

          {/* Asking Price */}
          {listing.askingPrice && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Asking Price</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(listing.askingPrice)}
                </span>
              </div>
              {listing.confidentialityLevel !== "public" && (
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  {listing.confidentialityLevel === "nda" ? "NDA Required" : "Private"}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
