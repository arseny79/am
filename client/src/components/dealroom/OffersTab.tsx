import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferHistory } from "@/components/OfferHistory";
import { OfferComparisonTable } from "@/components/OfferComparisonTable";
import { AcceptAskingPriceButton } from "@/components/AcceptAskingPriceButton";
import { RequestCounterOfferButton } from "@/components/RequestCounterOfferButton";
import { AcceptLoiTermsButton } from "@/components/AcceptLoiTermsButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Lock, CheckCircle2, Circle, ArrowRight, FileText } from "lucide-react";

interface OffersTabProps {
  deal: any;
  dealId: number;
  refetchDeal: () => void;
}

const STAGES_BEFORE_OFFERS = [
  { key: "initial_contact", label: "Initial Contact", description: "Build rapport with the other party" },
  { key: "nda_signed", label: "NDA Signed", description: "Sign NDA to access confidential info" },
  { key: "due_diligence", label: "Due Diligence", description: "Verify business claims and metrics" },
];

export function OffersTab({ deal, dealId, refetchDeal }: OffersTabProps) {
  const askingPrice = deal.listing?.askingPrice || 0;
  const currentStage = deal.stage;
  const isBuyer = deal.isBuyer;

  // Only show this tab content if in negotiation stage or later
  const isNegotiationStage = ['negotiation', 'escrow', 'closing', 'closed'].includes(currentStage);

  if (!isNegotiationStage) {
    // Calculate progress
    const currentStageIndex = STAGES_BEFORE_OFFERS.findIndex(s => s.key === currentStage);
    const progress = currentStageIndex >= 0 
      ? ((currentStageIndex + 1) / STAGES_BEFORE_OFFERS.length) * 100 
      : 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Offers & Negotiation
          </CardTitle>
          <CardDescription>
            Submit and negotiate offers once due diligence is complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Locked State Alert */}
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Not Yet Available</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Complete the stages below to unlock offer negotiations. This ensures both parties have enough information to make informed decisions.
            </AlertDescription>
          </Alert>

          {/* Progress Indicator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress to Offers</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stage Checklist */}
          <div className="space-y-3">
            {STAGES_BEFORE_OFFERS.map((stage, index) => {
              const stageIndex = STAGES_BEFORE_OFFERS.findIndex(s => s.key === currentStage);
              const isCompleted = index < stageIndex || (index === stageIndex && currentStage !== stage.key);
              const isCurrent = stage.key === currentStage;
              const isPending = index > stageIndex;

              return (
                <div 
                  key={stage.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isCurrent 
                      ? "border-primary bg-primary/5" 
                      : isCompleted 
                        ? "border-green-200 bg-green-50 dark:bg-green-950/20" 
                        : "border-muted bg-muted/30"
                  }`}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : isCurrent ? (
                      <Circle className="h-5 w-5 text-primary fill-primary/20" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isPending ? "text-muted-foreground" : ""}`}>
                      {stage.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </div>
                  {isCurrent && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
              );
            })}

            {/* Offers Stage Preview */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-muted bg-muted/10">
              <div className="mt-0.5">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-muted-foreground">Negotiation</p>
                <p className="text-sm text-muted-foreground">Submit offers, negotiate terms, and finalize the deal</p>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* What to Expect */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              What You'll Be Able to Do
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {isBuyer ? (
                <>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Submit a Letter of Intent (LOI) with your offer
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Accept the asking price to fast-track the deal
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Negotiate deal structure and terms
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Review and compare offers from buyers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Accept, reject, or counter offers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Negotiate final terms before closing
                  </li>
                </>
              )}
            </ul>
          </div>
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

      {/* LOI Info Card for Sellers */}
      {!isBuyer && currentStage === 'negotiation' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 border-l-4 border-l-blue-600 p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-800 mb-1">Letter of Intent (LOI)</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                The buyer is preparing a Letter of Intent outlining their proposed terms. Once submitted,
                it will appear in the <strong>Documents</strong> tab. You are not required to accept the
                LOI — it is a non-binding document to help both parties align on key terms before the
                formal agreement. We recommend reviewing it with a legal professional.
              </p>
            </div>
          </div>
        </div>
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
