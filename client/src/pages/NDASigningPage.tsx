import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { NDASigningModal } from "@/components/NDASigningModal";
import { format } from "date-fns";

interface NDASigningPageProps {
  dealId: number;
  ndaSigningId: number;
}

/**
 * NDA Signing Page
 * 
 * Displays NDA status and allows users to sign NDAs for deals
 * Integrates with NDASigningModal for the actual signing workflow
 */
export default function NDASigningPage({ dealId, ndaSigningId }: NDASigningPageProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [showSigningModal, setShowSigningModal] = useState(false);

  // Fetch NDA status
  const { data: ndaStatus, isLoading: isLoadingStatus, refetch } = trpc.ndaSigning.getNDAStatus.useQuery(
    { dealId },
    { enabled: isAuthenticated && !!dealId }
  );

  // Fetch NDA details
  const { data: ndaSigning, isLoading: isLoadingNDA } = trpc.ndaSigning.getNDASigning.useQuery(
    { ndaSigningId },
    { enabled: isAuthenticated && showSigningModal && !!ndaSigningId }
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="text-muted-foreground">Please log in to sign NDAs.</p>
      </div>
    );
  }

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ndaStatus?.exists) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>No NDA Found</CardTitle>
            <CardDescription>
              There is no NDA associated with this deal yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isExpired = ndaStatus.isExpired;
  const isFullySigned = ndaStatus.status === "fully_signed";
  const userHasSigned = user?.id === user?.id; // Placeholder - actual logic in modal
  const otherPartySigned = ndaStatus.buyerSigned || ndaStatus.sellerSigned;

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">NDA Signing</h1>
        <p className="text-muted-foreground">
          Review and sign the Non-Disclosure Agreement for this deal
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Buyer Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buyer Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {ndaStatus.buyerSigned ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Signed</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Pending</span>
                </>
              )}
            </div>
            {ndaStatus.buyerSigned && (
              <p className="text-xs text-muted-foreground mt-2">
                Signed on {format(new Date(ndaStatus.fullySignedAt || new Date()), "PPpp")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Seller Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Seller Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {ndaStatus.sellerSigned ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Signed</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Pending</span>
                </>
              )}
            </div>
            {ndaStatus.sellerSigned && (
              <p className="text-xs text-muted-foreground mt-2">
                Signed on {format(new Date(ndaStatus.fullySignedAt || new Date()), "PPpp")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Overall Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Overall Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isFullySigned ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Fully Signed</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium capitalize">{ndaStatus.status}</span>
                </>
              )}
            </div>
            {ndaStatus.expiresAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Expires {format(new Date(ndaStatus.expiresAt), "PPP")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The NDA signing window has expired. No further signatures can be added.
          </AlertDescription>
        </Alert>
      )}

      {isFullySigned && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            This NDA has been fully signed by both parties and is now in effect.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sign NDA</CardTitle>
          <CardDescription>
            {isFullySigned
              ? "This NDA has been fully executed by both parties."
              : isExpired
              ? "The signing window for this NDA has expired."
              : "Click below to review and sign the NDA."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowSigningModal(true)}
            disabled={isExpired || isFullySigned}
            size="lg"
          >
            {isFullySigned ? "NDA Signed" : isExpired ? "Signing Window Expired" : "Sign NDA"}
          </Button>
        </CardContent>
      </Card>

      {/* NDA Signing Modal */}
      <NDASigningModal
        open={showSigningModal}
        onOpenChange={setShowSigningModal}
        ndaSigningId={ndaSigningId}
        dealId={dealId}
        onSigningComplete={() => {
          refetch();
          setShowSigningModal(false);
        }}
      />
    </div>
  );
}
