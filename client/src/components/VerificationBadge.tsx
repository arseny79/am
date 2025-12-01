import { Shield, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  verificationStatus?: string | null;
  verifiedAt?: Date | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  inline?: boolean;
}

export function VerificationBadge({
  verificationStatus,
  verifiedAt,
  size = "md",
  showLabel = true,
  inline = false,
}: VerificationBadgeProps) {
  // Only show badge if verified
  if (verificationStatus !== "verified") {
    return null;
  }

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const badgeContent = (
    <Badge
      variant="default"
      className={`bg-blue-600 hover:bg-blue-700 ${inline ? "inline-flex" : "flex"} items-center gap-1`}
    >
      <Shield className={sizeClasses[size]} />
      {showLabel && <span>Verified</span>}
    </Badge>
  );

  const tooltipText = verifiedAt
    ? `Verified Buyer since ${new Date(verifiedAt).toLocaleDateString()}`
    : "Verified Buyer - Identity and funds confirmed";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <p>{tooltipText}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Inline variant for use in text
export function VerificationBadgeInline({
  verificationStatus,
}: {
  verificationStatus?: string | null;
}) {
  if (verificationStatus !== "verified") {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Shield className="inline h-4 w-4 text-blue-600 ml-1" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Buyer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
