import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Mail, AlertTriangle } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export default function SignupSuccess() {
  const emailFailed = new URLSearchParams(window.location.search).get("emailFailed") === "true";

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
            {emailFailed
              ? <AlertTriangle className="h-16 w-16 text-amber-500" />
              : <CheckCircle2 className="h-16 w-16 text-green-500" />
            }
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {emailFailed ? "Account created" : "Check your email"}
          </CardTitle>
          <CardDescription className="text-center">
            {emailFailed
              ? "Your account is ready, but we couldn't send the verification email"
              : "We've sent you a verification link"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailFailed ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The verification email could not be delivered. Please use the button below to resend it, or contact support if the problem persists.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Verification email sent!</p>
                <p>Please check your inbox and click the verification link to activate your account.</p>
              </div>
            </div>
          )}

          {!emailFailed && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Didn't receive the email?</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes and check again</li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Link href="/resend-verification" className="w-full">
            <Button variant={emailFailed ? "default" : "outline"} className="w-full">
              {emailFailed ? "Send Verification Email" : "Resend Verification Email"}
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
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
