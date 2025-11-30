import { Check, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { DealStage } from "./DealStageProgress";

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
}

interface StageChecklist {
  stage: DealStage;
  title: string;
  description: string;
  items: ChecklistItem[];
}

interface GuidedWorkflowProps {
  currentStage: DealStage;
  userRole: "buyer" | "seller";
  onItemToggle?: (stageKey: DealStage, itemId: string, completed: boolean) => void;
  className?: string;
}

export function GuidedWorkflow({
  currentStage,
  userRole,
  onItemToggle,
  className,
}: GuidedWorkflowProps) {
  const [expandedStages, setExpandedStages] = useState<Set<DealStage>>(new Set([currentStage]));

  const toggleStage = (stage: DealStage) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  };

  const getChecklists = (): StageChecklist[] => {
    if (userRole === "seller") {
      return [
        {
          stage: "initial_contact",
          title: "Initial Contact",
          description: "Evaluate the buyer and establish trust",
          items: [
            { id: "review_profile", label: "Review buyer's profile and background", completed: false },
            { id: "check_linkedin", label: "Verify buyer's LinkedIn profile", completed: false },
            { id: "verify_funds", label: "Confirm buyer has verified funds badge", completed: false },
            { id: "intro_call", label: "Schedule introductory call", completed: false },
            { id: "set_timeline", label: "Agree on deal timeline and deadlines", completed: false },
          ],
        },
        {
          stage: "nda_signed",
          title: "NDA Signed",
          description: "Share confidential information safely",
          items: [
            { id: "setup_dataroom", label: "Set up data room with organized folders", completed: false },
            { id: "upload_financials", label: "Upload P&L statements and tax returns", completed: false },
            { id: "upload_contracts", label: "Upload customer and vendor contracts", completed: false },
            { id: "upload_legal", label: "Upload legal documents and IP information", completed: false },
            { id: "grant_access", label: "Grant buyer access to data room", completed: false },
          ],
        },
        {
          stage: "due_diligence",
          title: "Due Diligence",
          description: "Answer buyer questions thoroughly",
          items: [
            { id: "respond_questions", label: "Respond to all buyer questions promptly", completed: false },
            { id: "provide_docs", label: "Provide requested documentation", completed: false },
            { id: "explain_metrics", label: "Explain key business metrics and trends", completed: false },
            { id: "customer_refs", label: "Provide customer references if requested", completed: false },
            { id: "tech_review", label: "Allow technical review of systems/code", completed: false },
          ],
        },
        {
          stage: "negotiation",
          title: "Negotiation",
          description: "Review and negotiate offers",
          items: [
            { id: "review_loi", label: "Review Letter of Intent (LOI) carefully", completed: false },
            { id: "consult_advisor", label: "Consult with legal/financial advisor", completed: false },
            { id: "negotiate_price", label: "Negotiate purchase price if needed", completed: false },
            { id: "negotiate_terms", label: "Negotiate deal structure and terms", completed: false },
            { id: "accept_loi", label: "Accept final LOI to enter exclusivity", completed: false },
          ],
        },
        {
          stage: "closing",
          title: "Closing",
          description: "Finalize the transaction",
          items: [
            { id: "review_apa", label: "Review Asset Purchase Agreement (APA)", completed: false },
            { id: "sign_apa", label: "Sign APA with legal counsel review", completed: false },
            { id: "setup_escrow", label: "Set up escrow account", completed: false },
            { id: "transfer_assets", label: "Transfer all assets per APA", completed: false },
            { id: "confirm_payment", label: "Confirm receipt of funds from escrow", completed: false },
          ],
        },
      ];
    } else {
      // Buyer checklists
      return [
        {
          stage: "initial_contact",
          title: "Initial Contact",
          description: "Introduce yourself and build rapport",
          items: [
            { id: "send_intro", label: "Send introduction message to seller", completed: false },
            { id: "explain_interest", label: "Explain why you're interested in this business", completed: false },
            { id: "share_background", label: "Share your acquisition experience", completed: false },
            { id: "request_nda", label: "Request mutual NDA", completed: false },
            { id: "schedule_call", label: "Schedule introductory call", completed: false },
          ],
        },
        {
          stage: "nda_signed",
          title: "NDA Signed",
          description: "Begin initial due diligence",
          items: [
            { id: "review_financials", label: "Review P&L and revenue metrics", completed: false },
            { id: "analyze_growth", label: "Analyze growth trends and projections", completed: false },
            { id: "review_customers", label: "Review customer concentration and churn", completed: false },
            { id: "assess_tech", label: "Assess technical infrastructure", completed: false },
            { id: "ask_questions", label: "Ask preliminary questions", completed: false },
          ],
        },
        {
          stage: "due_diligence",
          title: "Due Diligence",
          description: "Verify all business claims thoroughly",
          items: [
            { id: "verify_revenue", label: "Verify revenue and financial claims", completed: false },
            { id: "review_contracts", label: "Review all customer and vendor contracts", completed: false },
            { id: "legal_review", label: "Conduct legal due diligence", completed: false },
            { id: "tech_audit", label: "Perform technical audit", completed: false },
            { id: "reference_checks", label: "Contact customer references", completed: false },
          ],
        },
        {
          stage: "negotiation",
          title: "Negotiation",
          description: "Submit and negotiate your offer",
          items: [
            { id: "determine_value", label: "Determine fair valuation", completed: false },
            { id: "structure_deal", label: "Decide on deal structure (cash, earnout, etc.)", completed: false },
            { id: "draft_loi", label: "Draft Letter of Intent (LOI)", completed: false },
            { id: "submit_offer", label: "Submit formal offer to seller", completed: false },
            { id: "negotiate", label: "Negotiate terms until agreement reached", completed: false },
          ],
        },
        {
          stage: "closing",
          title: "Closing",
          description: "Complete the acquisition",
          items: [
            { id: "review_apa", label: "Review Asset Purchase Agreement (APA)", completed: false },
            { id: "sign_apa", label: "Sign APA with legal counsel", completed: false },
            { id: "fund_escrow", label: "Fund escrow account", completed: false },
            { id: "inspect_assets", label: "Inspect transferred assets", completed: false },
            { id: "approve_release", label: "Approve escrow release", completed: false },
          ],
        },
      ];
    }
  };

  const checklists = getChecklists();
  const currentStageIndex = checklists.findIndex((c) => c.stage === currentStage);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Guided Workflow</CardTitle>
        <CardDescription>
          Follow these steps to successfully complete your {userRole === "seller" ? "sale" : "acquisition"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {checklists.map((checklist, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isExpanded = expandedStages.has(checklist.stage);
          const completedCount = checklist.items.filter((item) => item.completed).length;
          const totalCount = checklist.items.length;
          const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <Collapsible
              key={checklist.stage}
              open={isExpanded}
              onOpenChange={() => toggleStage(checklist.stage)}
            >
              <div
                className={cn(
                  "border rounded-lg",
                  isCurrent && "border-primary bg-primary/5",
                  isCompleted && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                )}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto hover:bg-transparent"
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <Circle
                            className={cn(
                              "w-6 h-6",
                              isCurrent ? "text-primary fill-primary/20" : "text-muted-foreground"
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{checklist.title}</h4>
                        <p className="text-sm text-muted-foreground">{checklist.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                isCompleted ? "bg-green-500" : "bg-primary"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {completedCount}/{totalCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3">
                    {checklist.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <Checkbox
                          id={`${checklist.stage}-${item.id}`}
                          checked={item.completed}
                          onCheckedChange={(checked) => {
                            onItemToggle?.(checklist.stage, item.id, checked as boolean);
                          }}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={`${checklist.stage}-${item.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          <span className={cn(item.completed && "line-through text-muted-foreground")}>
                            {item.label}
                          </span>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
