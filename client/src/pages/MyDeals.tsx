import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const STAGE_LABELS: Record<string, string> = {
  initial_contact: "Initial Contact",
  nda_signed: "NDA Signed",
  due_diligence: "Due Diligence",
  negotiation: "Negotiation",
  closing: "Closing",
  closed: "Closed",
  cancelled: "Cancelled",
};

// Authenticated content component - only renders when user is confirmed
function AuthenticatedMyDealsContent() {
  const { user } = useAuth();
  
  // Extra safety check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { data: deals = [], isLoading: dealsLoading } = trpc.deal.getMyDeals.useQuery();

  if (dealsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <Link href="/deals">
              <Button variant="default">My Deals</Button>
            </Link>
            <NotificationBell />
            <UserDropdown user={user!} />

          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Deals</h1>
            <p className="text-muted-foreground">
              Track all your active and completed transactions
            </p>
          </div>

          {deals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">You don't have any deals yet</p>
                <Link href="/marketplace">
                  <Button>Browse Marketplace</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {deals.map((deal) => (
                <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {deal.listing?.businessName}
                        </CardTitle>
                        <CardDescription>
                          {deal.isBuyer ? (
                            <>Seller: {deal.seller?.name}</>
                          ) : (
                            <>Buyer: {deal.buyer?.name}</>
                          )}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          deal.stage === "closed"
                            ? "default"
                            : deal.stage === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {STAGE_LABELS[deal.stage]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Revenue</p>
                        <p className="font-semibold">
                          ${deal.listing?.annualRevenue?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">EBITDA</p>
                        <p className="font-semibold">
                          ${deal.listing?.ebitda?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-semibold">{deal.listing?.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-semibold">{deal.isBuyer ? "Buyer" : "Seller"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(deal.updatedAt).toLocaleDateString()}
                      </p>
                      <Link href={`/deal/${deal.id}`}>
                        <Button>
                          View Deal Room
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Main component that handles authentication checks
export default function MyDeals() {
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
        <p className="text-lg text-muted-foreground">Please sign in to view your deals</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  return <AuthenticatedMyDealsContent />;
}
