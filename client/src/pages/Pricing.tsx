import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Check, Loader2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { useState } from "react";

export default function Pricing() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const createCheckout = trpc.stripeListingUpgrade.createCheckoutSession.useMutation();
  
  // Load price plans from database
  const { data: plans = [], isLoading } = trpc.pricePlan.getActive.useQuery();
  
  // Get success fee from first plan (all plans have same success fee)
  const SUCCESS_FEE_PERCENT = plans.length > 0 ? plans[0].successFeePercentage / 100 : 3;

  const formatPercent = (percent: number) => {
    return `${percent}%`;
  };

  // Structured data for pricing page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "acquisition.market Listing Service",
    "description": "List your business or asset for sale with transparent pricing and success-based fees",
    "brand": {
      "@type": "Brand",
      "name": APP_TITLE
    },
    "offers": plans.map((plan) => ({
      "@type": "Offer",
      "name": plan.name,
      "price": plan.price / 100,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "description": plan.description || plan.name
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SEOHead
        title={`Pricing - ${APP_TITLE}`}
        description="Transparent pricing for listing your business or asset. Only 3% success fee when you sell. No upfront costs for standard listings."
        canonical="https://acquisition.market/pricing"
        structuredData={structuredData}
      />
      {/* Header */}
      <PublicHeader />

      {/* Hero Section - Clean and Simple */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-primary mb-4">
          Only Pay When You Sell
        </p>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Choose your plan. Upgrade anytime. Cancel anytime. We only win when you win.
        </p>
      </section>

      {/* Pricing Tiers */}
      <section className="container mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const upfrontCost = plan.price / 100; // Convert cents to dollars

              return (
                <Card
                  key={plan.id}
                  className={`p-8 ${
                    plan.isFeatured
                      ? "border-2 border-primary shadow-xl scale-105"
                      : "border"
                  }`}
                >
                  {!!plan.isFeatured && (
                    <div className="flex justify-center mb-4">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                        ⭐ MOST POPULAR
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-5xl font-bold text-primary mb-1">
                      {plan.price === 0 ? "FREE" : `$${upfrontCost.toFixed(0)}`}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {plan.price === 0 ? "$0 upfront cost" : `$${upfrontCost.toFixed(0)}/${plan.billingPeriod.replace("_", " ")}`}
                    </p>
                    <p className="text-lg font-semibold">
                      {formatPercent(SUCCESS_FEE_PERCENT)} success fee
                    </p>
                    <p className="text-xs text-muted-foreground">(only when sold)</p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    {(plan.features as string[] || []).map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-label="Included" role="img" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <div className="border-t pt-4 mb-6">
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  )}

                  {/* CTA Button */}
                  {plan.price === 0 ? (
                    <Link href="/create-listing">
                      <Button
                        className="w-full"
                        variant={plan.isFeatured ? "default" : "outline"}
                        size="lg"
                      >
                        List Your Business Free
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.isFeatured ? "default" : "outline"}
                      size="lg"
                      disabled={loadingPlan === plan.name}
                      onClick={async () => {
                        if (!user) {
                          toast.error("Please sign in to upgrade");
                          return;
                        }
                        setLoadingPlan(plan.name);
                        try {
                          const productId = plan.name === "Featured" ? "featured_weekly" : "premium_weekly";
                          const result = await createCheckout.mutateAsync({ productId });
                          window.open(result.url, "_blank");
                          toast.success("Redirecting to checkout...");
                        } catch (error) {
                          toast.error("Failed to create checkout session");
                        } finally {
                          setLoadingPlan(null);
                        }
                      }}
                    >
                      {loadingPlan === plan.name ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Get ${plan.name}`
                      )}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
