import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Key, Save, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export function APIKeysTab() {
  const [stripeKey, setStripeKey] = useState("");
  const [sendgridKey, setSendgridKey] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [statcounterId, setStatcounterId] = useState("");
  const [statcounterSecurity, setStatcounterSecurity] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation states
  const [stripeValidation, setStripeValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid";
    message?: string;
  }>({ status: "idle" });
  const [sendgridValidation, setSendgridValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid";
    message?: string;
  }>({ status: "idle" });
  const [gaValidation, setGaValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid";
    message?: string;
  }>({ status: "idle" });
  const [scValidation, setScValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid";
    message?: string;
  }>({ status: "idle" });

  // Validation mutations
  const validateStripeMutation = trpc.admin.apiKeyValidation.validateStripe.useMutation();
  const validateSendGridMutation = trpc.admin.apiKeyValidation.validateSendGrid.useMutation();
  const validateGAMutation = trpc.admin.apiKeyValidation.validateGoogleAnalytics.useMutation();
  const validateSCMutation = trpc.admin.apiKeyValidation.validateStatCounter.useMutation();

  // Validation handlers
  const validateStripe = async () => {
    if (!stripeKey) return;
    setStripeValidation({ status: "validating" });
    const result = await validateStripeMutation.mutateAsync({ apiKey: stripeKey });
    setStripeValidation({
      status: result.valid ? "valid" : "invalid",
      message: result.message,
    });
  };

  const validateSendGrid = async () => {
    if (!sendgridKey) return;
    setSendgridValidation({ status: "validating" });
    const result = await validateSendGridMutation.mutateAsync({ apiKey: sendgridKey });
    setSendgridValidation({
      status: result.valid ? "valid" : "invalid",
      message: result.message,
    });
  };

  const validateGA = async () => {
    if (!googleAnalyticsId) return;
    setGaValidation({ status: "validating" });
    const result = await validateGAMutation.mutateAsync({ measurementId: googleAnalyticsId });
    setGaValidation({
      status: result.valid ? "valid" : "invalid",
      message: result.message,
    });
  };

  const validateSC = async () => {
    if (!statcounterId || !statcounterSecurity) return;
    setScValidation({ status: "validating" });
    const result = await validateSCMutation.mutateAsync({
      projectId: statcounterId,
      securityCode: statcounterSecurity,
    });
    setScValidation({
      status: result.valid ? "valid" : "invalid",
      message: result.message,
    });
  };

  // Fetch current settings
  const { data: siteSettings, refetch } = trpc.admin.getSiteSettings.useQuery();

  useEffect(() => {
    if (siteSettings) {
      setGoogleAnalyticsId(siteSettings.googleAnalyticsId || "");
      setStatcounterId(siteSettings.statcounterId || "");
      setStatcounterSecurity(siteSettings.statcounterSecurity || "");
    }
  }, [siteSettings]);

  const updateMutation = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: () => {
      toast.success("API keys saved successfully");
      refetch();
      setLoading(false);
    },
    onError: (error) => {
      toast.error("Failed to save API keys: " + error.message);
      setLoading(false);
    },
  });

  const handleSave = () => {
    setLoading(true);
    updateMutation.mutate({
      googleAnalyticsId: googleAnalyticsId || null,
      statcounterId: statcounterId || null,
      statcounterSecurity: statcounterSecurity || null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Keys & Integrations</h2>
        <p className="text-muted-foreground">
          Manage third-party service integrations and API keys
        </p>
      </div>

      {/* Stripe Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
          <CardDescription>
            Payment processing for featured listings and success fees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe-key">Stripe Secret Key</Label>
            <div className="flex gap-2">
              <Input
                id="stripe-key"
                type="password"
                placeholder="sk_live_..."
                value={stripeKey}
                onChange={(e) => {
                  setStripeKey(e.target.value);
                  setStripeValidation({ status: "idle" });
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={validateStripe}
                disabled={!stripeKey || stripeValidation.status === "validating"}
              >
                {stripeValidation.status === "validating" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
            {stripeValidation.status === "valid" && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{stripeValidation.message}</span>
              </div>
            )}
            {stripeValidation.status === "invalid" && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{stripeValidation.message}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Stripe Dashboard
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SendGrid Integration */}
      <Card>
        <CardHeader>
          <CardTitle>SendGrid</CardTitle>
          <CardDescription>
            Email delivery for notifications and transactional emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
            <div className="flex gap-2">
              <Input
                id="sendgrid-key"
                type="password"
                placeholder="SG...."
                value={sendgridKey}
                onChange={(e) => {
                  setSendgridKey(e.target.value);
                  setSendgridValidation({ status: "idle" });
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={validateSendGrid}
                disabled={!sendgridKey || sendgridValidation.status === "validating"}
              >
                {sendgridValidation.status === "validating" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
            {sendgridValidation.status === "valid" && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{sendgridValidation.message}</span>
              </div>
            )}
            {sendgridValidation.status === "invalid" && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{sendgridValidation.message}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://app.sendgrid.com/settings/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                SendGrid Settings
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Analytics Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Google Analytics</CardTitle>
          <CardDescription>
            Track website traffic and user behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ga-id">Measurement ID</Label>
            <div className="flex gap-2">
              <Input
                id="ga-id"
                placeholder="G-XXXXXXXXXX"
                value={googleAnalyticsId}
                onChange={(e) => {
                  setGoogleAnalyticsId(e.target.value);
                  setGaValidation({ status: "idle" });
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={validateGA}
                disabled={!googleAnalyticsId || gaValidation.status === "validating"}
              >
                {gaValidation.status === "validating" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
            {gaValidation.status === "valid" && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{gaValidation.message}</span>
              </div>
            )}
            {gaValidation.status === "invalid" && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{gaValidation.message}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Find your ID in{" "}
              <a
                href="https://analytics.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Analytics
              </a>{" "}
              under Admin → Data Streams
            </p>
          </div>
        </CardContent>
      </Card>

      {/* StatCounter Integration */}
      <Card>
        <CardHeader>
          <CardTitle>StatCounter</CardTitle>
          <CardDescription>
            Alternative analytics and visitor tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sc-id">Project ID</Label>
            <Input
              id="sc-id"
              placeholder="12345678"
              value={statcounterId}
              onChange={(e) => {
                setStatcounterId(e.target.value);
                setScValidation({ status: "idle" });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sc-security">Security Code</Label>
            <div className="flex gap-2">
              <Input
                id="sc-security"
                placeholder="abcdef123"
                value={statcounterSecurity}
                onChange={(e) => {
                  setStatcounterSecurity(e.target.value);
                  setScValidation({ status: "idle" });
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={validateSC}
                disabled={!statcounterId || !statcounterSecurity || scValidation.status === "validating"}
              >
                {scValidation.status === "validating" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
            {scValidation.status === "valid" && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{scValidation.message}</span>
              </div>
            )}
            {scValidation.status === "invalid" && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{scValidation.message}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Get your credentials from{" "}
              <a
                href="https://statcounter.com/projects/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                StatCounter Projects
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
