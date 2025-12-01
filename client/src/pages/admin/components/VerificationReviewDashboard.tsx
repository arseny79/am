import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, XCircle, FileText, DollarSign, User, Calendar, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function VerificationReviewDashboard() {
  const { data: pendingVerifications, isLoading } = trpc.admin.verification.getPendingVerifications.useQuery();
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const utils = trpc.useUtils();

  const approveVerification = trpc.admin.verification.approveVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification approved!");
      utils.admin.verification.getPendingVerifications.invalidate();
      setSelectedVerification(null);
      setApprovalNotes("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectVerification = trpc.admin.verification.rejectVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification rejected");
      utils.admin.verification.getPendingVerifications.invalidate();
      setSelectedVerification(null);
      setRejectionReason("");
      setShowRejectDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = (verification: any) => {
    approveVerification.mutate({
      userId: verification.userId,
      adminNotes: approvalNotes || undefined,
    });
  };

  const handleReject = () => {
    if (!selectedVerification || !rejectionReason.trim() || rejectionReason.length < 10) {
      toast.error("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    rejectVerification.mutate({
      userId: selectedVerification.userId,
      reason: rejectionReason,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!pendingVerifications || pendingVerifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Review Queue</CardTitle>
          <CardDescription>No pending verifications to review</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">All caught up! No verifications waiting for review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Verification Review Queue</CardTitle>
          <CardDescription>
            {pendingVerifications.length} verification{pendingVerifications.length !== 1 ? "s" : ""} pending review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingVerifications.map((verification: any) => (
            <Card key={verification.id} className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {verification.user?.name || "Unknown User"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {verification.user?.email}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(verification.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{verification.identityFullName || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                    <p className="font-medium">{verification.identityDateOfBirth || "Not provided"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    <p className="font-medium">{verification.identityAddress || "Not provided"}</p>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <Label className="text-xs text-blue-700">Available Funds</Label>
                    <p className="font-bold text-blue-900 text-lg">
                      <DollarSign className="inline h-4 w-4" />
                      {verification.verifiedBalance
                        ? (verification.verifiedBalance / 100).toLocaleString()
                        : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-blue-700">Bank Name</Label>
                    <p className="font-medium text-blue-900">{verification.bankName || "Not provided"}</p>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs text-green-700">Payment Status</Label>
                      <p className="font-medium text-green-900">
                        Paid ${verification.amountPaid ? (verification.amountPaid / 100).toFixed(2) : "0.00"}
                      </p>
                    </div>
                    {verification.paidAt && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Paid {new Date(verification.paidAt).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Admin Notes Input */}
                <div className="space-y-2">
                  <Label htmlFor={`notes-${verification.id}`}>Admin Notes (Optional)</Label>
                  <Textarea
                    id={`notes-${verification.id}`}
                    placeholder="Add any notes about this verification..."
                    value={selectedVerification?.id === verification.id ? approvalNotes : ""}
                    onChange={(e) => {
                      setSelectedVerification(verification);
                      setApprovalNotes(e.target.value);
                    }}
                    rows={2}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setSelectedVerification(verification);
                    handleApprove(verification);
                  }}
                  disabled={approveVerification.isPending}
                >
                  {approveVerification.isPending && selectedVerification?.id === verification.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve Verification
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setSelectedVerification(verification);
                    setShowRejectDialog(true);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejecting this verification. The user will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., ID document is blurry and unreadable. Please upload a clear photo of your government-issued ID."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className={rejectionReason.length > 0 && rejectionReason.length < 10 ? "border-red-500" : ""}
              />
              <p className="text-sm text-muted-foreground">
                {rejectionReason.length}/10 characters minimum
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectVerification.isPending || rejectionReason.length < 10}
            >
              {rejectVerification.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
