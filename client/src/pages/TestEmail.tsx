import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, Loader2, ShieldAlert } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";

export default function TestEmail() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");

  if (loading) return null;
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">This page is restricted to administrators.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const testEmailMutation = trpc.system.testEmail.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Test email sent successfully! Check your inbox.");
      } else {
        toast.error("Failed to send test email. Please check your SendGrid configuration.");
      }
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    testEmailMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              <CardTitle>Test SendGrid Integration</CardTitle>
            </div>
            <CardDescription>
              Send a test email to verify your SendGrid configuration is working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={testEmailMutation.isPending}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={testEmailMutation.isPending}
              >
                {testEmailMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Test Email
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
