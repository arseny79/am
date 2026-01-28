import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { User, Settings, LogOut, ChevronDown, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { KYCStatusBadge } from "./KYCStatusBadge";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    profilePhotoUrl?: string | null;
    kycStatus?: string | null;
    kycVerified?: boolean | number | null;
    stripeIdentityVerified?: boolean | number | null;
    emailVerified?: boolean | number | null;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const [, setLocation] = useLocation();
  
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Signed out successfully");
      setTimeout(() => window.location.href = "/", 500);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (user.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Get display name
  const displayName = user.name || user.email || "User";
  const displayEmail = user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-auto py-2 px-3">
          <Avatar className="h-8 w-8">
            {user.profilePhotoUrl && (
              <AvatarImage src={user.profilePhotoUrl} alt={user.name || "Profile"} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block font-medium">{displayName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {displayEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {displayEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        
        {/* KYC Status Badge Section */}
        <div className="px-2 py-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Verification Status</p>
          <KYCStatusBadge user={user} />
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/profile")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{logoutMutation.isPending ? "Signing out..." : "Sign Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
