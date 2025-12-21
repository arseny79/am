import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/SignOutButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Heart, Building2, DollarSign, TrendingUp, Users, MapPin, Loader2, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

// Authenticated content component - only renders when user is confirmed
function AuthenticatedSavedListingsContent() {
  const { user } = useAuth();
  
  // Extra safety check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { data: savedListings, isLoading } = trpc.savedListings.getMySavedListings.useQuery();
  const utils = trpc.useUtils();

  const unsaveMutation = trpc.savedListings.unsave.useMutation({
    onSuccess: () => {
      utils.savedListings.getMySavedListings.invalidate();
      toast.success("Listing removed from saved");
    },
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

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleUnsave = (listingId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    unsaveMutation.mutate({ listingId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-4xl font-bold">Saved Listings</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Your bookmarked MSP businesses for easy access
          </p>
        </div>

        {/* Listings */}
        {savedListings && savedListings.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {savedListings.length} {savedListings.length === 1 ? "listing" : "listings"} saved
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedListings.map((listing: any) => (
                <Link key={listing.id} href={`/listing/${listing.id}`}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer h-full group relative">
                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => handleUnsave(listing.id, e)}
                      disabled={unsaveMutation.isPending}
                    >
                      {unsaveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>

                    <CardContent className="p-6">
                      {/* Saved Date Badge */}
                      <div className="mb-3">
                        <Badge variant="outline" className="text-xs">
                          Saved {formatDate(listing.savedAt)}
                        </Badge>
                      </div>

                      {/* Header with Logo and Title */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Logo/Avatar */}
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {listing.logoUrl ? (
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
                            {listing.isAnonymous ? "Anonymous Listing" : listing.businessName}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{listing.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {listing.description}
                      </p>

                      {/* Key Metrics - Visual Boxes */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                          <p className="font-bold text-sm">{formatCurrency(listing.annualRevenue)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground mb-1">EBITDA</p>
                          <p className="font-bold text-sm">{formatCurrency(listing.ebitda)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground mb-1">Clients</p>
                          <p className="font-bold text-sm">{formatNumber(listing.clientCount)}</p>
                        </div>
                      </div>

                      {/* Asking Price - Prominent */}
                      <div className="border-t pt-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(listing.askingPrice)}</p>
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Saved Listings Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start browsing the marketplace and save listings you're interested in for easy access later.
              </p>
              <Link href="/marketplace">
                <Button size="lg">
                  Browse Marketplace
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Main component that handles authentication checks
export default function SavedListings() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to view your saved listings</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  return <AuthenticatedSavedListingsContent />;
}
