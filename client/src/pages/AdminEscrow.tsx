import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, ExternalLink, RefreshCw, XCircle, DollarSign, Calendar, User, Building2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function AdminEscrow() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [syncing, setSyncing] = useState<number | null>(null);

  const { data: escrowDeals, isLoading, refetch } = trpc.adminEscrow.getDealsWithEscrow.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const syncStatusMutation = trpc.adminEscrow.syncEscrowStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Escrow status synced: ${data.status}`);
      refetch();
      setSyncing(null);
    },
    onError: (error) => {
      toast.error("Failed to sync: " + error.message);
      setSyncing(null);
    },
  });

  const cancelEscrowMutation = trpc.adminEscrow.cancelEscrow.useMutation({
    onSuccess: () => {
      toast.success("Escrow transaction cancelled");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to cancel: " + error.message);
    },
  });

  const handleSync = (dealId: number) => {
    setSyncing(dealId);
    syncStatusMutation.mutate({ dealId });
  };

  const handleCancel = (dealId: number) => {
    if (confirm("Are you sure you want to cancel this escrow transaction? This action cannot be undone.")) {
      cancelEscrowMutation.mutate({ 
        dealId,
        reason: "Cancelled by admin",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "funded":
        return "bg-blue-500";
      case "created":
      case "agreed":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Escrow Management</h1>
            <p className="text-muted-foreground mt-2">Monitor and manage Escrow.com transactions</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">← Back to Admin</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : escrowDeals?.deals && escrowDeals.deals.length > 0 ? (
          <div className="grid gap-6">
            {escrowDeals.deals.map((deal) => (
              <Card key={deal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {deal.listing.businessName}
                      </CardTitle>
                      <CardDescription>Deal #{deal.id}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(deal.escrowStatus || "not_started")}>
                      {deal.escrowStatus?.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Buyer:</span>
                        <span>{deal.buyer.name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {deal.buyer.email}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Seller:</span>
                        <span>{deal.seller.name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {deal.seller.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Escrow ID:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {deal.escrowTransactionId}
                      </code>
                    </div>
                    {deal.escrowCreatedAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Created {new Date(deal.escrowCreatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {deal.escrowPaymentUrl && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <a href={deal.escrowPaymentUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Escrow.com
                        </a>
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(deal.id)}
                      disabled={syncing === deal.id}
                    >
                      {syncing === deal.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sync Status
                    </Button>

                    {deal.escrowStatus !== "completed" && deal.escrowStatus !== "cancelled" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(deal.id)}
                        disabled={cancelEscrowMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Escrow
                      </Button>
                    )}

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/deal/${deal.id}`}>View Deal Room</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No escrow transactions found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Escrow transactions are automatically created when deals reach the escrow stage
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
