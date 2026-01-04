import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { 
  Briefcase, 
  DollarSign, 
  Building2, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Settings,
  FileText,
  CreditCard,
  Wallet
} from "lucide-react";
import { getLoginUrl } from "@/const";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function BrokerDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Check broker status
  const { data: brokerStatus, isLoading: brokerLoading } = trpc.broker.getMyBrokerStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Get broker profile
  const { data: brokerProfile, refetch: refetchProfile } = trpc.broker.getMyBrokerProfile.useQuery(
    undefined,
    { enabled: isAuthenticated && brokerStatus?.isBroker }
  );
  
  // Get broker listings
  const { data: brokerListings } = trpc.broker.getMyBrokerListings.useQuery(
    undefined,
    { enabled: isAuthenticated && brokerStatus?.isBroker }
  );
  
  // Get earnings
  const { data: earnings, refetch: refetchEarnings } = trpc.broker.getMyEarnings.useQuery(
    undefined,
    { enabled: isAuthenticated && brokerStatus?.isBroker }
  );
  
  // Profile update mutation
  const updateProfile = trpc.broker.updateBrokerProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refetchProfile();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Payout request mutation
  const requestPayout = trpc.broker.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Payout request submitted successfully");
      refetchEarnings();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const [profileForm, setProfileForm] = useState({
    companyName: "",
    companyWebsite: "",
    contactPhone: "",
    bio: "",
    payoutMethod: "bank_transfer" as "bank_transfer" | "paypal" | "check",
    paypalEmail: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankRoutingNumber: "",
    bankName: "",
  });
  
  // Initialize form when profile loads
  if (brokerProfile && !profileForm.companyName) {
    setProfileForm({
      companyName: brokerProfile.companyName || "",
      companyWebsite: brokerProfile.companyWebsite || "",
      contactPhone: brokerProfile.contactPhone || "",
      bio: brokerProfile.bio || "",
      payoutMethod: brokerProfile.payoutMethod || "bank_transfer",
      paypalEmail: brokerProfile.paypalEmail || "",
      bankAccountName: brokerProfile.bankAccountName || "",
      bankAccountNumber: brokerProfile.bankAccountNumber || "",
      bankRoutingNumber: brokerProfile.bankRoutingNumber || "",
      bankName: brokerProfile.bankName || "",
    });
  }
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(profileForm);
  };
  
  const handlePayoutRequest = () => {
    if (!earnings?.summary.pendingEarnings || earnings.summary.pendingEarnings < 10000) {
      toast.error("Minimum payout amount is $100");
      return;
    }
    requestPayout.mutate({ amount: earnings.summary.pendingEarnings });
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
                Please sign in to access your broker dashboard
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
              <CardTitle>Not a Broker</CardTitle>
              <CardDescription>
                You need to be an approved broker to access this dashboard
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Briefcase className="h-8 w-8" />
              Broker Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your listings and track your earnings
            </p>
          </div>
          
          <Button asChild>
            <Link href="/broker/create-listing">
              <Plus className="h-4 w-4 mr-2" />
              Create New Listing
            </Link>
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {brokerListings?.filter(l => l.brokerListing.status === 'active').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(earnings?.summary.totalEarnings || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(earnings?.summary.pendingEarnings || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(earnings?.summary.paidEarnings || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="listings">
              <Building2 className="h-4 w-4 mr-2" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <DollarSign className="h-4 w-4 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/broker/create-listing">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Listing
                    </Link>
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("earnings")}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    View Earnings
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {earnings?.commissions && earnings.commissions.length > 0 ? (
                    <div className="space-y-3">
                      {earnings.commissions.slice(0, 5).map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                              {commission.status}
                            </Badge>
                            <span>Deal #{commission.dealId}</span>
                          </div>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(commission.brokerShare)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No recent activity. Create a listing to get started!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Listings Tab */}
          <TabsContent value="listings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Listings</CardTitle>
                  <CardDescription>
                    Manage businesses you've listed on behalf of clients
                  </CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/broker/create-listing">
                    <Plus className="h-4 w-4 mr-2" />
                    New Listing
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {brokerListings && brokerListings.length > 0 ? (
                  <div className="space-y-4">
                    {brokerListings.map((item) => (
                      <div 
                        key={item.brokerListing.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{item.listing?.businessName || 'Unknown Business'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.listing?.location} • MRR: {formatCurrency((item.listing?.monthlyRecurringRevenue || 0) * 100)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={item.brokerListing.status === 'active' ? 'default' : 'secondary'}>
                              {item.brokerListing.status}
                            </Badge>
                            {item.contract && item.contract.status === 'pending_verification' ? (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                <Clock className="h-3 w-3 mr-1" />
                                Contract Pending Verification
                              </Badge>
                            ) : item.contract && item.contract.isVerified ? (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Contract Verified
                              </Badge>
                            ) : item.contract ? (
                              <Badge variant="outline">
                                <FileText className="h-3 w-3 mr-1" />
                                Contract: {item.contract.status}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/listing/${item.listing?.id}`}>
                            View
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Listings Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first listing to start earning commissions
                    </p>
                    <Button asChild>
                      <Link href="/broker/create-listing">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Listing
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">
                    Available for Payout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">
                    {formatCurrency(earnings?.summary.pendingEarnings || 0)}
                  </div>
                  <Button 
                    className="mt-4" 
                    size="sm"
                    disabled={!earnings?.summary.pendingEarnings || earnings.summary.pendingEarnings < 10000 || requestPayout.isPending}
                    onClick={handlePayoutRequest}
                  >
                    {requestPayout.isPending ? "Processing..." : "Request Payout"}
                  </Button>
                  <p className="text-xs text-green-600 mt-2">Minimum payout: $100</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(earnings?.summary.totalEarnings || 0)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Paid Out
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(earnings?.summary.paidEarnings || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Commission History</CardTitle>
              </CardHeader>
              <CardContent>
                {earnings?.commissions && earnings.commissions.length > 0 ? (
                  <div className="space-y-3">
                    {earnings.commissions.map((commission) => (
                      <div 
                        key={commission.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              commission.status === 'paid' ? 'default' :
                              commission.status === 'approved' ? 'secondary' :
                              'outline'
                            }>
                              {commission.status}
                            </Badge>
                            <span className="font-medium">Deal #{commission.dealId}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Deal Value: {formatCurrency(commission.dealAmount)} • 
                            Platform Fee: {formatCurrency(commission.platformFee)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            +{formatCurrency(commission.brokerShare)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(commission.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No commissions yet. Close a deal to earn your first commission!
                  </p>
                )}
              </CardContent>
            </Card>
            
            {earnings?.payouts && earnings.payouts.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {earnings.payouts.map((payout) => (
                      <div 
                        key={payout.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              payout.status === 'completed' ? 'default' :
                              payout.status === 'processing' ? 'secondary' :
                              payout.status === 'failed' ? 'destructive' :
                              'outline'
                            }>
                              {payout.status}
                            </Badge>
                            <span className="capitalize">{payout.payoutMethod.replace('_', ' ')}</span>
                          </div>
                          {payout.paymentReference && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Ref: {payout.paymentReference}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {formatCurrency(payout.amount)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Broker Profile</CardTitle>
                <CardDescription>
                  Update your broker information and payout settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Company Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={profileForm.companyName}
                          onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyWebsite">Website</Label>
                        <Input
                          id="companyWebsite"
                          value={profileForm.companyWebsite}
                          onChange={(e) => setProfileForm({ ...profileForm, companyWebsite: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input
                        id="contactPhone"
                        value={profileForm.contactPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {/* Payout Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Payout Settings</h3>
                    <div className="space-y-2">
                      <Label htmlFor="payoutMethod">Payout Method</Label>
                      <Select
                        value={profileForm.payoutMethod}
                        onValueChange={(value: "bank_transfer" | "paypal" | "check") => 
                          setProfileForm({ ...profileForm, payoutMethod: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {profileForm.payoutMethod === 'paypal' && (
                      <div className="space-y-2">
                        <Label htmlFor="paypalEmail">PayPal Email</Label>
                        <Input
                          id="paypalEmail"
                          type="email"
                          value={profileForm.paypalEmail}
                          onChange={(e) => setProfileForm({ ...profileForm, paypalEmail: e.target.value })}
                        />
                      </div>
                    )}
                    
                    {profileForm.payoutMethod === 'bank_transfer' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            value={profileForm.bankName}
                            onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankAccountName">Account Name</Label>
                          <Input
                            id="bankAccountName"
                            value={profileForm.bankAccountName}
                            onChange={(e) => setProfileForm({ ...profileForm, bankAccountName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankAccountNumber">Account Number</Label>
                          <Input
                            id="bankAccountNumber"
                            value={profileForm.bankAccountNumber}
                            onChange={(e) => setProfileForm({ ...profileForm, bankAccountNumber: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankRoutingNumber">Routing Number</Label>
                          <Input
                            id="bankRoutingNumber"
                            value={profileForm.bankRoutingNumber}
                            onChange={(e) => setProfileForm({ ...profileForm, bankRoutingNumber: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
