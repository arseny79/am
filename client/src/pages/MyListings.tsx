import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Eye, Loader2, Plus, FileText } from "lucide-react";
import { KYCVerificationCard } from "@/components/KYCVerificationCard";
import { Link } from "wouter";
import { toast } from "sonner";

// Authenticated content component - only renders when user is confirmed
function AuthenticatedMyListingsContent() {
  const { user } = useAuth();
  
  // Extra safety check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { data: listings, isLoading, refetch } = trpc.listing.getMy.useQuery();

  const updateMutation = trpc.listing.update.useMutation({
    onSuccess: () => {
      toast.success("Listing updated successfully");
      refetch();
    },
  });

  const deleteMutation = trpc.listing.delete.useMutation({
    onSuccess: () => {
      toast.success("Listing deleted successfully");
      refetch();
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

  const handlePublish = (id: number) => {
    updateMutation.mutate({ id, isPublished: true, status: "active" });
  };

  const handleUnpublish = (id: number) => {
    updateMutation.mutate({ id, isPublished: false });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          {/* KYC Verification Prompt */}
          {(!user.kycVerified && !user.stripeIdentityVerified) && (
            <div className="mb-8">
              <KYCVerificationCard user={user} />
            </div>
          )}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Listings</h1>
              <p className="text-muted-foreground">Manage your MSP business listings</p>
            </div>
            <Link href="/create-listing">
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Create Listing
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid gap-6">
              {listings.map((listing) => (
                <Card key={listing.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl">{listing.businessName}</CardTitle>
                        <CardDescription>{listing.location}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {listing.isPublished ? (
                          <Badge variant="default">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                        <Badge variant="outline">{listing.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Annual Revenue</div>
                        <div className="font-semibold">{formatCurrency(listing.annualRevenue)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">EBITDA</div>
                        <div className="font-semibold">{formatCurrency(listing.ebitda)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Clients</div>
                        <div className="font-semibold">{listing.clientCount}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/listing/${listing.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/edit-listing/${listing.id}`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Link href={`/preparation/${listing.id}`}>
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Prepare Sales Packet
                        </Button>
                      </Link>
                      {listing.isPublished ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnpublish(listing.id)}
                          disabled={updateMutation.isPending}
                        >
                          Unpublish
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handlePublish(listing.id)}
                          disabled={updateMutation.isPending}
                        >
                          Publish
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(listing.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Listings Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first listing to start connecting with buyers
                </p>
                <Link href="/create-listing">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

// Main component that handles authentication checks
export default function MyListings() {
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
        <p className="text-lg text-muted-foreground">Please sign in to view your listings</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <AuthenticatedMyListingsContent />
      <Footer />
    </div>
  );
}
