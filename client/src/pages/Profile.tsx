import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

// This component only renders when user is authenticated
// So it's safe to call tRPC hooks here
function AuthenticatedProfileContent() {
  const { user } = useAuth();
  
  // Extra safety check - should never happen but prevents any edge cases
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    phoneNumber: "",
    location: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        companyName: user.companyName || "",
        companyWebsite: user.companyWebsite || "",
        phoneNumber: user.phoneNumber || "",
        location: user.location || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const updateMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_TITLE}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/my-listings">
              <Button variant="ghost">My Listings</Button>
            </Link>
            <Link href="/messages">
              <Button variant="ghost">Messages</Button>
            </Link>
            <Link href="/saved-listings">
              <Button variant="ghost">Saved</Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin-dashboard">
                <Button variant="ghost">Admin</Button>
              </Link>
            )}
            <Link href="/profile">
              <Button variant="default">Profile</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information. You can both buy and sell MSP businesses on this platform.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your profile details to help others in the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={user?.name || ""} disabled />
                  <p className="text-xs text-muted-foreground">Name cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="Your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    value={formData.companyWebsite}
                    onChange={(e) =>
                      setFormData({ ...formData, companyWebsite: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="City, State/Country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Tell others about yourself and your business goals..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                  <Link href="/">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Main component that handles authentication checks
export default function Profile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to access your profile</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  // Only render the authenticated content when user is confirmed to be logged in
  // This ensures tRPC hooks are never called for unauthenticated users
  return <AuthenticatedProfileContent />;
}
