import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Rocket, Eye, Copy, Info } from "lucide-react";

export function LaunchModeTab() {
  const { data, isLoading, refetch } = trpc.admin.getLaunchMode.useQuery();
  const updateLaunchMode = trpc.admin.updateLaunchMode.useMutation({
    onSuccess: () => {
      toast.success("Launch mode settings saved.");
      refetch();
    },
    onError: (err) => {
      toast.error("Failed to save: " + err.message);
    },
  });

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  // Use form state if edited, otherwise fall back to loaded data
  const launchModeEnabled = enabled !== null ? enabled : (data?.launchModeEnabled ?? false);
  const previewSecret = secret !== null ? secret : (data?.previewSecret ?? "");

  const isDirty = enabled !== null || secret !== null;

  const handleSave = () => {
    updateLaunchMode.mutate({
      launchModeEnabled,
      previewSecret,
    });
    setEnabled(null);
    setSecret(null);
  };

  const copyBypassUrl = () => {
    const url = `${window.location.origin}/?preview=${previewSecret}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Bypass URL copied to clipboard.");
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground p-4">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Launch Mode</h2>
        <p className="text-muted-foreground mt-1">
          Show a "Coming Soon" page to all visitors while you work on the site behind the scenes.
        </p>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Current status:</span>
        {launchModeEnabled ? (
          <Badge variant="destructive" className="gap-1">
            <Rocket className="w-3 h-3" /> Launch Mode ON — visitors see Coming Soon
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            Site is LIVE — all visitors see the full site
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Toggle Launch Mode</CardTitle>
          <CardDescription>
            When ON, everyone except you and admins will see the Coming Soon page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Switch
              id="launch-mode-toggle"
              checked={launchModeEnabled}
              onCheckedChange={(checked) => setEnabled(checked)}
            />
            <Label htmlFor="launch-mode-toggle" className="cursor-pointer select-none">
              {launchModeEnabled ? "ON — site is in launch mode" : "OFF — site is fully live"}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview Secret (Bypass Password)
          </CardTitle>
          <CardDescription>
            Anyone who knows this secret can bypass the Coming Soon page and see the full site.
            Share it with team members or trusted reviewers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preview-secret">Secret word or phrase</Label>
            <Input
              id="preview-secret"
              type="text"
              placeholder="e.g. opensesame"
              value={previewSecret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              Choose anything you like — a word, phrase, or short code. Keep it private.
            </p>
          </div>

          {previewSecret && (
            <div className="rounded-md bg-muted p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Your bypass URL:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs break-all flex-1">
                  {window.location.origin}/?preview={previewSecret}
                </code>
                <Button variant="ghost" size="sm" onClick={copyBypassUrl} className="shrink-0">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Visit this URL once in your browser — you'll see the full site for 7 days.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={!isDirty || updateLaunchMode.isPending}
        className="w-full sm:w-auto"
      >
        {updateLaunchMode.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
