import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface CompactMessagingProps {
  dealId: number;
}

const COMPACT_MESSAGE_COUNT = 5;

export function CompactMessaging({ dealId }: CompactMessagingProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then(setNotificationPermission);
      }
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {}
  }, []);

  const showBrowserNotification = useCallback((senderName: string, messagePreview: string) => {
    if (notificationPermission === "granted" && document.hidden) {
      const notification = new Notification("New Message", {
        body: `${senderName}: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? "..." : ""}`,
        icon: "/favicon.ico",
        tag: `deal-message-${dealId}`,
      });
      notification.onclick = () => { window.focus(); notification.close(); };
      setTimeout(() => notification.close(), 5000);
    }
  }, [notificationPermission, dealId]);

  const { data: messages, isLoading, refetch } = trpc.dealMessage.getByDeal.useQuery(
    { dealId },
    { refetchInterval: 5000 }
  );

  const sendMessageMutation = trpc.dealMessage.send.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
      toast.success("Message sent");
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  const prevMessageCountRef = useRef<number>(0);
  useEffect(() => {
    if (messages && prevMessageCountRef.current > 0 && messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      const newMessages = messages.slice(prevMessageCountRef.current);
      const otherPartyMessages = newMessages.filter(msg => msg.senderId !== user?.id);
      if (otherPartyMessages.length > 0) {
        const latestMsg = otherPartyMessages[otherPartyMessages.length - 1];
        playNotificationSound();
        showBrowserNotification(latestMsg.sender?.name || "Someone", latestMsg.content);
        toast.info(`New message from ${latestMsg.sender?.name || "the other party"}`, { duration: 4000 });
      }
    }
    prevMessageCountRef.current = messages?.length || 0;
  }, [messages, user?.id, playNotificationSound, showBrowserNotification]);

  const handleSend = () => {
    if (!message.trim()) { toast.error("Message cannot be empty"); return; }
    if (message.length > 5000) { toast.error("Message is too long (max 5000 characters)"); return; }
    sendMessageMutation.mutate({ dealId, content: message.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const formatTimestamp = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const displayMessages = isExpanded
    ? messages || []
    : (messages || []).slice(-(COMPACT_MESSAGE_COUNT));

  const totalCount = messages?.length || 0;
  const hasMore = totalCount > COMPACT_MESSAGE_COUNT;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Messages
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground font-normal">({totalCount})</span>
            )}
          </CardTitle>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs gap-1 h-7"
            >
              {isExpanded ? (
                <>Show Recent <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>View All ({totalCount}) <ChevronDown className="h-3 w-3" /></>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Messages List - Compact */}
        <div className={`space-y-3 mb-3 overflow-y-auto border rounded-lg p-3 bg-muted/20 ${isExpanded ? "max-h-[500px]" : "max-h-[280px]"}`}>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation below</p>
            </div>
          ) : (
            <>
              {!isExpanded && hasMore && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
                >
                  — {totalCount - COMPACT_MESSAGE_COUNT} earlier messages —
                </button>
              )}
              {displayMessages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className={`text-xs ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {getInitials(msg.sender?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${isMine ? "text-right" : "text-left"}`}>
                      <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className={`text-xs font-medium ${isMine ? "order-2" : "order-1"}`}>
                          {isMine ? "You" : msg.sender?.name || "Unknown"}
                        </span>
                        <span className={`text-[10px] text-muted-foreground ${isMine ? "order-1" : "order-2"}`}>
                          {formatTimestamp(msg.createdAt)}
                        </span>
                      </div>
                      <div
                        className={`inline-block px-3 py-1.5 rounded-lg max-w-[85%] ${
                          isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input - Always Visible */}
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Type a message... (Enter to send)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            className="resize-none min-h-[38px] text-sm"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="sm"
            className="h-[38px] px-3 flex-shrink-0"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
