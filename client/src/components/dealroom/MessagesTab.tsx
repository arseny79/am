import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealMessaging } from "@/components/DealMessaging";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { MilestoneTracker } from "@/components/MilestoneTracker";
import { MilestoneTimeline } from "@/components/MilestoneTimeline";
import { MessageSquare, Activity, Target } from "lucide-react";

interface MessagesTabProps {
  dealId: number;
}

export function MessagesTab({ dealId }: MessagesTabProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2">
            <Target className="h-4 w-4" />
            Milestones
          </TabsTrigger>
        </TabsList>

        {/* Messages Sub-Tab */}
        <TabsContent value="messages">
          <DealMessaging dealId={dealId} />
        </TabsContent>

        {/* Activity Timeline Sub-Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Complete Activity Timeline
              </CardTitle>
              <CardDescription>
                Full history of all events and actions in this deal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTimeline dealId={dealId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Sub-Tab */}
        <TabsContent value="milestones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Deal Milestones
              </CardTitle>
              <CardDescription>
                Track key milestones independently of deal stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MilestoneTracker dealId={dealId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestone Timeline</CardTitle>
              <CardDescription>
                Visual timeline showing milestone progress and expected completion dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MilestoneTimeline dealId={dealId} dealCreatedAt={new Date()} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
