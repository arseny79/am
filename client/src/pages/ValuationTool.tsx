import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calculator, TrendingUp, AlertCircle, ArrowRight, Building2 } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, getContractLengthLabel, type ContractLength } from "@shared/valuationCalculator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE } from "@/const";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/PublicHeader";

export default function ValuationTool() {
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [ebitda, setEbitda] = useState("");
  const [recurringRevenue, setRecurringRevenue] = useState("");
  const [contractLength, setContractLength] = useState<ContractLength>("1-year");
  const [topClient, setTopClient] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculateMutation = trpc.valuation.calculate.useMutation({
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleCalculate = () => {
    // Parse and validate inputs, preventing NaN
    const revenue = annualRevenue ? parseFloat(annualRevenue) : 0;
    const ebitdaValue = ebitda ? parseFloat(ebitda) : undefined;
    const recurring = recurringRevenue ? parseFloat(recurringRevenue) : 0;
    const topClientValue = topClient ? parseFloat(topClient) : 0;

    // Validate required fields and ranges
    if (!revenue || revenue <= 0) {
      return;
    }
    if (!recurring || recurring < 0 || recurring > 100) {
      return;
    }
    if (!topClientValue || topClientValue < 0 || topClientValue > 100) {
      return;
    }

    calculateMutation.mutate({
      annualRevenue: revenue,
      ebitda: ebitdaValue,
      recurringRevenuePercent: recurring,
      contractLength,
      topClientPercent: topClientValue,
    });
  };

  const isFormValid = annualRevenue && recurringRevenue && topClient && contractLength && privacyConsent;

  const { user, isAuthenticated } = useAuth();

  // Structured data for valuation tool
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "MSP Valuation Calculator",
    "description": "Free MSP business valuation calculator. Get instant valuation range based on real transaction data.",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`MSP Valuation Calculator - ${APP_TITLE}`}
        description="Free MSP business valuation calculator. Get instant valuation range in under 60 seconds based on real MSP transaction data."
        canonical="https://msp.investments/valuation-tool"
        structuredData={structuredData}
      />
      <PublicHeader />

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-b from-blue-50 to-white">
        <div className="container py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Calculator className="h-4 w-4" />
            Free MSP Valuation Calculator
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            What's Your MSP Worth?
          </h1>
          <p className="text-xl text-muted-foreground">
            Get an instant, data-driven valuation range in under 60 seconds. Based on real MSP transaction data from Aventis Advisors, Drake Star, and Worklyn Partners.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Your MSP Metrics</CardTitle>
              <CardDescription>
                Only 5 fields required. All information is confidential.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Annual Revenue */}
              <div className="space-y-2">
                <Label htmlFor="revenue">Annual Revenue ($) *</Label>
                <Input
                  id="revenue"
                  type="number"
                  min="0"
                  max="999999999"
                  step="1000"
                  placeholder="e.g., 2500000"
                  value={annualRevenue}
                  onChange={(e) => setAnnualRevenue(e.target.value)}
                  required
                />
              </div>

              {/* EBITDA (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="ebitda">
                  EBITDA or Net Profit ($)
                  <span className="text-muted-foreground ml-2">(Optional)</span>
                </Label>
                <Input
                  id="ebitda"
                  type="number"
                  min="0"
                  max="999999999"
                  step="1000"
                  placeholder="e.g., 500000"
                  value={ebitda}
                  onChange={(e) => setEbitda(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  If not provided, we'll estimate based on industry averages
                </p>
              </div>

              {/* Recurring Revenue % */}
              <div className="space-y-2">
                <Label htmlFor="recurring">Recurring Revenue (%) *</Label>
                <Input
                  id="recurring"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g., 80"
                  value={recurringRevenue}
                  onChange={(e) => setRecurringRevenue(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Percentage of revenue from recurring contracts
                </p>
              </div>

              {/* Contract Length */}
              <div className="space-y-2">
                <Label htmlFor="contract">Average Contract Length *</Label>
                <Select value={contractLength} onValueChange={(value) => setContractLength(value as ContractLength)}>
                  <SelectTrigger id="contract">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month-to-month">Month-to-month</SelectItem>
                    <SelectItem value="1-year">1-year contracts</SelectItem>
                    <SelectItem value="3-year">3-year contracts</SelectItem>
                    <SelectItem value="auto-renewal">Auto-renewal clauses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Top Client % */}
              <div className="space-y-2">
                <Label htmlFor="topClient">Top Client (% of Revenue) *</Label>
                <Input
                  id="topClient"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g., 18"
                  value={topClient}
                  onChange={(e) => setTopClient(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Percentage of revenue from your largest client
                </p>
              </div>

              {/* GDPR Consent */}
              <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="privacy-consent"
                  checked={privacyConsent}
                  onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="privacy-consent"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I agree to the data processing terms
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Your business metrics will be used solely to calculate your valuation. Read our{" "}
                    <Link href="/legal/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCalculate}
                disabled={!isFormValid || calculateMutation.isPending}
                className="w-full"
                size="lg"
              >
                {calculateMutation.isPending ? (
                  "Calculating..."
                ) : (
                  <>
                    <Calculator className="mr-2 h-5 w-5" />
                    Calculate My Valuation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6" role="status" aria-live="polite" aria-atomic="true">
            {!result ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Your valuation will appear here</p>
                  <p className="text-sm text-muted-foreground">
                    Fill in the form and click Calculate
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Fair Value - Hero Number */}
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Estimated Valuation Range</CardTitle>
                    <CardDescription className="text-blue-100">
                      Based on {result.breakdown.finalMultiple.toFixed(2)}x EBITDA multiple
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-bold mb-2">
                      {formatCurrency(result.valuationRange.low)} - {formatCurrency(result.valuationRange.high)}
                    </div>
                    <div className="text-blue-100">
                      Fair Value: {formatCurrency(result.fairValue)}
                    </div>
                  </CardContent>
                </Card>

                {/* Churn-Adjusted Warning */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Conservative Range (with 35-40% churn assumption):</strong>
                    <br />
                    {formatCurrency(result.churnAdjustedRange.low)} - {formatCurrency(result.churnAdjustedRange.high)}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      This accounts for typical MSP customer churn rates
                    </span>
                  </AlertDescription>
                </Alert>

                {/* Breakdown Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Valuation Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Base EBITDA</span>
                        <span className="font-medium">{formatCurrency(result.breakdown.baseEbitda)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Base Multiple</span>
                        <span className="font-medium">{result.breakdown.baseMultiple.toFixed(2)}x</span>
                      </div>
                      
                      <div className="pt-2">
                        <p className="font-medium mb-2">Adjustments:</p>
                        <div className="space-y-2 pl-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Recurring Revenue</span>
                            <span className={result.breakdown.adjustments.recurringRevenue >= 0 ? "text-green-600" : "text-red-600"}>
                              {result.breakdown.adjustments.recurringRevenue >= 0 ? "+" : ""}
                              {result.breakdown.adjustments.recurringRevenue.toFixed(2)}x
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Contract Quality</span>
                            <span className={result.breakdown.adjustments.contractQuality >= 0 ? "text-green-600" : "text-red-600"}>
                              {result.breakdown.adjustments.contractQuality >= 0 ? "+" : ""}
                              {result.breakdown.adjustments.contractQuality.toFixed(2)}x
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Client Concentration</span>
                            <span className={result.breakdown.adjustments.clientConcentration >= 0 ? "text-green-600" : "text-red-600"}>
                              {result.breakdown.adjustments.clientConcentration >= 0 ? "+" : ""}
                              {result.breakdown.adjustments.clientConcentration.toFixed(2)}x
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between py-2 border-t-2 font-bold">
                        <span>Final Multiple</span>
                        <span>{result.breakdown.finalMultiple.toFixed(2)}x</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CTA */}
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-xl font-bold">Ready to Sell Your MSP?</h3>
                      <p className="text-muted-foreground">
                        List your business for FREE. Only pay 3% when you successfully close.
                      </p>
                      <Button asChild size="lg" className="w-full">
                        <Link href="/create-listing">
                          List Your MSP Free
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        No upfront fees • Confidential • Takes 10 minutes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Data sources: Aventis Advisors, Drake Star, Greenwich PE, NinjaOne, Worklyn Partners, Evergreen, The 20
          </p>
          <p className="text-xs text-muted-foreground">
            This calculator provides an estimate only. Actual valuations may vary based on market conditions, buyer appetite, and due diligence findings.
          </p>
        </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
