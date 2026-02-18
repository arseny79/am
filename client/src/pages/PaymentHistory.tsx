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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Authenticated content component
function AuthenticatedPaymentHistoryContent() {
  const { user } = useAuth();
  // Using sonner toast
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Extra safety check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { data: payments, isLoading } = trpc.payments.getMyPayments.useQuery();
  const { data: subscriptions, refetch: refetchSubs } = trpc.subscription.getAll.useQuery();
  
  const cancelMutation = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription canceled", {
        description: "Your subscription will remain active until the end of the current billing period.",
      });
      refetchSubs();
      setShowCancelDialog(false);
      setCancelingId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reactivateMutation = trpc.subscription.reactivate.useMutation({
    onSuccess: () => {
      toast.success("Subscription reactivated", {
        description: "Your subscription will continue automatically.",
      });
      refetchSubs();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const portalMutation = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCancelSubscription = () => {
    if (cancelingId) {
      cancelMutation.mutate({ subscriptionId: cancelingId });
    }
  };

  const handleReactivate = (subscriptionId: number) => {
    reactivateMutation.mutate({ subscriptionId });
  };

  const handleManageBilling = () => {
    portalMutation.mutate();
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: number) => {
    if (cancelAtPeriodEnd) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Canceling
        </Badge>
      );
    }

    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "canceled":
        return <Badge variant="secondary">Canceled</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTierName = (productId: string) => {
    if (productId === "featured_weekly") return "Featured Listing";
    if (productId === "premium_weekly") return "Premium Listing";
    return productId;
  };

  const getTierPrice = (productId: string) => {
    if (productId === "featured_weekly") return "$99/week";
    if (productId === "premium_weekly") return "$299/week";
    return "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const activeSubscriptions = subscriptions?.filter(
    (sub) => sub.status === "active" || (sub.status === "canceled" && sub.cancelAtPeriodEnd)
  );
  const pastSubscriptions = subscriptions?.filter(
    (sub) => sub.status === "canceled" && !sub.cancelAtPeriodEnd
  );

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
          {/* Active Subscriptions Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>Manage your active listing tier subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {!activeSubscriptions || activeSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You don't have any active subscriptions.</p>
                  <Link href="/pricing">
                    <Button className="mt-4">View Pricing Plans</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{getTierName(sub.productId)}</h3>
                          {getStatusBadge(sub.status, sub.cancelAtPeriodEnd)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getTierPrice(sub.productId)} • Renews on {formatDate(sub.currentPeriodEnd)}
                        </p>
                        {sub.cancelAtPeriodEnd === 1 && (
                          <p className="text-sm text-yellow-600 mt-1">
                            Your subscription will end on {formatDate(sub.currentPeriodEnd)}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {sub.cancelAtPeriodEnd === 1 ? (
                            <DropdownMenuItem onClick={() => handleReactivate(sub.id)}>
                              Reactivate Subscription
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setCancelingId(sub.id);
                                setShowCancelDialog(true);
                              }}
                            >
                              Cancel Subscription
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={handleManageBilling}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Manage Billing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
      
      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of the current billing period. You
              can reactivate it at any time before then.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription}>
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
