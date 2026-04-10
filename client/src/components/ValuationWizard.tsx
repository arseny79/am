import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Info, ChevronLeft, ChevronRight, Calculator } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ValuationWizardProps {
  listingId: number;
  onComplete: (outputs: any) => void;
  onCancel?: () => void;
}

interface FormData {
  // Financial Data (TTM = Trailing Twelve Months)
  total_revenue_ttm: string;
  ebitda_ttm: string;
  owner_salary_add_back: string;
  one_time_expenses_add_back: string;
  recurring_revenue_ttm: string;
  project_based_revenue_ttm: string;
  yoy_growth_rate: string;
  
  // Operational Data
  client_count: string;
  top_1_client_revenue: string;
  top_5_clients_revenue: string;
  clients_under_contract_pct: string;
  avg_contract_length_months: string;
  contracts_with_transferability_pct: string;
  
  // Reality Check
  seller_desired_price: string;
}

const STEPS = [
  { id: 1, title: "Financial Data", description: "Enter your business financials" },
  { id: 2, title: "Operational Data", description: "Enter client and contract details" },
  { id: 3, title: "Review & Calculate", description: "Review and get your valuation" },
];

export default function ValuationWizard({ listingId, onComplete, onCancel }: ValuationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    total_revenue_ttm: "",
    ebitda_ttm: "",
    owner_salary_add_back: "0",
    one_time_expenses_add_back: "0",
    recurring_revenue_ttm: "",
    project_based_revenue_ttm: "0",
    yoy_growth_rate: "",
    client_count: "",
    top_1_client_revenue: "",
    top_5_clients_revenue: "",
    clients_under_contract_pct: "",
    avg_contract_length_months: "",
    contracts_with_transferability_pct: "",
    seller_desired_price: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Financial Data validation
      if (!formData.total_revenue_ttm || parseFloat(formData.total_revenue_ttm) <= 0) {
        newErrors.total_revenue_ttm = "Total revenue must be greater than 0";
      }
      if (!formData.ebitda_ttm) {
        newErrors.ebitda_ttm = "EBITDA is required";
      }
      if (!formData.recurring_revenue_ttm || parseFloat(formData.recurring_revenue_ttm) < 0) {
        newErrors.recurring_revenue_ttm = "Recurring revenue must be 0 or greater";
      }
      if (!formData.yoy_growth_rate) {
        newErrors.yoy_growth_rate = "Year-over-year growth rate is required";
      }
      
      // Logical validation
      const totalRevenue = parseFloat(formData.total_revenue_ttm);
      const recurringRevenue = parseFloat(formData.recurring_revenue_ttm);
      if (recurringRevenue > totalRevenue) {
        newErrors.recurring_revenue_ttm = "Recurring revenue cannot exceed total revenue";
      }
    }

    if (step === 2) {
      // Operational Data validation
      if (!formData.client_count || parseInt(formData.client_count) <= 0) {
        newErrors.client_count = "Client count must be greater than 0";
      }
      if (!formData.top_1_client_revenue || parseFloat(formData.top_1_client_revenue) < 0) {
        newErrors.top_1_client_revenue = "Top client revenue is required";
      }
      if (!formData.top_5_clients_revenue || parseFloat(formData.top_5_clients_revenue) < 0) {
        newErrors.top_5_clients_revenue = "Top 5 clients revenue is required";
      }
      if (!formData.clients_under_contract_pct) {
        newErrors.clients_under_contract_pct = "Clients under contract percentage is required";
      }
      if (!formData.avg_contract_length_months) {
        newErrors.avg_contract_length_months = "Average contract length is required";
      }
      if (!formData.contracts_with_transferability_pct) {
        newErrors.contracts_with_transferability_pct = "Transferability percentage is required";
      }

      // Percentage validation
      const contractPct = parseFloat(formData.clients_under_contract_pct);
      if (contractPct < 0 || contractPct > 100) {
        newErrors.clients_under_contract_pct = "Must be between 0 and 100";
      }
      const transferPct = parseFloat(formData.contracts_with_transferability_pct);
      if (transferPct < 0 || transferPct > 100) {
        newErrors.contracts_with_transferability_pct = "Must be between 0 and 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCalculate = () => {
    if (!validateStep(2)) return;

    // Convert form data to numbers
    const inputs = {
      total_revenue_ttm: parseFloat(formData.total_revenue_ttm),
      ebitda_ttm: parseFloat(formData.ebitda_ttm),
      owner_salary_add_back: parseFloat(formData.owner_salary_add_back) || 0,
      one_time_expenses_add_back: parseFloat(formData.one_time_expenses_add_back) || 0,
      recurring_revenue_ttm: parseFloat(formData.recurring_revenue_ttm),
      project_based_revenue_ttm: parseFloat(formData.project_based_revenue_ttm) || 0,
      yoy_growth_rate: parseFloat(formData.yoy_growth_rate),
      client_count: parseInt(formData.client_count),
      top_1_client_revenue: parseFloat(formData.top_1_client_revenue),
      top_5_clients_revenue: parseFloat(formData.top_5_clients_revenue),
      clients_under_contract_pct: parseFloat(formData.clients_under_contract_pct),
      avg_contract_length_months: parseFloat(formData.avg_contract_length_months),
      contracts_with_transferability_pct: parseFloat(formData.contracts_with_transferability_pct),
    };

    const sellerDesiredPrice = formData.seller_desired_price 
      ? parseInt(formData.seller_desired_price) 
      : undefined;

    onComplete({ inputs, sellerDesiredPrice });
  };

  const InfoTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help inline-block ml-2" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US");
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-2xl">Valuation Reality Check</CardTitle>
            <CardDescription>
              Get a data-driven valuation of your business
            </CardDescription>
          </div>
          <Calculator className="h-8 w-8 text-primary" />
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  step.id === currentStep
                    ? "text-primary font-semibold"
                    : step.id < currentStep
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <div className="mb-1">Step {step.id}</div>
                <div className="text-xs">{step.title}</div>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Financial Data */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Trailing Twelve Months (TTM)</strong> means the last 12 months of financial data.
                This gives buyers a clear picture of your current business performance.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_revenue_ttm">
                Total Revenue (TTM) *
                <InfoTooltip content="Your total revenue over the last 12 months, including all sources of income." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="total_revenue_ttm"
                  type="text"
                  placeholder="5,000,000"
                  className="pl-7"
                  value={formData.total_revenue_ttm}
                  onChange={(e) => updateField("total_revenue_ttm", e.target.value)}
                />
              </div>
              {errors.total_revenue_ttm && (
                <p className="text-sm text-destructive">{errors.total_revenue_ttm}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ebitda_ttm">
                EBITDA (TTM) *
                <InfoTooltip content="Earnings Before Interest, Taxes, Depreciation, and Amortization. This is your operating profit." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="ebitda_ttm"
                  type="text"
                  placeholder="1,000,000"
                  className="pl-7"
                  value={formData.ebitda_ttm}
                  onChange={(e) => updateField("ebitda_ttm", e.target.value)}
                />
              </div>
              {errors.ebitda_ttm && (
                <p className="text-sm text-destructive">{errors.ebitda_ttm}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_salary_add_back">
                Owner Salary Add-back
                <InfoTooltip content="Your salary as owner will be added back to EBITDA since a new owner may have different compensation." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="owner_salary_add_back"
                  type="text"
                  placeholder="150,000"
                  className="pl-7"
                  value={formData.owner_salary_add_back}
                  onChange={(e) => updateField("owner_salary_add_back", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="one_time_expenses_add_back">
                One-Time Expenses Add-back
                <InfoTooltip content="Non-recurring expenses (legal fees, office move, etc.) that won't repeat for the new owner." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="one_time_expenses_add_back"
                  type="text"
                  placeholder="50,000"
                  className="pl-7"
                  value={formData.one_time_expenses_add_back}
                  onChange={(e) => updateField("one_time_expenses_add_back", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurring_revenue_ttm">
                Annual Recurring Revenue (ARR) / Monthly Recurring Revenue (MRR × 12) *
                <InfoTooltip content="Revenue from contracts and subscriptions. Higher recurring revenue = more predictable cash flow = higher valuation." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="recurring_revenue_ttm"
                  type="text"
                  placeholder="4,000,000"
                  className="pl-7"
                  value={formData.recurring_revenue_ttm}
                  onChange={(e) => updateField("recurring_revenue_ttm", e.target.value)}
                />
              </div>
              {errors.recurring_revenue_ttm && (
                <p className="text-sm text-destructive">{errors.recurring_revenue_ttm}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_based_revenue_ttm">
                Project-based Revenue (TTM)
                <InfoTooltip content="Revenue from one-time projects. Lower project revenue = higher valuation." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="project_based_revenue_ttm"
                  type="text"
                  placeholder="1,000,000"
                  className="pl-7"
                  value={formData.project_based_revenue_ttm}
                  onChange={(e) => updateField("project_based_revenue_ttm", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yoy_growth_rate">
                Year-over-Year Revenue Growth Rate (%) *
                <InfoTooltip content="Your revenue growth compared to last year. Growing businesses command premium multiples." />
              </Label>
              <div className="relative">
                <Input
                  id="yoy_growth_rate"
                  type="number"
                  placeholder="15"
                  step="0.1"
                  value={formData.yoy_growth_rate}
                  onChange={(e) => updateField("yoy_growth_rate", e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              {errors.yoy_growth_rate && (
                <p className="text-sm text-destructive">{errors.yoy_growth_rate}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Operational Data */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Client and contract data</strong> helps assess the stability and transferability of your business.
                Strong contracts reduce buyer risk and increase valuation.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_count">
                Total Number of Clients *
                <InfoTooltip content="Your total active client count." />
              </Label>
              <Input
                id="client_count"
                type="number"
                placeholder="50"
                value={formData.client_count}
                onChange={(e) => updateField("client_count", e.target.value)}
              />
              {errors.client_count && (
                <p className="text-sm text-destructive">{errors.client_count}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="top_1_client_revenue">
                Revenue from Top 1 Client (TTM) *
                <InfoTooltip content="How much revenue comes from your largest client. High concentration = higher risk = lower valuation." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="top_1_client_revenue"
                  type="text"
                  placeholder="750,000"
                  className="pl-7"
                  value={formData.top_1_client_revenue}
                  onChange={(e) => updateField("top_1_client_revenue", e.target.value)}
                />
              </div>
              {errors.top_1_client_revenue && (
                <p className="text-sm text-destructive">{errors.top_1_client_revenue}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="top_5_clients_revenue">
                Revenue from Top 5 Clients (TTM) *
                <InfoTooltip content="Combined revenue from your top 5 clients." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="top_5_clients_revenue"
                  type="text"
                  placeholder="2,000,000"
                  className="pl-7"
                  value={formData.top_5_clients_revenue}
                  onChange={(e) => updateField("top_5_clients_revenue", e.target.value)}
                />
              </div>
              {errors.top_5_clients_revenue && (
                <p className="text-sm text-destructive">{errors.top_5_clients_revenue}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clients_under_contract_pct">
                Percentage of Clients Under Contract (%) *
                <InfoTooltip content="What percentage of your clients have signed contracts? Higher = more stable revenue." />
              </Label>
              <div className="relative">
                <Input
                  id="clients_under_contract_pct"
                  type="number"
                  placeholder="90"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.clients_under_contract_pct}
                  onChange={(e) => updateField("clients_under_contract_pct", e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              {errors.clients_under_contract_pct && (
                <p className="text-sm text-destructive">{errors.clients_under_contract_pct}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avg_contract_length_months">
                Average Contract Length (months) *
                <InfoTooltip content="How long are your typical contracts? Longer contracts = more predictable revenue." />
              </Label>
              <Input
                id="avg_contract_length_months"
                type="number"
                placeholder="24"
                step="1"
                min="0"
                value={formData.avg_contract_length_months}
                onChange={(e) => updateField("avg_contract_length_months", e.target.value)}
              />
              {errors.avg_contract_length_months && (
                <p className="text-sm text-destructive">{errors.avg_contract_length_months}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contracts_with_transferability_pct">
                Percentage of Contracts with Transferability Clause (%) *
                <InfoTooltip content="What percentage of contracts allow transfer to a new owner? Higher = easier transition = higher valuation." />
              </Label>
              <div className="relative">
                <Input
                  id="contracts_with_transferability_pct"
                  type="number"
                  placeholder="80"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.contracts_with_transferability_pct}
                  onChange={(e) => updateField("contracts_with_transferability_pct", e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              {errors.contracts_with_transferability_pct && (
                <p className="text-sm text-destructive">{errors.contracts_with_transferability_pct}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review & Calculate */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Reality Check:</strong> Enter your desired asking price to see how it compares to the calculated fair market value.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller_desired_price">
                Your Desired Asking Price (Optional)
                <InfoTooltip content="What price are you hoping to achieve? We'll show you how it compares to the calculated valuation." />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="seller_desired_price"
                  type="text"
                  placeholder="10,000,000"
                  className="pl-7"
                  value={formData.seller_desired_price}
                  onChange={(e) => updateField("seller_desired_price", e.target.value)}
                />
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg space-y-3">
              <h3 className="font-semibold text-lg">Review Your Data</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Revenue (TTM)</p>
                  <p className="font-semibold">${formatCurrency(formData.total_revenue_ttm)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">EBITDA (TTM)</p>
                  <p className="font-semibold">${formatCurrency(formData.ebitda_ttm)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recurring Revenue</p>
                  <p className="font-semibold">${formatCurrency(formData.recurring_revenue_ttm)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">YoY Growth</p>
                  <p className="font-semibold">{formData.yoy_growth_rate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Client Count</p>
                  <p className="font-semibold">{formData.client_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clients Under Contract</p>
                  <p className="font-semibold">{formData.clients_under_contract_pct}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {onCancel && currentStep === 1 && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <div>
            {currentStep < STEPS.length && (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {currentStep === STEPS.length && (
              <Button onClick={handleCalculate}>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Valuation
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
