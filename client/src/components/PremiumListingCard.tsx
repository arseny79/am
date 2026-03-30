import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Lock } from "lucide-react";
import { Link } from "wouter";

interface PremiumListingCardProps {
  listing: {
    id: number;
    businessName: string;
    logoUrl: string | null;
    location: string;
    description: string;
    annualRevenue: number;
    ebitda: number;
    clientCount: number;
    askingPrice: number | null;
    confidentialityLevel: string;
  };
}

export function PremiumListingCard({ listing }: PremiumListingCardProps) {
  const isConfidential =
    listing.confidentialityLevel === "nda" ||
    listing.confidentialityLevel === "private";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="relative bg-card border border-border/20 p-8 rounded-[1.5rem] shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow duration-300">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-3">
            {listing.logoUrl ? (
              <img
                src={listing.logoUrl}
                alt={`${listing.businessName} logo`}
                className="h-10 w-10 object-contain rounded-lg border border-border bg-background p-1 shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {isConfidential ? "Confidential Business" : listing.businessName}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span>{listing.location}</span>
              </div>
            </div>
          </div>
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
            Premium
          </Badge>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[
            { label: "Revenue", value: isConfidential ? null : listing.annualRevenue ? formatCurrency(listing.annualRevenue) : null },
            { label: "EBITDA", value: isConfidential ? null : listing.ebitda ? formatCurrency(listing.ebitda) : null },
            { label: "Clients", value: isConfidential ? null : listing.clientCount ? String(listing.clientCount) : null },
            { label: "Asking Price", value: listing.askingPrice ? formatCurrency(listing.askingPrice) : null, highlight: true },
          ].map((metric) => (
            <div key={metric.label} className="space-y-1">
              <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                {metric.label}
              </p>
              {metric.value ? (
                <p className={metric.highlight ? "text-lg font-bold text-foreground" : "text-sm font-semibold text-primary"}>
                  {metric.value}
                </p>
              ) : (
                <p className="text-sm font-semibold text-primary">NDA Required</p>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="w-full bg-primary/5 hover:bg-primary/10 text-primary py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm">
          Request Details
          <Lock className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
