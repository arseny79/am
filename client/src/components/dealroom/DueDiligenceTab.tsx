import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DueDiligenceChecklist } from "@/components/DueDiligenceChecklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Lock, FileText, DollarSign, Users, Shield, Code, Scale, Briefcase, CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface DueDiligenceTabProps {
  dealId: number;
  currentStage: string;
}

const DD_CATEGORIES = [
  { icon: DollarSign, label: "Financial", items: 8, description: "Revenue, P&L, tax returns, projections" },
  { icon: Users, label: "Customer", items: 7, description: "Contracts, concentration, churn analysis" },
  { icon: Code, label: "Technical", items: 8, description: "Infrastructure, code quality, security" },
  { icon: Scale, label: "Legal", items: 7, description: "Contracts, IP, compliance, litigation" },
  { icon: Briefcase, label: "Operations", items: 8, description: "Processes, vendors, employees" },
  { icon: Shield, label: "HR & Culture", items: 6, description: "Team, benefits, org structure" },
  { icon: FileText, label: "Strategic", items: 6, description: "Market position, growth potential" },
];

export function DueDiligenceTab({ dealId, currentStage }: DueDiligenceTabProps) {
  // Show checklist if in due diligence stage or later
  const isDueDiligenceStage = ['due_diligence', 'negotiation', 'escrow', 'closing', 'closed'].includes(currentStage);
  const isNdaSigned = ['nda_signed', 'due_diligence', 'negotiation', 'escrow', 'closing', 'closed'].includes(currentStage);

  if (!isDueDiligenceStage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Due Diligence
          </CardTitle>
          <CardDescription>
            Comprehensive checklist to verify all business claims
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Locked State Alert */}
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              {isNdaSigned ? "Almost There!" : "NDA Required"}
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              {isNdaSigned 
                ? "The due diligence checklist will be available once the deal advances to the Due Diligence stage. Continue building trust and sharing initial documents."
                : "Sign the NDA to access confidential business information and begin due diligence. This protects both parties during the evaluation process."
              }
            </AlertDescription>
          </Alert>

          {/* Progress Steps */}
          <div className="space-y-3">
            <div 
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                currentStage === "initial_contact" 
                  ? "border-primary bg-primary/5" 
                  : "border-green-200 bg-green-50 dark:bg-green-950/20"
              }`}
            >
              <div className="mt-0.5">
                {currentStage !== "initial_contact" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-primary fill-primary/20" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">Initial Contact</p>
                <p className="text-sm text-muted-foreground">Build rapport and establish trust</p>
              </div>
              {currentStage === "initial_contact" && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                  Current
                </span>
              )}
            </div>

            <div 
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                currentStage === "nda_signed" 
                  ? "border-primary bg-primary/5" 
                  : isNdaSigned
                    ? "border-green-200 bg-green-50 dark:bg-green-950/20"
                    : "border-muted bg-muted/30"
              }`}
            >
              <div className="mt-0.5">
                {['due_diligence', 'negotiation', 'escrow', 'closing', 'closed'].includes(currentStage) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : currentStage === "nda_signed" ? (
                  <Circle className="h-5 w-5 text-primary fill-primary/20" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${!isNdaSigned ? "text-muted-foreground" : ""}`}>
                  NDA Signed
                </p>
                <p className="text-sm text-muted-foreground">Access confidential documents</p>
              </div>
              {currentStage === "nda_signed" && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                  Current
                </span>
              )}
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-muted bg-muted/10">
              <div className="mt-0.5">
                <CheckSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-muted-foreground">Due Diligence</p>
                <p className="text-sm text-muted-foreground">50-item checklist across 7 categories</p>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Preview of DD Categories */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              What You'll Review
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DD_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <div 
                    key={category.label}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{category.label}</p>
                        <span className="text-xs text-muted-foreground">{category.items} items</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{category.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              <strong>50 total items</strong> to help you thoroughly evaluate this business
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Due Diligence Checklist
          </CardTitle>
          <CardDescription>
            50 items across 7 categories to thoroughly evaluate this business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Work through the checklist below to gather all necessary information. Each item can be expanded to add documents, ask questions, and track progress.
          </p>
        </CardContent>
      </Card>

      <DueDiligenceChecklist dealId={dealId} />
    </div>
  );
}
