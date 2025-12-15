import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, DollarSign, TrendingUp, CheckCircle, XCircle, Pause, Play, Plus, Edit, Trash2, Percent } from "lucide-react";

export function AffiliatesTab() {
  const [activeSubTab, setActiveSubTab] = useState("overview");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Affiliate Program</h2>
          <p className="text-muted-foreground">Manage affiliates, tiers, and commissions</p>
        </div>
      </div>
      
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="tiers">Commission Tiers</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <AffiliateOverview />
        </TabsContent>
        
        <TabsContent value="affiliates">
          <AffiliateManagement />
        </TabsContent>
        
        <TabsContent value="tiers">
          <TierManagement />
        </TabsContent>
        
        <TabsContent value="commissions">
          <CommissionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AffiliateOverview() {
  const { data: affiliateStats } = trpc.affiliate.getStats.useQuery();
  const { data: referralStats } = trpc.referral.getStats.useQuery();
  const { data: commissionStats } = trpc.commission.getStats.useQuery();
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliateStats?.statusCounts?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {affiliateStats?.statusCounts?.pending || 0} pending approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {referralStats?.conversionRate || "0"}% conversion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(affiliateStats?.totals?.pendingEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissionStats?.byStatus?.pending?.count || 0} commissions pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(affiliateStats?.totals?.paidEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissionStats?.byStatus?.paid?.count || 0} commissions paid
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" onClick={() => {}}>
            <Users className="mr-2 h-4 w-4" />
            Review Pending ({affiliateStats?.statusCounts?.pending || 0})
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <DollarSign className="mr-2 h-4 w-4" />
            Process Payouts ({commissionStats?.byStatus?.approved?.count || 0})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AffiliateManagement() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "active" | "suspended" | "rejected" | undefined>(undefined);
  const [selectedAffiliate, setSelectedAffiliate] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  
  const utils = trpc.useUtils();
  const { data } = trpc.affiliate.getAllAffiliates.useQuery({ status: statusFilter });
  const { data: tiers } = trpc.affiliateTier.getAllAdmin.useQuery();
  
  const approveMutation = trpc.affiliate.approve.useMutation({
    onSuccess: () => {
      toast.success("Affiliate approved");
      utils.affiliate.getAllAffiliates.invalidate();
      utils.affiliate.getStats.invalidate();
    },
  });
  
  const rejectMutation = trpc.affiliate.reject.useMutation({
    onSuccess: () => {
      toast.success("Affiliate rejected");
      utils.affiliate.getAllAffiliates.invalidate();
      utils.affiliate.getStats.invalidate();
      setRejectReason("");
    },
  });
  
  const suspendMutation = trpc.affiliate.suspend.useMutation({
    onSuccess: () => {
      toast.success("Affiliate suspended");
      utils.affiliate.getAllAffiliates.invalidate();
      setSuspendReason("");
    },
  });
  
  const reactivateMutation = trpc.affiliate.reactivate.useMutation({
    onSuccess: () => {
      toast.success("Affiliate reactivated");
      utils.affiliate.getAllAffiliates.invalidate();
    },
  });
  
  const changeTierMutation = trpc.affiliate.changeTier.useMutation({
    onSuccess: () => {
      toast.success("Tier updated");
      utils.affiliate.getAllAffiliates.invalidate();
    },
  });
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "rejected":
        return <Badge variant="outline">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <Button 
          variant={statusFilter === undefined ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        <Button 
          variant={statusFilter === "pending" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("pending")}
        >
          Pending
        </Button>
        <Button 
          variant={statusFilter === "active" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("active")}
        >
          Active
        </Button>
        <Button 
          variant={statusFilter === "suspended" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("suspended")}
        >
          Suspended
        </Button>
      </div>
      
      {/* Affiliates Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Referral Code</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Referrals</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.affiliates?.map((affiliate) => (
              <TableRow key={affiliate.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{affiliate.userName || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">{affiliate.userEmail}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="bg-muted px-2 py-1 rounded">{affiliate.referralCode}</code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{affiliate.tierName}</span>
                    <span className="text-muted-foreground">({affiliate.commissionPercent}%)</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                <TableCell>
                  <div>
                    <div>{affiliate.successfulReferrals} / {affiliate.totalReferrals}</div>
                    <div className="text-xs text-muted-foreground">converted / total</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{formatCurrency(affiliate.totalEarnings)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(affiliate.pendingEarnings)} pending
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {affiliate.status === "pending" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => approveMutation.mutate({ affiliateId: affiliate.id })}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Affiliate</DialogTitle>
                              <DialogDescription>
                                Provide a reason for rejecting this affiliate application.
                              </DialogDescription>
                            </DialogHeader>
                            <Textarea
                              placeholder="Rejection reason..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <DialogFooter>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  rejectMutation.mutate({ 
                                    affiliateId: affiliate.id, 
                                    reason: rejectReason 
                                  });
                                }}
                                disabled={!rejectReason}
                              >
                                Reject
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                    
                    {affiliate.status === "active" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Pause className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Suspend Affiliate</DialogTitle>
                            <DialogDescription>
                              Provide a reason for suspending this affiliate.
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Suspension reason..."
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                          />
                          <DialogFooter>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                suspendMutation.mutate({ 
                                  affiliateId: affiliate.id, 
                                  reason: suspendReason 
                                });
                              }}
                              disabled={!suspendReason}
                            >
                              Suspend
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {affiliate.status === "suspended" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => reactivateMutation.mutate({ affiliateId: affiliate.id })}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {(!data?.affiliates || data.affiliates.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No affiliates found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function TierManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTier, setEditingTier] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    level: 1,
    name: "",
    commissionPercent: 25,
    minReferrals: 0,
    minEarnings: 0,
  });
  
  const utils = trpc.useUtils();
  const { data: tiers } = trpc.affiliateTier.getAllAdmin.useQuery();
  
  const createMutation = trpc.affiliateTier.create.useMutation({
    onSuccess: () => {
      toast.success("Tier created");
      utils.affiliateTier.getAllAdmin.invalidate();
      setIsCreating(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateMutation = trpc.affiliateTier.update.useMutation({
    onSuccess: () => {
      toast.success("Tier updated");
      utils.affiliateTier.getAllAdmin.invalidate();
      setEditingTier(null);
      resetForm();
    },
  });
  
  const deleteMutation = trpc.affiliateTier.delete.useMutation({
    onSuccess: () => {
      toast.success("Tier deleted");
      utils.affiliateTier.getAllAdmin.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const resetForm = () => {
    setFormData({
      level: (tiers?.length || 0) + 1,
      name: "",
      commissionPercent: 25,
      minReferrals: 0,
      minEarnings: 0,
    });
  };
  
  const handleSubmit = () => {
    if (editingTier) {
      updateMutation.mutate({
        id: editingTier,
        name: formData.name,
        commissionPercent: formData.commissionPercent,
        minReferrals: formData.minReferrals,
        minEarnings: formData.minEarnings,
      });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const startEditing = (tier: NonNullable<typeof tiers>[0]) => {
    setEditingTier(tier.id);
    setFormData({
      level: tier.level,
      name: tier.name,
      commissionPercent: parseFloat(tier.commissionPercent),
      minReferrals: tier.minReferrals,
      minEarnings: tier.minEarnings,
    });
    setIsCreating(true);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Commission Tiers</h3>
          <p className="text-sm text-muted-foreground">
            Configure affiliate commission levels and requirements
          </p>
        </div>
        <Button onClick={() => { setIsCreating(true); resetForm(); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tier
        </Button>
      </div>
      
      {/* Tier Form Dialog */}
      <Dialog open={isCreating} onOpenChange={(open) => { setIsCreating(open); if (!open) { setEditingTier(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTier ? "Edit Tier" : "Create New Tier"}</DialogTitle>
            <DialogDescription>
              Configure the commission tier settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Level</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                  disabled={!!editingTier}
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Gold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label>Commission Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={formData.commissionPercent}
                  onChange={(e) => setFormData({ ...formData, commissionPercent: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of platform fee (3%) paid to affiliate
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Referrals Required</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.minReferrals}
                  onChange={(e) => setFormData({ ...formData, minReferrals: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Min Earnings Required ($)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.minEarnings / 100}
                  onChange={(e) => setFormData({ ...formData, minEarnings: (parseFloat(e.target.value) || 0) * 100 })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreating(false); setEditingTier(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editingTier ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Tiers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Requirements</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers?.map((tier) => (
              <TableRow key={tier.id}>
                <TableCell>
                  <Badge variant="outline">Level {tier.level}</Badge>
                </TableCell>
                <TableCell className="font-medium">{tier.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{tier.commissionPercent}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {tier.minReferrals > 0 && <div>{tier.minReferrals} referrals</div>}
                    {tier.minEarnings > 0 && <div>${(tier.minEarnings / 100).toFixed(0)} earnings</div>}
                    {tier.minReferrals === 0 && tier.minEarnings === 0 && (
                      <span className="text-muted-foreground">No requirements</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {tier.isActive ? (
                    <Badge className="bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => startEditing(tier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this tier?")) {
                          deleteMutation.mutate({ id: tier.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {(!tiers || tiers.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No tiers configured. Create your first tier to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CommissionManagement() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "paid" | "cancelled" | undefined>(undefined);
  const [paymentRef, setPaymentRef] = useState("");
  
  const utils = trpc.useUtils();
  const { data: commissions } = trpc.commission.getAllCommissions.useQuery({ status: statusFilter });
  
  const approveMutation = trpc.commission.approveCommission.useMutation({
    onSuccess: () => {
      toast.success("Commission approved");
      utils.commission.getAllCommissions.invalidate();
      utils.commission.getStats.invalidate();
    },
  });
  
  const markPaidMutation = trpc.commission.markPaid.useMutation({
    onSuccess: () => {
      toast.success("Commission marked as paid");
      utils.commission.getAllCommissions.invalidate();
      utils.commission.getStats.invalidate();
      utils.affiliate.getStats.invalidate();
      setPaymentRef("");
    },
  });
  
  const cancelMutation = trpc.commission.cancelCommission.useMutation({
    onSuccess: () => {
      toast.success("Commission cancelled");
      utils.commission.getAllCommissions.invalidate();
      utils.commission.getStats.invalidate();
    },
  });
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "approved":
        return <Badge className="bg-blue-500">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <Button 
          variant={statusFilter === undefined ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        <Button 
          variant={statusFilter === "pending" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("pending")}
        >
          Pending
        </Button>
        <Button 
          variant={statusFilter === "approved" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("approved")}
        >
          Approved
        </Button>
        <Button 
          variant={statusFilter === "paid" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("paid")}
        >
          Paid
        </Button>
      </div>
      
      {/* Commissions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Deal Amount</TableHead>
              <TableHead>Platform Fee</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions?.map((commission) => (
              <TableRow key={commission.id}>
                <TableCell>#{commission.id}</TableCell>
                <TableCell>{formatCurrency(commission.dealAmount)}</TableCell>
                <TableCell>{formatCurrency(commission.platformFee)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(commission.commissionAmount)}</TableCell>
                <TableCell>{commission.commissionPercent}%</TableCell>
                <TableCell>{getStatusBadge(commission.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {commission.status === "pending" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => approveMutation.mutate({ commissionId: commission.id })}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            const reason = prompt("Cancellation reason:");
                            if (reason) {
                              cancelMutation.mutate({ commissionId: commission.id, reason });
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    
                    {commission.status === "approved" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Mark Paid
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Mark Commission as Paid</DialogTitle>
                            <DialogDescription>
                              Enter the payment reference (PayPal transaction ID, bank transfer ref, etc.)
                            </DialogDescription>
                          </DialogHeader>
                          <Input
                            placeholder="Payment reference..."
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                          />
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                markPaidMutation.mutate({ 
                                  commissionId: commission.id, 
                                  paymentReference: paymentRef 
                                });
                              }}
                              disabled={!paymentRef}
                            >
                              Confirm Payment
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {commission.status === "paid" && commission.paymentReference && (
                      <span className="text-xs text-muted-foreground">
                        Ref: {commission.paymentReference}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {(!commissions || commissions.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No commissions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
