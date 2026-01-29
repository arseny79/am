import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Upload, Zap, Shield, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

interface KYCVerificationCardProps {
  user: {
    kycVerified: number | boolean;
    kycSubmittedAt: string | Date | null;
    stripeIdentityVerified: number | boolean;
    stripeIdentityVerifiedAt: string | Date | null;
  };
}

/**
 * KYC Verification Status Card
 * Shows user's verification status and offers two verification options:
 * 1. FREE manual KYC (upload documents, wait 24-48 hours)
 * 2. $5 Stripe Identity (instant automated verification)
 */
export function KYCVerificationCard({ user }: KYCVerificationCardProps) {
  // Convert number to boolean for database compatibility
  const isKycVerified = Boolean(user.kycVerified);
  const isStripeVerified = Boolean(user.stripeIdentityVerified);

  const { data: stripeStatus } = trpc.stripeIdentity.getVerificationStatus.useQuery(undefined, {
    enabled: !isStripeVerified && !isKycVerified,
  });

  // User is verified via either method
  if (isKycVerified || isStripeVerified) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">Account Verified</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            {isStripeVerified 
              ? `Verified via Stripe Identity on ${user.stripeIdentityVerifiedAt ? new Date(user.stripeIdentityVerifiedAt).toLocaleDateString() : 'N/A'}`
              : `Verified via manual KYC review`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Shield className="h-4 w-4" />
            <span>You can now create listings and access all marketplace features</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User has submitted FREE KYC documents (pending review)
  if (user.kycSubmittedAt) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-900">Verification Pending</CardTitle>
          </div>
          <CardDescription className="text-yellow-700">
            Your documents are under review. We'll notify you within 24-48 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <span>Need instant verification? Try Stripe Identity below</span>
            </div>
            <Link href="/verify-stripe">
              <Button variant="outline" className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                <Zap className="h-4 w-4 mr-2" />
                Get Instant Verification ($5)
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User hasn't started verification - show both options
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">Verification Required</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          Verify your identity to create listings and access all marketplace features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Option 1: FREE Manual KYC */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Manual Verification
              </h4>
              <Badge variant="secondary" className="mt-1">FREE</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Upload ID and proof of address. Admin review within 24-48 hours.
          </p>
          <Link href="/verify-account">
            <Button variant="outline" className="w-full">
              Start Free Verification
            </Button>
          </Link>
        </div>

        {/* Option 2: $5 Stripe Identity */}
        <div className="border rounded-lg p-4 bg-white border-primary/20">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Instant Verification
              </h4>
              <Badge className="mt-1">$5 - Instant</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Automated verification via Stripe Identity. Results in minutes.
          </p>
          <Link href="/verify-stripe">
            <Button className="w-full">
              Get Verified Instantly
            </Button>
          </Link>
        </div>

        {stripeStatus?.status === "processing" && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Stripe verification in progress...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
