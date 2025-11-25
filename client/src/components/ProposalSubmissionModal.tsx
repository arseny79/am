import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface ProposalSubmissionModalProps {
  requestId: number;
  requestTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalSubmissionModal({
  requestId,
  requestTitle,
  open,
  onOpenChange,
}: ProposalSubmissionModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [proposalMessage, setProposalMessage] = useState("");

  const { data: myListings = [], isLoading: listingsLoading } = trpc.listing.getMy.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const publishedListings = myListings.filter((l) => l.isPublished);

  const submitProposal = trpc.buyerRequestProposal.submit.useMutation({
    onSuccess: (data) => {
      toast.success("Proposal submitted! Redirecting to deal room...");
      onOpenChange(false);
      navigate(`/deal-room/${data.dealId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit proposal");
    },
  });

  const handleSubmit = () => {
    if (!selectedListingId) {
      toast.error("Please select a listing");
      return;
    }

    submitProposal.mutate({
      requestId,
      listingId: parseInt(selectedListingId),
      proposalMessage: proposalMessage || undefined,
    });
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to respond</DialogTitle>
            <DialogDescription>
              To contact this buyer, you need to create an account and list your MSP business.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-medium">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Create your account</li>
                <li>List your MSP business</li>
                <li>Match your listing to this request</li>
                <li>Start negotiating with the buyer</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => (window.location.href = getLoginUrl())}>
                Sign In
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!listingsLoading && publishedListings.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a listing to respond</DialogTitle>
            <DialogDescription>
              You need an active listing to respond to buyer requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Listing your business allows you to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Respond to buyer requests with detailed information</li>
                <li>Get discovered by qualified buyers</li>
                <li>Manage all negotiations in one place</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => navigate("/create-listing")}>
                Create Your Listing
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Match Your Listing to This Request</DialogTitle>
          <DialogDescription>
            Propose your listing: <span className="font-medium">{requestTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {listingsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Select Listing to Propose</Label>
              <RadioGroup value={selectedListingId} onValueChange={setSelectedListingId}>
                {publishedListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSelectedListingId(listing.id.toString())}
                  >
                    <RadioGroupItem value={listing.id.toString()} id={`listing-${listing.id}`} className="mt-1" />
                    <div className="flex-1 space-y-1">
                      <label
                        htmlFor={`listing-${listing.id}`}
                        className="font-medium cursor-pointer block"
                      >
                        {listing.businessName}
                      </label>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>Revenue: ${(listing.annualRevenue || 0).toLocaleString()}</span>
                        {listing.ebitda && (
                          <span>EBITDA: ${listing.ebitda.toLocaleString()}</span>
                        )}
                        <span>{listing.location}</span>
                      </div>
                      {listing.serviceMix && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{listing.serviceMix}</p>
                      )}
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message to Buyer (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Explain why your business is a great fit for their requirements..."
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This message will be sent with your listing details to the buyer.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!selectedListingId || submitProposal.isPending}
              >
                {submitProposal.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Send Proposal"
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={submitProposal.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
