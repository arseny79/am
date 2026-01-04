import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft,
  Upload,
  FileText,
  Building2,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function BrokerCreateListing() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractUploading, setContractUploading] = useState(false);
  const [contractUrl, setContractUrl] = useState("");
  
  // Check broker status
  const { data: brokerStatus, isLoading: brokerLoading } = trpc.broker.getMyBrokerStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Upload contract mutation
  const uploadContract = trpc.storage.uploadFile.useMutation();
  
  // Create listing mutation (uses existing listing.create)
  const createListing = trpc.listing.create.useMutation({
    onSuccess: async (data) => {
      // After creating listing, create broker contract and link
      if (data.id) {
        await createBrokerContract.mutateAsync({
          listingId: data.id,
          ...contractForm,
          contractDocumentUrl: contractUrl,
          contractFileName: contractFile?.name || "contract.pdf",
          contractFileSize: contractFile?.size,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Create broker contract mutation
  const createBrokerContract = trpc.broker.createContract.useMutation({
    onSuccess: () => {
      toast.success("Listing created successfully!");
      setLocation("/broker/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Contract form state
  const [contractForm, setContractForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompanyName: "",
    contractType: "exclusive" as "exclusive" | "non_exclusive",
    contractStartDate: "",
    contractEndDate: "",
    clientCommissionRate: "",
  });
  
  // Listing form state
  const [listingForm, setListingForm] = useState({
    businessName: "",
    location: "",
    yearFounded: "",
    employeeCount: "",
    monthlyRecurringRevenue: "",
    annualRevenue: "",
    ebitda: "",
    clientCount: "",
    description: "",
    askingPrice: "",
    serviceMix: "",
    keyStrengths: "",
    growthOpportunities: "",
  });
  
  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    
    setContractFile(file);
    setContractUploading(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await uploadContract.mutateAsync({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
          folder: "broker-contracts",
        });
        setContractUrl(result.url);
        toast.success("Contract uploaded successfully");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload contract");
    } finally {
      setContractUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractUrl) {
      toast.error("Please upload a contract document");
      return;
    }
    
    // Create the listing first
    createListing.mutate({
      businessName: listingForm.businessName,
      location: listingForm.location,
      yearFounded: listingForm.yearFounded ? parseInt(listingForm.yearFounded) : undefined,
      employeeCount: listingForm.employeeCount ? parseInt(listingForm.employeeCount) : undefined,
      monthlyRecurringRevenue: parseInt(listingForm.monthlyRecurringRevenue) || 0,
      annualRevenue: parseInt(listingForm.annualRevenue) || 0,
      ebitda: parseInt(listingForm.ebitda) || 0,
      clientCount: parseInt(listingForm.clientCount) || 0,
      description: listingForm.description,
      askingPrice: listingForm.askingPrice ? parseInt(listingForm.askingPrice) : undefined,
      serviceMix: listingForm.serviceMix || undefined,
      keyStrengths: listingForm.keyStrengths || undefined,
      growthOpportunities: listingForm.growthOpportunities || undefined,
      listingTier: "standard",
    });
  };
  
  if (authLoading || brokerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to create a listing
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!brokerStatus?.isBroker) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Broker Access Required</CardTitle>
              <CardDescription>
                You need to be an approved broker to create listings on behalf of clients
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild>
                <Link href="/broker/apply">Apply to Become a Broker</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/broker/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Broker Listing</h1>
            <p className="text-muted-foreground">
              List a business on behalf of your client
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              <div className={`w-24 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <div className={`w-24 h-1 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                3
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-8 text-sm mb-8">
            <span className={step === 1 ? 'font-medium' : 'text-muted-foreground'}>Contract Details</span>
            <span className={step === 2 ? 'font-medium' : 'text-muted-foreground'}>Business Info</span>
            <span className={step === 3 ? 'font-medium' : 'text-muted-foreground'}>Review & Submit</span>
          </div>
          
          {/* Step 1: Contract Details */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Brokerage Contract
                </CardTitle>
                <CardDescription>
                  Upload your signed brokerage contract with the client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contract Upload */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    {contractUrl ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                        <span className="font-medium">{contractFile?.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-2">
                          Upload your brokerage contract (PDF)
                        </p>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleContractUpload}
                          disabled={contractUploading}
                          className="max-w-xs mx-auto"
                        />
                      </>
                    )}
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Contract Requirements</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Must be a valid, signed brokerage agreement</li>
                        <li>Must include authorization to list the business</li>
                        <li>Contract must be current (not expired)</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Client Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Client Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        value={contractForm.clientName}
                        onChange={(e) => setContractForm({ ...contractForm, clientName: e.target.value })}
                        required
                        placeholder="John Smith"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clientCompanyName">Client Company Name *</Label>
                      <Input
                        id="clientCompanyName"
                        value={contractForm.clientCompanyName}
                        onChange={(e) => setContractForm({ ...contractForm, clientCompanyName: e.target.value })}
                        required
                        placeholder="ABC MSP Services"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Client Email *</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={contractForm.clientEmail}
                        onChange={(e) => setContractForm({ ...contractForm, clientEmail: e.target.value })}
                        required
                        placeholder="client@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Client Phone</Label>
                      <Input
                        id="clientPhone"
                        value={contractForm.clientPhone}
                        onChange={(e) => setContractForm({ ...contractForm, clientPhone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Contract Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Contract Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractType">Contract Type *</Label>
                      <Select
                        value={contractForm.contractType}
                        onValueChange={(value: "exclusive" | "non_exclusive") => 
                          setContractForm({ ...contractForm, contractType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exclusive">Exclusive</SelectItem>
                          <SelectItem value="non_exclusive">Non-Exclusive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clientCommissionRate">Your Commission Rate (%)</Label>
                      <Input
                        id="clientCommissionRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={contractForm.clientCommissionRate}
                        onChange={(e) => setContractForm({ ...contractForm, clientCommissionRate: e.target.value })}
                        placeholder="e.g., 5"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contractStartDate">Contract Start Date *</Label>
                      <Input
                        id="contractStartDate"
                        type="date"
                        value={contractForm.contractStartDate}
                        onChange={(e) => setContractForm({ ...contractForm, contractStartDate: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contractEndDate">Contract End Date *</Label>
                      <Input
                        id="contractEndDate"
                        type="date"
                        value={contractForm.contractEndDate}
                        onChange={(e) => setContractForm({ ...contractForm, contractEndDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep(2)}
                    disabled={!contractUrl || !contractForm.clientName || !contractForm.clientEmail || !contractForm.clientCompanyName || !contractForm.contractStartDate || !contractForm.contractEndDate}
                  >
                    Continue to Business Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Step 2: Business Information */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Enter the details of the business being listed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={listingForm.businessName}
                      onChange={(e) => setListingForm({ ...listingForm, businessName: e.target.value })}
                      required
                      placeholder="Business name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={listingForm.location}
                      onChange={(e) => setListingForm({ ...listingForm, location: e.target.value })}
                      required
                      placeholder="City, State/Country"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="yearFounded">Year Founded</Label>
                    <Input
                      id="yearFounded"
                      type="number"
                      value={listingForm.yearFounded}
                      onChange={(e) => setListingForm({ ...listingForm, yearFounded: e.target.value })}
                      placeholder="e.g., 2015"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Employee Count</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      value={listingForm.employeeCount}
                      onChange={(e) => setListingForm({ ...listingForm, employeeCount: e.target.value })}
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRecurringRevenue">Monthly Recurring Revenue ($) *</Label>
                    <Input
                      id="monthlyRecurringRevenue"
                      type="number"
                      value={listingForm.monthlyRecurringRevenue}
                      onChange={(e) => setListingForm({ ...listingForm, monthlyRecurringRevenue: e.target.value })}
                      required
                      placeholder="e.g., 50000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="annualRevenue">Annual Revenue ($) *</Label>
                    <Input
                      id="annualRevenue"
                      type="number"
                      value={listingForm.annualRevenue}
                      onChange={(e) => setListingForm({ ...listingForm, annualRevenue: e.target.value })}
                      required
                      placeholder="e.g., 600000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ebitda">EBITDA ($) *</Label>
                    <Input
                      id="ebitda"
                      type="number"
                      value={listingForm.ebitda}
                      onChange={(e) => setListingForm({ ...listingForm, ebitda: e.target.value })}
                      required
                      placeholder="e.g., 150000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientCount">Client Count *</Label>
                    <Input
                      id="clientCount"
                      type="number"
                      value={listingForm.clientCount}
                      onChange={(e) => setListingForm({ ...listingForm, clientCount: e.target.value })}
                      required
                      placeholder="e.g., 50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="askingPrice">Asking Price ($)</Label>
                    <Input
                      id="askingPrice"
                      type="number"
                      value={listingForm.askingPrice}
                      onChange={(e) => setListingForm({ ...listingForm, askingPrice: e.target.value })}
                      placeholder="e.g., 500000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serviceMix">Service Mix</Label>
                    <Input
                      id="serviceMix"
                      value={listingForm.serviceMix}
                      onChange={(e) => setListingForm({ ...listingForm, serviceMix: e.target.value })}
                      placeholder="e.g., Managed Services 60%, Projects 40%"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Business Description *</Label>
                  <Textarea
                    id="description"
                    value={listingForm.description}
                    onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                    required
                    rows={4}
                    placeholder="Describe the business, its services, and market position..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="keyStrengths">Key Strengths</Label>
                  <Textarea
                    id="keyStrengths"
                    value={listingForm.keyStrengths}
                    onChange={(e) => setListingForm({ ...listingForm, keyStrengths: e.target.value })}
                    rows={3}
                    placeholder="What makes this business attractive to buyers?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="growthOpportunities">Growth Opportunities</Label>
                  <Textarea
                    id="growthOpportunities"
                    value={listingForm.growthOpportunities}
                    onChange={(e) => setListingForm({ ...listingForm, growthOpportunities: e.target.value })}
                    rows={3}
                    placeholder="What growth opportunities exist for a new owner?"
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={!listingForm.businessName || !listingForm.location || !listingForm.monthlyRecurringRevenue || !listingForm.annualRevenue || !listingForm.ebitda || !listingForm.clientCount || !listingForm.description}
                  >
                    Review & Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>
                  Review the listing details before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contract Summary */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contract Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Client:</span> {contractForm.clientName}</div>
                    <div><span className="text-muted-foreground">Company:</span> {contractForm.clientCompanyName}</div>
                    <div><span className="text-muted-foreground">Type:</span> {contractForm.contractType}</div>
                    <div><span className="text-muted-foreground">Period:</span> {contractForm.contractStartDate} to {contractForm.contractEndDate}</div>
                    <div><span className="text-muted-foreground">Contract:</span> {contractFile?.name}</div>
                  </div>
                </div>
                
                {/* Business Summary */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Business Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {listingForm.businessName}</div>
                    <div><span className="text-muted-foreground">Location:</span> {listingForm.location}</div>
                    <div><span className="text-muted-foreground">MRR:</span> ${parseInt(listingForm.monthlyRecurringRevenue).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Annual Revenue:</span> ${parseInt(listingForm.annualRevenue).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">EBITDA:</span> ${parseInt(listingForm.ebitda).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Clients:</span> {listingForm.clientCount}</div>
                    {listingForm.askingPrice && (
                      <div><span className="text-muted-foreground">Asking Price:</span> ${parseInt(listingForm.askingPrice).toLocaleString()}</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Commission Structure</h4>
                  <p className="text-sm text-green-700">
                    When this listing results in a successful deal, you'll earn <strong>50% of the platform fee</strong> (typically 3% of deal value).
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createListing.isPending || createBrokerContract.isPending}
                  >
                    {createListing.isPending || createBrokerContract.isPending ? "Creating..." : "Create Listing"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
