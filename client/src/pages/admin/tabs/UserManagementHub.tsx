import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Users,
  ShieldCheck,
  Award,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  UserCheck,
  RotateCcw,
  StickyNote,
  DollarSign,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";

// User Context Panel Component
function UserContextPanel({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data, isLoading } = trpc.userManagementHub.getUserDetails.useQuery({ userId });
  const [newNote, setNewNote] = useState("");
  const [noteCategory, setNoteCategory] = useState<string>("general");
  
  const addNoteMutation = trpc.userManagementHub.addUserNote.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setNewNote("");
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { user, documents, notes } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">User Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{user.name || "Unnamed User"}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Company</span>
            <span>{user.companyName || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span>{user.phoneNumber || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span>{user.location || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">KYC Status</span>
            <Badge variant={user.kycStatus === "verified" ? "default" : user.kycStatus === "pending" ? "secondary" : "destructive"}>
              {user.kycStatus}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Joined</span>
            <span>{user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}</span>
          </div>
          {user.affiliateId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Affiliate</span>
              <Badge variant="outline">
                {user.affiliateStatus} - {user.affiliateReferralCode}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">KYC Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{doc.documentType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.reviewStatus === "approved" ? "default" : doc.reviewStatus === "rejected" ? "destructive" : "secondary"}>
                      {doc.reviewStatus}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Internal Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note about this user..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Select value={noteCategory} onValueChange={setNoteCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="kyc">KYC</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="fraud">Fraud</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => addNoteMutation.mutate({ userId, content: newNote, category: noteCategory as any })}
                disabled={!newNote.trim() || addNoteMutation.isPending}
              >
                Add Note
              </Button>
            </div>
          </div>

          {notes.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notes.map((note: any) => (
                <div key={note.id} className="p-2 border rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">{note.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {note.createdAt ? format(new Date(note.createdAt), "MMM d, yyyy") : ""}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">By {note.authorName}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Users Tab Component
function UsersTab({ onSelectUser }: { onSelectUser: (userId: number) => void }) {
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.userManagementHub.getUsers.useQuery({
    search: search || undefined,
    kycStatus: kycFilter as any,
    page,
    limit: 20,
  });

  const updateStatusMutation = trpc.userManagementHub.updateUserStatus.useMutation({
    onSuccess: () => {
      toast.success("User status updated");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label className="text-sm">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-40">
          <Label className="text-sm">KYC Status</Label>
          <Select value={kycFilter} onValueChange={setKycFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Affiliate</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name || "Unnamed"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{user.companyName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={
                      user.kycStatus === "verified" ? "default" :
                      user.kycStatus === "pending" ? "secondary" :
                      user.kycStatus === "rejected" ? "destructive" : "outline"
                    }>
                      {user.kycStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.affiliateId ? (
                      <Badge variant="outline">{user.affiliateStatus}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onSelectUser(user.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user.kycStatus !== "rejected" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ userId: user.id, action: "suspend" })}
                        >
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ userId: user.id, action: "activate" })}
                        >
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// KYC Review Tab Component
function KYCReviewTab({ onSelectUser }: { onSelectUser: (userId: number) => void }) {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data, isLoading, refetch } = trpc.userManagementHub.getKYCQueue.useQuery({
    status: statusFilter as any,
  });

  const approveMutation = trpc.userManagementHub.approveKYC.useMutation({
    onSuccess: () => {
      toast.success("KYC approved");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const rejectMutation = trpc.userManagementHub.rejectKYC.useMutation({
    onSuccess: () => {
      toast.success("KYC rejected");
      setShowRejectDialog(false);
      setRejectionReason("");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter("pending")}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{data.summary.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter("approved")}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{data.summary.approved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter("rejected")}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{data.summary.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submissions</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data?.submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No KYC submissions in this category</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{submission.name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">{submission.email}</p>
                  </div>
                </TableCell>
                <TableCell>{submission.companyName || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{submission.kycMethod || "manual"}</Badge>
                </TableCell>
                <TableCell>
                  {submission.kycSubmittedAt ? format(new Date(submission.kycSubmittedAt), "MMM d, yyyy") : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    submission.kycStatus === "verified" ? "default" :
                    submission.kycStatus === "pending" ? "secondary" : "destructive"
                  }>
                    {submission.kycStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onSelectUser(submission.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {submission.kycStatus === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => approveMutation.mutate({ userId: submission.id })}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(submission.id);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUserId && rejectMutation.mutate({ userId: selectedUserId, reason: rejectionReason })}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Affiliates Tab Component
function AffiliatesTab({ onSelectUser }: { onSelectUser: (userId: number) => void }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedAffiliate, setSelectedAffiliate] = useState<number | null>(null);
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [newTierId, setNewTierId] = useState<string>("");

  const { data, isLoading, refetch } = trpc.userManagementHub.getAffiliates.useQuery({
    status: statusFilter as any,
    page,
    limit: 20,
  });

  const { data: affiliateDetails } = trpc.userManagementHub.getAffiliateDetails.useQuery(
    { affiliateId: selectedAffiliate! },
    { enabled: !!selectedAffiliate }
  );

  const updateStatusMutation = trpc.userManagementHub.updateAffiliateStatus.useMutation({
    onSuccess: () => {
      toast.success("Affiliate status updated");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateTierMutation = trpc.userManagementHub.updateAffiliateTier.useMutation({
    onSuccess: () => {
      toast.success("Affiliate tier updated");
      setShowTierDialog(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Affiliates</p>
                  <p className="text-2xl font-bold">{data.summary.totalActive}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Applications</p>
                  <p className="text-2xl font-bold">{data.summary.pendingApplications}</p>
                </div>
                <UserPlus className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold">{data.summary.totalReferrals}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">${(data.summary.totalEarnings / 100).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Affiliates</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Affiliates Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data?.affiliates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No affiliates in this category</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Affiliate</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Referrals</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.affiliates.map((affiliate) => (
              <TableRow key={affiliate.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{affiliate.userName || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">{affiliate.userEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{affiliate.referralCode}</code>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {affiliate.tierName} ({affiliate.commissionPercent}%)
                  </Badge>
                </TableCell>
                <TableCell>
                  {affiliate.successfulReferrals}/{affiliate.totalReferrals}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">${(affiliate.totalEarnings / 100).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      ${(affiliate.pendingEarnings / 100).toLocaleString()} pending
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    affiliate.status === "active" ? "default" :
                    affiliate.status === "pending" ? "secondary" :
                    affiliate.status === "suspended" ? "destructive" : "outline"
                  }>
                    {affiliate.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onSelectUser(affiliate.userId)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {affiliate.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ affiliateId: affiliate.id, status: "active" })}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ affiliateId: affiliate.id, status: "rejected", reason: "Application not approved" })}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    {affiliate.status === "active" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAffiliate(affiliate.id);
                            setShowTierDialog(true);
                          }}
                        >
                          <Award className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ affiliateId: affiliate.id, status: "suspended" })}
                        >
                          <Ban className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    {affiliate.status === "suspended" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ affiliateId: affiliate.id, status: "active" })}
                      >
                        <RotateCcw className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} affiliates
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tier Update Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Commission Tier</DialogTitle>
            <DialogDescription>
              Select a new commission tier for this affiliate.
            </DialogDescription>
          </DialogHeader>
          {affiliateDetails?.availableTiers && (
            <Select value={newTierId} onValueChange={setNewTierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {affiliateDetails.availableTiers.map((tier: any) => (
                  <SelectItem key={tier.id} value={tier.id.toString()}>
                    {tier.name} - {tier.commissionPercent}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTierDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedAffiliate && newTierId && updateTierMutation.mutate({ affiliateId: selectedAffiliate, tierId: parseInt(newTierId) })}
              disabled={!newTierId || updateTierMutation.isPending}
            >
              Update Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main User Management Hub Component
export default function UserManagementHub() {
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: metrics } = trpc.userManagementHub.getHubMetrics.useQuery();

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className={`flex-1 ${selectedUserId ? "max-w-[calc(100%-400px)]" : ""}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management Hub
            </CardTitle>
            <CardDescription>
              Manage users, KYC verification, and affiliate program from one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Overview Metrics */}
            {metrics && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{metrics.users.total}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{metrics.users.verified}</p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{metrics.users.pendingKYC}</p>
                  <p className="text-sm text-muted-foreground">Pending KYC</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{metrics.affiliates.total}</p>
                  <p className="text-sm text-muted-foreground">Active Affiliates</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="kyc" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  KYC Review
                  {metrics && metrics.users.pendingKYC > 0 && (
                    <Badge variant="destructive" className="ml-1">{metrics.users.pendingKYC}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="affiliates" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Affiliates
                  {metrics && metrics.affiliates.pending > 0 && (
                    <Badge variant="secondary" className="ml-1">{metrics.affiliates.pending}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-6">
                <UsersTab onSelectUser={setSelectedUserId} />
              </TabsContent>

              <TabsContent value="kyc" className="mt-6">
                <KYCReviewTab onSelectUser={setSelectedUserId} />
              </TabsContent>

              <TabsContent value="affiliates" className="mt-6">
                <AffiliatesTab onSelectUser={setSelectedUserId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* User Context Panel */}
      {selectedUserId && (
        <div className="w-96 shrink-0">
          <Card className="sticky top-4">
            <CardContent className="pt-6">
              <UserContextPanel userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
