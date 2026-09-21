import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, Save } from "lucide-react";
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

  // 4th proof ribbon slot
  const [statConfidential, setStatConfidential] = useState("");
  const [statConfidentialLabel, setStatConfidentialLabel] = useState("");

  // Features Section form state
  const [featuresEyebrow, setFeaturesEyebrow] = useState("");
  const [featuresHeadline, setFeaturesHeadline] = useState("");
  const [featuresSubheadline, setFeaturesSubheadline] = useState("");
  const defaultFeatureCards = [
    { title: "Curated iGaming Opportunities", description: "Browse privately listed iGaming businesses, B2B technology platforms and affiliate, media and traffic assets — each manually reviewed before publication." },
    { title: "Qualified Buyers Only", description: "Each buyer completes a profile review before accessing confidential information. Sellers choose who sees their deal and when." },
    { title: "Confidential by Design", description: "NDA workflows and seller-controlled access protect sensitive financials and operating data throughout the process." },
    { title: "iGaming-Native Diligence", description: "Opportunities include iGaming-relevant context — licensing status, revenue model, traffic sources and regulatory exposure." },
    { title: "Direct Introductions", description: "Once access is granted, buyers and sellers communicate directly. No intermediated auction, no anonymous bidding." },
    { title: "External Advisors & Closing", description: "AM facilitates introductions and diligence access. Final negotiations and legal closing are handled by the parties and their own advisors." },
  ];
  const [featureCards, setFeatureCards] = useState<{ title: string; description: string }[]>(defaultFeatureCards);
  const [savingFeatures, setSavingFeatures] = useState(false);

  // How It Works Section form state
  const [howItWorksEyebrow, setHowItWorksEyebrow] = useState("");
  const [howItWorksHeadline, setHowItWorksHeadline] = useState("");
  const [howItWorksSubheadline, setHowItWorksSubheadline] = useState("");
  const defaultSellerSteps = [
    { title: "Submit Your Business", desc: "Share the key details about your iGaming business or asset. AM reviews every submission before it appears in the marketplace." },
    { title: "Manual Review", desc: "Our team reviews your listing for fit and completeness. Approved listings are published to qualified buyers." },
    { title: "Seller-Controlled Access", desc: "Choose what is visible publicly and what unlocks only after a buyer signs an NDA or you approve their request." },
    { title: "Qualified Introduction", desc: "When a serious buyer emerges, AM facilitates the introduction. Diligence and closing are handled by you and your advisors." },
  ];
  const defaultBuyerSteps = [
    { title: "Share Your Mandate", desc: "Tell us what you are looking for. Complete your buyer profile to unlock access to confidential listings." },
    { title: "Review Curated Opportunities", desc: "Browse iGaming businesses, B2B technology platforms and affiliate assets that fit your acquisition thesis." },
    { title: "Request Access", desc: "Sign an NDA or request seller approval to review confidential financials and operating data." },
    { title: "Engage Directly", desc: "Once access is granted, communicate directly with the seller. AM does not intermediate negotiations or handle closing." },
  ];
  const [sellerLabel, setSellerLabel] = useState("For Sellers");
  const [sellerSubtitle, setSellerSubtitle] = useState("List, get reviewed, exit on your terms");
  const [sellerSteps, setSellerSteps] = useState<{ title: string; desc: string }[]>(defaultSellerSteps);
  const [buyerLabel, setBuyerLabel] = useState("For Buyers");
  const [buyerSubtitle, setBuyerSubtitle] = useState("Qualify once, access curated opportunities");
  const [buyerSteps, setBuyerSteps] = useState<{ title: string; desc: string }[]>(defaultBuyerSteps);
  const [savingHowItWorks, setSavingHowItWorks] = useState(false);

  // CTA Section form state
  const [ctaEyebrow, setCtaEyebrow] = useState("");
  const [ctaHeadline, setCtaHeadline] = useState("");
  const [ctaDescription, setCtaDescription] = useState("");
  const [savingCta, setSavingCta] = useState(false);

  // Active Opportunities Section form state
  const [activeOpportunitiesHeadline, setActiveOpportunitiesHeadline] = useState("");
  const [activeOpportunitiesSubheadline, setActiveOpportunitiesSubheadline] = useState("");
  const [savingActiveOpportunities, setSavingActiveOpportunities] = useState(false);

  // Status Bar form state
  const [statusBarLiveLabel, setStatusBarLiveLabel] = useState("");
  const [statusBarActiveListingsLabel, setStatusBarActiveListingsLabel] = useState("");
  const [statusBarAccessLabel, setStatusBarAccessLabel] = useState("");
  const [statusBarAccessValue, setStatusBarAccessValue] = useState("");
  const [statusBarConfidentialTagline, setStatusBarConfidentialTagline] = useState("");
  const [savingStatusBar, setSavingStatusBar] = useState(false);

  // Hero Badges & Trust Strip form state
  const [heroBadge1Text, setHeroBadge1Text] = useState("");
  const [heroBadge2Text, setHeroBadge2Text] = useState("");
  const [heroTrust1Text, setHeroTrust1Text] = useState("");
  const [heroTrust2Text, setHeroTrust2Text] = useState("");
  const [heroTrust3Text, setHeroTrust3Text] = useState("");
  const [savingHeroBadges, setSavingHeroBadges] = useState(false);

  // CTA Buttons form state
  const [ctaBrowseListingsText, setCtaBrowseListingsText] = useState("");
  const [ctaBrowseListingsUrl, setCtaBrowseListingsUrl] = useState("");
  const [ctaListBusinessText, setCtaListBusinessText] = useState("");
  const [ctaListBusinessUrl, setCtaListBusinessUrl] = useState("");
  const [ctaSignUpText, setCtaSignUpText] = useState("");
  const [savingCtaButtons, setSavingCtaButtons] = useState(false);

  // Active Opportunities Extended form state
  const [activeOpportunitiesEyebrow, setActiveOpportunitiesEyebrow] = useState("");
  const [activeOpportunitiesEyebrowBadge, setActiveOpportunitiesEyebrowBadge] = useState("");
  const [activeOpportunitiesSubmitBtn, setActiveOpportunitiesSubmitBtn] = useState("");
  const [activeOpportunitiesMandateBtn, setActiveOpportunitiesMandateBtn] = useState("");
  const [activeOpportunitiesGhostCardsJson, setActiveOpportunitiesGhostCardsJson] = useState("");
  const [activeOpportunitiesViewListingBtn, setActiveOpportunitiesViewListingBtn] = useState("");
  const [activeOpportunitiesViewAllBtnText, setActiveOpportunitiesViewAllBtnText] = useState("");
  const [activeOpportunitiesFilterAllLabel, setActiveOpportunitiesFilterAllLabel] = useState("");
  const [savingActiveOpportunitiesExt, setSavingActiveOpportunitiesExt] = useState(false);

  // Hero Deal Card Empty State form state
  const [heroDealCardEmptyJson, setHeroDealCardEmptyJson] = useState("");
  const [heroDealCardCuratedLabel, setHeroDealCardCuratedLabel] = useState("");
  const [heroDealCardManuallyReviewedLabel, setHeroDealCardManuallyReviewedLabel] = useState("");
  const [savingHeroDealCard, setSavingHeroDealCard] = useState(false);

  // Navigation Labels form state
  const [navMarketplaceLabel, setNavMarketplaceLabel] = useState("");
  const [navBuyerMandatesLabel, setNavBuyerMandatesLabel] = useState("");
  const [navSellBusinessLabel, setNavSellBusinessLabel] = useState("");
  const [navHowItWorksLabel, setNavHowItWorksLabel] = useState("");
  const [navLoginLabel, setNavLoginLabel] = useState("");
  const [savingNavLabels, setSavingNavLabels] = useState(false);

  // Footer Content form state
  const [footerTagline, setFooterTagline] = useState("");
  const [footerDisclaimer, setFooterDisclaimer] = useState("");
  const [footerLinksJson, setFooterLinksJson] = useState("");
  const [footerCopyrightText, setFooterCopyrightText] = useState("");
  const [savingFooter, setSavingFooter] = useState(false);
  
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

      // Proof ribbon 4th slot
      setStatConfidential(settings.statConfidential || "");
      setStatConfidentialLabel(settings.statConfidentialLabel || "");

      // Features section
      setFeaturesEyebrow(settings.featuresEyebrow || "");
      setFeaturesHeadline(settings.featuresHeadline || "");
      setFeaturesSubheadline(settings.featuresSubheadline || "");
      if (settings.featureCardsJson) {
        try { setFeatureCards(JSON.parse(settings.featureCardsJson)); } catch (e) { /* malformed JSON — keep defaults */ }
      }

      // How It Works section
      setHowItWorksEyebrow(settings.howItWorksEyebrow || "");
      setHowItWorksHeadline(settings.howItWorksHeadline || "");
      setHowItWorksSubheadline(settings.howItWorksSubheadline || "");
      if (settings.howItWorksSellersJson) {
        try {
          const s = JSON.parse(settings.howItWorksSellersJson);
          if (s.label) setSellerLabel(s.label);
          if (s.subtitle) setSellerSubtitle(s.subtitle);
          if (s.steps) setSellerSteps(s.steps);
        } catch (e) { /* malformed JSON — keep defaults */ }
      }
      if (settings.howItWorksBuyersJson) {
        try {
          const b = JSON.parse(settings.howItWorksBuyersJson);
          if (b.label) setBuyerLabel(b.label);
          if (b.subtitle) setBuyerSubtitle(b.subtitle);
          if (b.steps) setBuyerSteps(b.steps);
        } catch (e) { /* malformed JSON — keep defaults */ }
      }

      // CTA section
      setCtaEyebrow(settings.ctaEyebrow || "");
      setCtaHeadline(settings.ctaHeadline || "");
      setCtaDescription(settings.ctaDescription || "");

      // Active Opportunities section
      setActiveOpportunitiesHeadline(settings.activeOpportunitiesHeadline || "");
      setActiveOpportunitiesSubheadline(settings.activeOpportunitiesSubheadline || "");

      // Status Bar
      setStatusBarLiveLabel(settings.statusBarLiveLabel || "");
      setStatusBarActiveListingsLabel(settings.statusBarActiveListingsLabel || "");
      setStatusBarAccessLabel(settings.statusBarAccessLabel || "");
      setStatusBarAccessValue(settings.statusBarAccessValue || "");
      setStatusBarConfidentialTagline(settings.statusBarConfidentialTagline || "");

      // Hero Badges & Trust Strip
      setHeroBadge1Text(settings.heroBadge1Text || "");
      setHeroBadge2Text(settings.heroBadge2Text || "");
      setHeroTrust1Text(settings.heroTrust1Text || "");
      setHeroTrust2Text(settings.heroTrust2Text || "");
      setHeroTrust3Text(settings.heroTrust3Text || "");

      // CTA Buttons
      setCtaBrowseListingsText(settings.ctaBrowseListingsText || "");
      setCtaBrowseListingsUrl(settings.ctaBrowseListingsUrl || "");
      setCtaListBusinessText(settings.ctaListBusinessText || "");
      setCtaListBusinessUrl(settings.ctaListBusinessUrl || "");
      setCtaSignUpText(settings.ctaSignUpText || "");

      // Active Opportunities Extended
      setActiveOpportunitiesEyebrow(settings.activeOpportunitiesEyebrow || "");
      setActiveOpportunitiesEyebrowBadge(settings.activeOpportunitiesEyebrowBadge || "");
      setActiveOpportunitiesSubmitBtn(settings.activeOpportunitiesSubmitBtn || "");
      setActiveOpportunitiesMandateBtn(settings.activeOpportunitiesMandateBtn || "");
      setActiveOpportunitiesGhostCardsJson(settings.activeOpportunitiesGhostCardsJson || "");
      setActiveOpportunitiesViewListingBtn(settings.activeOpportunitiesViewListingBtn || "");
      setActiveOpportunitiesViewAllBtnText(settings.activeOpportunitiesViewAllBtnText || "");
      setActiveOpportunitiesFilterAllLabel(settings.activeOpportunitiesFilterAllLabel || "");

      // Hero Deal Card
      setHeroDealCardEmptyJson(settings.heroDealCardEmptyJson || "");
      setHeroDealCardCuratedLabel(settings.heroDealCardCuratedLabel || "");
      setHeroDealCardManuallyReviewedLabel(settings.heroDealCardManuallyReviewedLabel || "");

      // Navigation Labels
      setNavMarketplaceLabel(settings.navMarketplaceLabel || "");
      setNavBuyerMandatesLabel(settings.navBuyerMandatesLabel || "");
      setNavSellBusinessLabel(settings.navSellBusinessLabel || "");
      setNavHowItWorksLabel(settings.navHowItWorksLabel || "");
      setNavLoginLabel(settings.navLoginLabel || "");

      // Footer
      setFooterTagline(settings.footerTagline || "");
      setFooterDisclaimer(settings.footerDisclaimer || "");
      setFooterLinksJson(settings.footerLinksJson || "");
      setFooterCopyrightText(settings.footerCopyrightText || "");
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

        try {
          // Upload via tRPC
          await updateLogo.mutateAsync({
            fileData: base64,
            fileName: file.name,
            mimeType: file.type,
          });
        } finally {
          setUploading(false);
        }
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
                  Displayed in the site header and branding areas. This does not change the browser tab icon.
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
              placeholder="/create-listing"
              value={heroPrimaryButtonUrl}
              onChange={(e) => setHeroPrimaryButtonUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The link destination for the primary button (e.g., /create-listing, /marketplace)
            </p>
          </div>

          {/* Secondary Button Text */}
          <div className="space-y-2">
            <Label htmlFor="heroSecondaryButtonText">Secondary Button Text</Label>
            <Input
              id="heroSecondaryButtonText"
              placeholder="Browse Opportunities"
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
              placeholder="/marketplace"
              value={heroSecondaryButtonUrl}
              onChange={(e) => setHeroSecondaryButtonUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The link destination for the secondary button (e.g., /buy-asset, /marketplace)
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

      {/* Proof Ribbon — 4th Slot (Confidential) */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Proof Ribbon — Confidential Slot</CardTitle>
          <CardDescription>
            The fourth slot in the proof ribbon below the hero. Defaults to "Confidential / By Design".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statConfidential">Value/Text</Label>
              <Input
                id="statConfidential"
                placeholder="Confidential"
                value={statConfidential}
                onChange={(e) => setStatConfidential(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statConfidentialLabel">Label</Label>
              <Input
                id="statConfidentialLabel"
                placeholder="By Design"
                value={statConfidentialLabel}
                onChange={(e) => setStatConfidentialLabel(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => {
              updateHeroContent.mutate({
                statConfidential: statConfidential || null,
                statConfidentialLabel: statConfidentialLabel || null,
              }, {
                onSuccess: () => toast.success("Confidential slot updated"),
                onError: (e) => toast.error(e.message || "Failed to save"),
              });
            }}
            className="w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Confidential Slot
          </Button>
        </CardContent>
      </Card>

      {/* Features Section */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Features Section</CardTitle>
          <CardDescription>
            The "Built for Private Deals" section below the listings feed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="featuresEyebrow">Eyebrow</Label>
            <Input
              id="featuresEyebrow"
              placeholder="Built for Private Deals"
              value={featuresEyebrow}
              onChange={(e) => setFeaturesEyebrow(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="featuresHeadline">Headline</Label>
            <Input
              id="featuresHeadline"
              placeholder="Built for Private iGaming Deals"
              value={featuresHeadline}
              onChange={(e) => setFeaturesHeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="featuresSubheadline">Subheadline</Label>
            <Textarea
              id="featuresSubheadline"
              placeholder="From curated sourcing to qualified introductions..."
              value={featuresSubheadline}
              onChange={(e) => setFeaturesSubheadline(e.target.value)}
              rows={2}
            />
          </div>

          <div className="pt-2 space-y-4">
            <p className="text-sm font-medium">Feature Cards (6 cards, icons stay fixed)</p>
            {featureCards.map((card, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <h4 className="font-medium text-sm">Card {i + 1}</h4>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder={defaultFeatureCards[i]?.title || "Card title"}
                    value={card.title}
                    onChange={(e) => {
                      const updated = [...featureCards];
                      updated[i] = { ...updated[i], title: e.target.value };
                      setFeatureCards(updated);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder={defaultFeatureCards[i]?.description || "Card description"}
                    value={card.description}
                    onChange={(e) => {
                      const updated = [...featureCards];
                      updated[i] = { ...updated[i], description: e.target.value };
                      setFeatureCards(updated);
                    }}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => {
              setSavingFeatures(true);
              updateHeroContent.mutate({
                featuresEyebrow: featuresEyebrow || null,
                featuresHeadline: featuresHeadline || null,
                featuresSubheadline: featuresSubheadline || null,
                featureCardsJson: JSON.stringify(featureCards),
              }, {
                onSuccess: () => { toast.success("Features section updated"); setSavingFeatures(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingFeatures(false); },
              });
            }}
            disabled={savingFeatures}
            className="w-full sm:w-auto"
          >
            {savingFeatures ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Features Section</>}
          </Button>
        </CardContent>
      </Card>

      {/* How It Works Section */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage How It Works Section</CardTitle>
          <CardDescription>
            Eyebrow, headline, subheadline, and the For Sellers / For Buyers steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="howItWorksEyebrow">Eyebrow</Label>
            <Input id="howItWorksEyebrow" placeholder="How It Works" value={howItWorksEyebrow} onChange={(e) => setHowItWorksEyebrow(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="howItWorksHeadline">Headline</Label>
            <Input id="howItWorksHeadline" placeholder="How AM Deals Get Done" value={howItWorksHeadline} onChange={(e) => setHowItWorksHeadline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="howItWorksSubheadline">Subheadline</Label>
            <Textarea id="howItWorksSubheadline" placeholder="Manually reviewed listings, confidential access..." value={howItWorksSubheadline} onChange={(e) => setHowItWorksSubheadline(e.target.value)} rows={2} />
          </div>

          <div className="pt-2 space-y-3">
            <p className="text-sm font-medium">For Sellers</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section Label</Label>
                <Input placeholder="For Sellers" value={sellerLabel} onChange={(e) => setSellerLabel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Input placeholder="List, get reviewed, exit on your terms" value={sellerSubtitle} onChange={(e) => setSellerSubtitle(e.target.value)} />
              </div>
            </div>
            {sellerSteps.map((step, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <h4 className="font-medium text-sm">Step {i + 1}</h4>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => {
                      const updated = [...sellerSteps];
                      updated[i] = { ...updated[i], title: e.target.value };
                      setSellerSteps(updated);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={step.desc}
                    onChange={(e) => {
                      const updated = [...sellerSteps];
                      updated[i] = { ...updated[i], desc: e.target.value };
                      setSellerSteps(updated);
                    }}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-3">
            <p className="text-sm font-medium">For Buyers</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section Label</Label>
                <Input placeholder="For Buyers" value={buyerLabel} onChange={(e) => setBuyerLabel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Input placeholder="Qualify once, access curated opportunities" value={buyerSubtitle} onChange={(e) => setBuyerSubtitle(e.target.value)} />
              </div>
            </div>
            {buyerSteps.map((step, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <h4 className="font-medium text-sm">Step {i + 1}</h4>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => {
                      const updated = [...buyerSteps];
                      updated[i] = { ...updated[i], title: e.target.value };
                      setBuyerSteps(updated);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={step.desc}
                    onChange={(e) => {
                      const updated = [...buyerSteps];
                      updated[i] = { ...updated[i], desc: e.target.value };
                      setBuyerSteps(updated);
                    }}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => {
              setSavingHowItWorks(true);
              updateHeroContent.mutate({
                howItWorksEyebrow: howItWorksEyebrow || null,
                howItWorksHeadline: howItWorksHeadline || null,
                howItWorksSubheadline: howItWorksSubheadline || null,
                howItWorksSellersJson: JSON.stringify({ label: sellerLabel, subtitle: sellerSubtitle, steps: sellerSteps }),
                howItWorksBuyersJson: JSON.stringify({ label: buyerLabel, subtitle: buyerSubtitle, steps: buyerSteps }),
              }, {
                onSuccess: () => { toast.success("How It Works updated"); setSavingHowItWorks(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingHowItWorks(false); },
              });
            }}
            disabled={savingHowItWorks}
            className="w-full sm:w-auto"
          >
            {savingHowItWorks ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save How It Works</>}
          </Button>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage CTA Section</CardTitle>
          <CardDescription>
            The call-to-action banner at the bottom of the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ctaEyebrow">Eyebrow</Label>
            <Input id="ctaEyebrow" placeholder="Ready to Start a Confidential Deal Process?" value={ctaEyebrow} onChange={(e) => setCtaEyebrow(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctaHeadline">Headline</Label>
            <Input id="ctaHeadline" placeholder="List an Asset or Share Your Acquisition Mandate" value={ctaHeadline} onChange={(e) => setCtaHeadline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctaDescription">Description</Label>
            <Textarea id="ctaDescription" placeholder="List an iGaming asset for acquisition, share your mandate, or explore what is currently available." value={ctaDescription} onChange={(e) => setCtaDescription(e.target.value)} rows={3} />
          </div>
          <Button
            onClick={() => {
              setSavingCta(true);
              updateHeroContent.mutate({
                ctaEyebrow: ctaEyebrow || null,
                ctaHeadline: ctaHeadline || null,
                ctaDescription: ctaDescription || null,
              }, {
                onSuccess: () => { toast.success("CTA section updated"); setSavingCta(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingCta(false); },
              });
            }}
            disabled={savingCta}
            className="w-full sm:w-auto"
          >
            {savingCta ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save CTA Section</>}
          </Button>
        </CardContent>
      </Card>

      {/* Active Opportunities Section */}
      <Card>
        <CardHeader>
          <CardTitle>Active Opportunities Section</CardTitle>
          <CardDescription>
            The heading and subheadline of the live listings feed on the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activeOpportunitiesHeadline">Headline</Label>
            <Input id="activeOpportunitiesHeadline" placeholder="Active Opportunities" value={activeOpportunitiesHeadline} onChange={(e) => setActiveOpportunitiesHeadline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activeOpportunitiesSubheadline">Subheadline</Label>
            <Textarea id="activeOpportunitiesSubheadline" placeholder="New iGaming businesses and assets published after manual review." value={activeOpportunitiesSubheadline} onChange={(e) => setActiveOpportunitiesSubheadline(e.target.value)} rows={2} />
          </div>
          <Button
            onClick={() => {
              setSavingActiveOpportunities(true);
              updateHeroContent.mutate({
                activeOpportunitiesHeadline: activeOpportunitiesHeadline || null,
                activeOpportunitiesSubheadline: activeOpportunitiesSubheadline || null,
              }, {
                onSuccess: () => { toast.success("Active Opportunities section updated"); setSavingActiveOpportunities(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingActiveOpportunities(false); },
              });
            }}
            disabled={savingActiveOpportunities}
            className="w-full sm:w-auto"
          >
            {savingActiveOpportunities ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Active Opportunities</>}
          </Button>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Status Bar</CardTitle>
          <CardDescription>The ticker bar at the top of the homepage showing marketplace status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusBarLiveLabel">Live Label</Label>
              <Input id="statusBarLiveLabel" placeholder="MARKETPLACE: LIVE" value={statusBarLiveLabel} onChange={(e) => setStatusBarLiveLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusBarActiveListingsLabel">Active Listings Label</Label>
              <Input id="statusBarActiveListingsLabel" placeholder="Active Listings:" value={statusBarActiveListingsLabel} onChange={(e) => setStatusBarActiveListingsLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusBarAccessLabel">Access Label</Label>
              <Input id="statusBarAccessLabel" placeholder="Access:" value={statusBarAccessLabel} onChange={(e) => setStatusBarAccessLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusBarAccessValue">Access Value</Label>
              <Input id="statusBarAccessValue" placeholder="Manual Review Only" value={statusBarAccessValue} onChange={(e) => setStatusBarAccessValue(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="statusBarConfidentialTagline">Confidential Tagline</Label>
              <Input id="statusBarConfidentialTagline" placeholder="Confidential by Design" value={statusBarConfidentialTagline} onChange={(e) => setStatusBarConfidentialTagline(e.target.value)} />
            </div>
          </div>
          <Button
            onClick={() => {
              setSavingStatusBar(true);
              updateHeroContent.mutate({
                statusBarLiveLabel: statusBarLiveLabel || null,
                statusBarActiveListingsLabel: statusBarActiveListingsLabel || null,
                statusBarAccessLabel: statusBarAccessLabel || null,
                statusBarAccessValue: statusBarAccessValue || null,
                statusBarConfidentialTagline: statusBarConfidentialTagline || null,
              }, {
                onSuccess: () => { toast.success("Status bar updated"); setSavingStatusBar(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingStatusBar(false); },
              });
            }}
            disabled={savingStatusBar}
            className="w-full sm:w-auto"
          >
            {savingStatusBar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Status Bar</>}
          </Button>
        </CardContent>
      </Card>

      {/* Hero Badges & Trust Strip */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Badges &amp; Trust Strip</CardTitle>
          <CardDescription>The two small badges below the hero headline and the three trust strip items.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroBadge1Text">Badge 1</Label>
              <Input id="heroBadge1Text" placeholder="Manually Reviewed Listings" value={heroBadge1Text} onChange={(e) => setHeroBadge1Text(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroBadge2Text">Badge 2</Label>
              <Input id="heroBadge2Text" placeholder="Confidential by Design" value={heroBadge2Text} onChange={(e) => setHeroBadge2Text(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroTrust1Text">Trust Strip Item 1</Label>
              <Input id="heroTrust1Text" placeholder="Seller-Controlled Access" value={heroTrust1Text} onChange={(e) => setHeroTrust1Text(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroTrust2Text">Trust Strip Item 2</Label>
              <Input id="heroTrust2Text" placeholder="Qualified Buyers Only" value={heroTrust2Text} onChange={(e) => setHeroTrust2Text(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroTrust3Text">Trust Strip Item 3</Label>
              <Input id="heroTrust3Text" placeholder="NDA-Gated Financials" value={heroTrust3Text} onChange={(e) => setHeroTrust3Text(e.target.value)} />
            </div>
          </div>
          <Button
            onClick={() => {
              setSavingHeroBadges(true);
              updateHeroContent.mutate({
                heroBadge1Text: heroBadge1Text || null,
                heroBadge2Text: heroBadge2Text || null,
                heroTrust1Text: heroTrust1Text || null,
                heroTrust2Text: heroTrust2Text || null,
                heroTrust3Text: heroTrust3Text || null,
              }, {
                onSuccess: () => { toast.success("Hero badges updated"); setSavingHeroBadges(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingHeroBadges(false); },
              });
            }}
            disabled={savingHeroBadges}
            className="w-full sm:w-auto"
          >
            {savingHeroBadges ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Badges &amp; Trust Strip</>}
          </Button>
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>CTA Buttons</CardTitle>
          <CardDescription>The call-to-action buttons in the hero and CTA sections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ctaBrowseListingsText">Browse Listings — Label</Label>
              <Input id="ctaBrowseListingsText" placeholder="Browse Listings" value={ctaBrowseListingsText} onChange={(e) => setCtaBrowseListingsText(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaBrowseListingsUrl">Browse Listings — URL</Label>
              <Input id="ctaBrowseListingsUrl" placeholder="/marketplace" value={ctaBrowseListingsUrl} onChange={(e) => setCtaBrowseListingsUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaListBusinessText">List Business — Label</Label>
              <Input id="ctaListBusinessText" placeholder="List Your Business" value={ctaListBusinessText} onChange={(e) => setCtaListBusinessText(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaListBusinessUrl">List Business — URL</Label>
              <Input id="ctaListBusinessUrl" placeholder="/create-listing" value={ctaListBusinessUrl} onChange={(e) => setCtaListBusinessUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaSignUpText">Sign Up Button Label</Label>
              <Input id="ctaSignUpText" placeholder="Sign Up Now" value={ctaSignUpText} onChange={(e) => setCtaSignUpText(e.target.value)} />
            </div>
          </div>
          <Button
            onClick={() => {
              setSavingCtaButtons(true);
              updateHeroContent.mutate({
                ctaBrowseListingsText: ctaBrowseListingsText || null,
                ctaBrowseListingsUrl: ctaBrowseListingsUrl || null,
                ctaListBusinessText: ctaListBusinessText || null,
                ctaListBusinessUrl: ctaListBusinessUrl || null,
                ctaSignUpText: ctaSignUpText || null,
              }, {
                onSuccess: () => { toast.success("CTA buttons updated"); setSavingCtaButtons(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingCtaButtons(false); },
              });
            }}
            disabled={savingCtaButtons}
            className="w-full sm:w-auto"
          >
            {savingCtaButtons ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save CTA Buttons</>}
          </Button>
        </CardContent>
      </Card>

      {/* Active Opportunities Extended */}
      <Card>
        <CardHeader>
          <CardTitle>Active Opportunities — Extended</CardTitle>
          <CardDescription>Eyebrow labels, empty-state buttons, and ghost card placeholders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activeOpportunitiesEyebrow">Eyebrow Label</Label>
              <Input id="activeOpportunitiesEyebrow" placeholder="Curated Deal Flow" value={activeOpportunitiesEyebrow} onChange={(e) => setActiveOpportunitiesEyebrow(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activeOpportunitiesEyebrowBadge">Eyebrow Badge</Label>
              <Input id="activeOpportunitiesEyebrowBadge" placeholder="Manually Reviewed" value={activeOpportunitiesEyebrowBadge} onChange={(e) => setActiveOpportunitiesEyebrowBadge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activeOpportunitiesSubmitBtn">Submit Button Label</Label>
              <Input id="activeOpportunitiesSubmitBtn" placeholder="Submit a Business" value={activeOpportunitiesSubmitBtn} onChange={(e) => setActiveOpportunitiesSubmitBtn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activeOpportunitiesMandateBtn">Mandate Button Label</Label>
              <Input id="activeOpportunitiesMandateBtn" placeholder="Share Your Mandate" value={activeOpportunitiesMandateBtn} onChange={(e) => setActiveOpportunitiesMandateBtn(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="activeOpportunitiesGhostCardsJson">Ghost Cards JSON</Label>
              <Textarea
                id="activeOpportunitiesGhostCardsJson"
                placeholder={'[{"type":"iGaming Operator","region":"Malta / Gibraltar","badge":"NDA Required"}]'}
                value={activeOpportunitiesGhostCardsJson}
                onChange={(e) => setActiveOpportunitiesGhostCardsJson(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">JSON array of ghost cards shown when no listings exist. Each item: type, region, badge. The <code>type</code> values also populate the disabled filter pills in the empty state.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activeOpportunitiesFilterAllLabel">Filter "All" Label</Label>
              <Input id="activeOpportunitiesFilterAllLabel" placeholder="All" value={activeOpportunitiesFilterAllLabel} onChange={(e) => setActiveOpportunitiesFilterAllLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activeOpportunitiesViewListingBtn">View Listing Button</Label>
              <Input id="activeOpportunitiesViewListingBtn" placeholder="View Listing" value={activeOpportunitiesViewListingBtn} onChange={(e) => setActiveOpportunitiesViewListingBtn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activeOpportunitiesViewAllBtnText">View All Listings Button</Label>
              <Input id="activeOpportunitiesViewAllBtnText" placeholder="View All {count} Listings" value={activeOpportunitiesViewAllBtnText} onChange={(e) => setActiveOpportunitiesViewAllBtnText(e.target.value)} />
              <p className="text-xs text-muted-foreground">Use <code>{"{count}"}</code> as a placeholder for the live listing count.</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setSavingActiveOpportunitiesExt(true);
              updateHeroContent.mutate({
                activeOpportunitiesEyebrow: activeOpportunitiesEyebrow || null,
                activeOpportunitiesEyebrowBadge: activeOpportunitiesEyebrowBadge || null,
                activeOpportunitiesSubmitBtn: activeOpportunitiesSubmitBtn || null,
                activeOpportunitiesMandateBtn: activeOpportunitiesMandateBtn || null,
                activeOpportunitiesGhostCardsJson: activeOpportunitiesGhostCardsJson || null,
                activeOpportunitiesViewListingBtn: activeOpportunitiesViewListingBtn || null,
                activeOpportunitiesViewAllBtnText: activeOpportunitiesViewAllBtnText || null,
                activeOpportunitiesFilterAllLabel: activeOpportunitiesFilterAllLabel || null,
              }, {
                onSuccess: () => { toast.success("Active Opportunities extended settings updated"); setSavingActiveOpportunitiesExt(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingActiveOpportunitiesExt(false); },
              });
            }}
            disabled={savingActiveOpportunitiesExt}
            className="w-full sm:w-auto"
          >
            {savingActiveOpportunitiesExt ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Extended Settings</>}
          </Button>
        </CardContent>
      </Card>

      {/* Hero Deal Card Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Deal Card</CardTitle>
          <CardDescription>Labels and empty-state copy for the featured deal card in the hero section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroDealCardCuratedLabel">Curated Label (live card)</Label>
              <Input id="heroDealCardCuratedLabel" placeholder="Curated Opportunity" value={heroDealCardCuratedLabel} onChange={(e) => setHeroDealCardCuratedLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroDealCardManuallyReviewedLabel">Manually Reviewed Label</Label>
              <Input id="heroDealCardManuallyReviewedLabel" placeholder="Manually Reviewed" value={heroDealCardManuallyReviewedLabel} onChange={(e) => setHeroDealCardManuallyReviewedLabel(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="heroDealCardEmptyJson">Empty State JSON</Label>
              <Textarea
                id="heroDealCardEmptyJson"
                placeholder={'{"title":"Confidential iGaming Asset","category":"iGaming Operator","region":"Europe","description":"...","shareMandateBtn":"Share Mandate","submitBusinessBtn":"Submit a Business","viewListingBtn":"View Listing"}'}
                value={heroDealCardEmptyJson}
                onChange={(e) => setHeroDealCardEmptyJson(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">JSON object overriding empty-state card fields. Omitted keys use built-in defaults.</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setSavingHeroDealCard(true);
              updateHeroContent.mutate({
                heroDealCardCuratedLabel: heroDealCardCuratedLabel || null,
                heroDealCardManuallyReviewedLabel: heroDealCardManuallyReviewedLabel || null,
                heroDealCardEmptyJson: heroDealCardEmptyJson || null,
              }, {
                onSuccess: () => { toast.success("Hero Deal Card updated"); setSavingHeroDealCard(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingHeroDealCard(false); },
              });
            }}
            disabled={savingHeroDealCard}
            className="w-full sm:w-auto"
          >
            {savingHeroDealCard ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Hero Deal Card</>}
          </Button>
        </CardContent>
      </Card>

      {/* Navigation Labels */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Labels</CardTitle>
          <CardDescription>Text labels for the main navigation menu (desktop and mobile).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="navMarketplaceLabel">Marketplace Link</Label>
              <Input id="navMarketplaceLabel" placeholder="Marketplace" value={navMarketplaceLabel} onChange={(e) => setNavMarketplaceLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="navBuyerMandatesLabel">Buyer Mandates Link</Label>
              <Input id="navBuyerMandatesLabel" placeholder="Buyer Mandates" value={navBuyerMandatesLabel} onChange={(e) => setNavBuyerMandatesLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="navSellBusinessLabel">Sell a Business Link</Label>
              <Input id="navSellBusinessLabel" placeholder="Sell a Business" value={navSellBusinessLabel} onChange={(e) => setNavSellBusinessLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="navHowItWorksLabel">How It Works Link</Label>
              <Input id="navHowItWorksLabel" placeholder="How It Works" value={navHowItWorksLabel} onChange={(e) => setNavHowItWorksLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="navLoginLabel">Login Button</Label>
              <Input id="navLoginLabel" placeholder="Login" value={navLoginLabel} onChange={(e) => setNavLoginLabel(e.target.value)} />
            </div>
          </div>
          <Button
            onClick={() => {
              setSavingNavLabels(true);
              updateHeroContent.mutate({
                navMarketplaceLabel: navMarketplaceLabel || null,
                navBuyerMandatesLabel: navBuyerMandatesLabel || null,
                navSellBusinessLabel: navSellBusinessLabel || null,
                navHowItWorksLabel: navHowItWorksLabel || null,
                navLoginLabel: navLoginLabel || null,
              }, {
                onSuccess: () => { toast.success("Navigation labels updated"); setSavingNavLabels(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingNavLabels(false); },
              });
            }}
            disabled={savingNavLabels}
            className="w-full sm:w-auto"
          >
            {savingNavLabels ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Navigation Labels</>}
          </Button>
        </CardContent>
      </Card>

      {/* Footer Content */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Content</CardTitle>
          <CardDescription>The brand tagline and legal disclaimer shown in the footer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footerTagline">Brand Tagline</Label>
            <Input id="footerTagline" placeholder="Curated M&A marketplace for crypto-friendly iGaming businesses and assets." value={footerTagline} onChange={(e) => setFooterTagline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerDisclaimer">Disclaimer Text</Label>
            <Textarea
              id="footerDisclaimer"
              placeholder="[Site Name] is a technology marketplace, not a broker-dealer..."
              value={footerDisclaimer}
              onChange={(e) => setFooterDisclaimer(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Shown after "DISCLAIMER:" in the footer. Leave blank to use the built-in default.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerLinksJson">Footer Link Columns (JSON)</Label>
            <Textarea
              id="footerLinksJson"
              placeholder={'{"columns":[{"heading":"Marketplace","links":[{"label":"Browse Deals","href":"/marketplace"}]}],"legalHeading":"Legal"}'}
              value={footerLinksJson}
              onChange={(e) => setFooterLinksJson(e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">JSON with <code>columns</code> array (each: heading, links[]) and optional <code>legalHeading</code>. Leave blank to use built-in defaults.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerCopyrightText">Copyright Text</Label>
            <Input id="footerCopyrightText" placeholder="All rights reserved." value={footerCopyrightText} onChange={(e) => setFooterCopyrightText(e.target.value)} />
            <p className="text-xs text-muted-foreground">Shown after "© {new Date().getFullYear()} [Site Name]." in the footer.</p>
          </div>
          <Button
            onClick={() => {
              setSavingFooter(true);
              updateHeroContent.mutate({
                footerTagline: footerTagline || null,
                footerDisclaimer: footerDisclaimer || null,
                footerLinksJson: footerLinksJson || null,
                footerCopyrightText: footerCopyrightText || null,
              }, {
                onSuccess: () => { toast.success("Footer content updated"); setSavingFooter(false); },
                onError: (e) => { toast.error(e.message || "Failed to save"); setSavingFooter(false); },
              });
            }}
            disabled={savingFooter}
            className="w-full sm:w-auto"
          >
            {savingFooter ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Footer Content</>}
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
