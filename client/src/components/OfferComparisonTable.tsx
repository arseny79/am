import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface OfferComparisonTableProps {
  dealId: number;
  askingPrice: number;
  isBuyer?: boolean; // true = buyer view, false/undefined = seller view
}

export function OfferComparisonTable({ dealId, askingPrice, isBuyer = false }: OfferComparisonTableProps) {
  const { data: offers, isLoading } = trpc.offerHistory.getByDeal.useQuery({ dealId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Offer Comparison</CardTitle>
          <CardDescription>Loading offer history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Offer Comparison</CardTitle>
          <CardDescription>No offers yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate metrics for each offer
  const offersWithMetrics = offers.map((offer) => {
    const discountAmount = askingPrice - offer.amount;
    // Handle division by zero when asking price is 0
    const discountPercent = askingPrice > 0 
      ? ((discountAmount / askingPrice) * 100).toFixed(1)
      : "0.0";
    const isDiscount = discountAmount > 0;
    const isPremium = discountAmount < 0;

    return {
      ...offer,
      discountAmount,
      discountPercent,
      isDiscount,
      isPremium,
    };
  });

  // Sort by creation date (newest first)
  const sortedOffers = [...offersWithMetrics].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-500">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "superseded":
        return <Badge variant="outline">Superseded</Badge>;
      case "expired":
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Expired</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOfferTypeBadge = (offerType: string) => {
    switch (offerType) {
      case "initial_asking_price":
        return <Badge variant="secondary">Asking Price</Badge>;
      case "buyer_counter_offer":
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Buyer Offer</Badge>;
      case "seller_counter_offer":
        return <Badge variant="outline" className="border-indigo-500 text-indigo-600">Seller Counter</Badge>;
      case "final_accepted_offer":
        return <Badge className="bg-green-500">Final Offer</Badge>;
      default:
        return <Badge variant="outline">{offerType}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Offer Comparison
        </CardTitle>
        <CardDescription>
          Side-by-side comparison of all offers in this negotiation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>vs. Asking Price</TableHead>
                <TableHead>Discount %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Asking Price Row (Reference) */}
              <TableRow className="bg-muted/50">
                <TableCell>
                  <Badge variant="secondary">Asking Price</Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  ${askingPrice.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Minus className="h-4 w-4" />
                    Baseline
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">0%</TableCell>
                <TableCell>
                  <Badge variant="outline">Reference</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  —
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Seller's initial asking price
                </TableCell>
              </TableRow>

              {/* Offer Rows */}
              {sortedOffers.map((offer) => (
                <TableRow key={offer.id} className={offer.status === "accepted" ? "bg-green-50 dark:bg-green-950/20" : ""}>
                  <TableCell>
                    {getOfferTypeBadge(offer.offerType)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${offer.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${
                      // Buyer: discount = good (green), premium = bad (red)
                      // Seller: premium = good (green), discount = bad (red)
                      isBuyer
                        ? (offer.isDiscount ? "text-green-600 dark:text-green-400" : 
                           offer.isPremium ? "text-red-600 dark:text-red-400" : 
                           "text-muted-foreground")
                        : (offer.isPremium ? "text-green-600 dark:text-green-400" : 
                           offer.isDiscount ? "text-red-600 dark:text-red-400" : 
                           "text-muted-foreground")
                    }`}>
                      {offer.isDiscount && (
                        <>
                          <TrendingDown className="h-4 w-4" />
                          ${Math.abs(offer.discountAmount).toLocaleString()} less
                        </>
                      )}
                      {offer.isPremium && (
                        <>
                          <TrendingUp className="h-4 w-4" />
                          ${Math.abs(offer.discountAmount).toLocaleString()} more
                        </>
                      )}
                      {!offer.isDiscount && !offer.isPremium && (
                        <>
                          <Minus className="h-4 w-4" />
                          Same
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={
                      // Buyer: discount = good (green), premium = bad (red)
                      // Seller: premium = good (green), discount = bad (red)
                      isBuyer
                        ? (offer.isDiscount ? "text-green-600 dark:text-green-400 font-semibold" : 
                           offer.isPremium ? "text-red-600 dark:text-red-400 font-semibold" : 
                           "text-muted-foreground")
                        : (offer.isPremium ? "text-green-600 dark:text-green-400 font-semibold" : 
                           offer.isDiscount ? "text-red-600 dark:text-red-400 font-semibold" : 
                           "text-muted-foreground")
                    }>
                      {offer.isDiscount && "-"}
                      {offer.isPremium && "+"}
                      {Math.abs(parseFloat(offer.discountPercent))}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(offer.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(offer.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: new Date(offer.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {offer.reason || "No reason provided"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Total Offers</div>
            <div className="text-2xl font-bold">{offers.length}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Avg. Discount</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {askingPrice > 0 
                ? (offersWithMetrics.reduce((sum, o) => sum + parseFloat(o.discountPercent), 0) / offers.length).toFixed(1) + "%"
                : "N/A"}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Negotiation Rounds</div>
            <div className="text-2xl font-bold">
              {offers.filter(o => o.offerType !== "initial_asking_price").length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
