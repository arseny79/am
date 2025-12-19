import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

export default function CredentialsVerificationTab() {
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingCredentials, refetch } = trpc.professional.adminGetPendingCredentials.useQuery();

  const verifyCredential = trpc.professional.adminVerifyCredential.useMutation({
    onSuccess: () => {
      toast.success("Credential verified successfully");
      setSelectedCredential(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify credential");
    },
  });

  const rejectCredential = trpc.professional.adminVerifyCredential.useMutation({
    onSuccess: () => {
      toast.success("Credential rejected");
      setSelectedCredential(null);
      setShowRejectDialog(false);
      setRejectionReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject credential");
    },
  });

  const handleVerify = (credentialId: number) => {
    if (confirm("Are you sure you want to verify this credential?")) {
      verifyCredential.mutate({
        credentialId,
        status: "verified",
      });
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    rejectCredential.mutate({
      credentialId: selectedCredential.credential.id,
      status: "rejected",
      rejectionReason: rejectionReason.trim(),
    });
  };

  const getCredentialTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      license: "bg-blue-100 text-blue-800",
      certification: "bg-green-100 text-green-800",
      degree: "bg-purple-100 text-purple-800",
      insurance: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={colors[type] || colors.other}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Credential Verification</h2>
        <p className="text-muted-foreground">
          Review and verify professional credentials
        </p>
      </div>

      {!pendingCredentials || pendingCredentials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No pending credentials</p>
            <p className="text-sm text-muted-foreground">
              All credentials have been reviewed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingCredentials.map((item) => {
            const { credential, professional } = item;
            if (!credential || !professional) return null;

            return (
              <Card key={credential.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {credential.title}
                        {getCredentialTypeBadge(credential.credentialType)}
                      </CardTitle>
                      <CardDescription>
                        Submitted by: <span className="font-medium">{professional.name}</span>
                        {professional.email && ` (${professional.email})`}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {credential.issuingOrganization && (
                      <div>
                        <span className="text-muted-foreground">Issuing Organization:</span>
                        <p className="font-medium">{credential.issuingOrganization}</p>
                      </div>
                    )}
                    {credential.credentialNumber && (
                      <div>
                        <span className="text-muted-foreground">Credential Number:</span>
                        <p className="font-medium">{credential.credentialNumber}</p>
                      </div>
                    )}
                    {credential.issueDate && (
                      <div>
                        <span className="text-muted-foreground">Issue Date:</span>
                        <p className="font-medium">
                          {new Date(credential.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {credential.expiryDate && (
                      <div>
                        <span className="text-muted-foreground">Expiry Date:</span>
                        <p className="font-medium">
                          {new Date(credential.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {credential.fileName}
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => window.open(credential.fileUrl, "_blank")}
                      className="ml-auto"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Document
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleVerify(credential.id)}
                      disabled={verifyCredential.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedCredential(item);
                        setShowRejectDialog(true);
                      }}
                      disabled={rejectCredential.isPending}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Credential</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this credential. The professional will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Document is not clear, credential has expired, etc."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
                setSelectedCredential(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectCredential.isPending || !rejectionReason.trim()}
            >
              {rejectCredential.isPending ? "Rejecting..." : "Reject Credential"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
