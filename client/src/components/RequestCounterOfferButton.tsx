import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

interface RequestCounterOfferButtonProps {
  dealId: number;
  askingPrice: number;
  currentStage: string;
  onSuccess?: () => void;
}

export function RequestCounterOfferButton({
  dealId,
  askingPrice,
  currentStage,
  onSuccess,
}: RequestCounterOfferButtonProps) {
  const [open, setOpen] = useState(false);
  const [counterOfferAmount, setCounterOfferAmount] = useState("");
  const [reason, setReason] = useState("");

  // Only show in early stages
  const validStages = ["initial_contact", "nda_signed", "due_diligence"];
  if (!validStages.includes(currentStage)) {
    return null;
  }

  const requestCounterOfferMutation = trpc.deal.requestCounterOffer.useMutation({
    onSuccess: () => {
      toast.success("Counter-offer submitted! Seller has been notified.");
      setOpen(false);
      setCounterOfferAmount("");
      setReason("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to submit counter-offer: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    const amount = parseFloat(counterOfferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid offer amount");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for your counter-offer");
      return;
    }

    requestCounterOfferMutation.mutate({
      dealId,
      counterOfferAmount: Math.round(amount),
      reason: reason.trim(),
    });
  };

  const discount = counterOfferAmount 
    ? ((askingPrice - parseFloat(counterOfferAmount)) / askingPrice * 100).toFixed(1)
    : "0";

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Request Counter-Offer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Counter-Offer</DialogTitle>
            <DialogDescription>
              Propose a different price and explain your reasoning. This will advance the deal to
              negotiation stage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="asking-price">Current Asking Price</Label>
              <Input
                id="asking-price"
                value={`$${askingPrice.toLocaleString()}`}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter-offer">Your Counter-Offer *</Label>
              <Input
                id="counter-offer"
                type="number"
                placeholder="Enter your offer amount"
                value={counterOfferAmount}
                onChange={(e) => setCounterOfferAmount(e.target.value)}
              />
              {counterOfferAmount && parseFloat(counterOfferAmount) < askingPrice && (
                <p className="text-sm text-muted-foreground">
                  {discount}% below asking price (${(askingPrice - parseFloat(counterOfferAmount)).toLocaleString()} discount)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Counter-Offer *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you're proposing this amount (e.g., market conditions, due diligence findings, comparable sales...)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-sm">
              <p className="font-medium mb-2">What happens next:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Deal advances to <strong>Negotiation</strong> stage</li>
                <li>• Seller receives your offer and reasoning</li>
                <li>• Seller can accept, decline, or counter your offer</li>
                <li>• You can continue negotiating until terms are agreed</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={requestCounterOfferMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={requestCounterOfferMutation.isPending}
            >
              {requestCounterOfferMutation.isPending ? "Submitting..." : "Submit Counter-Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
