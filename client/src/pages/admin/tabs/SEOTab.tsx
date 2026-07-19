import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, FileText, Copy, ExternalLink, RefreshCw } from "lucide-react";

type SeoFormState = {
  siteName: string;
  siteUrl: string;
  twitterHandle: string;
  defaultMetaRobots: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  homeSeoTitle: string;
  homeSeoDescription: string;
  marketplaceSeoTitle: string;
  marketplaceSeoDescription: string;
  createListingSeoTitle: string;
  createListingSeoDescription: string;
  buyAssetSeoTitle: string;
  buyAssetSeoDescription: string;
  pricingSeoTitle: string;
  pricingSeoDescription: string;
  valuationToolSeoTitle: string;
  valuationToolSeoDescription: string;
  verifyStripeSeoTitle: string;
  verifyStripeSeoDescription: string;
};

const EMPTY_FORM: SeoFormState = {
  siteName: "",
  siteUrl: "",
  twitterHandle: "",
  defaultMetaRobots: "",
  seoTitle: "",
  seoDescription: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  homeSeoTitle: "",
  homeSeoDescription: "",
  marketplaceSeoTitle: "",
  marketplaceSeoDescription: "",
  createListingSeoTitle: "",
  createListingSeoDescription: "",
  buyAssetSeoTitle: "",
  buyAssetSeoDescription: "",
  pricingSeoTitle: "",
  pricingSeoDescription: "",
  valuationToolSeoTitle: "",
  valuationToolSeoDescription: "",
  verifyStripeSeoTitle: "",
  verifyStripeSeoDescription: "",
};

