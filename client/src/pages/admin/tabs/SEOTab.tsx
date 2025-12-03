import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, Search } from "lucide-react";

export function SEOTab() {
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch current settings
  const { data: siteSettings, refetch } = trpc.admin.getSiteSettings.useQuery();

  useEffect(() => {
    if (siteSettings) {
      setSeoTitle(siteSettings.seoTitle || "");
      setSeoDescription(siteSettings.seoDescription || "");
      setOgTitle(siteSettings.ogTitle || "");
      setOgDescription(siteSettings.ogDescription || "");
      setOgImage(siteSettings.ogImage || "");
    }
  }, [siteSettings]);

  const updateMutation = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: () => {
      toast.success("SEO settings saved successfully");
      refetch();
      setLoading(false);
    },
    onError: (error) => {
      toast.error("Failed to save SEO settings: " + error.message);
      setLoading(false);
    },
  });

  const handleSave = () => {
    setLoading(true);
    updateMutation.mutate({
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">SEO Configuration</h2>
        <p className="text-muted-foreground">
          Optimize your platform for search engines and social media
        </p>
      </div>

      {/* Basic SEO */}
      <Card>
        <CardHeader>
          <CardTitle>Basic SEO</CardTitle>
          <CardDescription>
            Meta tags that appear in search engine results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seo-title">Page Title</Label>
            <Input
              id="seo-title"
              placeholder="MSP M&A Marketplace - Buy & Sell MSP Businesses"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              {seoTitle.length}/60 characters (optimal: 50-60)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-description">Meta Description</Label>
            <Textarea
              id="seo-description"
              placeholder="The trusted marketplace for buying and selling MSP businesses. Connect with serious buyers and sellers. No upfront fees - only 3% success fee."
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={160}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {seoDescription.length}/160 characters (optimal: 150-160)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Open Graph (Social Media) */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media (Open Graph)</CardTitle>
          <CardDescription>
            How your platform appears when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="og-title">Social Title</Label>
            <Input
              id="og-title"
              placeholder="MSP M&A Marketplace"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-description">Social Description</Label>
            <Textarea
              id="og-description"
              placeholder="The trusted marketplace for buying and selling MSP businesses"
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-image">Social Image URL</Label>
            <Input
              id="og-image"
              type="url"
              placeholder="https://yourdomain.com/og-image.jpg"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Recommended size: 1200x630px (JPG or PNG)
            </p>
          </div>
          {ogImage && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <img
                src={ogImage}
                alt="OG Image Preview"
                className="w-full max-w-md rounded border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Tips */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Include your primary keyword in the title (e.g., "MSP M&A")</li>
            <li>• Keep titles under 60 characters to avoid truncation</li>
            <li>• Write compelling descriptions that encourage clicks</li>
            <li>• Use unique titles and descriptions for each page</li>
            <li>• Include a clear call-to-action in descriptions</li>
            <li>• Update OG image to match your brand identity</li>
          </ul>
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
              Save SEO Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
