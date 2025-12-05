import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { PRICING_TIERS, calculateTotalFees, type ListingTier } from "@shared/pricing";
import { useState } from "react";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Check, X } from "lucide-react";
import { StandardHeader } from "@/components/StandardHeader";
import Footer from "@/components/Footer";

export default function Pricing() {
  const { user } = useAuth();
  const [salePrice, setSalePrice] = useState(500000);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <StandardHeader />

      {/* Hero Section - Hormozi Style */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          We Don't Make a Dime Unless You Sell
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-primary mb-4">
          That's How Confident We Are
        </p>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
          Choose your plan. Upgrade anytime. Cancel anytime. We only win when you win.
        </p>
        
        {/* Trust Signals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12 text-sm">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-primary">$2B+</div>
            <div className="text-muted-foreground">MSP buyer capital</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-muted-foreground">MSP owners trust us</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-primary">🔒</div>
            <div className="text-muted-foreground">Escrow.com protected</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-primary">3-7</div>
            <div className="text-muted-foreground">months to close</div>
          </div>
        </div>
        
        {/* Pricing Calculator */}
        <div className="max-w-md mx-auto mb-12">
          <label className="block text-sm font-medium mb-2">
            Estimate your fees (enter expected sale price):
          </label>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(Number(e.target.value))}
            className="w-full px-4 py-2 border rounded-lg text-lg"
            placeholder="500000"
            step="10000"
          />
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {(Object.keys(PRICING_TIERS) as ListingTier[]).map((tierId) => {
            const tier = PRICING_TIERS[tierId];
            const fees = calculateTotalFees(salePrice, tierId);
            const savingsPercent = ((fees.savingsVsBroker / (fees.totalFees + fees.savingsVsBroker)) * 100).toFixed(0);

            return (
              <Card
                key={tierId}
                className={`p-8 relative ${
                  tier.recommended
                    ? "border-2 border-primary shadow-xl scale-105"
                    : "border"
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    ⭐ RECOMMENDED
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="text-5xl font-bold text-primary mb-1">
                    {tier.upfrontCost === 0 ? "FREE" : `€${tier.upfrontCost}`}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {tier.upfrontCost === 0 ? "€0 upfront cost" : `€${tier.upfrontCost}/${tier.billingPeriod || "once"}`}
                  </p>
                  <p className="text-lg font-semibold">
                    {formatPercent(tier.successFeePercent)} success fee
                  </p>
                  <p className="text-xs text-muted-foreground">(only when sold)</p>
                </div>

                {/* Example Calculation */}
                <div className="bg-slate-50 p-4 rounded-lg mb-6 text-sm">
                  <div className="font-semibold mb-2">For a {formatCurrency(salePrice)} sale:</div>
                  <div className="flex justify-between mb-1">
                    <span>Listing fee:</span>
                    <span className="font-semibold">{tier.upfrontCost === 0 ? "FREE" : `€${tier.upfrontCost}${tier.billingPeriod ? `/${tier.billingPeriod}` : ""}`}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Success fee:</span>
                    <span className="font-semibold">{formatCurrency(fees.successFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total fees:</span>
                    <span className="text-primary">{formatCurrency(fees.totalFees)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold mt-2">
                    <span>You save:</span>
                    <span>{formatCurrency(fees.savingsVsBroker)} ({savingsPercent}%)</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Perfect For */}
                <div className="border-t pt-4 mb-6">
                  <div className="font-semibold text-sm mb-2">Perfect For:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {tier.perfectFor.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Link href="/create-listing">
                  <Button
                    className="w-full"
                    variant={tier.recommended ? "default" : "outline"}
                    size="lg"
                  >
                    {tier.upfrontCost === 0 ? "List Your MSP Free" : `Get ${tier.name}`}
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2">
                <th className="text-left p-4 font-semibold">Feature</th>
                <th className="text-center p-4 font-semibold">Standard<br/>(FREE)</th>
                <th className="text-center p-4 font-semibold bg-primary/5">Featured<br/>($99/week)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b">
                <td className="p-4">Upfront Cost</td>
                <td className="text-center p-4 font-semibold text-green-600">$0</td>
                <td className="text-center p-4 bg-primary/5">$99/week</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Success Fee</td>
                <td className="text-center p-4">3%</td>
                <td className="text-center p-4 bg-primary/5">3%</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">For $500K Sale</td>
                <td className="text-center p-4">$15,000</td>
                <td className="text-center p-4 bg-primary/5">$15,000 + $99/week</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Savings vs Broker</td>
                <td className="text-center p-4 text-green-600">70%</td>
                <td className="text-center p-4 bg-primary/5 text-green-600">70%</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-semibold">Listing Duration</td>
                <td className="text-center p-4">Unlimited</td>
                <td className="text-center p-4 bg-primary/5">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Placement</td>
                <td className="text-center p-4">Standard</td>
                <td className="text-center p-4 bg-primary/5">Featured</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Homepage Showcase</td>
                <td className="text-center p-4"><X className="w-5 h-5 text-red-500 inline" /></td>
                <td className="text-center p-4 bg-primary/5"><Check className="w-5 h-5 text-green-600 inline" /></td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Buyer Analytics</td>
                <td className="text-center p-4"><X className="w-5 h-5 text-red-500 inline" /></td>
                <td className="text-center p-4 bg-primary/5"><Check className="w-5 h-5 text-green-600 inline" /></td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Priority in Search</td>
                <td className="text-center p-4"><X className="w-5 h-5 text-red-500 inline" /></td>
                <td className="text-center p-4 bg-primary/5"><Check className="w-5 h-5 text-green-600 inline" /></td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Buyer Notifications</td>
                <td className="text-center p-4"><X className="w-5 h-5 text-red-500 inline" /></td>
                <td className="text-center p-4 bg-primary/5"><Check className="w-5 h-5 text-green-600 inline" /></td>
              </tr>



              <tr className="border-b">
                <td className="p-4">Support</td>
                <td className="text-center p-4">Email</td>
                <td className="text-center p-4 bg-primary/5">Priority Email</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Response Time</td>
                <td className="text-center p-4">48 hours</td>
                <td className="text-center p-4 bg-primary/5">24 hours</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Why is the Standard tier completely free?</h3>
            <p className="text-muted-foreground">
              We believe in removing ALL barriers to entry. List your MSP for free, see buyer interest, and only pay if you sell. If we don't find a buyer, you pay nothing. Zero risk.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Can I upgrade my listing later?</h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade from Standard to Featured at any time. Featured listings cost $99/week and give you homepage showcase, priority in search results, and 3x more buyer views.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">What happens if my listing expires?</h3>
            <p className="text-muted-foreground">
              Both Standard and Featured listings have unlimited duration. Standard listings stay active forever at no cost. Featured listings continue as long as you maintain the $99/week subscription.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">How do success fees work?</h3>
            <p className="text-muted-foreground">
              Success fees are only charged when your business sells. The fee is 3% of the final sale price for both Standard and Featured tiers. If your business doesn't sell, you pay nothing (Standard tier) or only the weekly featured fee (Featured tier).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">How do I pay the success fee?</h3>
            <p className="text-muted-foreground">
              Success fees are collected through Escrow.com during the closing process. The fee is automatically deducted from the sale proceeds before funds are released to you.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">What if I don't get any buyer inquiries?</h3>
            <p className="text-muted-foreground">
              For Featured listings, if you don't get at least 3 qualified buyer inquiries in 90 days, we'll refund your listing fees. No questions asked. Standard listings are free, so there's zero risk.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join the marketplace today and connect with serious buyers or discover your next acquisition
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/create-listing">
              <Button size="lg" variant="secondary">
                List Your MSP Free
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10">
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
