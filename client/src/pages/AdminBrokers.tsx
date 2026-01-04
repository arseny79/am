import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Users,
  DollarSign,
  FileText,
  Eye,
  Ban,
  Play,
  ArrowLeft,
  FileCheck,
  ExternalLink
} from "lucide-react";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function AdminBrokers() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("applications");
  
  // Dialog states
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractAction, setContractAction] = useState<'approve' | 'reject' | null>(null);
  const [contractNotes, setContractNotes] = useState("");
  
  // Queries
  const { data: applications, refetch: refetchApplications } = trpc.broker.listApplications.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === 'admin' }
  );
  
  const { data: brokersData, refetch: refetchBrokers } = trpc.broker.listBrokers.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === 'admin' }
  );
  
  const { data: pendingPayouts, refetch: refetchPayouts } = trpc.broker.listPendingPayouts.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === 'admin' }
  );
  
  const { data: commissionsData, refetch: refetchCommissions } = trpc.broker.listCommissions.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === 'admin' }
  );
  
  const { data: pendingContracts, refetch: refetchContracts } = trpc.broker.listPendingContracts.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === 'admin' }
  );
  
  // Mutations
  const reviewApplication = trpc.broker.reviewApplication.useMutation({
    onSuccess: () => {
      toast.success(reviewAction === 'approve' ? "Application approved!" : "Application rejected");
      refetchApplications();
      refetchBrokers();
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setReviewNotes("");
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateBrokerStatus = trpc.broker.updateBrokerStatus.useMutation({
    onSuccess: () => {
      toast.success("Broker status updated");
      refetchBrokers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const processPayout = trpc.broker.processPayout.useMutation({
    onSuccess: () => {
      toast.success("Payout processed");
      refetchPayouts();
      refetchBrokers();
      setPayoutDialogOpen(false);
      setSelectedPayout(null);
      setPaymentReference("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const verifyContract = trpc.broker.verifyContract.useMutation({
    onSuccess: (data) => {
      toast.success(data.status === 'approved' ? "Contract approved! Listing is now active." : "Contract rejected");
      refetchContracts();
      setContractDialogOpen(false);
      setSelectedContract(null);
      setContractNotes("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const approveCommission = trpc.broker.approveCommission.useMutation({
    onSuccess: () => {
      toast.success("Commission approved");
      refetchCommissions();
      refetchBrokers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleReviewSubmit = () => {
    if (!selectedApplication || !reviewAction) return;
    
    reviewApplication.mutate({
      applicationId: selectedApplication.application.id,
      action: reviewAction,
      reviewNotes: reviewNotes || undefined,
      rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
    });
  };
  
  const handlePayoutComplete = () => {
    if (!selectedPayout) return;
    
    processPayout.mutate({
      payoutId: selectedPayout.payout.id,
      action: 'complete',
      paymentReference: paymentReference || undefined,
    });
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You need admin access to view this page
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const pendingApplicationsCount = applications?.applications.filter(
    a => a.application.status === 'pending' || a.application.status === 'under_review'
  ).length || 0;
  
  const activeBrokersCount = brokersData?.brokers.filter(
    b => b.broker.status === 'approved'
  ).length || 0;
  
  const pendingPayoutsCount = pendingPayouts?.length || 0;
  const pendingContractsCount = pendingContracts?.length || 0;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/admin" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Link>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Broker Management
          </h1>
          <p className="text-muted-foreground">
            Manage broker applications, profiles, and payouts
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingApplicationsCount}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Brokers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeBrokersCount}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {pendingPayoutsCount}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {commissionsData?.total || 0}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="applications" className="relative">
              <FileText className="h-4 w-4 mr-2" />
              Applications
              {pendingApplicationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingApplicationsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="brokers">
              <Users className="h-4 w-4 mr-2" />
              Brokers
            </TabsTrigger>
            <TabsTrigger value="payouts" className="relative">
              <DollarSign className="h-4 w-4 mr-2" />
              Payouts
              {pendingPayoutsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingPayoutsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="commissions">
              <DollarSign className="h-4 w-4 mr-2" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="contracts" className="relative">
              <FileCheck className="h-4 w-4 mr-2" />
              Contracts
              {pendingContractsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingContractsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Broker Applications</CardTitle>
                <CardDescription>
                  Review and process broker applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications?.applications && applications.applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.applications.map((item) => (
                      <div 
                        key={item.application.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{item.application.companyName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.application.contactName} • {item.application.contactEmail}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={
                              item.application.status === 'approved' ? 'default' :
                              item.application.status === 'rejected' ? 'destructive' :
                              item.application.status === 'under_review' ? 'secondary' :
                              'outline'
                            }>
                              {item.application.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.application.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {['pending', 'under_review'].includes(item.application.status) && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(item);
                                  setReviewAction('approve');
                                  setReviewDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(item);
                                  setReviewAction('reject');
                                  setReviewDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No applications found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Brokers Tab */}
          <TabsContent value="brokers">
            <Card>
              <CardHeader>
                <CardTitle>Active Brokers</CardTitle>
                <CardDescription>
                  Manage approved broker accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {brokersData?.brokers && brokersData.brokers.length > 0 ? (
                  <div className="space-y-4">
                    {brokersData.brokers.map((item) => (
                      <div 
                        key={item.broker.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{item.broker.companyName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.broker.contactName} • {item.broker.contactEmail}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>
                              <strong>Earnings:</strong> {formatCurrency(item.broker.totalEarnings)}
                            </span>
                            <span>
                              <strong>Pending:</strong> {formatCurrency(item.broker.pendingEarnings)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={
                              item.broker.status === 'approved' ? 'default' :
                              item.broker.status === 'suspended' ? 'destructive' :
                              'secondary'
                            }>
                              {item.broker.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {item.broker.status === 'approved' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBrokerStatus.mutate({
                                brokerId: item.broker.id,
                                status: 'suspended',
                                reason: 'Admin action',
                              })}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          ) : item.broker.status === 'suspended' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBrokerStatus.mutate({
                                brokerId: item.broker.id,
                                status: 'approved',
                              })}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Reactivate
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No brokers found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Pending Payouts</CardTitle>
                <CardDescription>
                  Process broker payout requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPayouts && pendingPayouts.length > 0 ? (
                  <div className="space-y-4">
                    {pendingPayouts.map((item) => (
                      <div 
                        key={item.payout.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{item.broker?.companyName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.broker?.contactEmail} • {item.payout.payoutMethod}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {item.payout.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.payout.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatCurrency(item.payout.amount)}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(item);
                              setPayoutDialogOpen(true);
                            }}
                          >
                            Process
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No pending payouts
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>Broker Commissions</CardTitle>
                <CardDescription>
                  View and approve broker commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commissionsData?.commissions && commissionsData.commissions.length > 0 ? (
                  <div className="space-y-4">
                    {commissionsData.commissions.map((item) => (
                      <div 
                        key={item.commission.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{item.broker?.companyName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Deal #{item.commission.dealId} • {item.listing?.businessName || 'Unknown Listing'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Deal: {formatCurrency(item.commission.dealAmount)}</span>
                            <span>Fee: {formatCurrency(item.commission.platformFee)}</span>
                            <span className="text-green-600 font-medium">
                              Broker Share: {formatCurrency(item.commission.brokerShare)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={
                              item.commission.status === 'paid' ? 'default' :
                              item.commission.status === 'approved' ? 'secondary' :
                              item.commission.status === 'cancelled' ? 'destructive' :
                              'outline'
                            }>
                              {item.commission.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {item.commission.status === 'pending' && (
                            <Button 
                              size="sm"
                              onClick={() => approveCommission.mutate({
                                commissionId: item.commission.id,
                              })}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No commissions found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Contract Verification</CardTitle>
                <CardDescription>
                  Review and verify broker contracts before listings go live
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingContracts && pendingContracts.length > 0 ? (
                  <div className="space-y-4">
                    {pendingContracts.map((item) => (
                      <div 
                        key={item.contract.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.contract.clientCompanyName}</h4>
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Pending Verification
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Broker: {item.broker?.companyName} ({item.broker?.contactEmail})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Client: {item.contract.clientName} ({item.contract.clientEmail})
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Contract Type: {item.contract.contractType}</span>
                            <span>Listing: {item.listing?.businessName || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Submitted: {new Date(item.contract.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Expires: {new Date(item.contract.contractEndDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(item.contract.contractDocumentUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Contract
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedContract(item);
                              setContractAction('approve');
                              setContractDialogOpen(true);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedContract(item);
                              setContractAction('reject');
                              setContractDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No contracts pending verification
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Review Application Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? 'This will create a broker account for the applicant.'
                : 'This will reject the application. The applicant will be notified.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium">{selectedApplication.application.companyName}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedApplication.application.contactName} • {selectedApplication.application.contactEmail}
                </p>
                <p className="text-sm mt-2">
                  <strong>Experience:</strong> {selectedApplication.application.yearsExperience || 'Not specified'} years
                </p>
                <p className="text-sm">
                  <strong>Previous Deals:</strong> {selectedApplication.application.previousDealsCount || 'Not specified'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (optional)</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Internal notes about this application..."
                  rows={3}
                />
              </div>
              
              {reviewAction === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">Rejection Reason (sent to applicant)</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the application was rejected..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReviewSubmit}
              variant={reviewAction === 'reject' ? 'destructive' : 'default'}
              disabled={reviewApplication.isPending}
            >
              {reviewApplication.isPending ? 'Processing...' : 
                reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Process Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Mark this payout as completed
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayout && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium">{selectedPayout.broker?.companyName}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPayout.broker?.contactEmail}
                </p>
                <p className="text-lg font-bold mt-2">
                  {formatCurrency(selectedPayout.payout.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Method: {selectedPayout.payout.payoutMethod}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentReference">Payment Reference (optional)</Label>
                <Textarea
                  id="paymentReference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Transaction ID, check number, etc..."
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayoutComplete}
              disabled={processPayout.isPending}
            >
              {processPayout.isPending ? 'Processing...' : 'Mark as Completed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Contract Verification Dialog */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contractAction === 'approve' ? 'Approve Contract' : 'Reject Contract'}
            </DialogTitle>
            <DialogDescription>
              {contractAction === 'approve' 
                ? 'This will verify the contract and make the listing active in the marketplace.'
                : 'This will reject the contract. The broker will be notified and the listing will remain unpublished.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium">{selectedContract.contract.clientCompanyName}</h4>
                <p className="text-sm text-muted-foreground">
                  Client: {selectedContract.contract.clientName} ({selectedContract.contract.clientEmail})
                </p>
                <p className="text-sm text-muted-foreground">
                  Broker: {selectedContract.broker?.companyName}
                </p>
                <p className="text-sm mt-2">
                  <strong>Contract Type:</strong> {selectedContract.contract.contractType}
                </p>
                <p className="text-sm">
                  <strong>Valid:</strong> {new Date(selectedContract.contract.contractStartDate).toLocaleDateString()} - {new Date(selectedContract.contract.contractEndDate).toLocaleDateString()}
                </p>
                <Button
                  size="sm"
                  variant="link"
                  className="p-0 h-auto mt-2"
                  onClick={() => window.open(selectedContract.contract.contractDocumentUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Contract Document
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contractNotes">
                  {contractAction === 'approve' ? 'Verification Notes (optional)' : 'Rejection Reason (sent to broker)'}
                </Label>
                <Textarea
                  id="contractNotes"
                  value={contractNotes}
                  onChange={(e) => setContractNotes(e.target.value)}
                  placeholder={contractAction === 'approve' 
                    ? 'Any notes about the verification...'
                    : 'Explain why the contract was rejected...'}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!selectedContract || !contractAction) return;
                verifyContract.mutate({
                  contractId: selectedContract.contract.id,
                  action: contractAction,
                  verificationNotes: contractNotes || undefined,
                });
              }}
              variant={contractAction === 'reject' ? 'destructive' : 'default'}
              disabled={verifyContract.isPending}
            >
              {verifyContract.isPending ? 'Processing...' : 
                contractAction === 'approve' ? 'Approve Contract' : 'Reject Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
