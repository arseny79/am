import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { PRICING_TIERS, calculateTotalFees, type ListingTier } from "@shared/pricing";
import { useState } from "react";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

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
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-2xl font-bold text-primary cursor-pointer">{APP_TITLE}</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/">Home</Link>
            <Link href="/marketplace">Browse</Link>
            <Link href="/pricing" className="font-semibold text-primary">Pricing</Link>
            {user?.role === "admin" && (
              <Link href="/admin-dashboard">Admin</Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Save 50-70% compared to traditional brokers. No monthly fees, no retainers, no hidden costs. Just a small listing fee and a success fee only when your business sells.
        </p>
        
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
                    Recommended
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="text-4xl font-bold text-primary mb-1">
                    {formatCurrency(tier.listingFee)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    one-time listing fee
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-2xl font-semibold">
                      + {formatPercent(tier.successFeePercent)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      success fee (only when sold)
                    </p>
                  </div>
                </div>

                {/* Fee Calculation for Current Price */}
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <div className="text-sm font-medium mb-2">
                    For a {formatCurrency(salePrice)} sale:
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Listing fee:</span>
                      <span className="font-medium">{formatCurrency(fees.listingFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success fee:</span>
                      <span className="font-medium">{formatCurrency(fees.successFee)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total fees:</span>
                      <span className="text-primary">{formatCurrency(fees.totalFees)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 pt-1">
                      <span>You save:</span>
                      <span className="font-semibold">
                        {formatCurrency(fees.savingsVsBroker)} ({savingsPercent}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/create-listing">
                  <Button
                    className="w-full"
                    variant={tier.recommended ? "default" : "outline"}
                    size="lg"
                  >
                    Get Started
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Comparison Section */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How We Compare to Traditional Brokers
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Feature</th>
                    <th className="px-6 py-4 text-center">Traditional Broker</th>
                    <th className="px-6 py-4 text-center bg-primary/10">
                      {APP_TITLE}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-6 py-4 font-medium">Commission Rate</td>
                    <td className="px-6 py-4 text-center">8-12%</td>
                    <td className="px-6 py-4 text-center bg-primary/5 font-semibold text-primary">
                      3-5%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Upfront Retainer</td>
                    <td className="px-6 py-4 text-center">$45K-$80K</td>
                    <td className="px-6 py-4 text-center bg-primary/5 font-semibold text-primary">
                      $299-$999
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Monthly Fees</td>
                    <td className="px-6 py-4 text-center">Often required</td>
                    <td className="px-6 py-4 text-center bg-primary/5 font-semibold text-primary">
                      None
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Total Cost ($500K sale)</td>
                    <td className="px-6 py-4 text-center">~$50,000</td>
                    <td className="px-6 py-4 text-center bg-primary/5 font-semibold text-primary">
                      $16K-$25K
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">MSP-Specific Tools</td>
                    <td className="px-6 py-4 text-center">❌</td>
                    <td className="px-6 py-4 text-center bg-primary/5 text-2xl">✅</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Instant Valuation</td>
                    <td className="px-6 py-4 text-center">❌</td>
                    <td className="px-6 py-4 text-center bg-primary/5 text-2xl">✅</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Direct Buyer Access</td>
                    <td className="px-6 py-4 text-center">Limited</td>
                    <td className="px-6 py-4 text-center bg-primary/5 font-semibold text-primary">
                      Full Control
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              When do I pay the listing fee?
            </h3>
            <p className="text-muted-foreground">
              The listing fee is paid once when you create your listing. It covers a 12-month listing period with no additional monthly charges.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              When do I pay the success fee?
            </h3>
            <p className="text-muted-foreground">
              The success fee is only paid when your business successfully sells. It's calculated as a percentage of the final sale price and is typically paid at closing.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              What if my business doesn't sell?
            </h3>
            <p className="text-muted-foreground">
              If your business doesn't sell during the 12-month listing period, you only pay the initial listing fee. No success fee. You can renew your listing or make adjustments as needed.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Can I upgrade my listing tier later?
            </h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade from Basic to Featured or Premium at any time. You'll pay the difference in listing fees and benefit from the lower success fee percentage going forward.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Are there any hidden fees?
            </h3>
            <p className="text-muted-foreground">
              No. The listing fee and success fee are the only costs. There are no monthly fees, no transaction fees, no payment processing fees, and no surprise charges.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to List Your MSP Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join sellers who are saving thousands compared to traditional brokers
          </p>
          <Link href="/create-listing">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Create Your Listing
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 {APP_TITLE}. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="/">
                <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                  Home
                </span>
              </Link>
              <Link href="/marketplace">
                <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                  Browse
                </span>
              </Link>
              <Link href="/pricing">
                <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                  Pricing
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
