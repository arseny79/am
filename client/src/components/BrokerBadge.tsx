import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Briefcase } from "lucide-react";

interface BrokerBadgeProps {
  brokerName?: string;
  companyName?: string;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * BrokerBadge component displays a "Broker Represented" badge with optional tooltip
 * showing broker information. Used on listing cards and detail pages.
 */
export function BrokerBadge({ 
  brokerName, 
  companyName, 
  variant = "default",
  className = "" 
}: BrokerBadgeProps) {
  const badge = (
    <Badge 
      variant="outline" 
      className={`bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 ${className}`}
    >
      <Briefcase className="h-3 w-3 mr-1" />
      {variant === "compact" ? "Broker" : "Broker Represented"}
    </Badge>
  );

  // If we have broker info, wrap in tooltip
  if (brokerName || companyName) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Represented by a Professional Broker</p>
            {companyName && <p className="text-muted-foreground">{companyName}</p>}
            {brokerName && <p className="text-muted-foreground">Contact: {brokerName}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
