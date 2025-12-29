import { useAuth } from "@/_core/hooks/useAuth";
import { StandardHeader } from "@/components/StandardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, Shield, Zap, CreditCard } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful! Starting verification...");
        onSuccess();
      }
    } catch (err) {
      toast.error("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || processing} className="w-full">
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay $5 & Start Verification
          </>
        )}
      </Button>
    </form>
  );
}

function AuthenticatedContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"payment" | "verification" | "complete">("payment");
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const createPaymentMutation = trpc.stripeIdentity.createVerificationPayment.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createSessionMutation = trpc.stripeIdentity.createVerificationSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe Identity verification
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { data: verificationStatus } = trpc.stripeIdentity.getVerificationStatus.useQuery();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // User already verified
  if (user.stripeIdentityVerified || user.kycVerified) {
    return (
      <div className="min-h-screen flex flex-col">
        <StandardHeader />
        <main className="flex-1 py-12">
          <div className="container max-w-2xl">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-green-900">Already Verified</CardTitle>
                </div>
                <CardDescription className="text-green-700">
                  Your account is already verified. You have full access to all marketplace features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/create-listing">
                  <Button className="w-full">Create a Listing</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const handlePaymentSuccess = () => {
    if (!paymentIntentId) return;
    
    setStep("verification");
    createSessionMutation.mutate({ paymentIntentId });
  };

  const startPayment = async () => {
    const result = await createPaymentMutation.mutateAsync();
    setPaymentIntentId(result.paymentIntentId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`Instant Verification - ${APP_TITLE}`}
        description="Get instantly verified with Stripe Identity in minutes"
      />
      <StandardHeader />
      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Instant Verification</h1>
            <p className="text-muted-foreground">
              Get verified in minutes with Stripe Identity
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Stripe Identity Verification
              </CardTitle>
              <CardDescription>
                Automated identity verification powered by Stripe. One-time fee of $5.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="space-y-3">
                <h3 className="font-semibold">What you get:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Instant verification (results in minutes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Automated process - no manual review needed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Secure verification via Stripe's trusted platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Full access to create listings immediately</span>
                  </li>
                </ul>
              </div>

              {/* Payment Form */}
              {step === "payment" && (
                <div className="space-y-4">
                  {!createPaymentMutation.data ? (
                    <Button 
                      onClick={startPayment} 
                      disabled={createPaymentMutation.isPending}
                      className="w-full"
                    >
                      {createPaymentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Continue to Payment
                        </>
                      )}
                    </Button>
                  ) : (
                    <Elements 
                      stripe={stripePromise} 
                      options={{ 
                        clientSecret: createPaymentMutation.data.clientSecret!,
                        appearance: { theme: "stripe" }
                      }}
                    >
                      <PaymentForm 
                        clientSecret={createPaymentMutation.data.clientSecret!}
                        onSuccess={handlePaymentSuccess}
                      />
                    </Elements>
                  )}
                </div>
              )}

              {step === "verification" && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Redirecting to Stripe Identity verification...
                  </p>
                </div>
              )}

              {/* Alternative Option */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Prefer a free option?
                </p>
                <Link href="/verify-account">
                  <Button variant="outline" className="w-full">
                    Try Manual Verification (FREE)
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function VerifyStripe() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <StandardHeader />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to access instant verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href={getLoginUrl()}>
                <Button className="w-full">Sign In</Button>
              </a>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return <AuthenticatedContent />;
}
