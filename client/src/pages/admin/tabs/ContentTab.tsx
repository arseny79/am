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
  
  // Stats section form state
  const [statGmv, setStatGmv] = useState("");
  const [statGmvLabel, setStatGmvLabel] = useState("");
  const [statActiveListings, setStatActiveListings] = useState("");
  const [statActiveListingsLabel, setStatActiveListingsLabel] = useState("");
  const [statEscrowProtected, setStatEscrowProtected] = useState("");
  const [statEscrowProtectedLabel, setStatEscrowProtectedLabel] = useState("");
  const [savingStats, setSavingStats] = useState(false);
  
  // Valuation Tool Footer form state
  const [valuationDataSources, setValuationDataSources] = useState("");
  const [valuationDisclaimer, setValuationDisclaimer] = useState("");
  const [savingValuation, setSavingValuation] = useState(false);
  
  // Valuation Tool Header form state
  const [valuationToolHeading, setValuationToolHeading] = useState("");
  const [valuationToolSubheading, setValuationToolSubheading] = useState("");
  const [savingValuationHeader, setSavingValuationHeader] = useState(false);
  
  // Marketplace Page Header form state
  const [marketplaceHeading, setMarketplaceHeading] = useState("");
  const [marketplaceSubheading, setMarketplaceSubheading] = useState("");
  const [savingMarketplaceHeader, setSavingMarketplaceHeader] = useState(false);
  
  // Buy Asset Page Header form state
  const [buyAssetHeading, setBuyAssetHeading] = useState("");
  const [buyAssetSubheading, setBuyAssetSubheading] = useState("");
  const [savingBuyAssetHeader, setSavingBuyAssetHeader] = useState(false);
  
  // Livechat Settings form state
  const [livechatScript, setLivechatScript] = useState("");
  const [livechatEnabledPublic, setLivechatEnabledPublic] = useState(true);
  const [livechatEnabledAdmin, setLivechatEnabledAdmin] = useState(false);
  const [savingLivechat, setSavingLivechat] = useState(false);
  
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
      setStatGmv(settings.statGmv || "");
      setStatGmvLabel(settings.statGmvLabel || "");
      setStatActiveListings(settings.statActiveListings || "");
      setStatActiveListingsLabel(settings.statActiveListingsLabel || "");
      setStatEscrowProtected(settings.statEscrowProtected || "");
      setStatEscrowProtectedLabel(settings.statEscrowProtectedLabel || "");
      setValuationDataSources(settings.valuationDataSources || "");
      setValuationDisclaimer(settings.valuationDisclaimer || "");
      setValuationToolHeading(settings.valuationToolHeading || "");
      setValuationToolSubheading(settings.valuationToolSubheading || "");
      setMarketplaceHeading(settings.marketplaceHeading || "");
      setMarketplaceSubheading(settings.marketplaceSubheading || "");
      setBuyAssetHeading(settings.buyAssetHeading || "");
      setBuyAssetSubheading(settings.buyAssetSubheading || "");
      setLivechatScript(settings.livechatScript || "");
      setLivechatEnabledPublic(settings.livechatEnabledPublic === 1);
      setLivechatEnabledAdmin(settings.livechatEnabledAdmin === 1);
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

      {/* Stats Section */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Trust Signals</CardTitle>
          <CardDescription>
            Customize the three trust signals displayed below the hero section. You can use numbers (e.g., "$2M+") or text descriptions (e.g., "Seller-controlled visibility").
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Stat */}
          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="font-medium">First Trust Signal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="statGmv">Value/Text</Label>
                <Input
                  id="statGmv"
                  placeholder="$2M+ or Seller-controlled visibility"
                  value={statGmv}
                  onChange={(e) => setStatGmv(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statGmvLabel">Label (optional)</Label>
                <Input
                  id="statGmvLabel"
                  placeholder="Total GMV"
                  value={statGmvLabel}
                  onChange={(e) => setStatGmvLabel(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave label empty if your value is descriptive text
            </p>
          </div>

          {/* Second Stat */}
          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="font-medium">Second Trust Signal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="statActiveListings">Value/Text</Label>
                <Input
                  id="statActiveListings"
                  placeholder="7+ or Secure document sharing"
                  value={statActiveListings}
                  onChange={(e) => setStatActiveListings(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statActiveListingsLabel">Label (optional)</Label>
                <Input
                  id="statActiveListingsLabel"
                  placeholder="Active Listings"
                  value={statActiveListingsLabel}
                  onChange={(e) => setStatActiveListingsLabel(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave label empty if your value is descriptive text
            </p>
          </div>

          {/* Third Stat */}
          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="font-medium">Third Trust Signal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="statEscrowProtected">Value/Text</Label>
                <Input
                  id="statEscrowProtected"
                  placeholder="Escrow supported"
                  value={statEscrowProtected}
                  onChange={(e) => setStatEscrowProtected(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statEscrowProtectedLabel">Label (optional)</Label>
                <Input
                  id="statEscrowProtectedLabel"
                  placeholder="Protection"
                  value={statEscrowProtectedLabel}
                  onChange={(e) => setStatEscrowProtectedLabel(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave label empty if your value is descriptive text
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={() => {
              setSavingStats(true);
              updateHeroContent.mutate({
                statGmv: statGmv || null,
                statGmvLabel: statGmvLabel || null,
                statActiveListings: statActiveListings || null,
                statActiveListingsLabel: statActiveListingsLabel || null,
                statEscrowProtected: statEscrowProtected || null,
                statEscrowProtectedLabel: statEscrowProtectedLabel || null,
              }, {
                onSuccess: () => {
                  toast.success("Trust signals updated successfully");
                  setSavingStats(false);
                },
                onError: (error) => {
                  toast.error(error.message || "Failed to update trust signals");
                  setSavingStats(false);
                },
              });
            }}
            disabled={savingStats}
            className="w-full sm:w-auto"
          >
            {savingStats ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Trust Signals
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Valuation Tool Header */}
      <Card>
        <CardHeader>
          <CardTitle>Valuation Tool Header</CardTitle>
          <CardDescription>
            Customize the heading and subheading displayed at the top of the valuation tool page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="valuationToolHeading">Heading</Label>
            <Input
              id="valuationToolHeading"
              placeholder="What's Your MSP Worth?"
              value={valuationToolHeading}
              onChange={(e) => setValuationToolHeading(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The main heading displayed at the top of the valuation tool page
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valuationToolSubheading">Subheading</Label>
            <Textarea
              id="valuationToolSubheading"
              placeholder="Get an instant, data-driven valuation range in under 60 seconds. Based on real MSP transaction data from Aventis Advisors, Drake Star, and Worklyn Partners."
              value={valuationToolSubheading}
              onChange={(e) => setValuationToolSubheading(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              The description text below the main heading
            </p>
          </div>

          <Button
            onClick={() => {
              setSavingValuationHeader(true);
              updateHeroContent.mutate({
                valuationToolHeading: valuationToolHeading || null,
                valuationToolSubheading: valuationToolSubheading || null,
              }, {
                onSuccess: () => {
                  toast.success("Valuation tool header updated successfully");
                  setSavingValuationHeader(false);
                },
                onError: (error) => {
                  toast.error(error.message || "Failed to update valuation tool header");
                  setSavingValuationHeader(false);
                },
              });
            }}
            disabled={savingValuationHeader}
            className="w-full sm:w-auto"
          >
            {savingValuationHeader ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Valuation Header
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Valuation Tool Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Valuation Tool Footer</CardTitle>
          <CardDescription>
            Customize the data sources and disclaimer text shown at the bottom of the valuation calculator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="valuationDataSources">Data Sources Text</Label>
            <Textarea
              id="valuationDataSources"
              placeholder="Data sources: Aventis Advisors, Drake Star, Greenwich PE, NinjaOne, Worklyn Partners, Evergreen, The 20"
              value={valuationDataSources}
              onChange={(e) => setValuationDataSources(e.target.value)}
              rows={2}
            />
            <p className="text-sm text-muted-foreground">
              List of data sources used for valuation calculations
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valuationDisclaimer">Disclaimer Text</Label>
            <Textarea
              id="valuationDisclaimer"
              placeholder="This calculator provides an estimate only. Actual valuations may vary based on market conditions, buyer appetite, and due diligence findings."
              value={valuationDisclaimer}
              onChange={(e) => setValuationDisclaimer(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Legal disclaimer about valuation accuracy
            </p>
          </div>

          <Button
            onClick={() => {
              setSavingValuation(true);
              updateHeroContent.mutate({
                valuationDataSources: valuationDataSources || null,
                valuationDisclaimer: valuationDisclaimer || null,
              }, {
                onSuccess: () => {
                  toast.success("Valuation footer updated successfully");
                  setSavingValuation(false);
                },
                onError: (error) => {
                  toast.error(error.message || "Failed to update valuation footer");
                  setSavingValuation(false);
                },
              });
            }}
            disabled={savingValuation}
            className="w-full sm:w-auto"
          >
            {savingValuation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Valuation Footer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Marketplace Page Header */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Page Header</CardTitle>
          <CardDescription>
            Customize the heading and subheading displayed at the top of the Marketplace browse page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="marketplaceHeading">Heading</Label>
              <span className={`text-xs ${marketplaceHeading.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {marketplaceHeading.length}/60
              </span>
            </div>
            <Input
              id="marketplaceHeading"
              placeholder="Browse MSP Businesses for Sale"
              value={marketplaceHeading}
              onChange={(e) => setMarketplaceHeading(e.target.value)}
              maxLength={60}
            />
            <p className="text-sm text-muted-foreground">
              The main heading displayed at the top of the Marketplace page
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="marketplaceSubheading">Subheading</Label>
              <span className={`text-xs ${marketplaceSubheading.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {marketplaceSubheading.length}/160
              </span>
            </div>
            <Textarea
              id="marketplaceSubheading"
              placeholder="Discover verified MSP businesses available for acquisition. Filter by revenue, location, and service type."
              value={marketplaceSubheading}
              onChange={(e) => setMarketplaceSubheading(e.target.value)}
              maxLength={160}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              The description text below the main heading
            </p>
          </div>

          <Button
            onClick={() => {
              setSavingMarketplaceHeader(true);
              updateHeroContent.mutate({
                marketplaceHeading: marketplaceHeading || null,
                marketplaceSubheading: marketplaceSubheading || null,
              }, {
                onSuccess: () => {
                  toast.success("Marketplace header updated successfully");
                  setSavingMarketplaceHeader(false);
                },
                onError: (error) => {
                  toast.error(error.message || "Failed to update Marketplace header");
                  setSavingMarketplaceHeader(false);
                },
              });
            }}
            disabled={savingMarketplaceHeader}
            className="w-full sm:w-auto"
          >
            {savingMarketplaceHeader ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Marketplace Header
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Buy Asset Page Header */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Asset Page Header</CardTitle>
          <CardDescription>
            Customize the heading and subheading displayed at the top of the Buy Asset (buyer requests) page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="buyAssetHeading">Heading</Label>
              <span className={`text-xs ${buyAssetHeading.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {buyAssetHeading.length}/60
              </span>
            </div>
            <Input
              id="buyAssetHeading"
              placeholder="Looking to Buy an MSP?"
              value={buyAssetHeading}
              onChange={(e) => setBuyAssetHeading(e.target.value)}
              maxLength={60}
            />
            <p className="text-sm text-muted-foreground">
              The main heading displayed at the top of the Buy Asset page
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="buyAssetSubheading">Subheading</Label>
              <span className={`text-xs ${buyAssetSubheading.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {buyAssetSubheading.length}/160
              </span>
            </div>
            <Textarea
              id="buyAssetSubheading"
              placeholder="Post your acquisition criteria and let qualified MSP sellers come to you."
              value={buyAssetSubheading}
              onChange={(e) => setBuyAssetSubheading(e.target.value)}
              maxLength={160}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              The description text below the main heading
            </p>
          </div>

          <Button
            onClick={() => {
              setSavingBuyAssetHeader(true);
              updateHeroContent.mutate({
                buyAssetHeading: buyAssetHeading || null,
                buyAssetSubheading: buyAssetSubheading || null,
              }, {
                onSuccess: () => {
                  toast.success("Buy Asset header updated successfully");
                  setSavingBuyAssetHeader(false);
                },
                onError: (error) => {
                  toast.error(error.message || "Failed to update Buy Asset header");
                  setSavingBuyAssetHeader(false);
                },
              });
            }}
            disabled={savingBuyAssetHeader}
            className="w-full sm:w-auto"
          >
            {savingBuyAssetHeader ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Buy Asset Header
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Livechat Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Livechat Settings</CardTitle>
          <CardDescription>
            Configure third-party chat widgets (like Leadster) without touching code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="livechatScript">Custom Script Code</Label>
            <Textarea
              id="livechatScript"
              placeholder="Paste your livechat script here (e.g., Leadster, Intercom, etc.)..."
              value={livechatScript}
              onChange={(e) => setLivechatScript(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Paste the complete script tag provided by your livechat provider
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="livechatEnabledPublic"
              checked={livechatEnabledPublic}
              onChange={(e) => setLivechatEnabledPublic(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="livechatEnabledPublic" className="font-normal cursor-pointer">
              Enable on public pages
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="livechatEnabledAdmin"
              checked={livechatEnabledAdmin}
              onChange={(e) => setLivechatEnabledAdmin(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="livechatEnabledAdmin" className="font-normal cursor-pointer">
              Enable on admin pages
            </Label>
          </div>

          <Button
            onClick={() => {
              setSavingLivechat(true);
              updateHeroContent.mutate({
                livechatScript: livechatScript || null,
                livechatEnabledPublic,
                livechatEnabledAdmin,
              }, {
                onSuccess: () => {
                  toast.success("Livechat settings updated successfully");
                  setSavingLivechat(false);
                },
                onError: (error) => {
                  toast.error(error.message || "Failed to update livechat settings");
                  setSavingLivechat(false);
                },
              });
            }}
            disabled={savingLivechat}
            className="w-full sm:w-auto"
          >
            {savingLivechat ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Livechat Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
