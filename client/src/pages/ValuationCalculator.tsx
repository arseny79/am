import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Calculator, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function ValuationCalculator() {
  const [formData, setFormData] = useState({
    annualRevenue: "",
    ebitda: "",
    clientCount: "",
    clientRetentionRate: "",
    growthRate: "",
  });

  const [result, setResult] = useState<any>(null);

  const calculateValuation = trpc.valuation.calculate.useQuery(
    {
      annualRevenue: parseFloat(formData.annualRevenue) || 0,
      ebitda: parseFloat(formData.ebitda) || 0,
      clientCount: parseInt(formData.clientCount) || 0,
      clientRetentionRate: parseFloat(formData.clientRetentionRate),
      growthRate: parseFloat(formData.growthRate),
    },
    {
      enabled: false,
    }
  );

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.annualRevenue || !formData.ebitda || !formData.clientCount) {
      alert("Please fill in all required fields");
      return;
    }

    const data = await calculateValuation.refetch();
    if (data.data) {
      setResult(data.data);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMultiple = (value: number) => {
    return (value / 10).toFixed(1) + "x";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_TITLE}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/valuation">
              <Button variant="default">Valuation Tool</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calculator className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">MSP Valuation Calculator</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get an instant, data-driven valuation estimate for your MSP business
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Business Metrics</CardTitle>
                <CardDescription>Enter your MSP financial and operational data</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCalculate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="annualRevenue">Annual Revenue *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="annualRevenue"
                        type="number"
                        required
                        value={formData.annualRevenue}
                        onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                        placeholder="1000000"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ebitda">EBITDA *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="ebitda"
                        type="number"
                        required
                        value={formData.ebitda}
                        onChange={(e) => setFormData({ ...formData, ebitda: e.target.value })}
                        placeholder="250000"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientCount">Number of Clients *</Label>
                    <Input
                      id="clientCount"
                      type="number"
                      required
                      value={formData.clientCount}
                      onChange={(e) => setFormData({ ...formData, clientCount: e.target.value })}
                      placeholder="50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientRetentionRate">Client Retention Rate (%)</Label>
                    <Input
                      id="clientRetentionRate"
                      type="number"
                      step="0.1"
                      value={formData.clientRetentionRate}
                      onChange={(e) => setFormData({ ...formData, clientRetentionRate: e.target.value })}
                      placeholder="92"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="growthRate">Annual Growth Rate (%)</Label>
                    <Input
                      id="growthRate"
                      type="number"
                      step="0.1"
                      value={formData.growthRate}
                      onChange={(e) => setFormData({ ...formData, growthRate: e.target.value })}
                      placeholder="15"
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Valuation
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Estimated Valuation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-5xl font-bold mb-2">
                        {formatCurrency(result.estimatedValuation)}
                      </div>
                      <p className="text-sm opacity-90">
                        Based on {formatMultiple(result.multiple)} EBITDA multiple
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Valuation Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">EBITDA Margin</span>
                        <span className="text-sm text-muted-foreground">{result.ebitdaMargin}%</span>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-xs text-muted-foreground">
                          This is an estimated valuation based on industry benchmarks.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Link href="/create-listing">
                    <Button className="w-full">Create Listing</Button>
                  </Link>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Enter Your Metrics</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill in the form to calculate valuation
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
