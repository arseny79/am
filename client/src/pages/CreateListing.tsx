import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, Check, Upload, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { VerificationRequired } from "@/components/VerificationRequired";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useKYCGating } from "@/components/KYCGatingModal";

export default function CreateListing() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    location: "",
    yearFounded: "",
    employeeCount: "",
    monthlyRecurringRevenue: "",
    annualRevenue: "",
    ebitda: "",
    ebitdaMargin: "",
    clientCount: "",
    averageClientValue: "",
    clientRetentionRate: "",
    serviceMix: "",
    primaryRMM: "",
    primaryPSA: "",
    otherTools: "",
    askingPrice: "",
    description: "",
    keyStrengths: "",
    growthOpportunities: "",
    confidentialityLevel: "public" as "public" | "nda" | "private",
    isAnonymous: false,
    ndaTemplateUrl: "",
    serviceCategory: "" as "managed_security" | "cloud_services" | "infrastructure" | "helpdesk" | "backup_dr" | "application_mgmt" | "consulting" | "telecommunications" | "other" | "",
    industryVertical: "" as "healthcare" | "financial_services" | "legal" | "education" | "manufacturing" | "professional_services" | "retail_ecommerce" | "nonprofit" | "government" | "general_smb" | "",
    listingTier: "standard" as "standard" | "featured" | "premium",
    logoUrl: "",
    thumbnailUrl: "",
    verticalId: null as number | null,
    assetTypeId: null as number | null,
    subcategoryId: null as number | null,
  });

  const { data: verticals } = trpc.taxonomy.listVerticals.useQuery();
  const { data: assetTypes } = trpc.taxonomy.listAssetTypes.useQuery(
    { verticalId: formData.verticalId ?? undefined },
    { enabled: formData.verticalId != null }
  );
  const { data: subcategories } = trpc.taxonomy.listSubcategories.useQuery(
    { assetTypeId: formData.assetTypeId ?? 0 },
    { enabled: formData.assetTypeId != null }
  );

  const createCheckoutMutation = trpc.stripe.createListingFeeCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to payment...");
        // Redirect to Stripe checkout (same tab for better UX)
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error("Failed to create checkout: " + error.message);
    },
  });

  const { handleError: handleKYCError, GatingModal } = useKYCGating();

  const createMutation = trpc.listing.create.useMutation({
    onSuccess: (listing) => {
      // For standard (free) tier, redirect immediately
      if (formData.listingTier === "standard") {
        toast.success("Listing created successfully!");
        setLocation("/my-listings");
      } else {
        // For paid tiers, create checkout with listing_id
        toast.success("Listing created! Redirecting to payment...");
        createCheckoutMutation.mutate({
          tier: formData.listingTier,
          listingId: listing.id,
        });
      }
    },
    onError: (error) => {
      // Check if this is a KYC gating error
      if (!handleKYCError(error, "create a listing")) {
        toast.error("Failed to create listing: " + error.message);
      }
    },
  });

  const logoUploadMutation = trpc.logoUpload.uploadLogo.useMutation({
    onSuccess: (data) => {
      setFormData({ ...formData, logoUrl: data.url });
      setUploadingLogo(false);
    },
    onError: (error) => {
      toast.error("Failed to upload logo: " + error.message);
      setUploadingLogo(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload logo first if provided
    let logoUrl = formData.logoUrl;
    if (logoFile && !formData.logoUrl) {
      setUploadingLogo(true);
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.readAsDataURL(logoFile);
        });
        
        const base64Data = await base64Promise;
        const result = await logoUploadMutation.mutateAsync({
          fileName: logoFile.name,
          fileData: base64Data,
          mimeType: logoFile.type,
        });
        logoUrl = result.url;
      } catch (error) {
        toast.error("Failed to upload logo");
        setUploadingLogo(false);
        return;
      }
      setUploadingLogo(false);
    }
    
    // Create the listing first (in draft mode for paid tiers)
    // The onSuccess handler will create the checkout session with listing_id
    createMutation.mutate({
      businessName: formData.businessName,
      location: formData.location,
      yearFounded: formData.yearFounded ? parseInt(formData.yearFounded) : undefined,
      employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
      monthlyRecurringRevenue: parseInt(formData.monthlyRecurringRevenue),
      annualRevenue: parseInt(formData.annualRevenue),
      ebitda: parseInt(formData.ebitda),
      ebitdaMargin: formData.ebitdaMargin ? parseInt(formData.ebitdaMargin) : undefined,
      clientCount: parseInt(formData.clientCount),
      averageClientValue: formData.averageClientValue ? parseInt(formData.averageClientValue) : undefined,
      clientRetentionRate: formData.clientRetentionRate ? parseInt(formData.clientRetentionRate) : undefined,
      serviceMix: formData.serviceMix || undefined,
      primaryRMM: formData.primaryRMM || undefined,
      primaryPSA: formData.primaryPSA || undefined,
      otherTools: formData.otherTools || undefined,
      askingPrice: formData.askingPrice ? parseInt(formData.askingPrice) : undefined,
      description: formData.description,
      keyStrengths: formData.keyStrengths || undefined,
      growthOpportunities: formData.growthOpportunities || undefined,
      confidentialityLevel: formData.confidentialityLevel,
      isAnonymous: formData.isAnonymous,
      ndaTemplateUrl: formData.ndaTemplateUrl || undefined,
      serviceCategory: formData.serviceCategory || undefined,
      industryVertical: formData.industryVertical || undefined,
      listingTier: formData.listingTier,
      logoUrl: logoUrl || undefined,
      thumbnailUrl: formData.thumbnailUrl || undefined,
      verticalId: formData.verticalId,
      assetTypeId: formData.assetTypeId,
      subcategoryId: formData.subcategoryId,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to create a listing</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  // Structured data for create listing page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Create Listing - Acquisitions.market",
    "description": "List a digital asset, online business, or acquisition opportunity for qualified buyers."
  };

  return (
    <>
      <GatingModal />
      <div className="min-h-screen flex flex-col">
        <SEOHead
        title="Create Listing | Acquisitions.market"
        description="List a digital asset, online business, or acquisition opportunity for qualified buyers."
        canonical="https://acquisitions.market/create-listing"
        structuredData={structuredData}
      />
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <Breadcrumb items={[
            { label: "Marketplace", href: "/marketplace" },
            { label: "Create Listing" }
          ]} />
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
            <p className="text-muted-foreground">
              List a digital asset, online business, or acquisition opportunity for qualified buyers
            </p>
          </div>

          {/* Show KYC requirement if user is not verified */}
          {user && !user.kycVerified && (
            <VerificationRequired 
              action="create a listing" 
              className="mb-8"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell buyers what you are offering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Brand / Project Logo (Optional)</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-border overflow-hidden">
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                            setFormData({ ...formData, logoUrl: "" });
                          }}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLogoFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLogoPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        disabled={uploadingLogo}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, WebP, or SVG. Max 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Asset / Business Name *</Label>
                    <Input
                      id="businessName"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country (e.g., Tallinn, Estonia or Boston, USA)"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearFounded">Year Founded</Label>
                    <Input
                      id="yearFounded"
                      type="number"
                      min="1900"
                      max="2099"
                      step="1"
                      value={formData.yearFounded}
                      onChange={(e) => setFormData({ ...formData, yearFounded: e.target.value })}
                      placeholder="2010"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Team Size</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      min="0"
                      max="100000"
                      step="1"
                      value={formData.employeeCount}
                      onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Metrics</CardTitle>
                <CardDescription>Key financial performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="annualRevenue">Annual Revenue ($) *</Label>
                    <Input
                      id="annualRevenue"
                      type="number"
                      min="0"
                      max="999999999"
                      step="1000"
                      required
                      value={formData.annualRevenue}
                      onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRecurringRevenue">Monthly Recurring Revenue ($) *</Label>
                    <Input
                      id="monthlyRecurringRevenue"
                      type="number"
                      min="0"
                      max="999999999"
                      step="1000"
                      required
                      value={formData.monthlyRecurringRevenue}
                      onChange={(e) => setFormData({ ...formData, monthlyRecurringRevenue: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ebitda">EBITDA ($) *</Label>
                    <Input
                      id="ebitda"
                      type="number"
                      min="0"
                      max="999999999"
                      step="1000"
                      required
                      value={formData.ebitda}
                      onChange={(e) => setFormData({ ...formData, ebitda: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="askingPrice">Asking Price ($)</Label>
                    <Input
                      id="askingPrice"
                      type="number"
                      min="0"
                      max="999999999"
                      step="1000"
                      value={formData.askingPrice}
                      onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience / Customer Base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientCount">Number of Customers / Users *</Label>
                    <Input
                      id="clientCount"
                      type="number"
                      min="0"
                      max="100000"
                      step="1"
                      required
                      value={formData.clientCount}
                      onChange={(e) => setFormData({ ...formData, clientCount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientRetentionRate">Client Retention Rate (%)</Label>
                    <Input
                      id="clientRetentionRate"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.clientRetentionRate}
                      onChange={(e) => setFormData({ ...formData, clientRetentionRate: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Business Description *</Label>
                  <Textarea
                    id="description"
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the asset or business, what it does, who it serves, and why it is attractive to an acquirer."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Categorization</CardTitle>
                <CardDescription>Help buyers understand what kind of asset or business this is</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="verticalId">Market Vertical</Label>
                    <select
                      id="verticalId"
                      value={formData.verticalId ?? ""}
                      onChange={(e) => {
                        const verticalId = e.target.value ? Number(e.target.value) : null;
                        setFormData({ ...formData, verticalId, assetTypeId: null, subcategoryId: null });
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select vertical...</option>
                      {(verticals ?? []).map((vertical) => (
                        <option key={vertical.id} value={vertical.id}>{vertical.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetTypeId">Asset Type</Label>
                    <select
                      id="assetTypeId"
                      value={formData.assetTypeId ?? ""}
                      onChange={(e) => {
                        const assetTypeId = e.target.value ? Number(e.target.value) : null;
                        setFormData({ ...formData, assetTypeId, subcategoryId: null });
                      }}
                      disabled={formData.verticalId == null}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      <option value="">Select asset type...</option>
                      {(assetTypes ?? []).map((assetType) => (
                        <option key={assetType.id} value={assetType.id}>{assetType.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategoryId">Subcategory</Label>
                    <select
                      id="subcategoryId"
                      value={formData.subcategoryId ?? ""}
                      onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value ? Number(e.target.value) : null })}
                      disabled={formData.assetTypeId == null}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      <option value="">Select subcategory...</option>
                      {(subcategories ?? []).map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceCategory">Primary Service Category</Label>
                    <select
                      id="serviceCategory"
                      value={formData.serviceCategory}
                      onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value as any })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a category...</option>
                      <option value="managed_security">Managed Security Services (MSSP)</option>
                      <option value="cloud_services">Cloud Services</option>
                      <option value="infrastructure">Infrastructure Management</option>
                      <option value="helpdesk">Help Desk & Support</option>
                      <option value="backup_dr">Backup & Disaster Recovery</option>
                      <option value="application_mgmt">Application Management</option>
                      <option value="consulting">Consulting & Strategy</option>
                      <option value="telecommunications">Telecommunications</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industryVertical">Industry Vertical</Label>
                    <select
                      id="industryVertical"
                      value={formData.industryVertical}
                      onChange={(e) => setFormData({ ...formData, industryVertical: e.target.value as any })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a vertical...</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="financial_services">Financial Services</option>
                      <option value="legal">Legal</option>
                      <option value="education">Education</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="professional_services">Professional Services</option>
                      <option value="retail_ecommerce">Retail & E-commerce</option>
                      <option value="nonprofit">Non-profit</option>
                      <option value="government">Government/Public Sector</option>
                      <option value="general_smb">General SMB</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy & Confidentiality Settings</CardTitle>
                <CardDescription>
                  Control who can view your listing and how your identity is displayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confidentialityLevel">Confidentiality Level *</Label>
                  <select
                    id="confidentialityLevel"
                    value={formData.confidentialityLevel}
                    onChange={(e) => setFormData({ ...formData, confidentialityLevel: e.target.value as "public" | "nda" | "private" })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="public">Public - Anyone can view all details</option>
                    <option value="nda">NDA Required - Buyers must sign NDA to view confidential information</option>
                    <option value="private">Private - Buyers must request access and be approved by you</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    {formData.confidentialityLevel === "public" && "All listing details will be visible to anyone browsing the marketplace."}
                    {formData.confidentialityLevel === "nda" && "Buyers will need to sign an NDA before viewing sensitive financial and client information."}
                    {formData.confidentialityLevel === "private" && "Buyers must submit an access request with their information, which you can approve or decline."}
                  </p>
                </div>

                {formData.confidentialityLevel === "nda" && (
                  <div className="space-y-2">
                    <Label htmlFor="ndaTemplateUrl">Custom NDA Template URL (Optional)</Label>
                    <Input
                      id="ndaTemplateUrl"
                      type="url"
                      value={formData.ndaTemplateUrl}
                      onChange={(e) => setFormData({ ...formData, ndaTemplateUrl: e.target.value })}
                      placeholder="https://example.com/my-nda-template.pdf"
                    />
                    <p className="text-sm text-muted-foreground">
                      If provided, buyers can download and sign your custom NDA. Otherwise, our standard NDA will be used.
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isAnonymous" className="font-normal cursor-pointer">
                    List anonymously (your name will not be shown to buyers)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Tier Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Listing Tier</CardTitle>
                <CardDescription>
                  Select the tier that best fits your needs. Higher tiers offer better visibility and lower success fees.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Basic Tier */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.listingTier === "standard"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setFormData({ ...formData, listingTier: "standard" })}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">Standard</h3>
                      {formData.listingTier === "standard" && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">FREE</div>
                    <div className="text-sm text-muted-foreground mb-3">3% success fee only</div>
                    <ul className="text-sm space-y-1">
                      <li>• 30-day listing duration</li>
                      <li>• Standard visibility</li>
                      <li>• Valuation calculator</li>
                      <li>• Basic messaging</li>
                      <li>• NDA management</li>
                    </ul>
                  </div>

                  {/* Featured Tier */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${
                      formData.listingTier === "featured"
                        ? "border-primary bg-primary/5 scale-105"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setFormData({ ...formData, listingTier: "featured" })}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-semibold">
                      Recommended
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">Featured</h3>
                      {formData.listingTier === "featured" && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">$99/week</div>
                    <div className="text-sm text-muted-foreground mb-3">3% success fee only</div>
                    <ul className="text-sm space-y-1">
                      <li>• 90-day listing duration</li>
                      <li>• All Standard features</li>
                      <li>• Featured placement</li>
                      <li>• Homepage showcase</li>
                      <li>• Priority support</li>
                      <li>• Buyer analytics</li>
                    </ul>
                  </div>

                  {/* Premium Tier */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.listingTier === "premium"
                        ? "border-amber-500 bg-amber-50"
                        : "border-border hover:border-amber-500/50"
                    }`}
                    onClick={() => setFormData({ ...formData, listingTier: "premium" })}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">Premium Featured</h3>
                      {formData.listingTier === "premium" && (
                        <Check className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div className="text-2xl font-bold text-amber-600 mb-1">$249/week</div>
                    <div className="text-sm text-muted-foreground mb-3">3% success fee only</div>
                    <ul className="text-sm space-y-1">
                      <li>• All Featured features</li>
                      <li>• Custom thumbnail image</li>
                      <li>• Premium badge</li>
                      <li>• Top carousel priority</li>
                      <li>• Priority email support</li>
                      <li>• Maximum visibility</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  Success fees are only paid when your business sells. <Link href="/pricing" className="text-primary hover:underline">View detailed pricing</Link>
                </div>
              </CardContent>
            </Card>

            {/* Premium Thumbnail Upload (only shown for Premium tier) */}
            {formData.listingTier === "premium" && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Thumbnail Image</CardTitle>
                  <CardDescription>
                    Upload a custom thumbnail for your Premium listing. This image will be displayed in the homepage carousel. Recommended size: 1200x630px (JPG, PNG, or WebP, max 5MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="thumbnail-upload"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Thumbnail must be less than 5MB");
                              return;
                            }
                            setThumbnailFile(file);
                            // Create preview
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, thumbnailUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label htmlFor="thumbnail-upload">
                        <Button type="button" variant="outline" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Choose Thumbnail
                          </span>
                        </Button>
                      </label>
                      {formData.thumbnailUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({ ...formData, thumbnailUrl: "" });
                            setThumbnailFile(null);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                    {formData.thumbnailUrl && (
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={formData.thumbnailUrl}
                          alt="Thumbnail preview"
                          className="w-full h-auto max-h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button type="submit" size="lg" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Listing
              </Button>
              <Link href="/my-listings">
                <Button type="button" variant="outline" size="lg">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  </>
  );
}
