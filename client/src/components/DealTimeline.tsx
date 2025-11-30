import { FileSignature, MessageSquare, FileText, Handshake, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: number;
  type: "message" | "document" | "stage_change" | "nda_signed" | "offer" | "milestone";
  title: string;
  description?: string;
  timestamp: Date;
  actor?: string;
}

interface DealTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const eventIcons = {
  message: MessageSquare,
  document: FileText,
  stage_change: Clock,
  nda_signed: FileSignature,
  offer: DollarSign,
  milestone: CheckCircle2,
};

const eventColors = {
  message: "text-blue-500",
  document: "text-purple-500",
  stage_change: "text-orange-500",
  nda_signed: "text-green-500",
  offer: "text-emerald-500",
  milestone: "text-primary",
};

export function DealTimeline({ events, className }: DealTimelineProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Deal Timeline</CardTitle>
        <CardDescription>Key events and milestones in this deal</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events yet. Activity will appear here as the deal progresses.
            </p>
          ) : (
            sortedEvents.map((event, index) => {
              const Icon = eventIcons[event.type];
              const colorClass = eventColors[event.type];
              const isLast = index === sortedEvents.length - 1;

              return (
                <div key={event.id} className="flex gap-3">
                  {/* Timeline line and icon */}
                  <div className="flex flex-col items-center">
                    <div className={cn("p-2 rounded-full bg-muted", colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {event.description}
                          </p>
                        )}
                        {event.actor && (
                          <p className="text-xs text-muted-foreground mt-1">
                            by {event.actor}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
