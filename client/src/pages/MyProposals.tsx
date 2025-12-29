import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { toast } from "sonner";

export default function MyProposals() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: myProposals = [], isLoading, refetch } = trpc.buyerRequestProposal.getMy.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: myRequests = [] } = trpc.buyerRequest.getMy.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const acceptProposal = trpc.buyerRequestProposal.accept.useMutation({
    onSuccess: () => {
      toast.success("Proposal accepted!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to accept proposal");
    },
  });

  const declineProposal = trpc.buyerRequestProposal.decline.useMutation({
    onSuccess: () => {
      toast.success("Proposal declined");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to decline proposal");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to view your proposals and buyer requests
              </p>
              <a href={getLoginUrl()}>
                <Button>Sign In</Button>
              </a>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Get proposals received for my requests (I'm the buyer)
  const proposalsReceived = myRequests.flatMap((request) =>
    myProposals
      .filter((p) => p.requestId === request.id)
      .map((p) => ({ ...p, myRequest: request }))
  );

  // Get proposals I submitted (I'm the seller)
  const proposalsSubmitted = myProposals.filter((p) =>
    myRequests.every((r) => r.id !== p.requestId)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Proposals</h1>
            <p className="text-muted-foreground">
              Manage proposals you've submitted and received
            </p>
          </div>

          <Tabs defaultValue="received" className="space-y-6">
            <TabsList>
              <TabsTrigger value="received">
                Received ({proposalsReceived.length})
              </TabsTrigger>
              <TabsTrigger value="submitted">
                Submitted ({proposalsSubmitted.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4">
              {proposalsReceived.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">
                      No proposals received yet. Post a buyer request to get started!
                    </p>
                    <div className="text-center">
                      <Link href="/buy-asset">
                        <Button>Post Buyer Request</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                proposalsReceived.map((proposal) => (
                  <Card key={proposal.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {proposal.listing?.businessName || "Listing"}
                          </CardTitle>
                          <CardDescription>
                            For your request: {proposal.request?.title}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            proposal.status === "accepted"
                              ? "default"
                              : proposal.status === "declined"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {proposal.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {proposal.status === "accepted" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {proposal.status === "declined" && <XCircle className="h-3 w-3 mr-1" />}
                          {proposal.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {proposal.listing && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Revenue</p>
                            <p className="font-semibold">
                              ${(proposal.listing.annualRevenue || 0).toLocaleString()}
                            </p>
                          </div>
                          {proposal.listing.ebitda && (
                            <div>
                              <p className="text-muted-foreground">EBITDA</p>
                              <p className="font-semibold">
                                ${proposal.listing.ebitda.toLocaleString()}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p className="font-semibold">{proposal.listing.location}</p>
                          </div>
                          {proposal.listing.clientCount && (
                            <div>
                              <p className="text-muted-foreground">Clients</p>
                              <p className="font-semibold">{proposal.listing.clientCount}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {proposal.proposalMessage && (
                        <div className="rounded-lg bg-muted p-4">
                          <p className="text-sm font-medium mb-1">Seller's Message:</p>
                          <p className="text-sm text-muted-foreground">
                            {proposal.proposalMessage}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {proposal.status === "pending" && (
                          <>
                            <Button
                              onClick={() => acceptProposal.mutate({ proposalId: proposal.id })}
                              disabled={acceptProposal.isPending || declineProposal.isPending}
                            >
                              {acceptProposal.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                              )}
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => declineProposal.mutate({ proposalId: proposal.id })}
                              disabled={acceptProposal.isPending || declineProposal.isPending}
                            >
                              {declineProposal.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                              )}
                              Decline
                            </Button>
                          </>
                        )}
                        {proposal.dealId && (
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/deal-room/${proposal.dealId}`)}
                          >
                            View Deal
                          </Button>
                        )}
                        {proposal.listing && (
                          <Button
                            variant="ghost"
                            onClick={() => navigate(`/listing/${proposal.listingId}`)}
                          >
                            View Full Listing
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(proposal.createdAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="submitted" className="space-y-4">
              {proposalsSubmitted.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">
                      You haven't submitted any proposals yet. Browse buyer requests to get started!
                    </p>
                    <div className="text-center">
                      <Link href="/buy-asset">
                        <Button>Browse Buyer Requests</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                proposalsSubmitted.map((proposal) => (
                  <Card key={proposal.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {proposal.request?.title || "Buyer Request"}
                          </CardTitle>
                          <CardDescription>
                            Your listing: {proposal.listing?.businessName}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            proposal.status === "accepted"
                              ? "default"
                              : proposal.status === "declined"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {proposal.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {proposal.status === "accepted" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {proposal.status === "declined" && <XCircle className="h-3 w-3 mr-1" />}
                          {proposal.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {proposal.request && (
                        <div className="rounded-lg bg-muted p-4">
                          <p className="text-sm font-medium mb-2">Buyer's Requirements:</p>
                          <p className="text-sm text-muted-foreground mb-3">
                            {proposal.request.description}
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {proposal.request.minRevenue && (
                              <div>
                                <span className="text-muted-foreground">Min Revenue: </span>
                                <span className="font-medium">
                                  ${proposal.request.minRevenue.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {proposal.request.maxRevenue && (
                              <div>
                                <span className="text-muted-foreground">Max Revenue: </span>
                                <span className="font-medium">
                                  ${proposal.request.maxRevenue.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {proposal.proposalMessage && (
                        <div className="rounded-lg border p-4">
                          <p className="text-sm font-medium mb-1">Your Message:</p>
                          <p className="text-sm text-muted-foreground">
                            {proposal.proposalMessage}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {proposal.dealId && (
                          <Button onClick={() => navigate(`/deal-room/${proposal.dealId}`)}>
                            View Deal
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(proposal.createdAt).toLocaleString()}
                        {proposal.respondedAt &&
                          ` • Responded ${new Date(proposal.respondedAt).toLocaleString()}`}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
