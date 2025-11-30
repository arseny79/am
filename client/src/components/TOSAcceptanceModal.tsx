import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Shield } from "lucide-react";

interface TOSAcceptanceModalProps {
  open: boolean;
  onAccepted: () => void;
}

export function TOSAcceptanceModal({ open, onAccepted }: TOSAcceptanceModalProps) {
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const acceptTermsMutation = trpc.auth.acceptTerms.useMutation({
    onSuccess: () => {
      toast.success("Terms accepted successfully");
      onAccepted();
    },
    onError: (error) => {
      toast.error(`Failed to accept terms: ${error.message}`);
    },
  });

  const handleAccept = () => {
    if (!tosAccepted || !privacyAccepted) {
      toast.error("Please accept both Terms of Service and Privacy Policy to continue");
      return;
    }
    acceptTermsMutation.mutate();
  };

  const allAccepted = tosAccepted && privacyAccepted;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-primary" />
            Welcome to MSP M&A Marketplace
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Before you can access the platform, please review and accept our legal agreements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Terms of Service */}
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id="tos"
              checked={tosAccepted}
              onCheckedChange={(checked) => setTosAccepted(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="tos"
                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Terms of Service
              </Label>
              <p className="text-sm text-muted-foreground">
                I have read and agree to the{" "}
                <Link href="/legal/terms-of-service" target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
                  Terms of Service
                  <FileText className="h-3 w-3" />
                </Link>
              </p>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="privacy"
                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Privacy Policy
              </Label>
              <p className="text-sm text-muted-foreground">
                I have read and agree to the{" "}
                <Link href="/legal/privacy-policy" target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
                  Privacy Policy
                  <FileText className="h-3 w-3" />
                </Link>
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>
              By accepting these terms, you confirm that you are authorized to use this platform and agree to comply with all applicable laws and regulations.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!allAccepted || acceptTermsMutation.isPending}
            className="w-full sm:w-auto"
            size="lg"
          >
            {acceptTermsMutation.isPending ? "Accepting..." : "Accept and Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
