import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ExternalLink, FileText, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function KYCReviewTab() {
  const { data: pendingSubmissions, isLoading, refetch } = trpc.admin.kyc.getPendingSubmissions.useQuery();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const approveMutation = trpc.admin.kyc.approveKYC.useMutation({
    onSuccess: () => {
      toast.success("KYC approved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to approve KYC: " + error.message);
    },
  });

  const rejectMutation = trpc.admin.kyc.rejectKYC.useMutation({
    onSuccess: () => {
      toast.success("KYC rejected");
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedUserId(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to reject KYC: " + error.message);
    },
  });

  const handleApprove = (userId: number) => {
    if (confirm("Are you sure you want to approve this KYC submission?")) {
      approveMutation.mutate({ userId });
    }
  };

  const handleRejectClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedUserId) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({ userId: selectedUserId, reason: rejectionReason });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pendingSubmissions || pendingSubmissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Review Queue</CardTitle>
          <CardDescription>Review and approve user verification documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending KYC submissions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>KYC Review Queue</CardTitle>
          <CardDescription>
            {pendingSubmissions.length} pending submission{pendingSubmissions.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingSubmissions.map((submission) => (
              <Card key={submission.user.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{submission.user.name || "Unnamed User"}</CardTitle>
                      <CardDescription>
                        {submission.user.email}
                        <br />
                        Submitted: {new Date(submission.user.kycSubmittedAt!).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">User ID</p>
                      <p className="font-medium">#{submission.user.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Created</p>
                      <p className="font-medium">{new Date(submission.user.createdAt).toLocaleDateString()}</p>
                    </div>
                    {submission.user.companyName && (
                      <div>
                        <p className="text-muted-foreground">Company</p>
                        <p className="font-medium">{submission.user.companyName}</p>
                      </div>
                    )}
                    {submission.user.location && (
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">{submission.user.location}</p>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div>
                    <p className="text-sm font-medium mb-2">Uploaded Documents:</p>
                    <div className="space-y-2">
                      {submission.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">
                                {doc.documentType === "government_id" ? "Government ID" : "Proof of Address"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {doc.fileName} • {doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                              </p>
                            </div>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            View <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleApprove(submission.user.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectClick(submission.user.id)}
                      disabled={rejectMutation.isPending}
                      className="flex-1"
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this submission. The user will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Document is not clear, ID has expired, address proof is older than 3 months..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                className="flex-1"
              >
                {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Rejection
              </Button>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
