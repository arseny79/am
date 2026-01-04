import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Briefcase,
  RefreshCw,
  Ban,
  Play,
  Eye,
  Mail,
  Phone,
  Building2,
  DollarSign,
  FileText,
  Settings,
  Send,
  Clock,
  Calendar,
  TrendingUp,
  Award,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  approved: { label: "Approved", className: "bg-green-100 text-green-800", icon: CheckCircle },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-800", icon: Ban },
  rejected: { label: "Rejected", className: "bg-gray-100 text-gray-800", icon: XCircle },
};

export function BrokersTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBroker, setSelectedBroker] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ type: "suspend" | "reactivate" | "view" | "send_onboarding"; broker: any } | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("brokers");

  // Fetch brokers list
  const { data: brokersData, isLoading, refetch } = trpc.broker.listBrokers.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    limit: 50,
    offset: 0,
  });

  // Fetch pending applications
  const { data: applicationsData, refetch: refetchApplications } = trpc.broker.listApplications.useQuery({
    status: "pending",
    limit: 50,
    offset: 0,
  });

  // Fetch pending contracts
  const { data: pendingContracts, refetch: refetchContracts } = trpc.broker.listPendingContracts.useQuery();

  // Mutations
  const updateStatusMutation = trpc.broker.updateBrokerStatus.useMutation({
    onSuccess: () => {
      toast.success("Broker status updated");
      refetch();
      setActionDialog(null);
      setSuspensionReason("");
    },
    onError: (error) => toast.error(error.message),
  });

  const reviewApplicationMutation = trpc.broker.reviewApplication.useMutation({
    onSuccess: () => {
      toast.success("Application reviewed");
      refetchApplications();
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const verifyContractMutation = trpc.broker.verifyContract.useMutation({
    onSuccess: () => {
      toast.success("Contract verified");
      refetchContracts();
    },
    onError: (error) => toast.error(error.message),
  });

  const sendOnboardingMutation = trpc.broker.sendOnboardingEmail.useMutation({
    onSuccess: () => {
      toast.success("Onboarding email sent");
      setActionDialog(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleStatusChange = () => {
    if (!actionDialog) return;

    if (actionDialog.type === "suspend") {
      updateStatusMutation.mutate({
        brokerId: actionDialog.broker.broker.id,
        status: "suspended",
        reason: suspensionReason || undefined,
      });
    } else if (actionDialog.type === "reactivate") {
      updateStatusMutation.mutate({
        brokerId: actionDialog.broker.broker.id,
        status: "approved",
      });
    } else if (actionDialog.type === "send_onboarding") {
      sendOnboardingMutation.mutate({
        brokerId: actionDialog.broker.broker.id,
        emailType: "welcome",
      });
    }
  };

  // Filter brokers by search
  const filteredBrokers = brokersData?.brokers.filter((b) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      b.broker.companyName?.toLowerCase().includes(searchLower) ||
      b.broker.contactName?.toLowerCase().includes(searchLower) ||
      b.broker.contactEmail?.toLowerCase().includes(searchLower) ||
      b.user?.name?.toLowerCase().includes(searchLower) ||
      b.user?.email?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Calculate stats
  const totalBrokers = brokersData?.total || 0;
  const approvedBrokers = brokersData?.brokers.filter(b => b.broker.status === "approved").length || 0;
  const suspendedBrokers = brokersData?.brokers.filter(b => b.broker.status === "suspended").length || 0;
  const pendingApplicationsCount = applicationsData?.total || 0;
  const pendingContractsCount = pendingContracts?.length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Brokers</p>
                <p className="text-2xl font-bold">{totalBrokers}</p>
              </div>
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{approvedBrokers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{suspendedBrokers}</p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className={pendingApplicationsCount > 0 ? "ring-2 ring-yellow-400" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Apps</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApplicationsCount}</p>
              </div>
              <AlertCircle className={`w-8 h-8 ${pendingApplicationsCount > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
            </div>
          </CardContent>
        </Card>
        <Card className={pendingContractsCount > 0 ? "ring-2 ring-orange-400" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Contracts</p>
                <p className="text-2xl font-bold text-orange-600">{pendingContractsCount}</p>
              </div>
              <FileText className={`w-8 h-8 ${pendingContractsCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="brokers" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Brokers
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <Users className="w-4 h-4" />
            Applications
            {pendingApplicationsCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingApplicationsCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-2">
            <FileText className="w-4 h-4" />
            Contracts
            {pendingContractsCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingContractsCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Brokers List Tab */}
        <TabsContent value="brokers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broker Management</CardTitle>
              <CardDescription>View and manage all approved brokers on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, company, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Brokers Table */}
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredBrokers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No brokers found matching your criteria</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrokers.map((item) => {
                      const statusConfig = STATUS_CONFIG[item.broker.status as keyof typeof STATUS_CONFIG];
                      return (
                        <TableRow key={item.broker.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.broker.companyName}</p>
                              <p className="text-sm text-muted-foreground">{item.broker.companyWebsite || "No website"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">{item.broker.contactName}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {item.broker.contactEmail}
                              </p>
                              {item.broker.contactPhone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {item.broker.contactPhone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">{item.broker.yearsExperience || 0} years</p>
                              <p className="text-xs text-muted-foreground">
                                {item.broker.totalDealsCompleted || 0} deals
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-green-600">
                                ${((item.broker.totalEarnings || 0) / 100).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Pending: ${((item.broker.pendingEarnings || 0) / 100).toLocaleString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig?.className}>
                              {statusConfig?.label || item.broker.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActionDialog({ type: "view", broker: item })}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {item.broker.status === "approved" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setActionDialog({ type: "send_onboarding", broker: item })}
                                    title="Send onboarding email"
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setActionDialog({ type: "suspend", broker: item })}
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {item.broker.status === "suspended" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setActionDialog({ type: "reactivate", broker: item })}
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broker Applications</CardTitle>
              <CardDescription>Review and process new broker applications</CardDescription>
            </CardHeader>
            <CardContent>
              {applicationsData?.applications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicationsData?.applications.map((app) => (
                    <Card key={app.application.id} className="border-l-4 border-l-yellow-400">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                              <span className="font-semibold">{app.application.companyName}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Contact</p>
                                <p>{app.application.contactName}</p>
                                <p className="text-muted-foreground">{app.application.contactEmail}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Experience</p>
                                <p>{app.application.yearsExperience || 0} years</p>
                                <p className="text-muted-foreground">{app.application.previousDealsCount || 0} previous deals</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-sm">Application Message</p>
                              <p className="text-sm mt-1">{app.application.applicationMessage}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => reviewApplicationMutation.mutate({
                                applicationId: app.application.id,
                                action: "approve",
                              })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => reviewApplicationMutation.mutate({
                                applicationId: app.application.id,
                                action: "reject",
                                rejectionReason: "Application does not meet requirements",
                              })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Verification</CardTitle>
              <CardDescription>Review and verify broker contracts before listings go live</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingContracts?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No contracts pending verification</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingContracts?.map((item) => (
                    <Card key={item.contract.id} className="border-l-4 border-l-orange-400">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <span className="font-semibold">{item.contract.clientCompanyName}</span>
                              <Badge variant="outline">{item.contract.contractType}</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Broker</p>
                                <p>{item.broker?.companyName}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Client</p>
                                <p>{item.contract.clientName}</p>
                                <p className="text-muted-foreground">{item.contract.clientEmail}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Contract Period</p>
                                <p>{new Date(item.contract.contractStartDate!).toLocaleDateString()} - {new Date(item.contract.contractEndDate!).toLocaleDateString()}</p>
                              </div>
                            </div>
                            {item.contract.contractDocumentUrl && (
                              <a
                                href={item.contract.contractDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-4 h-4" />
                                View Contract Document
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => verifyContractMutation.mutate({
                                contractId: item.contract.id,
                                action: "approve",
                              })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => verifyContractMutation.mutate({
                                contractId: item.contract.id,
                                action: "reject",
                                verificationNotes: "Contract document is invalid or incomplete",
                              })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <BrokerSettingsSection />
        </TabsContent>
      </Tabs>

      {/* Action Dialogs */}
      <Dialog open={actionDialog?.type === "suspend"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Broker</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {actionDialog?.broker?.broker?.companyName}? They will no longer be able to manage listings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Suspension Reason (optional)</Label>
              <Textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter reason for suspension..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleStatusChange}>Suspend Broker</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog?.type === "reactivate"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Broker</DialogTitle>
            <DialogDescription>
              Are you sure you want to reactivate {actionDialog?.broker?.broker?.companyName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={handleStatusChange}>Reactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog?.type === "view"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Broker Details</DialogTitle>
          </DialogHeader>
          {actionDialog?.broker && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company Name</Label>
                  <p className="font-medium">{actionDialog.broker.broker.companyName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Website</Label>
                  <p>{actionDialog.broker.broker.companyWebsite || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Name</Label>
                  <p>{actionDialog.broker.broker.contactName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Email</Label>
                  <p>{actionDialog.broker.broker.contactEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p>{actionDialog.broker.broker.contactPhone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">License Number</Label>
                  <p>{actionDialog.broker.broker.licenseNumber || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Years Experience</Label>
                  <p>{actionDialog.broker.broker.yearsExperience || 0} years</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Deals Completed</Label>
                  <p>{actionDialog.broker.broker.totalDealsCompleted || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Earnings</Label>
                  <p className="text-green-600 font-medium">
                    ${((actionDialog.broker.broker.totalEarnings || 0) / 100).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Commission Rate</Label>
                  <p>{actionDialog.broker.broker.commissionRate}%</p>
                </div>
              </div>
              {actionDialog.broker.broker.bio && (
                <div>
                  <Label className="text-muted-foreground">Bio</Label>
                  <p className="text-sm mt-1">{actionDialog.broker.broker.bio}</p>
                </div>
              )}
              {actionDialog.broker.broker.suspensionReason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <Label className="text-red-700">Suspension Reason</Label>
                  <p className="text-sm text-red-600 mt-1">{actionDialog.broker.broker.suspensionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog?.type === "send_onboarding"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Onboarding Email</DialogTitle>
            <DialogDescription>
              Send an onboarding email to {actionDialog?.broker?.broker?.companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will send the welcome email from the onboarding sequence to the broker.
              The automated sequence will continue with follow-up emails on Day 1, Day 3, and Day 7.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={handleStatusChange}>
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Broker Settings Section Component
function BrokerSettingsSection() {
  const [commissionRate, setCommissionRate] = useState("50");
  const [minPayoutAmount, setMinPayoutAmount] = useState("100");
  const [onboardingEnabled, setOnboardingEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Commission Settings
          </CardTitle>
          <CardDescription>Configure broker commission rates and payout settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Default Commission Rate (%)</Label>
              <Input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of platform fees shared with brokers
              </p>
            </div>
            <div>
              <Label>Minimum Payout Amount ($)</Label>
              <Input
                type="number"
                value={minPayoutAmount}
                onChange={(e) => setMinPayoutAmount(e.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum balance required for payout requests
              </p>
            </div>
          </div>
          <Button>Save Commission Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Onboarding Email Sequence
          </CardTitle>
          <CardDescription>Configure automated emails sent to new brokers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Automatic Onboarding Emails</p>
              <p className="text-sm text-muted-foreground">
                Send welcome and follow-up emails to newly approved brokers
              </p>
            </div>
            <Button
              variant={onboardingEnabled ? "default" : "outline"}
              onClick={() => setOnboardingEnabled(!onboardingEnabled)}
            >
              {onboardingEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Email Sequence</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Send className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Welcome Email</p>
                    <p className="text-xs text-muted-foreground">Sent immediately upon approval</p>
                  </div>
                </div>
                <Badge variant="outline">Immediate</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Getting Started Guide</p>
                    <p className="text-xs text-muted-foreground">Platform features and first steps</p>
                  </div>
                </div>
                <Badge variant="outline">Day 1</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Best Practices</p>
                    <p className="text-xs text-muted-foreground">Tips for successful listings</p>
                  </div>
                </div>
                <Badge variant="outline">Day 3</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Success Stories</p>
                    <p className="text-xs text-muted-foreground">Case studies and advanced features</p>
                  </div>
                </div>
                <Badge variant="outline">Day 7</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contract Requirements
          </CardTitle>
          <CardDescription>Configure requirements for broker listing contracts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Contract Upload</p>
                <p className="text-sm text-muted-foreground">Brokers must upload a signed contract for each listing</p>
              </div>
              <Badge variant="default">Required</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Admin Verification</p>
                <p className="text-sm text-muted-foreground">Contracts must be verified before listings go live</p>
              </div>
              <Badge variant="default">Required</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Contract Expiration Alerts</p>
                <p className="text-sm text-muted-foreground">Notify brokers when contracts are expiring</p>
              </div>
              <Badge variant="outline">30 days before</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BrokersTab;
