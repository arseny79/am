import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, MessageSquare, Loader2, Mail, Phone, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AccessRequests() {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseType, setResponseType] = useState<"approved" | "declined" | "more_info_requested">("approved");
  const [sellerResponse, setSellerResponse] = useState("");

  // Get all listings by current user
  const { data: myListings } = trpc.listing.getMy.useQuery();

  // Get access requests for all my listings
  const listingIds = myListings?.map((l: any) => l.id) || [];
  const accessRequestQueries = listingIds.map((listingId: number) =>
    trpc.accessRequest.getByListing.useQuery({ listingId })
  );

  const allRequests = accessRequestQueries.flatMap((q: any) => q.data || []);

  const respondMutation = trpc.accessRequest.respond.useMutation({
    onSuccess: () => {
      toast.success("Response sent successfully");
      setShowResponseDialog(false);
      setShowDeclineConfirm(false);
      setSellerResponse("");
      setSelectedRequest(null);
      // Refetch all queries
      accessRequestQueries.forEach((q: any) => q.refetch());
    },
  });

  const handleApprove = (request: Record<string, any>) => {
    setSelectedRequest(request);
    setResponseType("approved");
    setShowResponseDialog(true);
  };

  const handleDecline = (request: Record<string, any>) => {
    setSelectedRequest(request);
    setShowDeclineConfirm(true);
  };

  const confirmDecline = () => {
    setShowDeclineConfirm(false);
    setResponseType("declined");
    setShowResponseDialog(true);
  };

  const handleMoreInfo = (request: Record<string, any>) => {
    setSelectedRequest(request);
    setResponseType("more_info_requested");
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedRequest) return;

    respondMutation.mutate({
      requestId: selectedRequest.id,
      status: responseType,
      sellerResponse: sellerResponse || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      case "more_info_requested":
        return <Badge variant="outline">More Info Requested</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingRequests = allRequests.filter((r: any) => r.status === "pending");
  const respondedRequests = allRequests.filter((r: any) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Access Requests</h1>
          <p className="text-muted-foreground">
            Manage access requests for your private listings
          </p>
        </div>

        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Pending Requests ({pendingRequests.length})
          </h2>
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending access requests
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request: Record<string, any>) => {
                const listing = myListings?.find((l: Record<string, any>) => l.id === request.listingId);
                return (
                  <Card key={request.id} className="border-primary/50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Access Request for "{listing?.businessName}"
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Submitted {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {request.companyName && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{request.companyName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{request.contactEmail}</span>
                        </div>
                        {request.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{request.contactPhone}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-semibold">Message:</Label>
                        <p className="mt-2 text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                          {request.message}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleApprove(request)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDecline(request)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleMoreInfo(request)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request More Info
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Responded Requests */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Previous Responses ({respondedRequests.length})
          </h2>
          {respondedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No previous responses
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {respondedRequests.map((request: Record<string, any>) => {
                const listing = myListings?.find((l: Record<string, any>) => l.id === request.listingId);
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            "{listing?.businessName}"
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Responded {request.respondedAt ? new Date(request.respondedAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{request.contactEmail}</span>
                      </div>
                      {request.sellerResponse && (
                        <div>
                          <Label className="text-sm font-semibold">Your Response:</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {request.sellerResponse}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Decline Confirmation Dialog */}
      <Dialog open={showDeclineConfirm} onOpenChange={setShowDeclineConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Decline</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this access request? This action will notify the buyer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineConfirm(false)}>
              No, let me think
            </Button>
            <Button variant="destructive" onClick={confirmDecline}>
              Yes, Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseType === "approved" && "Approve Access Request"}
              {responseType === "declined" && "Decline Access Request"}
              {responseType === "more_info_requested" && "Request More Information"}
            </DialogTitle>
            <DialogDescription>
              {responseType === "approved" && "The buyer will be granted access to view your listing details."}
              {responseType === "declined" && "The buyer will be notified that their request was declined."}
              {responseType === "more_info_requested" && "Ask the buyer for additional information before making a decision."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="sellerResponse">
              {responseType === "more_info_requested" ? "Your Question *" : "Optional Message"}
            </Label>
            <Textarea
              id="sellerResponse"
              value={sellerResponse}
              onChange={(e) => setSellerResponse(e.target.value)}
              placeholder={
                responseType === "approved"
                  ? "Add a personal message to the buyer (optional)"
                  : responseType === "declined"
                  ? "Explain why you're declining (optional)"
                  : "What additional information do you need?"
              }
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={respondMutation.isPending || (responseType === "more_info_requested" && !sellerResponse)}
            >
              {respondMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {responseType === "approved" && "Approve"}
              {responseType === "declined" && "Decline"}
              {responseType === "more_info_requested" && "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
