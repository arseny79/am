import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";
import { BuyerCounterOfferResponse } from "@/components/BuyerCounterOfferResponse";
import { CounterOfferResponse } from "@/components/CounterOfferResponse";

interface OfferHistoryProps {
  dealId: number;
  askingPrice: number;
}

const OFFER_TYPE_LABELS: Record<string, string> = {
  initial_asking_price: "Initial Asking Price",
  buyer_counter_offer: "Buyer Counter-Offer",
  seller_counter_offer: "Seller Counter-Offer",
  final_accepted_offer: "Final Accepted Offer",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Response",
  accepted: "Accepted",
  rejected: "Rejected",
  superseded: "Superseded",
};

export function OfferHistory({ dealId, askingPrice }: OfferHistoryProps) {
  const { data: offers = [], isLoading } = trpc.offerHistory.getByDeal.useQuery({ dealId });
  const { data: deal } = trpc.deal.getById.useQuery({ id: dealId });
  const { user } = useAuth();

  // Calculate negotiation round for each offer
  const offersWithRounds = offers.map((offer, index) => {
    let round = 1;
    if (offer.offerType === "buyer_counter_offer" || offer.offerType === "seller_counter_offer") {
      // Count how many counter-offers came before this one
      const priorCounters = offers.slice(index + 1).filter(
        o => o.offerType === "buyer_counter_offer" || o.offerType === "seller_counter_offer"
      ).length;
      round = priorCounters + 1;
    }
    return { ...offer, round };
  });

  // Find the latest pending offer
  const latestPendingOffer = offersWithRounds.find(o => o.status === "pending");
  const isBuyer = deal?.buyerId === user?.id;
  const isSeller = deal?.sellerId === user?.id;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Offer History
          </CardTitle>
          <CardDescription>Loading negotiation history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Offer History
          </CardTitle>
          <CardDescription>No offers have been made yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Asking Price: ${askingPrice.toLocaleString()}</p>
            <p className="text-sm mt-2">Start negotiating by submitting an offer or accepting the asking price</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "superseded":
        return <Badge variant="secondary">Superseded</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOfferIcon = (offerType: string, status: string) => {
    if (status === "accepted") {
      return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
    }
    if (status === "rejected") {
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
    if (status === "pending") {
      return <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    }

    return offerType === "buyer_counter_offer" || offerType === "seller_counter_offer" ? (
      <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    ) : (
      <DollarSign className="h-5 w-5 text-muted-foreground" />
    );
  };

  const calculateDiscount = (amount: number) => {
    const discount = ((askingPrice - amount) / askingPrice) * 100;
    return discount > 0 ? `${discount.toFixed(1)}% below asking` : `${Math.abs(discount).toFixed(1)}% above asking`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Offer History
        </CardTitle>
        <CardDescription>
          Complete negotiation thread showing all offers and responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {offersWithRounds.map((offer, index) => (
            <div
              key={offer.id}
              className={`relative p-4 rounded-lg border ${
                offer.status === "accepted"
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : offer.status === "pending"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                  : "bg-card"
              }`}
            >
              {/* Timeline connector */}
              {index < offersWithRounds.length - 1 && (
                <div className="absolute left-8 top-full h-4 w-0.5 bg-border" />
              )}

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {getOfferIcon(offer.offerType, offer.status)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">
                      {OFFER_TYPE_LABELS[offer.offerType] || offer.offerType}
                    </div>
                    {(offer.offerType === "buyer_counter_offer" || offer.offerType === "seller_counter_offer") && (
                      <Badge variant="outline" className="text-xs">
                        Round {offer.round}
                      </Badge>
                    )}
                    {offer.id === latestPendingOffer?.id && (
                      <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Latest
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    by {offer.offeredByUser?.name || "Unknown"} •{" "}
                    {format(new Date(offer.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
                {getStatusBadge(offer.status)}
              </div>

                  {/* Amount */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="text-2xl font-bold">
                      ${offer.amount.toLocaleString()}
                    </div>
                    {offer.offerType !== "initial_asking_price" && (
                      <div className="text-sm text-muted-foreground">
                        ({calculateDiscount(offer.amount)})
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  {offer.reason && (
                    <div className="text-sm bg-muted/50 p-3 rounded border mb-2">
                      <div className="font-medium mb-1">Reasoning:</div>
                      <div className="text-muted-foreground">{offer.reason}</div>
                    </div>
                  )}

                  {/* Response */}
                  {offer.respondedBy && offer.respondedAt && (
                    <div className="text-sm border-t pt-2 mt-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">
                          {offer.status === "accepted" ? "Accepted" : "Responded"}
                        </span>
                        by {offer.respondedByUser?.name || "Unknown"} •{" "}
                        {format(new Date(offer.respondedAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      {offer.responseNotes && (
                        <div className="mt-1 text-muted-foreground italic">
                          "{offer.responseNotes}"
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Response Actions */}
              {offer.status === "pending" && offer.id === latestPendingOffer?.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium mb-3">Respond to this offer:</div>
                  {isBuyer && offer.offerType === "seller_counter_offer" && (
                    <BuyerCounterOfferResponse
                      dealId={dealId}
                      offer={offer}
                      askingPrice={askingPrice}
                    />
                  )}
                  {isSeller && offer.offerType === "buyer_counter_offer" && (
                    <CounterOfferResponse
                      dealId={dealId}
                      offer={offer}
                      askingPrice={askingPrice}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          ))}
        </div>

        {/* Summary */}
        {offers.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Original Asking Price</div>
                <div className="text-lg font-semibold">${askingPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Latest Offer</div>
                <div className="text-lg font-semibold">
                  ${offers[0]?.amount.toLocaleString() || "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
