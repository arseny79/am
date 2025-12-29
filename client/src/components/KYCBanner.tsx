import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

interface KYCBannerProps {
  user: {
    kycVerified: boolean;
    stripeIdentityVerified: boolean;
    kycSubmittedAt: Date | null;
  };
}

/**
 * KYC Verification Banner
 * Shows at top of homepage for logged-in unverified users
 * Dismissible but reappears on page reload
 */
export function KYCBanner({ user }: KYCBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if user is verified or has dismissed
  if (user.kycVerified || user.stripeIdentityVerified || dismissed) {
    return null;
  }

  // Different message if KYC is pending
  if (user.kycSubmittedAt) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-900">
                <strong>Verification Pending:</strong> Your documents are under review. Need instant verification?{" "}
                <Link href="/verify-stripe" className="underline font-semibold">
                  Try Stripe Identity ($5)
                </Link>
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-yellow-600 hover:text-yellow-900 flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User hasn't started verification
  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-900">
              <strong>Verify your account</strong> to create listings and access all features.{" "}
              <Link href="/verify-account" className="underline font-semibold">
                Start FREE verification
              </Link>
              {" "}or{" "}
              <Link href="/verify-stripe" className="underline font-semibold">
                get verified instantly ($5)
              </Link>
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-blue-600 hover:text-blue-900 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
