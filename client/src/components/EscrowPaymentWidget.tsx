import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, ExternalLink, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

interface EscrowPaymentWidgetProps {
  escrowTransactionId: string | null;
  escrowPaymentUrl: string | null;
  escrowStatus: string | null;
  dealStage: string;
  isBuyer: boolean;
  isSeller: boolean;
  askingPrice: number;
}

export function EscrowPaymentWidget({
  escrowTransactionId,
  escrowPaymentUrl,
  escrowStatus,
  dealStage,
  isBuyer,
  isSeller,
  askingPrice,
}: EscrowPaymentWidgetProps) {
  // Only show widget when deal reaches escrow stage
  if (dealStage !== "escrow" && dealStage !== "closing" && dealStage !== "closed") {
    return null;
  }

  // If no escrow transaction exists yet, show pending state
  if (!escrowTransactionId) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Lock className="h-5 w-5" />
            Escrow Payment Pending
          </CardTitle>
          <CardDescription className="text-amber-700">
            Escrow transaction is being created
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              The escrow transaction is being set up. You'll receive a notification once it's ready.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Determine status badge
  const getStatusBadge = () => {
    switch (escrowStatus?.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300"><Clock className="h-3 w-3 mr-1" />Pending Payment</Badge>;
      case "funded":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300"><CheckCircle2 className="h-3 w-3 mr-1" />Funded</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300"><CheckCircle2 className="h-3 w-3 mr-1" />Assets Transferred</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Unknown</Badge>;
    }
  };

  // Get appropriate message based on status and role
  const getMessage = () => {
    const status = escrowStatus?.toLowerCase();
    
    if (status === "pending") {
      if (isBuyer) {
        return "Click the button below to fund the escrow account. Your payment will be held securely until all conditions are met.";
      } else {
        return "Waiting for buyer to fund the escrow account. You'll be notified once payment is received.";
      }
    }
    
    if (status === "funded") {
      if (isSeller) {
        return "Escrow has been funded. You can now begin transferring assets to the buyer. Mark assets as transferred when complete.";
      } else {
        return "Escrow payment is secured. The seller will now transfer assets. Funds will be released once you confirm receipt.";
      }
    }
    
    if (status === "shipped") {
      if (isBuyer) {
        return "Seller has marked assets as transferred. Review and confirm receipt to release funds from escrow.";
      } else {
        return "You've marked assets as transferred. Waiting for buyer confirmation to release funds.";
      }
    }
    
    if (status === "completed") {
      return "Escrow transaction completed successfully. Funds have been released to the seller.";
    }
    
    if (status === "cancelled") {
      return "Escrow transaction was cancelled. Any funds have been refunded to the buyer.";
    }
    
    return "Escrow transaction in progress.";
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Lock className="h-5 w-5" />
            Escrow Payment
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-green-700">
          Secure payment through Escrow.com
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Transaction ID</p>
            <p className="font-mono text-xs">{escrowTransactionId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount</p>
            <p className="font-semibold">${askingPrice.toLocaleString()}</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {getMessage()}
          </AlertDescription>
        </Alert>

        {/* Show payment button for buyer when status is pending */}
        {isBuyer && escrowStatus?.toLowerCase() === "pending" && escrowPaymentUrl && (
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => window.open(escrowPaymentUrl, "_blank")}
          >
            <Lock className="h-4 w-4 mr-2" />
            Fund Escrow Account
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        )}

        {/* Show view transaction button for all users */}
        {escrowPaymentUrl && escrowStatus?.toLowerCase() !== "pending" && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open(escrowPaymentUrl, "_blank")}
          >
            View Transaction on Escrow.com
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        )}

        {/* Escrow milestones progress */}
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-medium">Transaction Progress</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`h-4 w-4 ${escrowStatus ? "text-green-600" : "text-gray-300"}`} />
              <span className={escrowStatus ? "text-foreground" : "text-muted-foreground"}>
                Escrow Created
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`h-4 w-4 ${["funded", "shipped", "completed"].includes(escrowStatus?.toLowerCase() || "") ? "text-green-600" : "text-gray-300"}`} />
              <span className={["funded", "shipped", "completed"].includes(escrowStatus?.toLowerCase() || "") ? "text-foreground" : "text-muted-foreground"}>
                Buyer Funded Escrow
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`h-4 w-4 ${["shipped", "completed"].includes(escrowStatus?.toLowerCase() || "") ? "text-green-600" : "text-gray-300"}`} />
              <span className={["shipped", "completed"].includes(escrowStatus?.toLowerCase() || "") ? "text-foreground" : "text-muted-foreground"}>
                Assets Transferred
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`h-4 w-4 ${escrowStatus?.toLowerCase() === "completed" ? "text-green-600" : "text-gray-300"}`} />
              <span className={escrowStatus?.toLowerCase() === "completed" ? "text-foreground" : "text-muted-foreground"}>
                Transaction Completed
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
