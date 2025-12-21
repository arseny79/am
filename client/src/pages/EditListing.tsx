import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2 } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { ListingDocumentVault } from "@/components/ListingDocumentVault";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EditListing() {
  const { id } = useParams();
  const listingId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data: listing, isLoading } = trpc.listing.getById.useQuery(
    { id: listingId },
    { enabled: isAuthenticated && listingId > 0 }
  );

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
            <Link href="/my-listings">
              <Button variant="ghost">My Listings</Button>
            </Link>
            <NotificationBell />
            <UserDropdown user={user!} />
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
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
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Listing Information</CardTitle>
                  <CardDescription>
                    Edit your listing details (full form coming soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Business Name</h3>
                      <p>{listing.businessName}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Location</h3>
                      <p>{listing.location}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Annual Revenue</h3>
                        <p>${listing.annualRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">EBITDA</h3>
                        <p>${listing.ebitda.toLocaleString()}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Clients</h3>
                        <p>{listing.clientCount}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Full editing form will be available soon. For now, use the Documents tab to manage your listing documents.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <ListingDocumentVault listingId={listingId} isOwner={true} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
