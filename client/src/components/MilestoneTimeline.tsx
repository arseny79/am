import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, CheckCircle2, Clock, AlertCircle, Edit2 } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";

interface MilestoneTimelineProps {
  dealId: number;
  dealCreatedAt: Date;
}

const MILESTONE_LABELS: Record<string, string> = {
  nda_signed: "NDA Signed",
  financials_reviewed: "Financials Reviewed",
  offer_submitted: "Offer Submitted",
  loi_signed: "Letter of Intent Signed",
  final_agreement_signed: "Final Agreement Signed",
  escrow_funded: "Escrow Funded",
  assets_transferred: "Assets Transferred",
};

const MILESTONE_ORDER = [
  "nda_signed",
  "financials_reviewed",
  "offer_submitted",
  "loi_signed",
  "final_agreement_signed",
  "escrow_funded",
  "assets_transferred",
];

export function MilestoneTimeline({ dealId, dealCreatedAt }: MilestoneTimelineProps) {
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [expectedDate, setExpectedDate] = useState("");

  const { data: milestones = [], refetch } = trpc.milestone.getByDeal.useQuery({ dealId });
  
  const setExpectedDateMutation = trpc.milestoneOverdue.setExpectedDate.useMutation({
    onSuccess: () => {
      toast.success("Expected date updated");
      setEditingMilestone(null);
      setExpectedDate("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to update date: ${error.message}`);
    },
  });

  const now = new Date();
  const dealStartDate = new Date(dealCreatedAt);

  // Calculate timeline span (deal start to 90 days out or latest milestone date)
  const latestMilestoneDate = milestones.reduce((latest, m) => {
    const dates = [
      m.completedAt ? new Date(m.completedAt) : null,
      m.expectedCompletionDate ? new Date(m.expectedCompletionDate) : null,
    ].filter(Boolean) as Date[];
    
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
    return maxDate && (!latest || maxDate > latest) ? maxDate : latest;
  }, null as Date | null);

  const timelineEndDate = latestMilestoneDate 
    ? new Date(Math.max(latestMilestoneDate.getTime(), addDays(now, 30).getTime()))
    : addDays(dealStartDate, 90);

  const totalDays = differenceInDays(timelineEndDate, dealStartDate);

  const getMilestoneStatus = (milestoneType: string) => {
    const milestone = milestones.find(m => m.milestoneType === milestoneType);
    
    if (milestone?.completedAt) {
      return { status: "completed", date: new Date(milestone.completedAt), milestone };
    }
    
    if (milestone?.expectedCompletionDate) {
      const expected = new Date(milestone.expectedCompletionDate);
      if (expected < now) {
        return { status: "overdue", date: expected, milestone };
      }
      return { status: "scheduled", date: expected, milestone };
    }
    
    return { status: "unscheduled", date: null, milestone };
  };

  const getPositionPercent = (date: Date | null) => {
    if (!date) return null;
    const daysSinceStart = differenceInDays(date, dealStartDate);
    return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100));
  };

  const handleSetExpectedDate = (milestoneType: string) => {
    if (!expectedDate) {
      toast.error("Please select a date");
      return;
    }

    setExpectedDateMutation.mutate({
      dealId,
      milestoneType: milestoneType as any,
      expectedDate,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Milestone Timeline
        </CardTitle>
        <CardDescription>
          Visual timeline showing milestone progress and expected completion dates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline visualization */}
        <div className="relative">
          {/* Timeline bar */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-border -translate-y-1/2" />
          
          {/* Current date marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
            style={{ left: `${getPositionPercent(now)}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-blue-600 dark:text-blue-400 font-medium">
              Today
            </div>
          </div>

          {/* Milestone markers */}
          <div className="relative h-24 pt-8">
            {MILESTONE_ORDER.map((milestoneType, index) => {
              const { status, date, milestone } = getMilestoneStatus(milestoneType);
              const position = getPositionPercent(date);

              if (!date || position === null) return null;

              return (
                <div
                  key={milestoneType}
                  className="absolute"
                  style={{ left: `${position}%` }}
                >
                  {/* Marker dot */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : status === "overdue" ? (
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                    <div className="text-xs font-medium whitespace-nowrap mb-1">
                      {MILESTONE_LABELS[milestoneType]}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(date, "MMM d")}
                    </div>
                    {status === "overdue" && (
                      <div className="text-xs text-red-600 dark:text-red-400 whitespace-nowrap">
                        {differenceInDays(now, date)}d overdue
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone list with status */}
        <div className="space-y-3 mt-8">
          {MILESTONE_ORDER.map((milestoneType) => {
            const { status, date, milestone } = getMilestoneStatus(milestoneType);

            return (
              <div
                key={milestoneType}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : status === "overdue" ? (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  ) : status === "scheduled" ? (
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  )}

                  <div className="flex-1">
                    <div className="font-medium">{MILESTONE_LABELS[milestoneType]}</div>
                    {date && (
                      <div className="text-sm text-muted-foreground">
                        {status === "completed" 
                          ? `Completed ${format(date, "MMM d, yyyy")}`
                          : status === "overdue"
                          ? `Due ${format(date, "MMM d, yyyy")} (${differenceInDays(now, date)} days overdue)`
                          : `Expected ${format(date, "MMM d, yyyy")}`
                        }
                      </div>
                    )}
                    {!date && (
                      <div className="text-sm text-muted-foreground">No date set</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {status === "completed" && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Completed
                    </Badge>
                  )}
                  {status === "overdue" && (
                    <Badge variant="destructive">Overdue</Badge>
                  )}
                  {status === "scheduled" && (
                    <Badge variant="secondary">Scheduled</Badge>
                  )}
                  
                  {status !== "completed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingMilestone(milestoneType);
                        setExpectedDate(
                          milestone?.expectedCompletionDate 
                            ? format(new Date(milestone.expectedCompletionDate), "yyyy-MM-dd")
                            : ""
                        );
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit date dialog */}
        <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Expected Completion Date</DialogTitle>
              <DialogDescription>
                Set when you expect to complete: {editingMilestone && MILESTONE_LABELS[editingMilestone]}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="expected-date">Expected Completion Date</Label>
                <Input
                  id="expected-date"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  min={format(now, "yyyy-MM-dd")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingMilestone(null)}
                disabled={setExpectedDateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => editingMilestone && handleSetExpectedDate(editingMilestone)}
                disabled={setExpectedDateMutation.isPending}
              >
                {setExpectedDateMutation.isPending ? "Saving..." : "Save Date"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
