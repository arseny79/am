import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Building2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

export default function Messages() {
  const { user, isAuthenticated, loading } = useAuth();

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

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Messages</h1>
          <Card>
            <CardHeader>
              <CardTitle>Messaging System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Messaging functionality will be available soon. You'll be able to communicate directly with buyers and sellers.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
