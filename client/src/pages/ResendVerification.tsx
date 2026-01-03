import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export default function ResendVerification() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const resendMutation = trpc.emailAuth.resendVerification.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError("");
    },
    onError: (error) => {
      setError(error.message);
      setSuccess(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    resendMutation.mutate({ email });
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-12" />}
            </div>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Email sent!</CardTitle>
            <CardDescription className="text-center">
              Check your inbox for the verification link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-900">
                We've sent a new verification email to <strong>{email}</strong>. Please check your inbox and spam folder.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-12" />}
          </div>
          <CardTitle className="text-2xl font-bold text-center">Resend verification email</CardTitle>
          <CardDescription className="text-center">
            Enter your email address to receive a new verification link
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Verification Email
            </Button>
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
