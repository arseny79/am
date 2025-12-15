/**
 * Buyer Qualification Badge
 * Displays buyer verification level with color-coded badge
 */

import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type VerificationLevel = 'basic' | 'verified' | 'premium';

interface BuyerQualificationBadgeProps {
  level: VerificationLevel;
  showIcon?: boolean;
  showTooltip?: boolean;
}

const LEVEL_CONFIG = {
  basic: {
    label: 'Basic',
    color: 'bg-gray-500',
    icon: Shield,
    description: 'Unverified buyer - limited access to listings',
  },
  verified: {
    label: 'Verified',
    color: 'bg-blue-500',
    icon: ShieldCheck,
    description: 'Proof of funds verified - full access to listings',
  },
  premium: {
    label: 'Premium',
    color: 'bg-purple-500',
    icon: Crown,
    description: 'Enhanced verification - priority access and support',
  },
};

export function BuyerQualificationBadge({
  level,
  showIcon = true,
  showTooltip = true,
}: BuyerQualificationBadgeProps) {
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;
  
  const badge = (
    <Badge className={`${config.color} text-white gap-1.5`}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </Badge>
  );
  
  if (!showTooltip) {
    return badge;
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
