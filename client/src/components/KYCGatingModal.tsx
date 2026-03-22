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
  ArrowRight,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type GatingReason = 
  | "EMAIL_NOT_VERIFIED" 
  | "KYC_NOT_VERIFIED" 
  | "KYC_PENDING_REVIEW" 
  | "KYC_REJECTED";

interface KYCGatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: GatingReason;
  action?: string;
}

export function KYCGatingModal({ isOpen, onClose, reason, action = "perform this action" }: KYCGatingModalProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const sendVerificationMutation = trpc.emailVerification.sendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success('Verification email sent! Please check your inbox.');
      setIsSendingEmail(false);
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send verification email');
      setIsSendingEmail(false);
    },
  });

  const handleSendVerificationEmail = () => {
    setIsSendingEmail(true);
    sendVerificationMutation.mutate();
  };

  const getContent = () => {
    switch (reason) {
      case "EMAIL_NOT_VERIFIED":
        return {
          icon: <Mail className="h-12 w-12 text-blue-500" />,
          title: "Email Verification Required",
          description: `To ${action}, you need to verify your email address first.`,
          badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800">Email Required</Badge>,
          primaryAction: { label: "Send Verification Email", type: "email" as const },
          secondaryText: "Click the button to send a verification email to your inbox.",
        };
      case "KYC_NOT_VERIFIED":
        return {
          icon: <Shield className="h-12 w-12 text-amber-500" />,
          title: "Identity Verification Required",
          description: `To ${action}, you need to complete identity verification (KYC). This ensures trust and security for all marketplace participants.`,
          badge: <Badge variant="secondary" className="bg-amber-100 text-amber-800">KYC Required</Badge>,
          primaryAction: { label: "Start Free Verification", type: "navigate" as const, href: "/verify-account" },
          secondaryText: "Upload your ID and proof of address. Admin review within 24-48 hours.",
        };
      case "KYC_PENDING_REVIEW":
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: "Verification Under Review",
          description: `Your identity verification is currently being reviewed. You'll be able to ${action} once approved.`,
          badge: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>,
          primaryAction: { label: "Check Status", type: "navigate" as const, href: "/verify-account" },
          secondaryText: "Reviews typically take 1-2 business days. You'll receive an email once complete.",
        };
      case "KYC_REJECTED":
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: "Verification Rejected",
          description: `Your previous verification was rejected. Please submit new documents to ${action}.`,
          badge: <Badge variant="destructive">Rejected</Badge>,
          primaryAction: { label: "Resubmit Documents", type: "navigate" as const, href: "/verify-account" },
          secondaryText: "Check your email for the rejection reason and required corrections.",
        };
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-gray-500" />,
          title: "Verification Required",
          description: `You need to complete verification to ${action}.`,
          badge: <Badge variant="secondary">Verification Required</Badge>,
          primaryAction: { label: "Get Verified", type: "navigate" as const, href: "/verify-account" },
          secondaryText: "",
        };
    }
  };

  const content = getContent();
  const isLoading = isSendingEmail || sendVerificationMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">{content.icon}</div>
          <div className="flex justify-center mb-2">{content.badge}</div>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">{content.description}</DialogDescription>
        </DialogHeader>

        {content.secondaryText && (
          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
            {content.secondaryText}
          </div>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {content.primaryAction.type === "email" ? (
            <Button className="w-full" onClick={handleSendVerificationEmail} disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
              ) : (
                <>{content.primaryAction.label}<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          ) : (
            <Link href={content.primaryAction.href || "/verify-account"} className="w-full">
              <Button className="w-full" onClick={onClose}>
                {content.primaryAction.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button variant="ghost" onClick={onClose} className="w-full">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
        setGatingModal({ isOpen: true, reason: message as GatingReason, action });
        return true;
      }
    }
    return false;
  };

  const closeModal = () => setGatingModal(prev => ({ ...prev, isOpen: false }));

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
