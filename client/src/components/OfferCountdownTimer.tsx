import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";

interface OfferCountdownTimerProps {
  expiresAt: string | Date | null | undefined;
  status: string;
}

export function OfferCountdownTimer({ expiresAt, status }: OfferCountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt || status !== "pending") {
      setTimeRemaining("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        setIsExpired(true);
        setIsExpiringSoon(false);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Mark as expiring soon if less than 24 hours
      setIsExpiringSoon(hours < 24);
      setIsExpired(false);

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        setTimeRemaining(`${days}d ${remainingHours}h remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`);
      } else {
        setTimeRemaining(`${seconds}s remaining`);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, status]);

  if (!expiresAt || status !== "pending" || !timeRemaining) {
    return null;
  }

  if (isExpired) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Clock className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  if (isExpiringSoon) {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="h-3 w-3" />
        {timeRemaining}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      {timeRemaining}
    </Badge>
  );
}
