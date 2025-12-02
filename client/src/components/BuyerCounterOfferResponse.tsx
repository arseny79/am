import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, CheckCircle2, XCircle, TrendingDown } from "lucide-react";

interface BuyerCounterOfferResponseProps {
  dealId: number;
  offer: {
    id: number;
    amount: number;
    offerType: string;
    offeredByUser?: { name: string | null };
  };
  askingPrice: number;
  onSuccess?: () => void;
}

export function BuyerCounterOfferResponse({ dealId, offer, askingPrice, onSuccess }: BuyerCounterOfferResponseProps) {
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);

  const [acceptNotes, setAcceptNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [counterAmount, setCounterAmount] = useState("");
  const [counterReason, setCounterReason] = useState("");

  const utils = trpc.useUtils();

  const acceptMutation = trpc.offerHistory.acceptOffer.useMutation({
    onSuccess: () => {
      toast.success("Offer accepted! Deal is moving to escrow.");
      setAcceptDialogOpen(false);
      utils.offerHistory.getByDeal.invalidate({ dealId });
      utils.deal.getById.invalidate({ id: dealId });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to accept offer: ${error.message}`);
    },
  });

  const rejectMutation = trpc.offerHistory.rejectOffer.useMutation({
    onSuccess: () => {
      toast.success("Offer rejected");
      setRejectDialogOpen(false);
      utils.offerHistory.getByDeal.invalidate({ dealId });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to reject offer: ${error.message}`);
    },
  });

  const counterMutation = trpc.offerHistory.buyerCounterCounterOffer.useMutation({
    onSuccess: () => {
      toast.success("Counter-offer sent to seller");
      setCounterDialogOpen(false);
      setCounterAmount("");
      setCounterReason("");
      utils.offerHistory.getByDeal.invalidate({ dealId });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to send counter-offer: ${error.message}`);
    },
  });

  const handleAccept = () => {
    acceptMutation.mutate({
      dealId,
      offerId: offer.id,
      notes: acceptNotes,
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    rejectMutation.mutate({
      dealId,
      offerId: offer.id,
      reason: rejectReason,
    });
  };

  const handleCounter = () => {
    const amount = parseInt(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid counter-offer amount");
      return;
    }

    if (!counterReason.trim()) {
      toast.error("Please provide reasoning for your counter-offer");
      return;
    }

    counterMutation.mutate({
      dealId,
      sellerOfferId: offer.id,
      counterAmount: amount,
      reason: counterReason,
    });
  };

  const discount = ((askingPrice - offer.amount) / askingPrice) * 100;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Accept Button */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Accept Offer
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Seller's Offer</DialogTitle>
            <DialogDescription>
              You're about to accept {offer.offeredByUser?.name || "the seller"}'s offer of ${offer.amount.toLocaleString()}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-500">
              <div className="text-sm font-medium mb-2">What happens next:</div>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Deal advances to escrow stage</li>
                <li>Seller is notified of acceptance</li>
                <li>Escrow process begins</li>
                <li>No further price negotiations</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accept-notes">Notes (Optional)</Label>
              <Textarea
                id="accept-notes"
                placeholder="Add any notes about this acceptance..."
                value={acceptNotes}
                onChange={(e) => setAcceptNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAcceptDialogOpen(false)}
              disabled={acceptMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {acceptMutation.isPending ? "Accepting..." : "Confirm Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Counter-Offer Button */}
      <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <TrendingDown className="h-4 w-4 mr-2" />
            Counter-Offer
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Counter-Offer</DialogTitle>
            <DialogDescription>
              Propose a different price to {offer.offeredByUser?.name || "the seller"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Original Asking Price</div>
                <div className="font-semibold">${askingPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Seller's Offer</div>
                <div className="font-semibold">
                  ${offer.amount.toLocaleString()}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({Math.abs(discount).toFixed(1)}% {discount > 0 ? "below" : "above"})
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter-amount">Your Counter-Offer Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="counter-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
              {counterAmount && !isNaN(parseInt(counterAmount)) && (
                <div className="text-sm text-muted-foreground">
                  {((askingPrice - parseInt(counterAmount)) / askingPrice * 100).toFixed(1)}% 
                  {parseInt(counterAmount) < askingPrice ? " below" : " above"} asking price
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter-reason">Reasoning *</Label>
              <Textarea
                id="counter-reason"
                placeholder="Explain why you're proposing this counter-offer..."
                value={counterReason}
                onChange={(e) => setCounterReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Reference valuation factors, market conditions, or specific concerns to strengthen your position
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCounterDialogOpen(false)}
              disabled={counterMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCounter}
              disabled={counterMutation.isPending}
            >
              {counterMutation.isPending ? "Sending..." : "Send Counter-Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Button */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Seller's Offer</DialogTitle>
            <DialogDescription>
              You're about to reject {offer.offeredByUser?.name || "the seller"}'s offer of ${offer.amount.toLocaleString()}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-500">
              <div className="text-sm font-medium mb-2">Note:</div>
              <p className="text-sm text-muted-foreground">
                Rejecting this offer will notify the seller. Consider making a counter-offer instead to keep negotiations open.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason for Rejection *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Explain why you're rejecting this offer..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
