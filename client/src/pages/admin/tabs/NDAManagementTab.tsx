import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function NDAManagementTab() {
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [showVoidDialog, setShowVoidDialog] = useState(false);

  // Fetch all NDA signings (admin can see all)
  const { data: ndaSignings, isLoading, refetch } = trpc.ndaSigning.adminGetAllNDAs.useQuery();

  // Void NDA mutation
  const voidMutation = trpc.ndaSigning.voidNDASigning.useMutation({
    onSuccess: () => {
      toast.success("NDA voided successfully");
      refetch();
      setShowVoidDialog(false);
      setVoidingId(null);
    },
    onError: (error) => {
      toast.error(`Failed to void NDA: ${error.message}`);
    },
  });

  const handleVoidClick = (ndaId: number) => {
    setVoidingId(ndaId);
    setShowVoidDialog(true);
  };

  const confirmVoid = () => {
    if (voidingId) {
      voidMutation.mutate({ ndaSigningId: voidingId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "fully_signed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Fully Signed
          </Badge>
        );
      case "buyer_signed":
        return (
          <Badge variant="default" className="bg-amber-500">
            <Clock className="h-3 w-3 mr-1" />
            Buyer Signed
          </Badge>
        );
      case "seller_signed":
        return (
          <Badge variant="default" className="bg-amber-500">
            <Clock className="h-3 w-3 mr-1" />
            Seller Signed
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case "voided":
        return (
          <Badge variant="outline">
            <XCircle className="h-3 w-3 mr-1" />
            Voided
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSignatureStatus = (signedAt: string | null) => {
    if (signedAt) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">{format(new Date(signedAt), "MMM d, yyyy")}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="text-sm">Not signed</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const stats = {
    total: ndaSignings?.length || 0,
    complete: ndaSignings?.filter((nda) => nda.status === "fully_signed").length || 0,
    partial: ndaSignings?.filter((nda) => nda.status === "partially_signed").length || 0,
    pending: ndaSignings?.filter((nda) => nda.status === "pending").length || 0,
    expired: ndaSignings?.filter((nda) => nda.status === "expired").length || 0,
    revoked: ndaSignings?.filter((nda) => nda.status === "revoked").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total NDAs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.partial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revoked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{stats.revoked}</div>
          </CardContent>
        </Card>
      </div>

      {/* NDA List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All NDA Signings
          </CardTitle>
          <CardDescription>
            Manage and monitor all NDA signings across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ndaSignings || ndaSignings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No NDA signings found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ndaSignings.map((nda) => (
                    <TableRow key={nda.id}>
                      <TableCell className="font-medium">#{nda.dealId}</TableCell>
                      <TableCell>{getStatusBadge(nda.status)}</TableCell>
                      <TableCell>{getSignatureStatus(nda.buyerSignedAt)}</TableCell>
                      <TableCell>{getSignatureStatus(nda.sellerSignedAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {nda.createdAt ? format(new Date(nda.createdAt), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {nda.expiresAt ? format(new Date(nda.expiresAt), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        {nda.status !== "revoked" && nda.status !== "fully_signed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVoidClick(nda.id)}
                            disabled={voidMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Void
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Void Confirmation Dialog */}
      <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void NDA Signing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will void the NDA signing and prevent both parties from signing. This action
              cannot be undone. The deal participants will need to create a new NDA if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVoid} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {voidMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Voiding...
                </>
              ) : (
                "Void NDA"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
