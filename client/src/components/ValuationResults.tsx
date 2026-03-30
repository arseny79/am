import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calculator, DollarSign } from "lucide-react";
import RealityCheckGauge from "./RealityCheckGauge";

interface ValuationOutputs {
  adjusted_ebitda: number;
  base_multiple: number;
  final_adjusted_multiple: number;
  calculated_fair_value: number;
  churn_adjusted_valuation: number;
  adjustments: {
    recurring_revenue_premium: number;
    contract_quality_premium: number;
    client_concentration_discount: number;
    growth_rate_premium: number;
  };
}

interface ValuationResultsProps {
  outputs: ValuationOutputs;
  sellerDesiredPrice?: number;
  onClose?: () => void;
}

export default function ValuationResults({ outputs, sellerDesiredPrice, onClose }: ValuationResultsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMultiple = (value: number) => {
    return `${value.toFixed(2)}x`;
  };

  const AdjustmentBadge = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{formatMultiple(value)}
        </Badge>
      );
    } else if (value < 0) {
      return (
        <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-100">
          <TrendingDown className="h-3 w-3 mr-1" />
          {formatMultiple(value)}
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <Minus className="h-3 w-3 mr-1" />
          {formatMultiple(value)}
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Valuation Summary */}
      <Card className="border-2 border-primary">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl">{formatCurrency(outputs.calculated_fair_value)}</CardTitle>
              <CardDescription>Calculated Fair Market Value</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Adjusted EBITDA</p>
              <p className="text-xl font-semibold">{formatCurrency(outputs.adjusted_ebitda)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Final Multiple</p>
              <p className="text-xl font-semibold">{formatMultiple(outputs.final_adjusted_multiple)}</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Churn-Adjusted Valuation (35% baseline)</span>
              <span className="text-lg font-bold">{formatCurrency(outputs.churn_adjusted_valuation)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This conservative estimate accounts for expected client churn during ownership transition.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reality Check (if desired price provided) */}
      {sellerDesiredPrice && (
        <RealityCheckGauge 
          calculatedValue={outputs.calculated_fair_value}
          desiredPrice={sellerDesiredPrice}
        />
      )}

      {/* Valuation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Valuation Breakdown
          </CardTitle>
          <CardDescription>
            How we calculated your business value
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Base Multiple */}
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Step 1: Base Multiple</h4>
                <p className="text-sm text-muted-foreground">Based on adjusted EBITDA size</p>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {formatMultiple(outputs.base_multiple)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Larger iGaming businesses typically command higher multiples due to economies of scale and reduced buyer risk.
            </p>
          </div>

          {/* Step 2: Adjustment Factors */}
          <div className="p-4 border rounded-lg space-y-3">
            <div>
              <h4 className="font-semibold mb-3">Step 2: Adjustment Factors</h4>
            </div>

            {/* Recurring Revenue */}
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-sm">Recurring Revenue Quality</p>
                <p className="text-xs text-muted-foreground">Higher recurring revenue = more predictable cash flow</p>
              </div>
              <AdjustmentBadge value={outputs.adjustments.recurring_revenue_premium} />
            </div>

            {/* Contract Quality */}
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-sm">Contract Quality</p>
                <p className="text-xs text-muted-foreground">Strong contracts with transferability reduce buyer risk</p>
              </div>
              <AdjustmentBadge value={outputs.adjustments.contract_quality_premium} />
            </div>

            {/* Client Concentration */}
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-sm">Client Concentration Risk</p>
                <p className="text-xs text-muted-foreground">High concentration in top clients increases risk</p>
              </div>
              <AdjustmentBadge value={outputs.adjustments.client_concentration_discount} />
            </div>

            {/* Growth Rate */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Year-over-Year Growth</p>
                <p className="text-xs text-muted-foreground">Growing businesses command premium multiples</p>
              </div>
              <AdjustmentBadge value={outputs.adjustments.growth_rate_premium} />
            </div>
          </div>

          {/* Step 3: Final Calculation */}
          <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
            <h4 className="font-semibold">Step 3: Final Calculation</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adjusted EBITDA</span>
                <span className="font-mono">{formatCurrency(outputs.adjusted_ebitda)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">× Final Multiple</span>
                <span className="font-mono">{formatMultiple(outputs.final_adjusted_multiple)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Fair Market Value</span>
                <span className="font-mono">{formatCurrency(outputs.calculated_fair_value)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-sm mb-2">Important Disclaimer</h4>
          <p className="text-xs text-muted-foreground">
            This valuation is an <strong>estimate based on industry-standard multiples and the data you provided</strong>. 
            It is not a formal business appraisal or guarantee of sale price. Actual sale prices may vary based on market 
            conditions, buyer motivations, deal structure, and other factors not captured in this model. For large transactions 
            or complex situations, we recommend consulting with a qualified M&A advisor or business valuation professional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
