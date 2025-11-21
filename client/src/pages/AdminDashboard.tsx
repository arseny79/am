import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, TrendingUp, Users, FileText, DollarSign, Eye, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

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
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage listings, monitor marketplace activity, and view analytics
            </p>
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
