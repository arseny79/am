import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Upload, Shield, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface KYCVerificationCardProps {
  user: {
    kycVerified: number | boolean;
    kycSubmittedAt: string | Date | null;
    stripeIdentityVerified?: number | boolean | null;
    stripeIdentityVerifiedAt?: string | Date | null;
  };
}

export function KYCVerificationCard({ user }: KYCVerificationCardProps) {
  const isVerified = Boolean(user.kycVerified) || Boolean(user.stripeIdentityVerified);

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">Account Verified</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Your identity has been verified successfully.
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
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <AlertCircle className="h-4 w-4" />
            <span>We'll email you once the review is complete.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

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
      <CardContent>
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
            Upload your ID and proof of address. Admin review within 24-48 hours.
          </p>
          <Link href="/verify-account">
            <Button variant="outline" className="w-full">
              Start Free Verification
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
