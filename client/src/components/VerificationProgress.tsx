import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface VerificationProgressProps {
  currentStep: "upload" | "review" | "verified";
}

export function VerificationProgress({ currentStep }: VerificationProgressProps) {
  const steps = [
    { id: "upload", label: "Upload Documents" },
    { id: "review", label: "Under Review" },
    { id: "verified", label: "Verified" },
  ];

  const getStepIndex = (step: string) => steps.findIndex((s) => s.id === step);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="relative">
                  {isCompleted && (
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {isCurrent && currentStep === "review" && (
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  {isCurrent && currentStep !== "review" && (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Circle className="h-6 w-6 text-white fill-white" />
                    </div>
                  )}
                  {isUpcoming && (
                    <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                      <Circle className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted || isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    isCompleted ? "bg-green-600" : "bg-muted-foreground/30"
                  }`}
                  style={{ marginTop: "-2rem" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
