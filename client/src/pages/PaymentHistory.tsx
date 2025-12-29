import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, Receipt, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { PRICING_TIERS } from "@shared/pricing";

// Authenticated content component
function AuthenticatedPaymentHistoryContent() {
  const { user } = useAuth();
  
  // Extra safety check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { data: payments, isLoading } = trpc.payments.getMyPayments.useQuery();

  const getTierInfo = (tier: string) => {
    const tierData = PRICING_TIERS[tier as keyof typeof PRICING_TIERS];
    return tierData || { name: tier, upfrontCost: 0, successFeePercent: 0 };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Receipt className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Payment History</h1>
            </div>
            <p className="text-muted-foreground">
              View all your listing fee payments and receipts
            </p>
          </div>

          {!payments || payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't made any listing fee payments yet
                </p>
                <Link href="/create-listing">
                  <Button>Create Your First Listing</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment Records</CardTitle>
                <CardDescription>
                  {payments.length} payment{payments.length !== 1 ? "s" : ""} on record
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Listing</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => {
                      const tierInfo = getTierInfo(payment.listingTier);
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.paidAt
                              ? new Date(payment.paidAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "N/A"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.businessName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {tierInfo.name}
                            </Badge>
                          </TableCell>
                          <TableCell>€{tierInfo.upfrontCost.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.paymentStatus === "paid"
                                  ? "default"
                                  : payment.paymentStatus === "refunded"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="capitalize"
                            >
                              {payment.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/listing/${payment.id}`}>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                              {payment.stripeSessionId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    window.open(
                                      `https://dashboard.stripe.com/test/payments/${payment.stripePaymentIntentId}`,
                                      "_blank"
                                    );
                                  }}
                                >
                                  Receipt
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Main component with auth checks
export default function PaymentHistory() {
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view your payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full">Log In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AuthenticatedPaymentHistoryContent />;
}
