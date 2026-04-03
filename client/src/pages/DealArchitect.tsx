import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Building2, Sparkles, ChevronRight, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE } from "@/const";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/PublicHeader";
import ReactMarkdown from "react-markdown";

type Role = "buyer" | "seller";
type Timeline = "3_months" | "6_months" | "12_months" | "18_months" | "flexible";

export default function DealArchitect() {
  const { isAuthenticated } = useAuth();
  const { data: settings } = trpc.admin.getSiteSettings.useQuery();

  const [role, setRole] = useState<Role>("buyer");
  const [businessType, setBusinessType] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [location, setLocation] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [timeline, setTimeline] = useState<Timeline>("12_months");
  const [budget, setBudget] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const generateMutation = trpc.architect.generate.useMutation();

  const isFormValid =
    businessType.trim() &&
    annualRevenue &&
    parseFloat(annualRevenue) > 0 &&
    employeeCount &&
    parseInt(employeeCount) > 0 &&
    yearsInBusiness &&
    parseInt(yearsInBusiness) > 0 &&
    location.trim() &&
    primaryGoal.trim();

  const handleGenerate = () => {
    if (!isFormValid) return;

    generateMutation.mutate({
      role,
      businessType: businessType.trim(),
      annualRevenue: parseFloat(annualRevenue),
      employeeCount: parseInt(employeeCount),
      yearsInBusiness: parseInt(yearsInBusiness),
      location: location.trim(),
      primaryGoal: primaryGoal.trim(),
      timeline,
      budget: budget.trim() || undefined,
      additionalContext: additionalContext.trim() || undefined,
    });
  };

  const handleReset = () => {
    generateMutation.reset();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`Deal Architect - ${APP_TITLE}`}
        description="AI-powered MSP M&A deal architect. Get a customized acquisition plan built around your specific situation."
      />
      <PublicHeader />

      <div className="flex-1 bg-gradient-to-b from-blue-50 to-white">
        <div className="container py-12">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              AI Deal Architect
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Build Your MSP Deal Plan
            </h1>
            <p className="text-xl text-muted-foreground">
              Describe your situation and get a comprehensive, customized M&A architecture plan powered by AI.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="max-w-2xl mx-auto mb-8">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please{" "}
                  <Link href="/login" className="underline font-medium">
                    log in
                  </Link>{" "}
                  to use the Deal Architect.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {generateMutation.data ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
                <span className="text-sm text-muted-foreground">Your personalized deal architecture plan</span>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{generateMutation.data.plan}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Ready to take the next step?
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href="/marketplace">
                    <Button>
                      Browse Listings
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                  <Link href="/valuation-tool">
                    <Button variant="outline">
                      Valuation Calculator
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Tell Us About Your Situation
                  </CardTitle>
                  <CardDescription>
                    The more detail you provide, the more tailored your plan will be.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Role */}
                  <div className="space-y-2">
                    <Label>I am a *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("buyer")}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          role === "buyer"
                            ? "border-blue-600 bg-blue-50"
                            : "border-border hover:border-blue-300"
                        }`}
                      >
                        <div className="font-medium">Buyer</div>
                        <div className="text-sm text-muted-foreground">Looking to acquire an MSP</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("seller")}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          role === "seller"
                            ? "border-blue-600 bg-blue-50"
                            : "border-border hover:border-blue-300"
                        }`}
                      >
                        <div className="font-medium">Seller</div>
                        <div className="text-sm text-muted-foreground">Looking to sell my MSP</div>
                      </button>
                    </div>
                  </div>

                  {/* Business Type */}
                  <div className="space-y-2">
                    <Label htmlFor="businessType">
                      {role === "buyer" ? "Target Business Type *" : "My Business Type *"}
                    </Label>
                    <Input
                      id="businessType"
                      placeholder="e.g., Managed IT Services, Cybersecurity MSP, Cloud Services"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                    />
                  </div>

                  {/* Revenue & Employees */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="revenue">
                        {role === "buyer" ? "Target Revenue ($) *" : "Annual Revenue ($) *"}
                      </Label>
                      <Input
                        id="revenue"
                        type="number"
                        min="0"
                        step="10000"
                        placeholder="e.g., 2000000"
                        value={annualRevenue}
                        onChange={(e) => setAnnualRevenue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employees">Employee Count *</Label>
                      <Input
                        id="employees"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g., 25"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Years & Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="years">Years in Business *</Label>
                      <Input
                        id="years"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g., 8"
                        value={yearsInBusiness}
                        onChange={(e) => setYearsInBusiness(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Austin, TX"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Primary Goal */}
                  <div className="space-y-2">
                    <Label htmlFor="goal">Primary Goal *</Label>
                    <Textarea
                      id="goal"
                      placeholder={
                        role === "buyer"
                          ? "e.g., Expand into healthcare vertical, acquire recurring revenue base, add technical staff"
                          : "e.g., Retire and exit within 12 months, maximize valuation, find buyer who will retain staff"
                      }
                      value={primaryGoal}
                      onChange={(e) => setPrimaryGoal(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <Label>Target Timeline *</Label>
                    <Select value={timeline} onValueChange={(v) => setTimeline(v as Timeline)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3_months">Within 3 months</SelectItem>
                        <SelectItem value="6_months">Within 6 months</SelectItem>
                        <SelectItem value="12_months">Within 12 months</SelectItem>
                        <SelectItem value="18_months">Within 18 months</SelectItem>
                        <SelectItem value="flexible">Flexible / No fixed deadline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="budget">
                      {role === "buyer" ? "Acquisition Budget" : "Price Expectation"}
                      <span className="text-muted-foreground ml-2">(Optional)</span>
                    </Label>
                    <Input
                      id="budget"
                      placeholder={role === "buyer" ? "e.g., $3M–$5M" : "e.g., 4–5x revenue"}
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>

                  {/* Additional Context */}
                  <div className="space-y-2">
                    <Label htmlFor="context">
                      Additional Context
                      <span className="text-muted-foreground ml-2">(Optional)</span>
                    </Label>
                    <Textarea
                      id="context"
                      placeholder="Any other relevant details: special assets, debt situation, customer concentration, reason for selling, strategic synergies, etc."
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {generateMutation.isError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {generateMutation.error?.message || "Something went wrong. Please try again."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={!isFormValid || !isAuthenticated || generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                        Generating Your Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate My Deal Architecture
                      </>
                    )}
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-sm text-center text-muted-foreground">
                      <Link href="/login" className="underline">Log in</Link> to generate your plan.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Footer settings={settings} />
    </div>
  );
}
