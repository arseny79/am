import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

interface RealityCheckGaugeProps {
  calculatedValue: number;
  desiredPrice: number;
}

export default function RealityCheckGauge({ calculatedValue, desiredPrice }: RealityCheckGaugeProps) {
  const difference = desiredPrice - calculatedValue;
  const percentageDiff = (difference / calculatedValue) * 100;
  
  // Determine status based on percentage difference
  const getStatus = () => {
    if (Math.abs(percentageDiff) <= 10) {
      return {
        label: "Realistic",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: CheckCircle2,
        message: "Your desired price is well-aligned with market value. This pricing should attract serious buyers.",
      };
    } else if (percentageDiff > 10 && percentageDiff <= 25) {
      return {
        label: "Slightly High",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        icon: TrendingUp,
        message: "Your desired price is moderately above market value. You may need to justify the premium with strong growth metrics or unique assets.",
      };
    } else if (percentageDiff > 25) {
      return {
        label: "Significantly Overpriced",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: AlertTriangle,
        message: "Your desired price is significantly above market value. Consider adjusting expectations or be prepared for extended time on market and fewer inquiries.",
      };
    } else if (percentageDiff < -10) {
      return {
        label: "Underpriced",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: TrendingUp,
        message: "Your desired price is below market value. While this may attract more buyers, you could be leaving money on the table.",
      };
    } else {
      return {
        label: "Realistic",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: CheckCircle2,
        message: "Your desired price is well-aligned with market value.",
      };
    }
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate gauge position (0-100 scale, clamped)
  // -50% to +50% maps to 0-100
  const gaugePosition = Math.min(100, Math.max(0, 50 + percentageDiff));

  return (
    <Card className={`border-2 ${status.borderColor}`}>
      <CardHeader className={status.bgColor}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-8 w-8 ${status.color}`} />
          <div>
            <CardTitle className={status.color}>{status.label}</CardTitle>
            <CardDescription className="text-foreground/70">
              Reality Check Comparison
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Gauge Visualization */}
        <div className="space-y-4">
          <div className="relative h-24">
            {/* Gauge Background */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-4 bg-gradient-to-r from-red-200 via-green-200 to-red-200 rounded-full" />
            </div>
            
            {/* Center marker (calculated value) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-8 bg-gray-800 rounded-full" />
            </div>
            
            {/* Desired price indicator */}
            <div 
              className="absolute inset-0 flex items-center transition-all duration-300"
              style={{ justifyContent: `${gaugePosition}%` }}
            >
              <div className={`w-3 h-12 ${status.color.replace('text-', 'bg-')} rounded-full shadow-lg`} />
            </div>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-50%</span>
            <span className="font-semibold text-foreground">Market Value</span>
            <span>+50%</span>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Calculated Fair Value</p>
            <p className="text-2xl font-bold">{formatCurrency(calculatedValue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your Desired Price</p>
            <p className={`text-2xl font-bold ${status.color}`}>{formatCurrency(desiredPrice)}</p>
          </div>
        </div>

        {/* Difference */}
        <div className={`p-4 rounded-lg ${status.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Difference</span>
            <span className={`text-lg font-bold ${status.color}`}>
              {difference >= 0 ? "+" : ""}{formatCurrency(difference)} ({percentageDiff.toFixed(1)}%)
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {status.message}
          </p>
        </div>

        {/* Recommendations */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-semibold text-sm">Recommendations</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            {percentageDiff > 25 && (
              <>
                <li className="flex gap-2">
                  <span className="text-red-600">•</span>
                  <span>Consider reducing your asking price to attract more qualified buyers</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">•</span>
                  <span>If maintaining this price, prepare detailed justification (unique IP, exceptional growth, strategic value)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">•</span>
                  <span>Expect longer time on market and potentially fewer inquiries</span>
                </li>
              </>
            )}
            {percentageDiff > 10 && percentageDiff <= 25 && (
              <>
                <li className="flex gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Highlight unique value propositions to justify the premium</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Be prepared to negotiate down to market value</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Consider offering seller financing or earnouts to bridge the gap</span>
                </li>
              </>
            )}
            {Math.abs(percentageDiff) <= 10 && (
              <>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Your pricing is market-appropriate and should attract serious buyers</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Focus on highlighting your business strengths in the listing</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Prepare comprehensive due diligence materials to expedite the sale</span>
                </li>
              </>
            )}
            {percentageDiff < -10 && (
              <>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>You may be undervaluing your business - consider increasing your asking price</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Review your financials to ensure all value drivers are captured</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Consult with an M&A advisor to maximize your sale price</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
