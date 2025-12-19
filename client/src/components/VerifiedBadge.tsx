import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  verified: boolean;
  variant?: "icon" | "badge" | "full";
  className?: string;
}

export function VerifiedBadge({ verified, variant = "badge", className = "" }: VerifiedBadgeProps) {
  if (!verified) return null;

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCircle className={`w-4 h-4 text-green-600 ${className}`} />
          </TooltipTrigger>
          <TooltipContent>
            <p>Verified Professional</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "full") {
    return (
      <Badge className={`bg-green-600 text-white border-0 ${className}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified Professional
      </Badge>
    );
  }

  return (
    <Badge className={`bg-green-600 text-white border-0 ${className}`}>
      <CheckCircle className="w-3 h-3 mr-1" />
      Verified
    </Badge>
  );
}
