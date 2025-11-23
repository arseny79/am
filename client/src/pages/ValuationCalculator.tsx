import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import ValuationWizard from "@/components/ValuationWizard";
import ValuationResults from "@/components/ValuationResults";
import { toast } from "sonner";

export default function ValuationCalculator() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const listingId = params.id ? parseInt(params.id) : null;

  const [showResults, setShowResults] = useState(false);
  const [valuationOutputs, setValuationOutputs] = useState<any>(null);
  const [sellerDesiredPrice, setSellerDesiredPrice] = useState<number | undefined>();

  const calculateMutation = trpc.valuation.calculate.useMutation({
    onSuccess: (data) => {
      setValuationOutputs(data.outputs);
      setShowResults(true);
      toast.success("Valuation calculated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to calculate valuation: ${error.message}`);
    },
  });

  const handleComplete = ({ inputs, sellerDesiredPrice: desiredPrice }: any) => {
    if (!listingId) {
      toast.error("Listing ID is required");
      return;
    }

    setSellerDesiredPrice(desiredPrice);
    calculateMutation.mutate({
      listingId,
      inputs,
      sellerDesiredPrice: desiredPrice,
    });
  };

  const handleBack = () => {
    if (listingId) {
      setLocation(`/dashboard/listings/${listingId}`);
    } else {
      setLocation("/dashboard/listings");
    }
  };

  const handleStartOver = () => {
    setShowResults(false);
    setValuationOutputs(null);
    setSellerDesiredPrice(undefined);
  };

  if (!listingId) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Listing</h1>
          <p className="text-muted-foreground mb-6">
            Please select a listing to calculate valuation.
          </p>
          <Button onClick={() => setLocation("/dashboard/listings")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listing
          </Button>
        </div>

        {/* Content */}
        {calculateMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold">Calculating your valuation...</p>
            <p className="text-sm text-muted-foreground">This will only take a moment</p>
          </div>
        ) : showResults && valuationOutputs ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Your Valuation Report</h1>
                <p className="text-muted-foreground">
                  Based on the data you provided
                </p>
              </div>
              <Button variant="outline" onClick={handleStartOver}>
                Start Over
              </Button>
            </div>
            <ValuationResults 
              outputs={valuationOutputs}
              sellerDesiredPrice={sellerDesiredPrice}
            />
          </div>
        ) : (
          <ValuationWizard 
            listingId={listingId}
            onComplete={handleComplete}
            onCancel={handleBack}
          />
        )}
      </div>
    </div>
  );
}
