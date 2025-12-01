import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MilestoneTrackerProps {
  dealId: number;
  className?: string;
}

const MILESTONES = [
  {
    type: "nda_signed" as const,
    label: "NDA Signed",
    description: "Mutual non-disclosure agreement executed",
  },
  {
    type: "financials_reviewed" as const,
    label: "Financials Reviewed",
    description: "P&L statements and financial data analyzed",
  },
  {
    type: "offer_submitted" as const,
    label: "Offer Submitted",
    description: "Formal purchase offer presented",
  },
  {
    type: "loi_signed" as const,
    label: "Letter of Intent Signed",
    description: "LOI executed, entering exclusivity period",
  },
  {
    type: "final_agreement_signed" as const,
    label: "Final Agreement Signed",
    description: "Asset Purchase Agreement (APA) fully executed",
  },
  {
    type: "escrow_funded" as const,
    label: "Escrow Funded",
    description: "Purchase funds deposited into escrow account",
  },
  {
    type: "assets_transferred" as const,
    label: "Assets Transferred",
    description: "All business assets transferred to buyer",
  },
];

export function MilestoneTracker({ dealId, className }: MilestoneTrackerProps) {
  const { data: milestones = [], isLoading, refetch } = trpc.milestone.getByDeal.useQuery({ dealId });

  const completeMutation = trpc.milestone.complete.useMutation({
    onSuccess: () => {
      toast.success("Milestone completed!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to complete milestone: ${error.message}`);
    },
  });

  const uncompleteMutation = trpc.milestone.uncomplete.useMutation({
    onSuccess: () => {
      toast.success("Milestone uncompleted");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to uncomplete milestone: ${error.message}`);
    },
  });

  const handleToggle = (milestoneType: string, isCompleted: boolean) => {
    if (isCompleted) {
      uncompleteMutation.mutate({ dealId, milestoneType: milestoneType as any });
    } else {
      completeMutation.mutate({ dealId, milestoneType: milestoneType as any });
    }
  };

  const getMilestoneStatus = (type: string) => {
    return milestones.find((m) => m.milestoneType === type);
  };

  const completedCount = milestones.filter((m) => m.completedAt).length;
  const totalCount = MILESTONES.length;
  const progress = (completedCount / totalCount) * 100;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Deal Milestones</CardTitle>
          <CardDescription>Track key milestones independently of deal stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Deal Milestones</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </CardTitle>
        <CardDescription>
          Track key milestones independently of deal stages
        </CardDescription>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {MILESTONES.map((milestone) => {
            const status = getMilestoneStatus(milestone.type);
            const isCompleted = !!status?.completedAt;
            const isPending = completeMutation.isPending || uncompleteMutation.isPending;

            return (
              <div
                key={milestone.type}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  isCompleted && "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                )}
              >
                <button
                  onClick={() => handleToggle(milestone.type, isCompleted)}
                  disabled={isPending}
                  className="mt-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn(
                      "font-medium",
                      isCompleted && "text-green-900 dark:text-green-100"
                    )}>
                      {milestone.label}
                    </h4>
                    {status?.completedAt && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(status.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {milestone.description}
                  </p>
                  {status?.completedByUser && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed by {status.completedByUser.name}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
