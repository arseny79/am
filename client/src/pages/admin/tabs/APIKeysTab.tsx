import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Key, Save } from "lucide-react";

export function APIKeysTab() {
  const [stripeKey, setStripeKey] = useState("");
  const [sendgridKey, setSendgridKey] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [statcounterId, setStatcounterId] = useState("");
  const [statcounterSecurity, setStatcounterSecurity] = useState("");
  const [loading, setLoading] = useState(false);

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
            <Input
              id="stripe-key"
              type="password"
              placeholder="sk_live_..."
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
            />
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
          <Button disabled>
            <Save className="mr-2 h-4 w-4" />
            Save Stripe Key (Coming Soon)
          </Button>
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
            <Input
              id="sendgrid-key"
              type="password"
              placeholder="SG...."
              value={sendgridKey}
              onChange={(e) => setSendgridKey(e.target.value)}
            />
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
          <Button disabled>
            <Save className="mr-2 h-4 w-4" />
            Save SendGrid Key (Coming Soon)
          </Button>
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
            <Input
              id="ga-id"
              placeholder="G-XXXXXXXXXX"
              value={googleAnalyticsId}
              onChange={(e) => setGoogleAnalyticsId(e.target.value)}
            />
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
              onChange={(e) => setStatcounterId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sc-security">Security Code</Label>
            <Input
              id="sc-security"
              placeholder="abcdef123"
              value={statcounterSecurity}
              onChange={(e) => setStatcounterSecurity(e.target.value)}
            />
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
              Save Analytics Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
