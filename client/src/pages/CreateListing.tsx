import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumb } from "@/components/Breadcrumb";

type ListingVisibilityLevel = "public" | "registered_users" | "nda_required" | "seller_approval_required";

const LISTING_VISIBILITY_OPTIONS: Array<{
  value: ListingVisibilityLevel;
  label: string;
  description: string;
}> = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can view the full listing.",
  },
  {
    value: "registered_users",
    label: "Registered Users",
    description: "Only signed-in users can view the full listing.",
  },
  {
    value: "nda_required",
    label: "NDA Required",
    description: "Sensitive details stay hidden until a buyer signs an NDA.",
  },
  {
    value: "seller_approval_required",
    label: "Seller Approval Required",
    description: "Buyers must request access and be approved by you.",
  },
];

function visibilityToConfidentialityLevel(level: ListingVisibilityLevel): "public" | "nda" | "private" {
  switch (level) {
    case "nda_required":
      return "nda";
    case "seller_approval_required":
      return "private";
    case "public":
    case "registered_users":
    default:
      return "public";
  }
}

export default function CreateListing() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<number, string>>({});
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
    visibilityLevel: "seller_approval_required" as ListingVisibilityLevel,
    isAnonymous: false,
    ndaTemplateUrl: "",
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
  const { data: dynamicFieldDefs } = trpc.listingFieldValues.listDefinitionsForAssetType.useQuery(
    { assetTypeId: formData.assetTypeId ?? 0, subcategoryId: formData.subcategoryId ?? undefined },
    { enabled: formData.assetTypeId != null }
  );

  const createMutation = trpc.listing.create.useMutation({
    onSuccess: () => {
      toast.success("Your application has been submitted and is under review. Our team will be in touch shortly.");
      setLocation("/my-listings");
    },
    onError: (error) => {
      toast.error("Failed to submit application: " + error.message);
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
    
    const dynamicFields = Object.entries(dynamicFieldValues)
      .map(([id, val]) => ({ fieldDefinitionId: Number(id), value: val || null }));

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
      visibilityLevel: formData.visibilityLevel,
      confidentialityLevel: visibilityToConfidentialityLevel(formData.visibilityLevel),
      isAnonymous: formData.isAnonymous,
      ndaTemplateUrl: formData.ndaTemplateUrl || undefined,
      logoUrl: logoUrl || undefined,
      thumbnailUrl: formData.thumbnailUrl || undefined,
      verticalId: formData.verticalId,
      assetTypeId: formData.assetTypeId,
      subcategoryId: formData.subcategoryId,
      dynamicFields: dynamicFields.length > 0 ? dynamicFields : undefined,
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

  // Structured data for seller application page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Submit Listing Application - Acquisitions.market",
    "description": "Submit a confidential seller application for your iGaming or crypto asset."
  };

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <SEOHead
        pageKey="createListing"
        title="Submit Listing Application | Acquisitions.market"
        description="Submit a confidential seller application for your iGaming or crypto asset. Our team reviews every application."
        canonical="/create-listing"
        structuredData={structuredData}
      />
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <Breadcrumb items={[
            { label: "Marketplace", href: "/marketplace" },
            { label: "Submit Application" }
          ]} />
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Submit a Listing Application</h1>
            <p className="text-muted-foreground">
              Your application is confidential and will be reviewed by our team before going live.
            </p>
          </div>

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

              </CardContent>
            </Card>

            {/* Dynamic diligence fields — rendered when an asset type is selected */}
            {dynamicFieldDefs && dynamicFieldDefs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Diligence Information</CardTitle>
                  <CardDescription>Additional details specific to this asset type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dynamicFieldDefs.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`dyn-${field.id}`}>
                        {field.label}{field.required ? " *" : ""}
                      </Label>
                      {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      )}
                      {field.fieldType === "textarea" ? (
                        <Textarea
                          id={`dyn-${field.id}`}
                          required={field.required === 1}
                          rows={3}
                          value={dynamicFieldValues[field.id] ?? ""}
                          onChange={(e) => setDynamicFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        />
                      ) : field.fieldType === "boolean" ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`dyn-${field.id}`}
                            checked={dynamicFieldValues[field.id] === "true"}
                            onChange={(e) => setDynamicFieldValues(prev => ({ ...prev, [field.id]: e.target.checked ? "true" : "false" }))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                      ) : field.fieldType === "dropdown" ? (
                        <select
                          id={`dyn-${field.id}`}
                          required={field.required === 1}
                          value={dynamicFieldValues[field.id] ?? ""}
                          onChange={(e) => setDynamicFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select...</option>
                          {(field.options ? JSON.parse(field.options) as string[] : []).map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id={`dyn-${field.id}`}
                          type={field.fieldType === "number" || field.fieldType === "currency" || field.fieldType === "percentage" ? "number" : field.fieldType === "date" ? "date" : "text"}
                          required={field.required === 1}
                          value={dynamicFieldValues[field.id] ?? ""}
                          onChange={(e) => setDynamicFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        />
                      )}
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Privacy & Confidentiality Settings</CardTitle>
                <CardDescription>
                  Control who can view your listing and how your identity is displayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visibilityLevel">Listing Visibility *</Label>
                  <select
                    id="visibilityLevel"
                    value={formData.visibilityLevel}
                    onChange={(e) => setFormData({ ...formData, visibilityLevel: e.target.value as ListingVisibilityLevel })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {LISTING_VISIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground">
                    {LISTING_VISIBILITY_OPTIONS.find((option) => option.value === formData.visibilityLevel)?.description}
                  </p>
                </div>

                {formData.visibilityLevel === "nda_required" && (
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

            <div className="flex gap-4">
              <Button type="submit" size="lg" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for Review
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
