import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function CreateListing() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
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
  });

  const createMutation = trpc.listing.create.useMutation({
    onSuccess: () => {
      toast.success("Listing created successfully!");
      setLocation("/my-listings");
    },
    onError: (error) => {
      toast.error("Failed to create listing: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_TITLE}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/my-listings">
              <Button variant="ghost">My Listings</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
            <p className="text-muted-foreground">
              List your MSP business to connect with qualified buyers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell buyers about your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      placeholder="City, State"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearFounded">Year Founded</Label>
                    <Input
                      id="yearFounded"
                      type="number"
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
                      value={formData.askingPrice}
                      onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientCount">Number of Clients *</Label>
                    <Input
                      id="clientCount"
                      type="number"
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
                    placeholder="Describe your MSP business, services offered, target market, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Categorization</CardTitle>
                <CardDescription>Help buyers find your MSP by selecting relevant categories</CardDescription>
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
    </div>
  );
}
