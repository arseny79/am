import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, TrendingUp, PieChart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinancialsTabProps {
  listing: any;
  showConfidential: boolean;
  onSignNDA: () => void;
  formatCurrency: (value: number) => string;
}

export function FinancialsTab({
  listing,
  showConfidential,
  onSignNDA,
  formatCurrency,
}: FinancialsTabProps) {
  if (!showConfidential) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Financial Information Protected
          </CardTitle>
          <CardDescription>
            Sign the NDA to view detailed financial information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Confidential Information</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                Detailed financial information is protected by a Non-Disclosure Agreement. Once signed, you'll gain access to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Complete revenue breakdown and trends</li>
                <li>EBITDA and profit margin analysis</li>
                <li>Revenue by service line</li>
                <li>Client concentration metrics</li>
                <li>Historical financial performance</li>
              </ul>
              <Button onClick={onSignNDA} className="w-full mt-4">
                Sign NDA to View Financial Details
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Overview
          </CardTitle>
          <CardDescription>Annual and recurring revenue metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Annual Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(listing.annualRevenue || 0)}</p>
            </div>
            {listing.mrr && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(listing.mrr)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ARR: {formatCurrency(listing.mrr * 12)}
                </p>
              </div>
            )}
            {listing.annualRevenue && listing.mrr && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recurring Revenue %</p>
                <p className="text-2xl font-bold">
                  {((listing.mrr * 12 / listing.annualRevenue) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  High predictability
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profitability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Profitability
          </CardTitle>
          <CardDescription>EBITDA and margin analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">EBITDA</p>
              <p className="text-2xl font-bold">{formatCurrency(listing.ebitda || 0)}</p>
            </div>
            {listing.ebitda && listing.annualRevenue && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">EBITDA Margin</p>
                  <p className="text-2xl font-bold">
                    {((listing.ebitda / listing.annualRevenue) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {listing.ebitda / listing.annualRevenue > 0.25 ? "Excellent" : "Good"} margin
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gross Profit</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(listing.annualRevenue - (listing.annualRevenue - listing.ebitda))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimated
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Revenue by Service Line
          </CardTitle>
          <CardDescription>How revenue is distributed across services</CardDescription>
        </CardHeader>
        <CardContent>
          {listing.serviceBreakdown ? (
            <div className="space-y-4">
              {/* This would be populated from actual data */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Managed Services</span>
                  <span className="font-medium">60%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "60%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Project Work</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "25%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Hardware/Software Sales</span>
                  <span className="font-medium">15%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "15%" }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Service breakdown not available. Contact seller for details.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Valuation */}
      {listing.askingPrice && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation Metrics</CardTitle>
            <CardDescription>How the asking price compares to key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Asking Price</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(listing.askingPrice)}</p>
              </div>
              {listing.annualRevenue && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price / Revenue Multiple</p>
                  <p className="text-2xl font-bold">
                    {(listing.askingPrice / listing.annualRevenue).toFixed(2)}x
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Industry average: 2-4x
                  </p>
                </div>
              )}
              {listing.ebitda && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price / EBITDA Multiple</p>
                  <p className="text-2xl font-bold">
                    {(listing.askingPrice / listing.ebitda).toFixed(2)}x
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Industry average: 4-6x
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Concentration */}
      {listing.clientCount && listing.annualRevenue && (
        <Card>
          <CardHeader>
            <CardTitle>Client Economics</CardTitle>
            <CardDescription>Revenue concentration and client value metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Client Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(listing.annualRevenue / listing.clientCount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Per year
                </p>
              </div>
              {listing.mrr && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Average MRR per Client</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(listing.mrr / listing.clientCount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monthly recurring
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
