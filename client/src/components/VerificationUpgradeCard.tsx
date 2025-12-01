import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function VerificationUpgradeCard() {
  const { data: status, isLoading } = trpc.verification.getStatus.useQuery();
  const initiatePayment = trpc.verification.initiatePayment.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Already verified
  if (status?.verificationStatus === "verified") {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">Verified Buyer</CardTitle>
          </div>
          <CardDescription>
            Your account is verified. Sellers can see your verified badge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">
              <Shield className="mr-1 h-3 w-3" />
              Verified
            </Badge>
            {status.verifiedAt && (
              <span className="text-sm text-muted-foreground">
                Since {new Date(status.verifiedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // In progress
  if (status?.verificationStatus && status.verificationStatus !== "unverified") {
    const statusMessages = {
      payment_pending: "Payment pending...",
      identity_pending: "Please upload your documents",
      funds_pending: "Please upload proof of funds",
      review_pending: "Under admin review",
      rejected: "Verification rejected",
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Verification In Progress</CardTitle>
          </div>
          <CardDescription>
            {statusMessages[status.verificationStatus as keyof typeof statusMessages] || "Processing..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">{status.verificationStatus.replace("_", " ").toUpperCase()}</Badge>
        </CardContent>
      </Card>
    );
  }

  // Not verified - show upgrade option
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>Get Verified</CardTitle>
        </div>
        <CardDescription>
          Build trust with sellers and unlock premium features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Priority Access</p>
              <p className="text-sm text-muted-foreground">
                Sellers respond faster to verified buyers
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Build Trust</p>
              <p className="text-sm text-muted-foreground">
                Show sellers you're a serious buyer with verified identity and funds
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Skip the Line</p>
              <p className="text-sm text-muted-foreground">
                Get instant credibility instead of weeks of back-and-forth
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Exclusive Access</p>
              <p className="text-sm text-muted-foreground">
                Some sellers only accept offers from verified buyers
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-blue-900">$199</span>
            <span className="text-sm text-blue-700">one-time fee</span>
          </div>
          <p className="text-sm text-blue-700">
            Valid for 12 months • Instant credibility • Priority support
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => initiatePayment.mutate()}
          disabled={initiatePayment.isPending}
          className="w-full"
          size="lg"
        >
          {initiatePayment.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Get Verified for $199
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
