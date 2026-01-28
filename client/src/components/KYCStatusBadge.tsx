import { ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

interface KYCStatusBadgeProps {
  user: {
    kycStatus?: string | null;
    kycVerified?: boolean | number | null;
    stripeIdentityVerified?: boolean | number | null;
    emailVerified?: boolean | number | null;
  };
}

export function KYCStatusBadge({ user }: KYCStatusBadgeProps) {
  const [, setLocation] = useLocation();

  // Determine the effective verification status
  const getEffectiveStatus = () => {
    // Check if fully verified (either manual KYC or Stripe Identity)
    const isKYCVerified = user.kycVerified || user.stripeIdentityVerified;
    
    if (isKYCVerified) {
      return 'verified';
    }
    
    // Check KYC status for pending/rejected
    if (user.kycStatus === 'pending') {
      return 'pending';
    }
    
    if (user.kycStatus === 'rejected') {
      return 'rejected';
    }
    
    // Check if email is not verified
    if (!user.emailVerified) {
      return 'email_unverified';
    }
    
    // Default to unverified
    return 'unverified';
  };

  const getStatusConfig = () => {
    const status = getEffectiveStatus();
    
    switch (status) {
      case 'verified':
        return {
          icon: <ShieldCheck className="w-3 h-3" />,
          text: 'Verified',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-200',
          clickable: false,
          href: null,
        };
      case 'pending':
        return {
          icon: <Clock className="w-3 h-3" />,
          text: 'Under Review',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          clickable: false,
          href: null,
        };
      case 'rejected':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Resubmit Docs',
          bgColor: 'bg-red-50',
          textColor: 'text-red-600',
          borderColor: 'border-red-200',
          clickable: true,
          href: '/verify-account',
        };
      case 'email_unverified':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Verify Email',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          clickable: true,
          href: '/settings?tab=email',
        };
      case 'unverified':
      default:
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Verify Account',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-600',
          borderColor: 'border-amber-200',
          clickable: true,
          href: '/verify-account',
        };
    }
  };

  const config = getStatusConfig();

  const handleClick = () => {
    if (!config.clickable || !config.href) {
      return;
    }
    setLocation(config.href);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!config.clickable}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${
        config.clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'
      }`}
    >
      {config.icon}
      <span>{config.text}</span>
    </button>
  );
}

export default KYCStatusBadge;
