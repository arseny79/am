import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { VerificationUpgradeCard } from "@/components/VerificationUpgradeCard";
import { DocumentUploadForm } from "@/components/DocumentUploadForm";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Loader2, ShieldCheck, FileText, TrendingUp, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

export default function BuyerDashboard() {
  const { user, loading } = useAuth();

  // Get user's verification status
  const { data: verificationData, isLoading: verificationLoading } = trpc.verification.getStatus.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (loading || verificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please log in to access your buyer dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verificationStatus = verificationData?.verificationStatus || "unverified";
  const showUpgradeCard = verificationStatus === "unverified";
  const showDocumentUpload = verificationStatus === "payment_pending" || verificationStatus === "identity_pending" || verificationStatus === "funds_pending";
  const isPending = verificationStatus === "review_pending";
  const isVerified = verificationStatus === "verified";
  const isRejected = verificationStatus === "rejected";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <div className="container py-8 flex-1">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Buyer Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.name}
              </p>
            </div>
            <VerificationBadge verificationStatus={verificationStatus} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Deals in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Listings</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Businesses you're watching
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Unread conversations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Verification Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Verification Status
          </h2>

          {showUpgradeCard && (
            <VerificationUpgradeCard />
          )}

          {showDocumentUpload && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Verification</CardTitle>
                <CardDescription>
                  Upload your identity document and proof of funds to complete the verification process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUploadForm />
              </CardContent>
            </Card>
          )}

          {isPending && (
            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verification Under Review
                </CardTitle>
                <CardDescription>
                  Your documents are being reviewed by our team. This typically takes 1-2 business days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We'll send you an email once your verification is approved or if we need additional information.
                </p>
              </CardContent>
            </Card>
          )}

          {isVerified && (
            <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <ShieldCheck className="h-5 w-5" />
                  Verified Buyer
                </CardTitle>
                <CardDescription>
                  Your account is verified. Sellers will see your verified badge when you request access to listings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Benefits:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Priority response from sellers</li>
                    <li>Access to premium listings</li>
                    <li>Verified badge on all communications</li>
                    <li>Faster deal closing process</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {isRejected && verificationData?.latestAttempt?.rejectionReason && (
            <Card className="border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400">
                  Verification Rejected
                </CardTitle>
                <CardDescription>
                  Your verification was not approved. Please review the reason below and try again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-md">
                    <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                      Reason for Rejection:
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {verificationData.latestAttempt?.rejectionReason}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/buyer-dashboard">Try Again</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <Link href="/browse">
                <CardHeader>
                  <CardTitle className="text-lg">Browse Listings</CardTitle>
                  <CardDescription>
                    Discover businesses and assets available for acquisition
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer">
              <Link href="/my-deals">
                <CardHeader>
                  <CardTitle className="text-lg">My Deals</CardTitle>
                  <CardDescription>
                    View and manage your active deal rooms
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer">
              <Link href="/access-requests">
                <CardHeader>
                  <CardTitle className="text-lg">Access Requests</CardTitle>
                  <CardDescription>
                    Track your requests for private listings
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
