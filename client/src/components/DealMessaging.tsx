import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface DealMessagingProps {
  dealId: number;
}

export function DealMessaging({ dealId }: DealMessagingProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then(setNotificationPermission);
      }
    }
  }, []);

  // Play notification sound
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
    } catch (e) {
      // Audio not supported
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((senderName: string, messagePreview: string) => {
    if (notificationPermission === "granted" && document.hidden) {
      const notification = new Notification("New Message", {
        body: `${senderName}: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? "..." : ""}`,
        icon: "/favicon.ico",
        tag: `deal-message-${dealId}`,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }, [notificationPermission, dealId]);

  // Fetch messages with auto-refetch every 5 seconds
  const { data: messages, isLoading, refetch } = trpc.dealMessage.getByDeal.useQuery(
    { dealId },
    {
      refetchInterval: 5000, // Poll every 5 seconds for new messages
    }
  );

  // Send message mutation
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

  // Auto-scroll to bottom and notify when new messages arrive (not on initial load)
  const prevMessageCountRef = useRef<number>(0);
  const prevMessagesRef = useRef<typeof messages>([]);
  useEffect(() => {
    if (messages && prevMessageCountRef.current > 0 && messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      
      // Find the new message(s) and notify if from other party
      const newMessages = messages.slice(prevMessageCountRef.current);
      const otherPartyMessages = newMessages.filter(msg => msg.senderId !== user?.id);
      
      if (otherPartyMessages.length > 0) {
        const latestMsg = otherPartyMessages[otherPartyMessages.length - 1];
        playNotificationSound();
        showBrowserNotification(
          latestMsg.sender?.name || "Someone",
          latestMsg.content
        );
        toast.info(`New message from ${latestMsg.sender?.name || "the other party"}`, {
          duration: 4000,
        });
      }
    }
    prevMessageCountRef.current = messages?.length || 0;
    prevMessagesRef.current = messages || [];
  }, [messages, user?.id, playNotificationSound, showBrowserNotification]);

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    if (message.length > 5000) {
      toast.error("Message is too long (max 5000 characters)");
      return;
    }

    sendMessageMutation.mutate({
      dealId,
      content: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTimestamp = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
        <CardDescription>
          Communicate securely with the other party in this deal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Messages List */}
        <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto border rounded-lg p-4 bg-muted/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message below</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={isMine ? "bg-primary text-primary-foreground" : "bg-muted"}>
                        {getInitials(msg.sender?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${isMine ? "text-right" : "text-left"}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-sm font-medium ${isMine ? "order-2" : "order-1"}`}>
                          {isMine ? "You" : msg.sender?.name || "Unknown"}
                        </span>
                        <span className={`text-xs text-muted-foreground ${isMine ? "order-1" : "order-2"}`}>
                          {formatTimestamp(msg.createdAt)}
                        </span>
                      </div>
                      <div
                        className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                          isMine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
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

        {/* Message Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={3}
            className="resize-none"
            disabled={sendMessageMutation.isPending}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {message.length}/5000 characters
            </span>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Privacy:</strong> Messages are only visible to you and the other party in this deal. 
            All communications are encrypted and logged for security purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
