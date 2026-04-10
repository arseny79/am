import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  FileText,
  Award,
  DollarSign
} from "lucide-react";
import { getLoginUrl } from "@/const";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export default function BrokerApply() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Check existing application
  const { data: existingApplication, isLoading: applicationLoading } = trpc.broker.getMyApplication.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Check if already a broker
  const { data: brokerStatus, isLoading: brokerLoading } = trpc.broker.getMyBrokerStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const submitApplication = trpc.broker.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("Application submitted successfully! We'll review it within 2-3 business days.");
      setLocation("/broker");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    licenseNumber: "",
    licenseState: "",
    contactName: user?.name || "",
    contactEmail: user?.email || "",
    contactPhone: "",
    yearsExperience: "",
    previousDealsCount: "",
    previousDealVolume: "",
    specializations: "",
    applicationMessage: "",
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.applicationMessage.length < 50) {
      toast.error("Please provide more details about why you want to become a broker (at least 50 characters)");
      return;
    }
    
    submitApplication.mutate({
      companyName: formData.companyName,
      companyWebsite: formData.companyWebsite || undefined,
      licenseNumber: formData.licenseNumber || undefined,
      licenseState: formData.licenseState || undefined,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone || undefined,
      yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined,
      previousDealsCount: formData.previousDealsCount ? parseInt(formData.previousDealsCount) : undefined,
      previousDealVolume: formData.previousDealVolume ? parseInt(formData.previousDealVolume) : undefined,
      specializations: formData.specializations || undefined,
      applicationMessage: formData.applicationMessage,
    });
  };
  
  if (authLoading || applicationLoading || brokerLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <div className="container py-12">
          <Link href="/broker" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Broker Info
          </Link>
          
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to apply for broker status
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild>
                <a href={getLoginUrl()}>Sign In to Apply</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Already a broker
  if (brokerStatus?.isBroker) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <div className="container py-12">
          <Link href="/broker" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Broker Info
          </Link>
          
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>You're Already a Broker!</CardTitle>
              <CardDescription>
                You have an active broker account. Access your dashboard to manage listings.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild>
                <Link href="/broker/dashboard">Go to Broker Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Has pending application
  if (existingApplication && ['pending', 'under_review'].includes(existingApplication.status)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <div className="container py-12">
          <Link href="/broker" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Broker Info
          </Link>
          
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Application Under Review</CardTitle>
              <CardDescription>
                Your broker application is currently being reviewed. We'll notify you via email once a decision is made.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm"><strong>Company:</strong> {existingApplication.companyName}</p>
                <p className="text-sm"><strong>Submitted:</strong> {new Date(existingApplication.createdAt).toLocaleDateString()}</p>
                <p className="text-sm"><strong>Status:</strong> {existingApplication.status === 'pending' ? 'Pending Review' : 'Under Review'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Rejected application
  if (existingApplication?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <div className="container py-12">
          <Link href="/broker" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Broker Info
          </Link>
          
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Application Not Approved</CardTitle>
              <CardDescription>
                Unfortunately, your broker application was not approved at this time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {existingApplication.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800"><strong>Reason:</strong> {existingApplication.rejectionReason}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">
                You may reapply after 90 days if your circumstances change.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Application form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <div className="container py-12">
        <Link href="/broker" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Broker Info
        </Link>
        
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Apply to Become a Broker</h1>
            <p className="text-muted-foreground">
              Complete the form below to apply for broker status. We review applications within 2-3 business days.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Broker Application
              </CardTitle>
              <CardDescription>
                All fields marked with * are required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        required
                        placeholder="Your brokerage company name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyWebsite">Company Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="companyWebsite"
                          value={formData.companyWebsite}
                          onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                          placeholder="https://example.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">Broker License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        placeholder="If applicable"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="licenseState">License State/Country</Label>
                      <Input
                        id="licenseState"
                        value={formData.licenseState}
                        onChange={(e) => setFormData({ ...formData, licenseState: e.target.value })}
                        placeholder="e.g., California, USA"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name *</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        required
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contactEmail"
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                          required
                          placeholder="you@example.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Experience */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Experience
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience">Years of Experience</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        min="0"
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                        placeholder="e.g., 5"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="previousDealsCount">Deals Completed</Label>
                      <Input
                        id="previousDealsCount"
                        type="number"
                        min="0"
                        value={formData.previousDealsCount}
                        onChange={(e) => setFormData({ ...formData, previousDealsCount: e.target.value })}
                        placeholder="e.g., 25"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="previousDealVolume">Total Deal Volume ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="previousDealVolume"
                          type="number"
                          min="0"
                          value={formData.previousDealVolume}
                          onChange={(e) => setFormData({ ...formData, previousDealVolume: e.target.value })}
                          placeholder="e.g., 5000000"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specializations">Specializations</Label>
                    <Input
                      id="specializations"
                      value={formData.specializations}
                      onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                      placeholder="e.g., SaaS, IT Services, E-commerce, Web3, Healthcare IT"
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated list of your areas of expertise</p>
                  </div>
                </div>
                
                {/* Application Message */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Application Details
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="applicationMessage">Why do you want to become a broker? *</Label>
                    <Textarea
                      id="applicationMessage"
                      value={formData.applicationMessage}
                      onChange={(e) => setFormData({ ...formData, applicationMessage: e.target.value })}
                      required
                      rows={5}
                      placeholder="Tell us about your experience in M&A, your client base, and why you'd like to list businesses on our platform..."
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 50 characters. {formData.applicationMessage.length}/50
                    </p>
                  </div>
                </div>
                
                {/* Commission Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Broker Commission Structure</h4>
                  <p className="text-sm text-green-700">
                    As an approved broker, you'll earn <strong>50% of platform fees</strong> on every successful deal 
                    you facilitate. Platform fees are typically 3% of the deal value.
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitApplication.isPending}
                >
                  {submitApplication.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
