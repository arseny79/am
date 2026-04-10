import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

export default function PaymentSuccess() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get session_id from URL query params
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    if (sid) {
      setSessionId(sid);
    }
  }, []);

  const { data: session, isLoading, error } = trpc.stripe.verifyCheckoutSession.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />

        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <CardTitle>Payment Verification Failed</CardTitle>
              </div>
              <CardDescription>
                We couldn't verify your payment. Please contact support if you believe this is an error.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Error: {error?.message || "Unable to verify payment session"}
                </p>
                <div className="flex gap-3">
                  <Link href="/create-listing" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Try Again
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button variant="default" className="w-full">
                      Go Home
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isPaid = session.status === "paid";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                <CardDescription>
                  Your listing fee has been processed
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Details */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold mb-3">Payment Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Listing Tier</p>
                  <p className="font-medium capitalize">{session.tier || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-medium">
                    ${session.amountTotal ? (session.amountTotal / 100).toFixed(2) : "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <p className="font-medium text-green-600">
                    {isPaid ? "Paid" : session.status}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{session.customerEmail || user?.email}</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold">What's Next?</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Complete Your Listing</p>
                    <p className="text-sm text-muted-foreground">
                      Finish filling out your listing details if you haven't already
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Your Listing Goes Live</p>
                    <p className="text-sm text-muted-foreground">
                      After payment confirmation, your listing will be published automatically
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Connect with Buyers</p>
                    <p className="text-sm text-muted-foreground">
                      Start receiving inquiries from qualified buyers interested in your listing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Link href="/my-listings" className="flex-1">
                <Button className="w-full">
                  View My Listings
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/marketplace" className="flex-1">
                <Button variant="outline" className="w-full">
                  Browse Marketplace
                </Button>
              </Link>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              A receipt has been sent to {session.customerEmail || user?.email}
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
