import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SignOutButton() {
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Signed out successfully");
      setTimeout(() => window.location.href = "/", 500);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </>
      )}
    </Button>
  );
}
