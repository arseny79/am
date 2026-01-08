import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, MessageSquare, CheckCircle2, XCircle, DollarSign, Shield, TrendingUp } from "lucide-react";

interface ActivityTimelineProps {
  dealId: number;
}

const ACTIVITY_ICONS: Record<string, any> = {
  deal_created: TrendingUp,
  stage_changed: TrendingUp,
  document_uploaded: FileText,
  message_sent: MessageSquare,
  action_item_created: CheckCircle2,
  action_item_completed: CheckCircle2,
  nda_signed: Shield,
  escrow_initiated: DollarSign,
  payment_received: DollarSign,
  deal_closed: CheckCircle2,
  deal_cancelled: XCircle,
  proposal_submitted: MessageSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  deal_created: "text-blue-500",
  stage_changed: "text-purple-500",
  document_uploaded: "text-yellow-500",
  message_sent: "text-gray-500",
  action_item_created: "text-orange-500",
  action_item_completed: "text-green-500",
  nda_signed: "text-indigo-500",
  escrow_initiated: "text-cyan-500",
  payment_received: "text-green-600",
  deal_closed: "text-green-700",
  deal_cancelled: "text-red-500",
  proposal_submitted: "text-blue-600",
};

export function ActivityTimeline({ dealId }: ActivityTimelineProps) {
  const { data: activities = [], isLoading } = trpc.dealActivity.getByDeal.useQuery({ dealId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Loading deal history...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>
          Complete history of all events and actions in this deal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = ACTIVITY_ICONS[activity.activityType] || MessageSquare;
              const colorClass = ACTIVITY_COLORS[activity.activityType] || "text-gray-500";
              
              return (
                <div key={activity.id} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-2 bg-background border-2 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.activityType.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {/* Show metadata if available */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
