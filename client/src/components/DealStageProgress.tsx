import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type DealStage =
  | "initial_contact"
  | "nda_signed"
  | "due_diligence"
  | "negotiation"
  | "closing"
  | "closed";

interface DealStageProgressProps {
  currentStage: DealStage;
  className?: string;
}

const stages: { key: DealStage; label: string }[] = [
  { key: "initial_contact", label: "Initial Contact" },
  { key: "nda_signed", label: "NDA Signed" },
  { key: "due_diligence", label: "Due Diligence" },
  { key: "negotiation", label: "Negotiation" },
  { key: "closing", label: "Closing" },
  { key: "closed", label: "Closed" },
];

export function DealStageProgress({ currentStage, className }: DealStageProgressProps) {
  const currentIndex = stages.findIndex((s) => s.key === currentStage);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              {/* Stage Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                    isUpcoming && "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-2 text-xs text-center font-medium max-w-[80px]",
                    (isCompleted || isCurrent) && "text-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </p>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all",
                    isCompleted && "bg-primary",
                    (isCurrent || isUpcoming) && "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
