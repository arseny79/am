import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, DollarSign, Loader2, MapPin, Shield, TrendingUp, Users } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function ListingDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const listingId = parseInt(id || "0");

  const { data: listing, isLoading } = trpc.listing.getById.useQuery({ id: listingId });
  const { data: hasNDA } = trpc.nda.hasSigned.useQuery({ listingId });

  const signNDAMutation = trpc.nda.sign.useMutation({
    onSuccess: () => {
      toast.success("NDA signed successfully. Confidential information is now visible.");
      window.location.reload();
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
        <Link href="/marketplace">
          <Button>Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const showConfidential = hasNDA || (user && listing.sellerId === user.id);

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
              <Button variant="ghost">Back to Marketplace</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{listing.businessName}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                  {listing.yearFounded && <span>• Founded {listing.yearFounded}</span>}
                </div>
              </div>
              {listing.askingPrice && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Asking Price</div>
                  <div className="text-4xl font-bold text-primary">
                    {formatCurrency(listing.askingPrice)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Annual Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(listing.annualRevenue)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  MRR: {formatCurrency(listing.monthlyRecurringRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  EBITDA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(listing.ebitda)}</div>
                {listing.ebitdaMargin && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Margin: {listing.ebitdaMargin}%
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{listing.clientCount}</div>
                {listing.clientRetentionRate && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Retention: {listing.clientRetentionRate}%
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Business Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{listing.description}</p>
            </CardContent>
          </Card>

          {!showConfidential && isAuthenticated && (
            <Card className="mb-6 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Confidential Information Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Sign an NDA to access detailed financial information and client list.
                </p>
                <Button
                  onClick={() => signNDAMutation.mutate({ listingId })}
                  disabled={signNDAMutation.isPending}
                >
                  {signNDAMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign NDA & View Details
                </Button>
              </CardContent>
            </Card>
          )}

          {showConfidential && (listing.clientList || listing.financialDetails) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Confidential Information
                  <Badge variant="default">NDA Protected</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {listing.clientList && (
                  <div>
                    <h4 className="font-semibold mb-2">Client List</h4>
                    <p className="whitespace-pre-wrap text-sm">{listing.clientList}</p>
                  </div>
                )}
                {listing.financialDetails && (
                  <div>
                    <h4 className="font-semibold mb-2">Financial Details</h4>
                    <p className="whitespace-pre-wrap text-sm">{listing.financialDetails}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!isAuthenticated && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="mb-4">Sign in to contact the seller or access confidential information</p>
                <a href={getLoginUrl()}>
                  <Button size="lg">Sign In</Button>
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
