import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, 
  Building2, 
  Handshake, 
  TrendingUp, 
  Plus, 
  Eye, 
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { Badge } from "@/components/ui/badge";

function AuthenticatedDashboardContent() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fetch user's listings
  const { data: listings, isLoading: listingsLoading } = trpc.listing.getMyListings.useQuery();
  
  // Fetch user's deals
  const { data: deals, isLoading: dealsLoading } = trpc.deal.getMyDeals.useQuery();

  const isLoading = listingsLoading || dealsLoading;

  // Calculate metrics
  const totalListings = listings?.length || 0;
  const publishedListings = listings?.filter(l => l.status === 'published').length || 0;
  const draftListings = listings?.filter(l => l.status === 'draft').length || 0;
  
  const totalDeals = deals?.length || 0;
  const activeDeals = deals?.filter(d => d.status === 'active' || d.status === 'nda_signed').length || 0;
  const pendingDeals = deals?.filter(d => d.status === 'pending').length || 0;

  // Get recent activity (last 5 items)
  const recentListings = listings?.slice(0, 3) || [];
  const recentDeals = deals?.slice(0, 3) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'active':
      case 'nda_signed':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12 bg-gray-50">
        <div className="container max-w-6xl">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your marketplace activity
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Listings</p>
                        <p className="text-3xl font-bold">{totalListings}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 text-sm">
                      <span className="text-green-600">{publishedListings} published</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{draftListings} drafts</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                        <p className="text-3xl font-bold">{activeDeals}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Handshake className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 text-sm">
                      <span className="text-yellow-600">{pendingDeals} pending</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{totalDeals} total</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Profile Views</p>
                        <p className="text-3xl font-bold">--</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Eye className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Coming soon</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                        <p className="text-3xl font-bold">--</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Coming soon</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Link href="/create-listing">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-2 hover:border-primary">
                    <CardContent className="pt-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Create New Listing</p>
                        <p className="text-sm text-muted-foreground">List your MSP for sale</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/browse">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Eye className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Browse Listings</p>
                        <p className="text-sm text-muted-foreground">Find MSPs to acquire</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/valuate">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Get Valuation</p>
                        <p className="text-sm text-muted-foreground">Estimate your MSP's value</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Listings */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Your Listings</CardTitle>
                      <CardDescription>Recent MSP listings you've created</CardDescription>
                    </div>
                    <Link href="/my-listings">
                      <Button variant="ghost" size="sm">
                        View All <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recentListings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No listings yet</p>
                        <Link href="/create-listing">
                          <Button variant="link" className="mt-2">Create your first listing</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentListings.map((listing) => (
                          <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{listing.businessName}</p>
                              <p className="text-sm text-muted-foreground">{listing.location}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(listing.status)}
                              <Link href={`/edit-listing/${listing.id}`}>
                                <Button variant="ghost" size="sm">Edit</Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Deals */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Your Deals</CardTitle>
                      <CardDescription>Active negotiations and transactions</CardDescription>
                    </div>
                    <Link href="/my-deals">
                      <Button variant="ghost" size="sm">
                        View All <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recentDeals.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Handshake className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No deals yet</p>
                        <Link href="/browse">
                          <Button variant="link" className="mt-2">Browse listings to start a deal</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentDeals.map((deal) => (
                          <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{deal.listing?.businessName || 'Unknown Listing'}</p>
                              <p className="text-sm text-muted-foreground">
                                {deal.role === 'seller' ? `Buyer: ${deal.buyerName || 'Anonymous'}` : `Seller: ${deal.sellerName || 'Anonymous'}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(deal.status)}
                              <Link href={`/deal-room/${deal.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function Dashboard() {
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
        <p className="text-lg text-muted-foreground">Please sign in to access your dashboard</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  return <AuthenticatedDashboardContent />;
}
