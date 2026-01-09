import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, X, Save, EyeOff, User } from "lucide-react";
import { toast } from "sonner";

interface ListingEditFormProps {
  listing: {
    id: number;
    businessName: string;
    location: string;
    yearFounded?: number | null;
    employeeCount?: number | null;
    monthlyRecurringRevenue: number;
    annualRevenue: number;
    ebitda: number;
    ebitdaMargin?: number | null;
    clientCount: number;
    averageClientValue?: number | null;
    clientRetentionRate?: number | null;
    serviceMix?: string | null;
    primaryRmm?: string | null;
    primaryPsa?: string | null;
    otherTools?: string | null;
    askingPrice?: number | null;
    description: string;
    keyStrengths?: string | null;
    growthOpportunities?: string | null;
    confidentialityLevel?: string | null;
    isAnonymous?: number | null;
    primaryServiceCategory?: string | null;
    industryVertical?: string | null;
    logoUrl?: string | null;
  };
  onSuccess?: () => void;
}

export function ListingEditForm({ listing, onSuccess }: ListingEditFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(listing.logoUrl || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    businessName: listing.businessName || "",
    location: listing.location || "",
    yearFounded: listing.yearFounded?.toString() || "",
    employeeCount: listing.employeeCount?.toString() || "",
    monthlyRecurringRevenue: listing.monthlyRecurringRevenue?.toString() || "",
    annualRevenue: listing.annualRevenue?.toString() || "",
    ebitda: listing.ebitda?.toString() || "",
    ebitdaMargin: listing.ebitdaMargin?.toString() || "",
    clientCount: listing.clientCount?.toString() || "",
    averageClientValue: listing.averageClientValue?.toString() || "",
    clientRetentionRate: listing.clientRetentionRate?.toString() || "",
    serviceMix: listing.serviceMix || "",
    primaryRMM: listing.primaryRmm || "",
    primaryPSA: listing.primaryPsa || "",
    otherTools: listing.otherTools || "",
    askingPrice: listing.askingPrice?.toString() || "",
    description: listing.description || "",
    keyStrengths: listing.keyStrengths || "",
    growthOpportunities: listing.growthOpportunities || "",
    confidentialityLevel: (listing.confidentialityLevel as "public" | "nda" | "private") || "public",
    isAnonymous: listing.isAnonymous === 1,
    serviceCategory: (listing.primaryServiceCategory as any) || "",
    industryVertical: (listing.industryVertical as any) || "",
    logoUrl: listing.logoUrl || "",
  });

  const updateMutation = trpc.listing.update.useMutation({
    onSuccess: () => {
      toast.success("Listing updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to update listing: " + error.message);
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
    
    // Upload logo first if a new one was selected
    let logoUrl = formData.logoUrl;
    if (logoFile) {
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
    
    // Update the listing
    updateMutation.mutate({
      id: listing.id,
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
      serviceCategory: formData.serviceCategory || undefined,
      industryVertical: formData.industryVertical || undefined,
      logoUrl: logoUrl || undefined,
    });
  };

  const isLoading = updateMutation.isPending || uploadingLogo;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core details about your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
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
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WebP, or SVG. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
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
              <Label htmlFor="employeeCount">Number of Employees</Label>
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

      {/* Financial Metrics */}
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
              <Label htmlFor="ebitdaMargin">EBITDA Margin (%)</Label>
              <Input
                id="ebitdaMargin"
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.ebitdaMargin}
                onChange={(e) => setFormData({ ...formData, ebitdaMargin: e.target.value })}
              />
            </div>
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
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Details about your client base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientCount">Number of Clients *</Label>
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
              <Label htmlFor="averageClientValue">Average Client Value ($)</Label>
              <Input
                id="averageClientValue"
                type="number"
                min="0"
                max="9999999"
                step="100"
                value={formData.averageClientValue}
                onChange={(e) => setFormData({ ...formData, averageClientValue: e.target.value })}
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

      {/* Services & Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Services & Tools</CardTitle>
          <CardDescription>Technology stack and service offerings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryRMM">Primary RMM Tool</Label>
              <Input
                id="primaryRMM"
                value={formData.primaryRMM}
                onChange={(e) => setFormData({ ...formData, primaryRMM: e.target.value })}
                placeholder="e.g., ConnectWise Automate, Datto RMM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryPSA">Primary PSA Tool</Label>
              <Input
                id="primaryPSA"
                value={formData.primaryPSA}
                onChange={(e) => setFormData({ ...formData, primaryPSA: e.target.value })}
                placeholder="e.g., ConnectWise Manage, Autotask"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceMix">Service Mix</Label>
            <Textarea
              id="serviceMix"
              rows={3}
              value={formData.serviceMix}
              onChange={(e) => setFormData({ ...formData, serviceMix: e.target.value })}
              placeholder="Describe your service offerings (e.g., 60% managed services, 25% projects, 15% break-fix)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherTools">Other Tools & Technologies</Label>
            <Textarea
              id="otherTools"
              rows={2}
              value={formData.otherTools}
              onChange={(e) => setFormData({ ...formData, otherTools: e.target.value })}
              placeholder="List other key tools and technologies used"
            />
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>Tell potential buyers about your business</CardDescription>
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
              placeholder="Describe your MSP business, services offered, target market, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyStrengths">Key Strengths</Label>
            <Textarea
              id="keyStrengths"
              rows={3}
              value={formData.keyStrengths}
              onChange={(e) => setFormData({ ...formData, keyStrengths: e.target.value })}
              placeholder="What makes your MSP stand out? (e.g., strong client relationships, specialized expertise)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="growthOpportunities">Growth Opportunities</Label>
            <Textarea
              id="growthOpportunities"
              rows={3}
              value={formData.growthOpportunities}
              onChange={(e) => setFormData({ ...formData, growthOpportunities: e.target.value })}
              placeholder="What opportunities exist for growth? (e.g., new markets, additional services)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control how your listing appears to buyers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {formData.isAnonymous ? (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="isAnonymous" className="text-base font-medium cursor-pointer">
                  {formData.isAnonymous ? "Anonymous Seller" : "Show Your Name"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.isAnonymous 
                    ? "Buyers will see 'Anonymous Seller' until you reveal your identity" 
                    : "Your name will be visible to buyers"}
                </p>
              </div>
            </div>
            <Switch
              id="isAnonymous"
              checked={formData.isAnonymous}
              onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidentialityLevel">Confidentiality Level</Label>
            <select
              id="confidentialityLevel"
              value={formData.confidentialityLevel}
              onChange={(e) => setFormData({ ...formData, confidentialityLevel: e.target.value as any })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="public">Public - All details visible</option>
              <option value="nda">NDA Required - Sensitive details hidden until NDA signed</option>
              <option value="private">Private - Invitation only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
