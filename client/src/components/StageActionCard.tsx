import { AlertCircle, CheckCircle2, Clock, MessageSquare, FileText, Handshake, DollarSign, User, Send, Upload, Eye, HelpCircle, ListChecks, FileQuestion, PenLine, FileCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DealStage } from "./DealStageProgress";

interface StageActionCardProps {
  currentStage: DealStage;
  userRole: "buyer" | "seller";
  dealId: number;
  hasSignedNDA?: boolean;
  className?: string;
  onViewBuyerProfile?: () => void;
  onSendMessage?: () => void;
  onViewDocuments?: () => void;
  onUploadDocuments?: () => void;
  onViewOffers?: () => void;
  onViewDueDiligence?: () => void;
  onSignNDA?: () => void;
}

interface ActionButton {
  label: string;
  variant?: "default" | "outline";
  icon?: React.ElementType;
  action: "viewBuyerProfile" | "sendMessage" | "viewDocuments" | "uploadDocuments" | "viewOffers" | "viewDueDiligence" | "signNDA" | "none";
}

interface ActionGuidance {
  title: string;
  description: string;
  icon: React.ElementType;
  actions: ActionButton[];
  status: "action_required" | "waiting" | "completed";
}

export function StageActionCard({
  currentStage,
  userRole,
  dealId,
  hasSignedNDA = false,
  className,
  onViewBuyerProfile,
  onSendMessage,
  onViewDocuments,
  onUploadDocuments,
  onViewOffers,
  onViewDueDiligence,
  onSignNDA,
}: StageActionCardProps) {
  
  const handleAction = (action: ActionButton["action"]) => {
    switch (action) {
      case "viewBuyerProfile":
        onViewBuyerProfile?.();
        break;
      case "sendMessage":
        onSendMessage?.();
        break;
      case "viewDocuments":
        onViewDocuments?.();
        break;
      case "uploadDocuments":
        onUploadDocuments?.();
        break;
      case "viewOffers":
        onViewOffers?.();
        break;
      case "viewDueDiligence":
        onViewDueDiligence?.();
        break;
      case "signNDA":
        onSignNDA?.();
        break;
      default:
        break;
    }
  };

  const getGuidance = (): ActionGuidance => {
    if (currentStage === "initial_contact") {
      if (userRole === "seller") {
        return {
          title: "Review Buyer Profile",
          description: "Get to know the buyer before sharing sensitive information. Check their background, experience, and verify they have the capital to close.",
          icon: MessageSquare,
          actions: [
            { label: "View Buyer Profile", variant: "default", icon: User, action: "viewBuyerProfile" },
            { label: "Sign NDA", variant: "outline", icon: FileCheck, action: "signNDA" },
          ],
          status: "action_required",
        };
      } else {
        return {
          title: "Introduce Yourself",
          description: "Build rapport with the seller. Explain why you're interested in their business and share your acquisition goals.",
          icon: MessageSquare,
          actions: [
            { label: "Send Introduction", variant: "default", icon: Send, action: "sendMessage" },
            { label: "Sign NDA", variant: "outline", icon: FileCheck, action: "signNDA" },
          ],
          status: "action_required",
        };
      }
    }

    if (currentStage === "nda_signed") {
      if (userRole === "seller") {
        return {
          title: "Share Due Diligence Documents",
          description: "Now that the NDA is signed, you can safely share confidential business information. Upload financials, customer lists, and other documents to the data room.",
          icon: FileText,
          actions: [
            { label: "Upload Documents", variant: "default", icon: Upload, action: "uploadDocuments" },
            { label: "View Data Room", variant: "outline", icon: Eye, action: "viewDocuments" },
          ],
          status: "action_required",
        };
      } else {
        return {
          title: "Begin Initial Due Diligence",
          description: "Review the seller's documents and ask preliminary questions. Verify key metrics and assess if this business meets your criteria.",
          icon: FileText,
          actions: [
            { label: "View Documents", variant: "default", icon: Eye, action: "viewDocuments" },
            { label: "Ask Questions", variant: "outline", icon: HelpCircle, action: "sendMessage" },
          ],
          status: "action_required",
        };
      }
    }

    if (currentStage === "due_diligence") {
      if (userRole === "seller") {
        return {
          title: "Answer Due Diligence Questions",
          description: "The buyer is verifying your business claims. Respond promptly to questions and provide requested documentation to keep the deal moving.",
          icon: Clock,
          actions: [
            { label: "View Questions", variant: "default", icon: FileQuestion, action: "sendMessage" },
            { label: "Upload More Docs", variant: "outline", icon: Upload, action: "uploadDocuments" },
          ],
          status: "waiting",
        };
      } else {
        return {
          title: "Complete Due Diligence",
          description: "Verify all business claims thoroughly. Review financials, customer contracts, technical infrastructure, and legal documents. Ask follow-up questions as needed.",
          icon: CheckCircle2,
          actions: [
            { label: "DD Checklist", variant: "default", icon: ListChecks, action: "viewDueDiligence" },
            { label: "Request Documents", variant: "outline", icon: FileQuestion, action: "sendMessage" },
          ],
          status: "action_required",
        };
      }
    }

    if (currentStage === "negotiation") {
      if (userRole === "seller") {
        return {
          title: "Review and Negotiate Offers",
          description: "You've received a Letter of Intent (LOI). Review the purchase price, deal structure, and terms carefully. Negotiate anything you're unhappy with.",
          icon: Handshake,
          actions: [
            { label: "View Offers", variant: "default", icon: Eye, action: "viewOffers" },
            { label: "Counter Offer", variant: "outline", icon: PenLine, action: "viewOffers" },
          ],
          status: "action_required",
        };
      } else {
        return {
          title: "Submit Your Offer",
          description: "Due diligence is complete. Submit a formal Letter of Intent (LOI) with your purchase price, deal structure, and terms.",
          icon: DollarSign,
          actions: [
            { label: "Create LOI", variant: "default", icon: PenLine, action: "viewOffers" },
            { label: "View Templates", variant: "outline", icon: FileCheck, action: "viewDocuments" },
          ],
          status: "action_required",
        };
      }
    }

    if (currentStage === "closing" || currentStage === "escrow") {
      return {
        title: "Finalize Asset Transfer",
        description: userRole === "seller" 
          ? "Sign the Asset Purchase Agreement (APA) and prepare to transfer assets. Work with escrow to ensure safe fund transfer."
          : "Sign the APA and fund escrow. Once the seller transfers assets, inspect and approve them to release payment.",
        icon: CheckCircle2,
        actions: [
          { label: "View APA", variant: "default", icon: FileCheck, action: "viewDocuments" },
          { label: "View Messages", variant: "outline", icon: MessageSquare, action: "sendMessage" },
        ],
        status: "action_required",
      };
    }

    // closed
    return {
      title: "Deal Closed Successfully!",
      description: "Congratulations! The acquisition is complete. Assets have been transferred and payment has been released.",
      icon: CheckCircle2,
      actions: [
        { label: "View Deal Summary", variant: "outline", icon: Eye, action: "none" },
      ],
      status: "completed",
    };
  };

  const guidance = getGuidance();
  const Icon = guidance.icon;

  const statusConfig = {
    action_required: {
      badge: "Action Required",
      badgeVariant: "destructive" as const,
      iconColor: "text-destructive",
    },
    waiting: {
      badge: "Waiting for Response",
      badgeVariant: "secondary" as const,
      iconColor: "text-muted-foreground",
    },
    completed: {
      badge: "Completed",
      badgeVariant: "default" as const,
      iconColor: "text-primary",
    },
  };

  const config = statusConfig[guidance.status];

  return (
    <Card className={cn("border-l-4", guidance.status === "action_required" && "border-l-destructive", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg bg-muted", config.iconColor)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{guidance.title}</CardTitle>
              <CardDescription className="mt-1">{guidance.description}</CardDescription>
            </div>
          </div>
          <Badge variant={config.badgeVariant}>{config.badge}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {guidance.actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || "default"}
                size="sm"
                onClick={() => handleAction(action.action)}
                disabled={action.action === "none"}
              >
                {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
