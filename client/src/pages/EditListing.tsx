import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { ListingDocumentVault } from "@/components/ListingDocumentVault";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingEditForm } from "@/components/ListingEditForm";
import { WalletVerificationCard } from "@/components/WalletVerificationCard";

export default function EditListing() {
  const { id } = useParams();
  const listingId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: listing, isLoading } = trpc.listing.getById.useQuery(
    { id: listingId },
    { enabled: isAuthenticated && listingId > 0 }
  );

  const handleEditSuccess = () => {
    // Invalidate the listing query to refresh data
    utils.listing.getById.invalidate({ id: listingId });
    utils.listing.getMy.invalidate();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to edit listings</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Listing not found</p>
        <Link href="/my-listings">
          <Button>Back to My Listings</Button>
        </Link>
      </div>
    );
  }

  // Check ownership
  if (listing.sellerId !== user?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">You don't have permission to edit this listing</p>
        <Link href="/my-listings">
          <Button>Back to My Listings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: "My Listings", href: "/my-listings" },
              { label: "Edit Listing" }
            ]} 
          />
          <div className="mb-8">
            <Link href="/my-listings">
              <Button variant="ghost" className="mb-4">
                ← Back to My Listings
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Edit Listing</h1>
            <p className="text-muted-foreground">{listing.businessName}</p>
          </div>

          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Listing Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="wallet">Wallet Verification</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <ListingEditForm 
                listing={listing} 
                onSuccess={handleEditSuccess}
              />
            </TabsContent>

            <TabsContent value="documents">
              <ListingDocumentVault listingId={listingId} isOwner={true} />
            </TabsContent>

            <TabsContent value="wallet">
              <WalletVerificationCard listingId={listingId} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
