import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, Search, FileText, Copy, ExternalLink, RefreshCw } from "lucide-react";

export function SEOTab() {
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sitemapXml, setSitemapXml] = useState<string | null>(null);
  const [generatingSitemap, setGeneratingSitemap] = useState(false);

  // Fetch current settings
  const { data: siteSettings, refetch } = trpc.admin.getSiteSettings.useQuery();
  
  // Sitemap generation mutation
  const generateSitemapMutation = trpc.admin.generateSitemap.useQuery(
    { baseUrl: window.location.origin },
    { enabled: false }
  );

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
              placeholder="acquisition.market - Buy & Sell Businesses and Digital Assets"
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
              placeholder="The trusted marketplace for buying and selling businesses and digital assets. Connect with serious buyers and sellers. No upfront fees - only 3% success fee."
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
              placeholder="acquisition.market"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-description">Social Description</Label>
            <Textarea
              id="og-description"
              placeholder="The trusted marketplace for buying and selling businesses and digital assets"
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
            <li>• Include your primary keyword in the title (e.g., "acquisition marketplace")</li>
            <li>• Keep titles under 60 characters to avoid truncation</li>
            <li>• Write compelling descriptions that encourage clicks</li>
            <li>• Use unique titles and descriptions for each page</li>
            <li>• Include a clear call-to-action in descriptions</li>
            <li>• Update OG image to match your brand identity</li>
          </ul>
        </CardContent>
      </Card>

      {/* Sitemap Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sitemap.xml
          </CardTitle>
          <CardDescription>
            Generate and manage your sitemap for search engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sitemap URL</Label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/sitemap.xml`}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/sitemap.xml`);
                  toast.success("Sitemap URL copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(`${window.location.origin}/sitemap.xml`, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Submit this URL to Google Search Console and Bing Webmaster Tools
            </p>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={async () => {
                setGeneratingSitemap(true);
                try {
                  const result = await generateSitemapMutation.refetch();
                  if (result.data?.xml) {
                    setSitemapXml(result.data.xml);
                    toast.success("Sitemap generated successfully");
                  }
                } catch (error) {
                  toast.error("Failed to generate sitemap");
                } finally {
                  setGeneratingSitemap(false);
                }
              }}
              disabled={generatingSitemap}
            >
              {generatingSitemap ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Preview
                </>
              )}
            </Button>
          </div>

          {sitemapXml && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg p-4 bg-muted/50 max-h-96 overflow-auto">
                <pre className="text-xs font-mono">{sitemapXml}</pre>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([sitemapXml], { type: "application/xml" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "sitemap.xml";
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Sitemap downloaded");
                  }}
                >
                  Download sitemap.xml
                </Button>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">What's included:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• All public pages (home, marketplace, pricing, etc.)</li>
              <li>• All active listings with last modified dates</li>
              <li>• Automatic priority and change frequency settings</li>
              <li>• Real-time generation from database</li>
            </ul>
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
              Save SEO Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
