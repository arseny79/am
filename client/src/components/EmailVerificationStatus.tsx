import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationStatus() {
  const [isResending, setIsResending] = useState(false);

  // Get verification status
  const verificationStatus = trpc.emailVerification.getVerificationStatus.useQuery();

  // Resend verification email mutation
  const resendMutation = trpc.emailVerification.resendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success("Verification email sent! Check your inbox.");
      setIsResending(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend verification email");
      setIsResending(false);
    },
  });

  const handleResendEmail = () => {
    setIsResending(true);
    resendMutation.mutate();
  };

  if (verificationStatus.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  const { emailVerified, email } = verificationStatus.data || {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>Verify your email to access all marketplace features</CardDescription>
          </div>
          {emailVerified ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              <AlertCircle className="h-4 w-4 mr-1" />
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Email Address</p>
          <p className="font-medium">{email || "Not set"}</p>
        </div>

        {!emailVerified && (
          <>
            <Alert className="border-amber-200 bg-amber-50">
              <Mail className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                Email verification is required to submit KYC documents, create listings, and access confidential listings.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleResendEmail}
              disabled={isResending || resendMutation.isPending}
              className="w-full"
            >
              {isResending || resendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </>
        )}

        {emailVerified && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              Your email is verified. You can now use all marketplace features.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
