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
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Briefcase,
  Scale,
  Calculator,
  FileSearch,
  UserCog,
  Crown,
  Star,
  Eye,
  Ban,
  RefreshCw,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { Link } from "wouter";

const PROFESSIONAL_TYPES = [
  { value: "broker", label: "M&A Broker", icon: Briefcase },
  { value: "lawyer", label: "M&A Attorney", icon: Scale },
  { value: "accountant", label: "CPA / Financial Advisor", icon: Calculator },
  { value: "due_diligence", label: "Due Diligence Specialist", icon: FileSearch },
  { value: "valuation", label: "Valuation Expert", icon: Calculator },
  { value: "consultant", label: "M&A Consultant", icon: UserCog },
  { value: "other", label: "Other", icon: Users },
] as const;

const STATUS_CONFIG = {
  pending: { label: "Pending Review", className: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  active: { label: "Active", className: "bg-green-100 text-green-800", icon: CheckCircle },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-800", icon: Ban },
  rejected: { label: "Rejected", className: "bg-gray-100 text-gray-800", icon: XCircle },
};

const TIER_CONFIG = {
  basic: { label: "Basic", className: "bg-gray-100 text-gray-700" },
  professional: { label: "Professional", className: "bg-blue-100 text-blue-700" },
  premium: { label: "Premium", className: "bg-amber-100 text-amber-700" },
};

export default function ProfessionalsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ type: "approve" | "reject" | "suspend" | "reactivate"; professional: any } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading, refetch } = trpc.professional.adminList.useQuery({
    search: search || undefined,
    status: statusFilter as any || undefined,
    type: typeFilter as any || undefined,
    limit: 50,
    offset: 0,
  });

  const { data: stats } = trpc.professional.getStats.useQuery();

  const approveMutation = trpc.professional.adminApprove.useMutation({
    onSuccess: () => {
      toast.success("Professional approved");
      refetch();
      setActionDialog(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const rejectMutation = trpc.professional.adminReject.useMutation({
    onSuccess: () => {
      toast.success("Professional rejected");
      refetch();
      setActionDialog(null);
      setRejectionReason("");
    },
    onError: (error) => toast.error(error.message),
  });

  const suspendMutation = trpc.professional.adminSuspend.useMutation({
    onSuccess: () => {
      toast.success("Professional suspended");
      refetch();
      setActionDialog(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const reactivateMutation = trpc.professional.adminReactivate.useMutation({
    onSuccess: () => {
      toast.success("Professional reactivated");
      refetch();
      setActionDialog(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleAction = () => {
    if (!actionDialog) return;

    switch (actionDialog.type) {
      case "approve":
        approveMutation.mutate({ id: actionDialog.professional.id });
        break;
      case "reject":
        rejectMutation.mutate({ id: actionDialog.professional.id, reason: rejectionReason || undefined });
        break;
      case "suspend":
        suspendMutation.mutate({ id: actionDialog.professional.id });
        break;
      case "reactivate":
        reactivateMutation.mutate({ id: actionDialog.professional.id });
        break;
    }
  };

  const pendingCount = stats?.byStatus?.pending || 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Professionals</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? "ring-2 ring-yellow-400" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <AlertCircle className={`w-8 h-8 ${pendingCount > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats?.byStatus?.active || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.byTier?.premium || 0}</p>
              </div>
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications Alert */}
      {pendingCount > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-10 h-10 text-yellow-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">
                  {pendingCount} Application{pendingCount > 1 ? "s" : ""} Pending Review
                </h3>
                <p className="text-sm text-yellow-700">
                  New professionals are waiting for approval to appear in the directory.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                onClick={() => setStatusFilter("pending")}
              >
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Directory Management</CardTitle>
          <CardDescription>Review, approve, and manage professional listings</CardDescription>
        </CardHeader>
        <CardContent>
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
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {PROFESSIONAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Professionals List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : data?.professionals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No professionals found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.professionals.map((pro) => {
                const TypeIcon = PROFESSIONAL_TYPES.find(t => t.value === pro.type)?.icon || Users;
                const statusConfig = STATUS_CONFIG[pro.status as keyof typeof STATUS_CONFIG];
                const tierConfig = TIER_CONFIG[pro.tier as keyof typeof TIER_CONFIG];

                return (
                  <div
                    key={pro.id}
                    className={`border rounded-lg p-4 ${pro.status === "pending" ? "bg-yellow-50 border-yellow-200" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        pro.tier === 'premium' ? 'bg-amber-100' : pro.tier === 'professional' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <TypeIcon className={`w-6 h-6 ${
                          pro.tier === 'premium' ? 'text-amber-600' : pro.tier === 'professional' ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{pro.name}</span>
                          {pro.verified && (
                            <Badge className="bg-green-600 text-white text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                          <Badge className={tierConfig.className}>
                            {pro.tier === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                            {pro.tier === 'professional' && <Star className="w-3 h-3 mr-1" />}
                            {tierConfig.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span>{PROFESSIONAL_TYPES.find(t => t.value === pro.type)?.label}</span>
                          {pro.companyName && <span>• {pro.companyName}</span>}
                          {pro.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {pro.location}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {pro.email && (
                            <a href={`mailto:${pro.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                              <Mail className="w-3 h-3" />
                              {pro.email}
                            </a>
                          )}
                          {pro.phone && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {pro.phone}
                            </span>
                          )}
                        </div>

                        {pro.bio && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{pro.bio}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link href={`/professionals/${pro.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>

                        {pro.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => setActionDialog({ type: "approve", professional: pro })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setActionDialog({ type: "reject", professional: pro })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {pro.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setActionDialog({ type: "suspend", professional: pro })}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                        )}

                        {(pro.status === "suspended" || pro.status === "rejected") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:bg-green-50"
                            onClick={() => setActionDialog({ type: "reactivate", professional: pro })}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "approve" && "Approve Professional"}
              {actionDialog?.type === "reject" && "Reject Professional"}
              {actionDialog?.type === "suspend" && "Suspend Professional"}
              {actionDialog?.type === "reactivate" && "Reactivate Professional"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === "approve" && `Are you sure you want to approve ${actionDialog.professional.name}? They will appear in the public directory.`}
              {actionDialog?.type === "reject" && `Are you sure you want to reject ${actionDialog.professional.name}? They will not appear in the directory.`}
              {actionDialog?.type === "suspend" && `Are you sure you want to suspend ${actionDialog.professional.name}? They will be hidden from the directory.`}
              {actionDialog?.type === "reactivate" && `Are you sure you want to reactivate ${actionDialog.professional.name}? They will appear in the directory again.`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog?.type === "reject" && (
            <div className="space-y-2">
              <Label>Rejection Reason (optional)</Label>
              <Textarea
                placeholder="Provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              className={
                actionDialog?.type === "approve" ? "bg-green-600 hover:bg-green-700" :
                actionDialog?.type === "reject" || actionDialog?.type === "suspend" ? "bg-red-600 hover:bg-red-700" :
                ""
              }
              disabled={approveMutation.isPending || rejectMutation.isPending || suspendMutation.isPending || reactivateMutation.isPending}
            >
              {actionDialog?.type === "approve" && "Approve"}
              {actionDialog?.type === "reject" && "Reject"}
              {actionDialog?.type === "suspend" && "Suspend"}
              {actionDialog?.type === "reactivate" && "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
