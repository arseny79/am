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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileCheck } from "lucide-react";

interface AcceptLoiTermsButtonProps {
  dealId: number;
  currentStage: string;
  onSuccess?: () => void;
}

export function AcceptLoiTermsButton({
  dealId,
  currentStage,
  onSuccess,
}: AcceptLoiTermsButtonProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");

  // Only show in negotiation stage
  if (currentStage !== "negotiation") {
    return null;
  }

  const acceptLoiMutation = trpc.deal.acceptLoiTerms.useMutation({
    onSuccess: () => {
      toast.success("LOI terms accepted! Deal advanced to escrow stage.");
      setOpen(false);
      setNotes("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to accept LOI terms: ${error.message}`);
    },
  });

  const handleAccept = () => {
    acceptLoiMutation.mutate({
      dealId,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
      >
        <FileCheck className="mr-2 h-4 w-4" />
        Accept LOI Terms
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Accept Letter of Intent</DialogTitle>
            <DialogDescription>
              By accepting the LOI terms, you commit to an exclusivity period and advance to escrow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-4 text-sm border border-amber-200 dark:border-amber-800">
              <p className="font-medium mb-2 text-amber-900 dark:text-amber-100">⚠️ Important Commitment</p>
              <p className="text-amber-800 dark:text-amber-200">
                Accepting the Letter of Intent means you agree to:
              </p>
              <ul className="mt-2 space-y-1 text-amber-800 dark:text-amber-200">
                <li>• Enter an <strong>exclusivity period</strong> (typically 30-60 days)</li>
                <li>• Cease negotiations with other potential buyers</li>
                <li>• Proceed with finalizing the Asset Purchase Agreement</li>
                <li>• Move forward with escrow and closing processes</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the LOI acceptance (e.g., specific terms agreed upon, timeline expectations...)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-sm">
              <p className="font-medium mb-2">What happens next:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Deal advances to <strong>Escrow</strong> stage</li>
                <li>• Exclusivity period begins</li>
                <li>• Seller is notified of your commitment</li>
                <li>• Final agreement preparation starts</li>
                <li>• Escrow account setup initiated</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={acceptLoiMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={acceptLoiMutation.isPending}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              {acceptLoiMutation.isPending ? "Processing..." : "Accept LOI Terms"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
