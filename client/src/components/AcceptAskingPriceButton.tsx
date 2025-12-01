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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle2, Zap } from "lucide-react";

interface AcceptAskingPriceButtonProps {
  dealId: number;
  askingPrice: number;
  currentStage: string;
  onSuccess?: () => void;
}

export function AcceptAskingPriceButton({
  dealId,
  askingPrice,
  currentStage,
  onSuccess,
}: AcceptAskingPriceButtonProps) {
  const [open, setOpen] = useState(false);

  const acceptMutation = trpc.deal.acceptAskingPrice.useMutation({
    onSuccess: () => {
      toast.success("Asking price accepted! Deal advanced to LOI stage.");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to accept asking price: ${error.message}`);
    },
  });

  // Only show button in initial_contact or nda_signed stages
  if (!["initial_contact", "nda_signed", "due_diligence"].includes(currentStage)) {
    return null;
  }

  const handleAccept = () => {
    acceptMutation.mutate({
      dealId,
      reason: "Buyer accepted asking price - skipping negotiation",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="w-full gap-2">
          <Zap className="w-4 h-4" />
          Accept Asking Price (${(askingPrice / 1000).toFixed(0)}k)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Accept Asking Price & Fast-Track Deal
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              You're about to accept the seller's asking price of{" "}
              <span className="font-semibold text-foreground">
                ${askingPrice.toLocaleString()}
              </span>
              .
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                What happens next:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
                <li>Deal will skip the negotiation stage</li>
                <li>You'll move directly to Letter of Intent (LOI)</li>
                <li>Seller will be notified of your acceptance</li>
                <li>You can proceed to escrow and closing</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Make sure you've completed your due diligence
              and are ready to proceed at the asking price.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
            className="gap-2"
          >
            {acceptMutation.isPending ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Accept
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
