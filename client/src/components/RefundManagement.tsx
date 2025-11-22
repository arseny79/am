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
import { DollarSign, Loader2 } from "lucide-react";

interface RefundManagementProps {
  listingId: number;
  businessName: string;
  listingTier: string;
  paymentStatus: string;
  onRefundComplete?: () => void;
}

export function RefundManagement({
  listingId,
  businessName,
  listingTier,
  paymentStatus,
  onRefundComplete,
}: RefundManagementProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const refundMutation = trpc.refunds.processRefund.useMutation({
    onSuccess: (data) => {
      toast.success(`Refund processed: $${data.amount.toFixed(2)}`);
      setOpen(false);
      setReason("");
      setRefundAmount("");
      onRefundComplete?.();
    },
    onError: (error) => {
      toast.error("Refund failed: " + error.message);
    },
  });

  const handleSubmit = () => {
    if (reason.length < 10) {
      toast.error("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    refundMutation.mutate({
      listingId,
      reason,
      refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
    });
  };

  // Only show refund button for paid listings
  if (paymentStatus !== "paid") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="h-4 w-4 mr-1" />
          Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Issue a refund for listing: <strong>{businessName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Listing Tier</Label>
            <Input value={listingTier} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-amount">
              Refund Amount (USD)
              <span className="text-muted-foreground text-sm ml-2">
                Leave empty for full refund
              </span>
            </Label>
            <Input
              id="refund-amount"
              type="number"
              placeholder="299.00"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Refund <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this refund is being processed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
            <p className="text-sm text-muted-foreground">
              This reason will be included in the refund confirmation email to the seller.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={refundMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={refundMutation.isPending || reason.length < 10}
          >
            {refundMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Process Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
