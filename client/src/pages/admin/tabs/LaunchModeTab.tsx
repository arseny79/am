import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Rocket, EyeOff } from "lucide-react";

export function LaunchModeTab() {
  const settingsQuery = trpc.admin.getSiteSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const updateMutation = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: () => {
      settingsQuery.refetch();
      toast.success("Launch mode updated.");
    },
    onError: (err) => toast.error(err.message),
  });

  const settings = settingsQuery.data as { launchMode?: string } | null | undefined;
  const currentMode = settings?.launchMode ?? "live";
  const isPreLaunch = currentMode === "pre_launch";

  const toggle = () => {
    updateMutation.mutate({
      launchMode: isPreLaunch ? "live" : "pre_launch",
    });
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Card className={isPreLaunch ? "border-amber-500/50 bg-amber-500/5" : "border-green-500/50 bg-green-500/5"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPreLaunch ? (
              <>
                <EyeOff className="h-5 w-5 text-amber-500" />
                Pre-Launch Mode — Site Hidden
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 text-green-500" />
                Live — Site Public
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isPreLaunch
              ? "Only admin users can see the full site. All other visitors see the \"Getting Ready for Launch\" coming soon page."
              : "The site is publicly accessible to all visitors. Admins and regular users see the full platform."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={toggle}
            disabled={updateMutation.isPending}
            variant={isPreLaunch ? "default" : "outline"}
            className={isPreLaunch ? "bg-green-600 hover:bg-green-500" : "border-amber-500 text-amber-600 hover:bg-amber-500/10"}
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPreLaunch ? "Go Live — Open Site to Public" : "Switch to Pre-Launch Mode"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong className="text-foreground">Pre-Launch:</strong> Visitors see a branded "Getting Ready for Launch" page with an email waitlist. Admins who log in bypass the gate and see everything normally.</p>
          <p><strong className="text-foreground">Live:</strong> Everyone sees the full site. Normal operation.</p>
          <p>You can switch back and forth at any time from this panel.</p>
        </CardContent>
      </Card>
    </div>
  );
}
