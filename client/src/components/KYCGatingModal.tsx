import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Mail, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  CheckCircle,
  ArrowRight,
  CreditCard
} from "lucide-react";

type GatingReason = 
  | "EMAIL_NOT_VERIFIED" 
  | "KYC_NOT_VERIFIED" 
  | "KYC_PENDING_REVIEW" 
  | "KYC_REJECTED";

interface KYCGatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: GatingReason;
  action?: string; // e.g., "create a listing", "request access", "submit a buyer request"
}

export function KYCGatingModal({ isOpen, onClose, reason, action = "perform this action" }: KYCGatingModalProps) {
  const getContent = () => {
    switch (reason) {
      case "EMAIL_NOT_VERIFIED":
        return {
          icon: <Mail className="h-12 w-12 text-blue-500" />,
          title: "Email Verification Required",
          description: `To ${action}, you need to verify your email address first. This helps us ensure the security of your account and the marketplace.`,
          badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800">Email Required</Badge>,
          primaryAction: {
            label: "Verify Email",
            href: "/settings?tab=email",
          },
          secondaryText: "Check your inbox for the verification email, or request a new one from your settings.",
        };
      
      case "KYC_NOT_VERIFIED":
        return {
          icon: <Shield className="h-12 w-12 text-amber-500" />,
          title: "Identity Verification Required",
          description: `To ${action}, you need to complete identity verification (KYC). This ensures trust and security for all marketplace participants.`,
          badge: <Badge variant="secondary" className="bg-amber-100 text-amber-800">KYC Required</Badge>,
          primaryAction: {
            label: "Start Verification",
            href: "/verify-account",
          },
          secondaryText: "You can verify for free by uploading documents, or use instant verification with Stripe Identity for $5.",
          showStripeOption: true,
        };
      
      case "KYC_PENDING_REVIEW":
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: "Verification Under Review",
          description: `Your identity verification is currently being reviewed by our team. You'll be able to ${action} once your verification is approved.`,
          badge: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>,
          primaryAction: {
            label: "Check Status",
            href: "/verify-account",
          },
          secondaryText: "Reviews typically take 1-2 business days. You'll receive an email notification once complete.",
        };
      
      case "KYC_REJECTED":
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: "Verification Rejected",
          description: `Your previous verification was rejected. Please review the feedback and submit new documents to ${action}.`,
          badge: <Badge variant="destructive">Rejected</Badge>,
          primaryAction: {
            label: "Resubmit Documents",
            href: "/verify-account",
          },
          secondaryText: "Check your email or verification page for the rejection reason and required corrections.",
        };
      
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-gray-500" />,
          title: "Verification Required",
          description: `You need to complete verification to ${action}.`,
          badge: <Badge variant="secondary">Verification Required</Badge>,
          primaryAction: {
            label: "Get Verified",
            href: "/verify-account",
          },
          secondaryText: "",
        };
    }
  };

  const content = getContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>
          <div className="flex justify-center mb-2">
            {content.badge}
          </div>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        {content.secondaryText && (
          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
            {content.secondaryText}
          </div>
        )}

        {content.showStripeOption && (
          <div className="flex items-center gap-3 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Instant Verification Available</p>
              <p className="text-xs text-blue-700">Get verified instantly with Stripe Identity for $5</p>
            </div>
            <Link href="/verify-stripe">
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                Try Now
              </Button>
            </Link>
          </div>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Link href={content.primaryAction.href} className="w-full">
            <Button className="w-full" onClick={onClose}>
              {content.primaryAction.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to handle KYC gating errors from tRPC
 */
export function useKYCGating() {
  const [gatingModal, setGatingModal] = useState<{
    isOpen: boolean;
    reason: GatingReason;
    action: string;
  }>({
    isOpen: false,
    reason: "KYC_NOT_VERIFIED",
    action: "perform this action",
  });

  const handleError = (error: unknown, action: string) => {
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message: string }).message;
      
      if (message === "EMAIL_NOT_VERIFIED" || 
          message === "KYC_NOT_VERIFIED" || 
          message === "KYC_PENDING_REVIEW" || 
          message === "KYC_REJECTED") {
        setGatingModal({
          isOpen: true,
          reason: message as GatingReason,
          action,
        });
        return true; // Error was handled
      }
    }
    return false; // Error was not a KYC gating error
  };

  const closeModal = () => {
    setGatingModal(prev => ({ ...prev, isOpen: false }));
  };

  return {
    gatingModal,
    handleError,
    closeModal,
    GatingModal: () => (
      <KYCGatingModal
        isOpen={gatingModal.isOpen}
        onClose={closeModal}
        reason={gatingModal.reason}
        action={gatingModal.action}
      />
    ),
  };
}

export default KYCGatingModal;
