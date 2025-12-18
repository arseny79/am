import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DueDiligenceChecklist } from "@/components/DueDiligenceChecklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckSquare } from "lucide-react";

interface DueDiligenceTabProps {
  dealId: number;
  currentStage: string;
}

export function DueDiligenceTab({ dealId, currentStage }: DueDiligenceTabProps) {
  // Show checklist if in due diligence stage or later
  const isDueDiligenceStage = ['due_diligence', 'negotiation', 'escrow', 'closing', 'closed'].includes(currentStage);

  if (!isDueDiligenceStage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Due Diligence
          </CardTitle>
          <CardDescription>
            The due diligence checklist will appear here once the NDA is signed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Not Yet Available</AlertTitle>
            <AlertDescription>
              Complete the NDA stage to access the due diligence checklist with 50 items across 7 categories.
            </AlertDescription>
          </Alert>
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
