import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferHistory } from "@/components/OfferHistory";
import { OfferComparisonTable } from "@/components/OfferComparisonTable";
import { AcceptAskingPriceButton } from "@/components/AcceptAskingPriceButton";
import { RequestCounterOfferButton } from "@/components/RequestCounterOfferButton";
import { AcceptLoiTermsButton } from "@/components/AcceptLoiTermsButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp } from "lucide-react";

interface OffersTabProps {
  deal: any;
  dealId: number;
  refetchDeal: () => void;
}

export function OffersTab({ deal, dealId, refetchDeal }: OffersTabProps) {
  const askingPrice = deal.listing?.askingPrice || 0;
  const currentStage = deal.stage;
  const isBuyer = deal.isBuyer;

  // Only show this tab content if in negotiation stage or later
  const isNegotiationStage = ['negotiation', 'escrow', 'closing', 'closed'].includes(currentStage);

  if (!isNegotiationStage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Offers & Negotiation
          </CardTitle>
          <CardDescription>
            Offer negotiations will appear here once the deal reaches the negotiation stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Not Yet Available</AlertTitle>
            <AlertDescription>
              Complete the NDA and due diligence stages before entering negotiations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions for Buyers */}
      {isBuyer && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Respond to the current offer or make a new proposal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AcceptAskingPriceButton
              dealId={dealId}
              askingPrice={askingPrice}
              currentStage={currentStage}
              onSuccess={() => refetchDeal()}
            />
            <RequestCounterOfferButton
              dealId={dealId}
              askingPrice={askingPrice}
              currentStage={currentStage}
              onSuccess={() => refetchDeal()}
            />
            <AcceptLoiTermsButton
              dealId={dealId}
              currentStage={currentStage}
              onSuccess={() => refetchDeal()}
            />
          </CardContent>
        </Card>
      )}

      {/* Offer History */}
      <OfferHistory 
        dealId={dealId} 
        askingPrice={askingPrice}
      />

      {/* Offer Comparison Table */}
      <OfferComparisonTable 
        dealId={dealId} 
        askingPrice={askingPrice}
      />
    </div>
  );
}