const PAGE_FIELDS: Array<{ keyTitle: keyof SeoFormState; keyDescription: keyof SeoFormState; label: string }> = [
  { keyTitle: "homeSeoTitle", keyDescription: "homeSeoDescription", label: "Home" },
  { keyTitle: "marketplaceSeoTitle", keyDescription: "marketplaceSeoDescription", label: "Marketplace" },
  { keyTitle: "createListingSeoTitle", keyDescription: "createListingSeoDescription", label: "Create Listing" },
  { keyTitle: "buyAssetSeoTitle", keyDescription: "buyAssetSeoDescription", label: "Buyer Requests" },
  { keyTitle: "pricingSeoTitle", keyDescription: "pricingSeoDescription", label: "Pricing" },
  { keyTitle: "valuationToolSeoTitle", keyDescription: "valuationToolSeoDescription", label: "Valuation Tool" },
  { keyTitle: "verifyStripeSeoTitle", keyDescription: "verifyStripeSeoDescription", label: "Stripe Verification" },
];

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function SEOTab() {
  const [form, setForm] = useState<SeoFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [sitemapXml, setSitemapXml] = useState<string | null>(null);
  const [generatingSitemap, setGeneratingSitemap] = useState(false);

  const { data: siteSettings, refetch } = trpc.admin.getSiteSettings.useQuery();
  const sitemapBaseUrl = useMemo(
    () => (form.siteUrl.trim() || window.location.origin).replace(/\/+$/, ""),
    [form.siteUrl]
  );

  const generateSitemapMutation = trpc.admin.generateSitemap.useQuery(
    { baseUrl: sitemapBaseUrl },
    { enabled: false }
  );

  useEffect(() => {
    if (!siteSettings) return;
    setForm({
      siteName: siteSettings.siteName || "",
      siteUrl: siteSettings.siteUrl || "",
      twitterHandle: siteSettings.twitterHandle || "",
      defaultMetaRobots: siteSettings.defaultMetaRobots || "",
      seoTitle: siteSettings.seoTitle || "",
      seoDescription: siteSettings.seoDescription || "",
      ogTitle: siteSettings.ogTitle || "",
      ogDescription: siteSettings.ogDescription || "",
      ogImage: siteSettings.ogImage || "",
      homeSeoTitle: siteSettings.homeSeoTitle || "",
      homeSeoDescription: siteSettings.homeSeoDescription || "",
      marketplaceSeoTitle: siteSettings.marketplaceSeoTitle || "",
      marketplaceSeoDescription: siteSettings.marketplaceSeoDescription || "",
      createListingSeoTitle: siteSettings.createListingSeoTitle || "",
      createListingSeoDescription: siteSettings.createListingSeoDescription || "",
      buyAssetSeoTitle: siteSettings.buyAssetSeoTitle || "",
      buyAssetSeoDescription: siteSettings.buyAssetSeoDescription || "",
      pricingSeoTitle: siteSettings.pricingSeoTitle || "",
      pricingSeoDescription: siteSettings.pricingSeoDescription || "",
      valuationToolSeoTitle: siteSettings.valuationToolSeoTitle || "",
      valuationToolSeoDescription: siteSettings.valuationToolSeoDescription || "",
      verifyStripeSeoTitle: siteSettings.verifyStripeSeoTitle || "",
      verifyStripeSeoDescription: siteSettings.verifyStripeSeoDescription || "",
    });
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

  const setField = (key: keyof SeoFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    setLoading(true);
    updateMutation.mutate({
      siteName: toNullable(form.siteName),
      siteUrl: toNullable(form.siteUrl),
      twitterHandle: toNullable(form.twitterHandle),
      defaultMetaRobots: toNullable(form.defaultMetaRobots),
      seoTitle: toNullable(form.seoTitle),
      seoDescription: toNullable(form.seoDescription),
      ogTitle: toNullable(form.ogTitle),
      ogDescription: toNullable(form.ogDescription),
      ogImage: toNullable(form.ogImage),
      homeSeoTitle: toNullable(form.homeSeoTitle),
      homeSeoDescription: toNullable(form.homeSeoDescription),
      marketplaceSeoTitle: toNullable(form.marketplaceSeoTitle),
      marketplaceSeoDescription: toNullable(form.marketplaceSeoDescription),
      createListingSeoTitle: toNullable(form.createListingSeoTitle),
      createListingSeoDescription: toNullable(form.createListingSeoDescription),
      buyAssetSeoTitle: toNullable(form.buyAssetSeoTitle),
      buyAssetSeoDescription: toNullable(form.buyAssetSeoDescription),
      pricingSeoTitle: toNullable(form.pricingSeoTitle),
      pricingSeoDescription: toNullable(form.pricingSeoDescription),
      valuationToolSeoTitle: toNullable(form.valuationToolSeoTitle),
      valuationToolSeoDescription: toNullable(form.valuationToolSeoDescription),
      verifyStripeSeoTitle: toNullable(form.verifyStripeSeoTitle),
      verifyStripeSeoDescription: toNullable(form.verifyStripeSeoDescription),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">SEO Configuration</h2>
        <p className="text-muted-foreground">
          Control AM’s canonical domain, global meta defaults, social sharing data, and page-level SEO without code changes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Identity & Canonical Domain</CardTitle>
          <CardDescription>
            These values drive canonical URLs, sitemap links, Open Graph site name, and social metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                placeholder="Acquisitions.market"
                value={form.siteName}
                onChange={(e) => setField("siteName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-url">Canonical Site URL</Label>
              <Input
                id="site-url"
                type="url"
                placeholder="https://acquisitions.market"
                value={form.siteUrl}
                onChange={(e) => setField("siteUrl", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use the final production domain with https.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="twitter-handle">Twitter/X Handle</Label>
              <Input
                id="twitter-handle"
                placeholder="@acquisitionsmarket"
                value={form.twitterHandle}
                onChange={(e) => setField("twitterHandle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-robots">Default Robots Meta</Label>
              <Input
                id="meta-robots"
                placeholder="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
                value={form.defaultMetaRobots}
                onChange={(e) => setField("defaultMetaRobots", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Meta & Social Sharing</CardTitle>
          <CardDescription>
            Fallback metadata used when a page does not have its own specific SEO title or description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seo-title">Default Title</Label>
            <Input
              id="seo-title"
              placeholder="Acquisitions.market | Digital Asset & Online Business Marketplace"
              value={form.seoTitle}
              onChange={(e) => setField("seoTitle", e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-description">Default Meta Description</Label>
            <Textarea
              id="seo-description"
              placeholder="Browse digital assets, online businesses, and acquisition opportunities. Protect confidential information, qualify buyers, and move deals forward."
              value={form.seoDescription}
              onChange={(e) => setField("seoDescription", e.target.value)}
              maxLength={320}
              rows={3}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="og-title">Default Social Title</Label>
              <Input
                id="og-title"
                placeholder="Acquisitions.market"
                value={form.ogTitle}
                onChange={(e) => setField("ogTitle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="og-image">Default Social Image URL</Label>
              <Input
                id="og-image"
                type="url"
                placeholder="https://acquisitions.market/og-image.jpg"
                value={form.ogImage}
                onChange={(e) => setField("ogImage", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-description">Default Social Description</Label>
            <Textarea
              id="og-description"
              placeholder="Trusted marketplace infrastructure for acquisitions of digital assets and online businesses."
              value={form.ogDescription}
              onChange={(e) => setField("ogDescription", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page-Specific SEO</CardTitle>
          <CardDescription>
            These fields override the default title and description for important public pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {PAGE_FIELDS.map((page) => (
            <div key={page.label} className="space-y-3 rounded-lg border p-4">
              <h3 className="font-semibold">{page.label}</h3>
              <div className="space-y-2">
                <Label>{page.label} Title</Label>
                <Input
                  value={form[page.keyTitle]}
                  onChange={(e) => setField(page.keyTitle, e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label>{page.label} Description</Label>
                <Textarea
                  value={form[page.keyDescription]}
                  onChange={(e) => setField(page.keyDescription, e.target.value)}
                  rows={3}
                  maxLength={320}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep the canonical site URL locked to your main production domain.</li>
            <li>• Give every public page a unique title and description that match search intent.</li>
            <li>• Use a 1200×630 social image for stronger Open Graph and Twitter previews.</li>
            <li>• Keep robots set to index/follow on live pages unless you intentionally want them hidden.</li>
            <li>• Submit both sitemap.xml and robots.txt in Google Search Console after major SEO changes.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sitemap.xml
          </CardTitle>
          <CardDescription>
            Preview the live sitemap generated from the canonical base URL and active listings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sitemap URL</Label>
            <div className="flex gap-2">
              <Input value={`${sitemapBaseUrl}/sitemap.xml`} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(`${sitemapBaseUrl}/sitemap.xml`);
                  toast.success("Sitemap URL copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(`${sitemapBaseUrl}/sitemap.xml`, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
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
                } catch {
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
          )}
        </CardContent>
      </Card>

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
