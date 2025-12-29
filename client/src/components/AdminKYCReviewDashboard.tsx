import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, FileText, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface KYCSubmission {
  id: number;
  name: string | null;
  email: string | null;
  companyName: string | null;
  kycSubmittedAt: Date | null;
  kycVerified: boolean;
  kycRejectionReason: string | null;
}

interface KYCDocument {
  id: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
}

export function AdminKYCReviewDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Get pending submissions
  const pendingSubmissions = trpc.adminKYCReview.getPendingSubmissions.useQuery();

  // Get submission details
  const submissionDetails = trpc.adminKYCReview.getSubmissionDetails.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  // Approve mutation
  const approveMutation = trpc.adminKYCReview.approveSubmission.useMutation({
    onSuccess: () => {
      toast.success("KYC submission approved!");
      setSelectedUserId(null);
      pendingSubmissions.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve submission");
    },
  });

  // Reject mutation
  const rejectMutation = trpc.adminKYCReview.rejectSubmission.useMutation({
    onSuccess: () => {
      toast.success("KYC submission rejected!");
      setSelectedUserId(null);
      setRejectionReason("");
      setShowRejectDialog(false);
      pendingSubmissions.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject submission");
    },
  });

  const handleApprove = (userId: number) => {
    approveMutation.mutate({ userId });
  };

  const handleRejectClick = (userId: number) => {
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = (userId: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({ userId, rejectionReason });
  };

  if (pendingSubmissions.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  const submissions = pendingSubmissions.data || [];

  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Review Dashboard</CardTitle>
          <CardDescription>No pending KYC submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              All KYC submissions have been reviewed. Check back later for new submissions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>KYC Review Dashboard</CardTitle>
          <CardDescription>
            {submissions.length} pending submission{submissions.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{submission.name || "Unknown User"}</CardTitle>
                  <CardDescription>{submission.email}</CardDescription>
                  {submission.companyName && (
                    <p className="text-sm text-gray-600 mt-1">{submission.companyName}</p>
                  )}
                </div>
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Submitted: {submission.kycSubmittedAt ? format(new Date(submission.kycSubmittedAt), "PPP p") : "Unknown"}
              </div>

              <Button
                onClick={() => setSelectedUserId(submission.id)}
                variant="outline"
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {submissionDetails.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : submissionDetails.data ? (
            <>
              <DialogHeader>
                <DialogTitle>KYC Submission Review</DialogTitle>
                <DialogDescription>
                  {submissionDetails.data.user.name} - {submissionDetails.data.user.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* User Details */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">User Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium">{submissionDetails.data.user.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">{submissionDetails.data.user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Company</p>
                      <p className="font-medium">{submissionDetails.data.user.companyName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium">{submissionDetails.data.user.phoneNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium">{submissionDetails.data.user.location || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Submitted Documents</h3>
                  {submissionDetails.data.documents.length === 0 ? (
                    <p className="text-sm text-gray-600">No documents uploaded</p>
                  ) : (
                    <div className="space-y-2">
                      {submissionDetails.data.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {doc.documentType === "government_id" ? "Government ID" : "Proof of Address"}
                            </p>
                            <p className="text-xs text-gray-600">{doc.fileName}</p>
                            {doc.fileSize && (
                              <p className="text-xs text-gray-500">
                                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2"
                          >
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rejection Reason (if rejected) */}
                {submissionDetails.data.user.kycRejectionReason && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Previous Rejection Reason:</strong>
                      <p className="mt-2">{submissionDetails.data.user.kycRejectionReason}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleRejectClick(submissionDetails.data.user.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(submissionDetails.data.user.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. The user will receive an email with this reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason (e.g., 'Document is blurry and not legible', 'ID has expired', etc.)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-24"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUserId) {
                  handleRejectConfirm(selectedUserId);
                }
              }}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
