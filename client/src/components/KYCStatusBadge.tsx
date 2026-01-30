import { ShieldCheck, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

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
  const [isSending, setIsSending] = useState(false);

  const sendVerificationMutation = trpc.emailVerification.sendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success('Verification email sent! Please check your inbox.');
      setIsSending(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send verification email');
      setIsSending(false);
    },
  });

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
          action: 'none' as const,
        };
      case 'pending':
        return {
          icon: <Clock className="w-3 h-3" />,
          text: 'Under Review',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          clickable: false,
          action: 'none' as const,
        };
      case 'rejected':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Resubmit Docs',
          bgColor: 'bg-red-50',
          textColor: 'text-red-600',
          borderColor: 'border-red-200',
          clickable: true,
          action: 'navigate' as const,
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
          action: 'send_email' as const,
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
          action: 'navigate' as const,
          href: '/verify-account',
        };
    }
  };

  const config = getStatusConfig();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!config.clickable) {
      return;
    }
    
    if (config.action === 'send_email') {
      setIsSending(true);
      sendVerificationMutation.mutate();
    } else if (config.action === 'navigate' && 'href' in config && config.href) {
      setLocation(config.href);
    }
  };

  const isLoading = isSending || sendVerificationMutation.isPending;

  return (
    <button
      onClick={handleClick}
      disabled={!config.clickable || isLoading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${
        config.clickable && !isLoading ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'
      } ${isLoading ? 'opacity-70' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        config.icon
      )}
      <span>{isLoading ? 'Sending...' : config.text}</span>
    </button>
  );
}

export default KYCStatusBadge;
