import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Building2, Loader2, MessageSquare, ArrowRight, Inbox } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { formatDistanceToNow } from "date-fns";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function stageBadgeVariant(stage: string | null): "default" | "secondary" | "outline" {
  if (!stage) return "outline";
  if (["closed_won", "completed"].includes(stage)) return "default";
  if (["initial_contact", "nda_signed"].includes(stage)) return "secondary";
  return "outline";
}

function stageLabel(stage: string | null) {
  if (!stage) return "New";
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Messages() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: conversations, isLoading } = trpc.dealMessage.getInboxSummary.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 15000 }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to view messages</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  const totalUnread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-10">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Messages</h1>
              {totalUnread > 0 && (
                <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
                  {totalUnread} unread
                </Badge>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-lg">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When you start a deal or receive a message, it will appear here.
                  </p>
                </div>
                <Link href="/marketplace">
                  <Button variant="outline">Browse Listings</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map((convo) => (
                <Link key={convo.dealId} href={`/deal/${convo.dealId}`}>
                  <Card
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      convo.unreadCount > 0 ? "border-primary/40 bg-primary/5" : ""
                    }`}
                  >
                    <CardContent className="flex items-center gap-4 py-4 px-5">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-sm font-medium">
                          {initials(convo.otherPartyName)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`font-medium truncate ${convo.unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}>
                            {convo.listingName}
                          </span>
                          <Badge
                            variant={stageBadgeVariant(convo.dealStage)}
                            className="text-xs shrink-0 hidden sm:inline-flex"
                          >
                            {stageLabel(convo.dealStage)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span className="shrink-0">{convo.otherPartyName}</span>
                          {convo.lastMessage && (
                            <>
                              <span>·</span>
                              <span className="truncate">
                                {convo.lastMessage.isMine ? "You: " : ""}
                                {convo.lastMessage.content}
                              </span>
                            </>
                          )}
                          {!convo.lastMessage && (
                            <>
                              <span>·</span>
                              <span className="italic">No messages yet</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right side: time + unread badge + arrow */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {convo.lastMessage && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(convo.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5">
                          {convo.unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs">
                              {convo.unreadCount}
                            </Badge>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
