import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Image as ImageIcon, Loader2, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

export function ContentTab() {
  const [uploading, setUploading] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hero content form state
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroPrimaryButtonText, setHeroPrimaryButtonText] = useState("");
  const [heroPrimaryButtonUrl, setHeroPrimaryButtonUrl] = useState("");
  const [heroSecondaryButtonText, setHeroSecondaryButtonText] = useState("");
  const [heroSecondaryButtonUrl, setHeroSecondaryButtonUrl] = useState("");
  
  const { data: settings, refetch } = trpc.admin.getSiteSettings.useQuery();
  
  // Populate form with existing values when settings load
  useEffect(() => {
    if (settings) {
      setHeroHeadline(settings.heroHeadline || "");
      setHeroSubheadline(settings.heroSubheadline || "");
      setHeroDescription(settings.heroDescription || "");
      setHeroPrimaryButtonText(settings.heroPrimaryButtonText || "");
      setHeroPrimaryButtonUrl(settings.heroPrimaryButtonUrl || "");
      setHeroSecondaryButtonText(settings.heroSecondaryButtonText || "");
      setHeroSecondaryButtonUrl(settings.heroSecondaryButtonUrl || "");
    }
  }, [settings]);
  const updateLogo = trpc.admin.updateLogo.useMutation({
    onSuccess: () => {
      toast.success("Logo updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update logo");
    },
  });
  
  const updateHeroContent = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: () => {
      toast.success("Hero content updated successfully");
      refetch();
      setSavingHero(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update hero content");
      setSavingHero(false);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Upload via tRPC
        await updateLogo.mutateAsync({
          fileData: base64,
          fileName: file.name,
          mimeType: file.type,
        });
        
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Management</h2>
        <p className="text-muted-foreground">
          Customize site branding and homepage content
        </p>
      </div>

      {/* Logo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Site Logo</CardTitle>
          <CardDescription>
            Upload your site logo (PNG, JPG, or SVG recommended). Max size: 2MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Logo Preview */}
          {settings?.logoUrl && (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="w-16 h-16 flex items-center justify-center border rounded bg-white">
                <img
                  src={settings.logoUrl}
                  alt="Current logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Current Logo</p>
                <p className="text-xs text-muted-foreground">
                  Displayed in header and throughout the site
                </p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {settings?.logoUrl ? "Change Logo" : "Upload Logo"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: Square image, transparent background, minimum 200x200px
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hero Content Section */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Hero Section</CardTitle>
          <CardDescription>
            Customize the main headline, description, and call-to-action buttons on your homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hero Headline */}
          <div className="space-y-2">
            <Label htmlFor="heroHeadline">Main Headline</Label>
            <Input
              id="heroHeadline"
              placeholder="Sell Your MSP for FREE"
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The main headline displayed at the top of your homepage
            </p>
          </div>

          {/* Hero Subheadline */}
          <div className="space-y-2">
            <Label htmlFor="heroSubheadline">Subheadline</Label>
            <Input
              id="heroSubheadline"
              placeholder="Only Pay When You Get Paid"
              value={heroSubheadline}
              onChange={(e) => setHeroSubheadline(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The secondary headline below the main headline
            </p>
          </div>

          {/* Hero Description */}
          <div className="space-y-2">
            <Label htmlFor="heroDescription">Description</Label>
            <Textarea
              id="heroDescription"
              placeholder="Traditional brokers charge 5-10% upfront ($50,000 on a $500K sale). We charge 3% and only when your business sells. No sale = no fee. Zero risk."
              value={heroDescription}
              onChange={(e) => setHeroDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              The description paragraph explaining your value proposition
            </p>
          </div>

          {/* Primary Button Text */}
          <div className="space-y-2">
            <Label htmlFor="heroPrimaryButtonText">Primary Button Text</Label>
            <Input
              id="heroPrimaryButtonText"
              placeholder="List Your MSP Free"
              value={heroPrimaryButtonText}
              onChange={(e) => setHeroPrimaryButtonText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The text for the main call-to-action button (blue button)
            </p>
          </div>

          {/* Primary Button URL */}
          <div className="space-y-2">
            <Label htmlFor="heroPrimaryButtonUrl">Primary Button URL</Label>
            <Input
              id="heroPrimaryButtonUrl"
              placeholder="/sell"
              value={heroPrimaryButtonUrl}
              onChange={(e) => setHeroPrimaryButtonUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The link destination for the primary button (e.g., /sell, /marketplace)
            </p>
          </div>

          {/* Secondary Button Text */}
          <div className="space-y-2">
            <Label htmlFor="heroSecondaryButtonText">Secondary Button Text</Label>
            <Input
              id="heroSecondaryButtonText"
              placeholder="Get Featured for $99"
              value={heroSecondaryButtonText}
              onChange={(e) => setHeroSecondaryButtonText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The text for the secondary call-to-action button (white button)
            </p>
          </div>

          {/* Secondary Button URL */}
          <div className="space-y-2">
            <Label htmlFor="heroSecondaryButtonUrl">Secondary Button URL</Label>
            <Input
              id="heroSecondaryButtonUrl"
              placeholder="/pricing"
              value={heroSecondaryButtonUrl}
              onChange={(e) => setHeroSecondaryButtonUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The link destination for the secondary button (e.g., /pricing, /marketplace)
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={() => {
              setSavingHero(true);
              updateHeroContent.mutate({
                heroHeadline: heroHeadline || null,
                heroSubheadline: heroSubheadline || null,
                heroDescription: heroDescription || null,
                heroPrimaryButtonText: heroPrimaryButtonText || null,
                heroPrimaryButtonUrl: heroPrimaryButtonUrl || null,
                heroSecondaryButtonText: heroSecondaryButtonText || null,
                heroSecondaryButtonUrl: heroSecondaryButtonUrl || null,
              });
            }}
            disabled={savingHero}
            className="w-full sm:w-auto"
          >
            {savingHero ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Hero Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
