import { Check, Circle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { DealStage } from "./DealStageProgress";

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  tip?: string;
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
  dealId?: number;
  className?: string;
}

// Storage key for workflow progress
const getStorageKey = (dealId: number, userRole: string) => 
  `workflow_progress_${dealId}_${userRole}`;

export function GuidedWorkflow({
  currentStage,
  userRole,
  dealId,
  className,
}: GuidedWorkflowProps) {
  const [expandedStages, setExpandedStages] = useState<Set<DealStage>>(new Set([currentStage]));
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Load saved progress from localStorage
  useEffect(() => {
    if (dealId) {
      const storageKey = getStorageKey(dealId, userRole);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCompletedItems(new Set(parsed));
        } catch (e) {
          console.error("Failed to parse saved workflow progress:", e);
        }
      }
    }
  }, [dealId, userRole]);

  // Save progress to localStorage
  const saveProgress = useCallback((items: Set<string>) => {
    if (dealId) {
      const storageKey = getStorageKey(dealId, userRole);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(items)));
    }
  }, [dealId, userRole]);

  const toggleItem = (stageKey: DealStage, itemId: string) => {
    const fullId = `${stageKey}-${itemId}`;
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(fullId)) {
        next.delete(fullId);
        toast.info("Task marked as incomplete");
      } else {
        next.add(fullId);
        toast.success("Task completed!");
      }
      saveProgress(next);
      return next;
    });
  };

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
            { id: "review_profile", label: "Review buyer's profile and background", tip: "Check their experience, past acquisitions, and industry knowledge" },
            { id: "check_linkedin", label: "Verify buyer's LinkedIn profile", tip: "Look for professional connections and credibility indicators" },
            { id: "verify_funds", label: "Confirm buyer has verified funds badge", tip: "Verified funds badge means they've proven access to capital" },
            { id: "intro_call", label: "Schedule introductory call", tip: "Use this call to assess fit and answer initial questions" },
            { id: "set_timeline", label: "Agree on deal timeline and deadlines", tip: "Set clear expectations for the process duration" },
          ],
        },
        {
          stage: "nda_signed",
          title: "NDA Signed",
          description: "Share confidential information safely",
          items: [
            { id: "setup_dataroom", label: "Set up data room with organized folders", tip: "Create folders for financials, legal, operations, and tech" },
            { id: "upload_financials", label: "Upload P&L statements and tax returns", tip: "Include 3 years of financial history if available" },
            { id: "upload_contracts", label: "Upload customer and vendor contracts", tip: "Redact sensitive customer names if needed" },
            { id: "upload_legal", label: "Upload legal documents and IP information", tip: "Include incorporation docs, trademarks, and patents" },
            { id: "grant_access", label: "Grant buyer access to data room", tip: "Use the Documents tab to manage access" },
          ],
        },
        {
          stage: "due_diligence",
          title: "Due Diligence",
          description: "Answer buyer questions thoroughly",
          items: [
            { id: "respond_questions", label: "Respond to all buyer questions promptly", tip: "Quick responses keep the deal moving forward" },
            { id: "provide_docs", label: "Provide requested documentation", tip: "Upload additional docs as requested" },
            { id: "explain_metrics", label: "Explain key business metrics and trends", tip: "Be transparent about both strengths and challenges" },
            { id: "customer_refs", label: "Provide customer references if requested", tip: "Choose customers who can speak positively about your service" },
            { id: "tech_review", label: "Allow technical review of systems/code", tip: "Prepare for technical due diligence questions" },
          ],
        },
        {
          stage: "negotiation",
          title: "Negotiation",
          description: "Review and negotiate offers",
          items: [
            { id: "review_loi", label: "Review Letter of Intent (LOI) carefully", tip: "Pay attention to price, terms, and exclusivity period" },
            { id: "consult_advisor", label: "Consult with legal/financial advisor", tip: "Professional advice is crucial at this stage" },
            { id: "negotiate_price", label: "Negotiate purchase price if needed", tip: "Know your minimum acceptable price beforehand" },
            { id: "negotiate_terms", label: "Negotiate deal structure and terms", tip: "Consider earnouts, escrow holdbacks, and transition period" },
            { id: "accept_loi", label: "Accept final LOI to enter exclusivity", tip: "Once accepted, you're committed to this buyer" },
          ],
        },
        {
          stage: "closing",
          title: "Closing",
          description: "Finalize the transaction",
          items: [
            { id: "review_apa", label: "Review Asset Purchase Agreement (APA)", tip: "This is the final legal document - review thoroughly" },
            { id: "sign_apa", label: "Sign APA with legal counsel review", tip: "Have your attorney review before signing" },
            { id: "setup_escrow", label: "Set up escrow account", tip: "Use a reputable escrow service for fund protection" },
            { id: "transfer_assets", label: "Transfer all assets per APA", tip: "Follow the asset transfer schedule in the APA" },
            { id: "confirm_payment", label: "Confirm receipt of funds from escrow", tip: "Verify funds are released before completing transfer" },
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
            { id: "send_intro", label: "Send introduction message to seller", tip: "Be professional and explain your acquisition goals" },
            { id: "explain_interest", label: "Explain why you're interested in this business", tip: "Show you've done your research on their business" },
            { id: "share_background", label: "Share your acquisition experience", tip: "Sellers prefer experienced buyers who can close" },
            { id: "request_nda", label: "Request mutual NDA", tip: "This protects both parties during due diligence" },
            { id: "schedule_call", label: "Schedule introductory call", tip: "Use this to build rapport and ask initial questions" },
          ],
        },
        {
          stage: "nda_signed",
          title: "NDA Signed",
          description: "Begin initial due diligence",
          items: [
            { id: "review_financials", label: "Review P&L and revenue metrics", tip: "Look for trends, seasonality, and consistency" },
            { id: "analyze_growth", label: "Analyze growth trends and projections", tip: "Verify growth claims with historical data" },
            { id: "review_customers", label: "Review customer concentration and churn", tip: "High concentration is a risk factor" },
            { id: "assess_tech", label: "Assess technical infrastructure", tip: "Understand the tech stack and any technical debt" },
            { id: "ask_questions", label: "Ask preliminary questions", tip: "Document all questions and answers for reference" },
          ],
        },
        {
          stage: "due_diligence",
          title: "Due Diligence",
          description: "Verify all business claims thoroughly",
          items: [
            { id: "verify_revenue", label: "Verify revenue and financial claims", tip: "Request bank statements to verify revenue" },
            { id: "review_contracts", label: "Review all customer and vendor contracts", tip: "Check for assignment clauses and termination rights" },
            { id: "legal_review", label: "Conduct legal due diligence", tip: "Review corporate structure, IP, and any litigation" },
            { id: "tech_audit", label: "Perform technical audit", tip: "Assess code quality, security, and scalability" },
            { id: "reference_checks", label: "Contact customer references", tip: "Ask about service quality and relationship history" },
          ],
        },
        {
          stage: "negotiation",
          title: "Negotiation",
          description: "Submit and negotiate your offer",
          items: [
            { id: "determine_value", label: "Determine fair valuation", tip: "Use multiple valuation methods for comparison" },
            { id: "structure_deal", label: "Decide on deal structure (cash, earnout, etc.)", tip: "Consider risk allocation in your structure" },
            { id: "draft_loi", label: "Draft Letter of Intent (LOI)", tip: "Include key terms: price, structure, exclusivity, timeline" },
            { id: "submit_offer", label: "Submit formal offer to seller", tip: "Be prepared to explain your valuation rationale" },
            { id: "negotiate", label: "Negotiate terms until agreement reached", tip: "Focus on deal-breakers first, minor terms later" },
          ],
        },
        {
          stage: "closing",
          title: "Closing",
          description: "Complete the acquisition",
          items: [
            { id: "review_apa", label: "Review Asset Purchase Agreement (APA)", tip: "Ensure all negotiated terms are accurately reflected" },
            { id: "sign_apa", label: "Sign APA with legal counsel", tip: "Have your attorney review all provisions" },
            { id: "fund_escrow", label: "Fund escrow account", tip: "Use wire transfer for large amounts" },
            { id: "inspect_assets", label: "Inspect transferred assets", tip: "Verify all assets match the APA schedule" },
            { id: "approve_release", label: "Approve escrow release", tip: "Only approve after confirming all assets received" },
          ],
        },
      ];
    }
  };

  const checklists = getChecklists();
  const currentStageIndex = checklists.findIndex((c) => c.stage === currentStage);

  // Calculate completion for each stage
  const getStageCompletion = (checklist: StageChecklist) => {
    const completedCount = checklist.items.filter(
      (item) => completedItems.has(`${checklist.stage}-${item.id}`)
    ).length;
    return {
      completed: completedCount,
      total: checklist.items.length,
      percentage: checklist.items.length > 0 
        ? (completedCount / checklist.items.length) * 100 
        : 0,
    };
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Guided Workflow
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Track your progress through each stage. Check off tasks as you complete them - your progress is saved automatically.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>
            Follow these steps to successfully complete your {userRole === "seller" ? "sale" : "acquisition"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklists.map((checklist, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isExpanded = expandedStages.has(checklist.stage);
            const { completed: completedCount, total: totalCount, percentage: progress } = getStageCompletion(checklist);

            return (
              <Collapsible
                key={checklist.stage}
                open={isExpanded}
                onOpenChange={() => toggleStage(checklist.stage)}
              >
                <div
                  className={cn(
                    "border rounded-lg transition-colors",
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
                                  "h-full transition-all duration-300",
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
                      {checklist.items.map((item) => {
                        const isItemCompleted = completedItems.has(`${checklist.stage}-${item.id}`);
                        return (
                          <div key={item.id} className="flex items-start gap-3 group">
                            <Checkbox
                              id={`${checklist.stage}-${item.id}`}
                              checked={isItemCompleted}
                              onCheckedChange={() => toggleItem(checklist.stage, item.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`${checklist.stage}-${item.id}`}
                                className="text-sm cursor-pointer flex items-center gap-2"
                              >
                                <span className={cn(isItemCompleted && "line-through text-muted-foreground")}>
                                  {item.label}
                                </span>
                                {item.tip && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{item.tip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </label>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

          {/* Add Task Button - Placeholder for future feature */}
          <Button variant="outline" className="w-full" disabled>
            <span className="text-muted-foreground">Add Custom Task (Coming Soon)</span>
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
