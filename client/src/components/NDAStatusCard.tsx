import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, FileSignature, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { NDASigningModal } from "./NDASigningModal";

interface NDAStatusCardProps {
  dealId: number;
  isBuyer: boolean;
  isSeller: boolean;
}

export function NDAStatusCard({ dealId, isBuyer, isSeller }: NDAStatusCardProps) {
  const [showSigningModal, setShowSigningModal] = useState(false);

  // Fetch NDA status for this deal
  const { data: ndaStatus, isLoading, refetch } = trpc.ndaSigning.getNDAStatus.useQuery({ dealId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!ndaStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            NDA Status
          </CardTitle>
          <CardDescription>No NDA has been created for this deal yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            An NDA will be automatically created when the deal progresses.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (ndaStatus.status) {
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
            Pending Signatures
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
        return <Badge variant="secondary">{ndaStatus.status}</Badge>;
    }
  };

  const canSign = () => {
    if (ndaStatus.status === "expired" || ndaStatus.status === "voided" || ndaStatus.status === "fully_signed") {
      return false;
    }
    if (isBuyer && !ndaStatus.buyerSigned) return true;
    if (isSeller && !ndaStatus.sellerSigned) return true;
    return false;
  };

  const getSigningMessage = () => {
    if (ndaStatus.status === "fully_signed") {
      return "Both parties have signed the NDA. You can now proceed with the deal.";
    }
    if (ndaStatus.status === "expired") {
      return "The NDA signing window has expired. Please contact support to renew.";
    }
    if (ndaStatus.status === "voided") {
      return "This NDA has been voided. A new NDA may need to be created.";
    }
    
    if (isBuyer) {
      if (ndaStatus.buyerSigned) {
        return "You have signed the NDA. Waiting for seller to sign.";
      } else {
        return "Please sign the NDA to proceed with the deal.";
      }
    }
    
    if (isSeller) {
      if (ndaStatus.sellerSigned) {
        return "You have signed the NDA. Waiting for buyer to sign.";
      } else {
        return "Please sign the NDA to proceed with the deal.";
      }
    }
    
    return "NDA signatures are pending.";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                NDA Status
              </CardTitle>
              <CardDescription>Non-Disclosure Agreement for this deal</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signing Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {ndaStatus.buyerSigned ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">Buyer</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {ndaStatus.buyerSigned && ndaStatus.buyerSignedAt
                  ? `Signed ${format(new Date(ndaStatus.buyerSignedAt), "MMM d, yyyy")}`
                  : "Not signed"}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {ndaStatus.sellerSigned ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">Seller</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {ndaStatus.sellerSigned && ndaStatus.sellerSignedAt
                  ? `Signed ${format(new Date(ndaStatus.sellerSignedAt), "MMM d, yyyy")}`
                  : "Not signed"}
              </div>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground">{getSigningMessage()}</p>

          {/* Expiration */}
          {ndaStatus.expiresAt && ndaStatus.status !== "fully_signed" && ndaStatus.status !== "voided" && (
            <div className="text-sm text-muted-foreground">
              Expires on {format(new Date(ndaStatus.expiresAt), "MMMM d, yyyy")}
            </div>
          )}

          {/* Sign Button */}
          {canSign() && (
            <Button onClick={() => setShowSigningModal(true)} className="w-full">
              <FileSignature className="h-4 w-4 mr-2" />
              Sign NDA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* NDA Signing Modal */}
      {ndaStatus && ndaStatus.exists && ndaStatus.id && (
        <NDASigningModal
          open={showSigningModal}
          onOpenChange={(open) => {
            setShowSigningModal(open);
            if (!open) {
              refetch();
            }
          }}
          ndaSigningId={ndaStatus.id}
          dealId={dealId}
          onSigningComplete={() => {
            setShowSigningModal(false);
            refetch();
          }}
        />
      )}
    </>
  );
}
