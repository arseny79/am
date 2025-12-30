import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuidedWorkflow } from "@/components/GuidedWorkflow";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { EscrowPaymentWidget } from "@/components/EscrowPaymentWidget";
import { NDAStatusCard } from "@/components/NDAStatusCard";
import { ActionItems } from "@/components/ActionItems";
import type { DealStage } from "@/components/DealStageProgress";
import { Calendar, DollarSign, Users, MapPin } from "lucide-react";

interface OverviewTabProps {
  deal: any;
  dealId: number;
  refetchDeal: () => void;
}

export function OverviewTab({ deal, dealId, refetchDeal }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Deal Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Summary</CardTitle>
          <CardDescription>Key information about this transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Asking Price</p>
                <p className="text-2xl font-bold">${deal.listing?.askingPrice?.toLocaleString() || "0"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Annual Revenue</p>
                <p className="text-2xl font-bold">${deal.listing?.annualRevenue?.toLocaleString() || "0"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{deal.listing?.clientCount || "0"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-lg font-semibold">{deal.listing?.location || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Deal created on {new Date(deal.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NDA Status Card */}
      <NDAStatusCard
        dealId={dealId}
        isBuyer={deal.isBuyer}
        isSeller={deal.isOwner}
      />

      {/* Escrow Payment Widget */}
      {deal.listing && (
        <EscrowPaymentWidget
          escrowTransactionId={deal.escrowTransactionId}
          escrowPaymentUrl={deal.escrowPaymentUrl}
          escrowStatus={deal.escrowStatus}
          dealStage={deal.stage}
          isBuyer={deal.isBuyer}
          isSeller={deal.isOwner}
          askingPrice={deal.listing.askingPrice || 0}
        />
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Stage Guidance */}
        <GuidedWorkflow 
          currentStage={deal.stage as DealStage}
          userRole={deal.isBuyer ? "buyer" : "seller"}
        />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest 5 events in this deal</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline dealId={dealId} />
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <ActionItems 
        dealId={dealId} 
        isBuyer={deal.isBuyer} 
        isSeller={deal.isOwner} 
      />
    </div>
  );
}
