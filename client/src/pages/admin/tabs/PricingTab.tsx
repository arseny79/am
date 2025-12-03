import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, DollarSign, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PricingTab() {
  const [successFeePercent, setSuccessFeePercent] = useState("3");
  const [featuredListingWeekly, setFeaturedListingWeekly] = useState("99");
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // TODO: Implement pricing configuration mutation
    setTimeout(() => {
      toast.success("Pricing configuration saved successfully");
      setLoading(false);
    }, 1000);
  };

  // Calculate example fees
  const exampleSalePrice = 500000;
  const calculatedFee = (exampleSalePrice * parseFloat(successFeePercent || "0")) / 100;
  const traditionalBrokerFee = exampleSalePrice * 0.075; // 7.5% average
  const savings = traditionalBrokerFee - calculatedFee;
  const savingsPercent = ((savings / traditionalBrokerFee) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Pricing Configuration</h2>
        <p className="text-muted-foreground">
          Configure platform fees and pricing model
        </p>
      </div>

      {/* Current Pricing Model */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Model</CardTitle>
          <CardDescription>
            "We only make money when you make money" - Success-fee only model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Phase 1: MVP Launch
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">For Sellers</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• €0 upfront cost (FREE to list)</li>
                  <li>• Success fee only (charged at closing)</li>
                  <li>• Unlimited listing duration</li>
                  <li>• Optional featured listing upgrade</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">For Buyers</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 100% FREE during Phase 1</li>
                  <li>• Unlimited browsing and access</li>
                  <li>• Early adopters grandfathered</li>
                  <li>• No hidden fees</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Fee Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Success Fee (Sellers)</CardTitle>
          <CardDescription>
            Percentage charged on successful transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="success-fee">Success Fee Percentage</Label>
            <div className="flex items-center gap-2">
              <Input
                id="success-fee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={successFeePercent}
                onChange={(e) => setSuccessFeePercent(e.target.value)}
                className="max-w-[120px]"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Current: {successFeePercent}% (Industry standard: 5-10%)
            </p>
          </div>

          {/* Example Calculation */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-3">Example Calculation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">MSP Sale Price:</span>
                <span className="font-medium">€{exampleSalePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Fee ({successFeePercent}%):</span>
                <span className="font-semibold text-primary">€{calculatedFee.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Traditional Broker (7.5%):</span>
                  <span>€{traditionalBrokerFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-green-600 mt-1">
                  <span>Seller Savings:</span>
                  <span>€{savings.toLocaleString()} ({savingsPercent}% cheaper)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Listing Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Listing (Optional Upgrade)</CardTitle>
          <CardDescription>
            Weekly subscription for enhanced visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="featured-price">Weekly Price</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">€</span>
              <Input
                id="featured-price"
                type="number"
                min="0"
                step="1"
                value={featuredListingWeekly}
                onChange={(e) => setFeaturedListingWeekly(e.target.value)}
                className="max-w-[120px]"
              />
              <span className="text-muted-foreground">/ week</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Current: €{featuredListingWeekly}/week (cancel anytime)
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-2">Featured Benefits</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Homepage showcase placement</li>
              <li>• Priority in search results</li>
              <li>• "Featured" badge on listing</li>
              <li>• Highlighted in buyer emails</li>
              <li>• 3x more buyer views</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Example Revenue</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">12 weeks featured:</span>
                <span className="font-medium">€{(parseFloat(featuredListingWeekly) * 12).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Success fee (3%):</span>
                <span className="font-medium">€{calculatedFee.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Revenue:</span>
                  <span className="text-primary">€{(parseFloat(featuredListingWeekly) * 12 + calculatedFee).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Strategy Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>3% Success Fee:</strong> 40-70% cheaper than traditional brokers (5-10%), 
              making it a compelling value proposition for sellers while maintaining healthy margins.
            </p>
            <p>
              <strong>Free-to-List:</strong> Removes friction and maximizes marketplace liquidity. 
              Sellers can list without risk, increasing supply.
            </p>
            <p>
              <strong>Featured Listings:</strong> Optional revenue stream that doesn't affect core value prop. 
              Sellers who want faster results can pay for visibility.
            </p>
            <p>
              <strong>Free Buyers (Phase 1):</strong> Prioritizes rapid user acquisition. Early adopters 
              will be grandfathered when paid tiers launch in Phase 2.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Pricing Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
