import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Eye, CheckCircle, XCircle, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type BuyerRequest = {
  id: number;
  buyerId: number;
  title: string;
  description: string;
  targetRevenue: number | null;
  minRevenue: number | null;
  maxRevenue: number | null;
  targetEbitda: number | null;
  minEbitda: number | null;
  maxEbitda: number | null;
  preferredLocations: string | null;
  requiredServiceMix: string | null;
  budget: number | null;
  timeline: string | null;
  additionalRequirements: string | null;
  status: string;
  isPublic: number;
  isAnonymous: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  buyerCompany?: string | null;
  buyerLocation?: string | null;
};

export function BuyerRequestsTab() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "published" | "unpublished" | "expired">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<BuyerRequest | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expirationDays, setExpirationDays] = useState("30");

  const { data, isLoading, refetch } = trpc.adminBuyerRequests.getAll.useQuery({
    page,
    pageSize: 20,
    status: statusFilter,
    search: searchQuery,
  });

  const publishMutation = trpc.adminBuyerRequests.publish.useMutation({
    onSuccess: () => {
      toast.success("Request published successfully");
      refetch();
      setDetailModalOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to publish: " + error.message);
    },
  });

  const unpublishMutation = trpc.adminBuyerRequests.unpublish.useMutation({
    onSuccess: () => {
      toast.success("Request unpublished");
      refetch();
      setDetailModalOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to unpublish: " + error.message);
    },
  });

  const deleteMutation = trpc.adminBuyerRequests.delete.useMutation({
    onSuccess: () => {
      toast.success("Request deleted");
      setDeleteConfirmId(null);
      refetch();
      setDetailModalOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const updateExpirationMutation = trpc.adminBuyerRequests.updateExpiration.useMutation({
    onSuccess: () => {
      toast.success("Expiration date updated");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update expiration: " + error.message);
    },
  });

  const handleViewDetails = async (requestId: number) => {
    try {
      const request = await utils.client.adminBuyerRequests.getById.query({ id: requestId });
      setSelectedRequest(request as BuyerRequest);
      setDetailModalOpen(true);
    } catch (error: any) {
      toast.error("Failed to load request details: " + error.message);
    }
  };

  const handlePublish = () => {
    if (!selectedRequest) return;
    publishMutation.mutate({
      id: selectedRequest.id,
      expirationDays: parseInt(expirationDays) || 30,
    });
  };

  const handleUnpublish = () => {
    if (!selectedRequest) return;
    unpublishMutation.mutate({ id: selectedRequest.id });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const getStatusBadge = (status: string, expiresAt: string | null) => {
    // Check if expired
    if (status === "published" && expiresAt && new Date(expiresAt) < new Date()) {
      return <Badge variant="destructive">📅 Expired</Badge>;
    }

    switch (status) {
      case "pending":
        return <Badge variant="secondary">📝 Pending Review</Badge>;
      case "published":
        return <Badge variant="default">✅ Published</Badge>;
      case "unpublished":
        return <Badge variant="outline">🚫 Unpublished</Badge>;
      case "withdrawn":
        return <Badge variant="outline">🗑️ Withdrawn</Badge>;
      case "fulfilled":
        return <Badge variant="secondary">✔️ Fulfilled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buyer Requests Management</CardTitle>
          <CardDescription>
            Review, publish, and manage buyer acquisition requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by buyer name, email, or request content..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value: any) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unpublished">Unpublished</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {data && data.requests.length > 0 ? (
            <>
              <div className="space-y-4">
                {data.requests.map((request) => {
                  const daysRemaining = getDaysRemaining(request.expiresAt);
                  return (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(request.status, request.expiresAt)}
                              {request.isAnonymous === 1 && (
                                <Badge variant="outline">🔒 Anonymous</Badge>
                              )}
                              {daysRemaining !== null && daysRemaining > 0 && request.status === "published" && (
                                <Badge variant="secondary">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {daysRemaining} days left
                                </Badge>
                              )}
                            </div>
                            <CardTitle
                              className="text-lg cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleViewDetails(request.id)}
                            >
                              {request.title}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              <div className="space-y-1">
                                <div>
                                  <strong>Buyer:</strong> {request.buyerName || "Unknown"} ({request.buyerEmail})
                                </div>
                                <div className="line-clamp-2">{request.description}</div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Submitted: {format(new Date(request.createdAt), "MMM d, yyyy")}
                                  {request.publishedAt && (
                                    <> • Published: {format(new Date(request.publishedAt), "MMM d, yyyy")}</>
                                  )}
                                  {request.expiresAt && (
                                    <> • Expires: {format(new Date(request.expiresAt), "MMM d, yyyy")}</>
                                  )}
                                </div>
                              </div>
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(request.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages} ({data.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === data.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No buyer requests found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRequest.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(selectedRequest.status, selectedRequest.expiresAt)}
                    {selectedRequest.isAnonymous === 1 && (
                      <Badge variant="outline">🔒 Anonymous</Badge>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Buyer Information */}
                <div>
                  <h3 className="font-semibold mb-2">Buyer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Name:</strong> {selectedRequest.buyerName || "N/A"}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedRequest.buyerEmail || "N/A"}
                    </div>
                    {selectedRequest.buyerPhone && (
                      <div>
                        <strong>Phone:</strong> {selectedRequest.buyerPhone}
                      </div>
                    )}
                    {selectedRequest.buyerCompany && (
                      <div>
                        <strong>Company:</strong> {selectedRequest.buyerCompany}
                      </div>
                    )}
                    {selectedRequest.buyerLocation && (
                      <div>
                        <strong>Location:</strong> {selectedRequest.buyerLocation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Details */}
                <div>
                  <h3 className="font-semibold mb-2">Request Details</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Description:</strong>
                      <p className="mt-1 text-muted-foreground">{selectedRequest.description}</p>
                    </div>

                    {(selectedRequest.minRevenue || selectedRequest.maxRevenue) && (
                      <div>
                        <strong>Revenue Range:</strong> $
                        {selectedRequest.minRevenue?.toLocaleString() || "0"} - $
                        {selectedRequest.maxRevenue?.toLocaleString() || "∞"}
                      </div>
                    )}

                    {(selectedRequest.minEbitda || selectedRequest.maxEbitda) && (
                      <div>
                        <strong>EBITDA Range:</strong> $
                        {selectedRequest.minEbitda?.toLocaleString() || "0"} - $
                        {selectedRequest.maxEbitda?.toLocaleString() || "∞"}
                      </div>
                    )}

                    {selectedRequest.budget && (
                      <div>
                        <strong>Budget:</strong> ${selectedRequest.budget.toLocaleString()}
                      </div>
                    )}

                    {selectedRequest.preferredLocations && (
                      <div>
                        <strong>Preferred Locations:</strong> {selectedRequest.preferredLocations}
                      </div>
                    )}

                    {selectedRequest.requiredServiceMix && (
                      <div>
                        <strong>Required Service Mix:</strong>
                        <p className="mt-1 text-muted-foreground">{selectedRequest.requiredServiceMix}</p>
                      </div>
                    )}

                    {selectedRequest.timeline && (
                      <div>
                        <strong>Timeline:</strong> {selectedRequest.timeline}
                      </div>
                    )}

                    {selectedRequest.additionalRequirements && (
                      <div>
                        <strong>Additional Requirements:</strong>
                        <p className="mt-1 text-muted-foreground">{selectedRequest.additionalRequirements}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="font-semibold mb-2">Dates</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Submitted:</strong> {format(new Date(selectedRequest.createdAt), "PPP")}
                    </div>
                    {selectedRequest.publishedAt && (
                      <div>
                        <strong>Published:</strong> {format(new Date(selectedRequest.publishedAt), "PPP")}
                      </div>
                    )}
                    {selectedRequest.expiresAt && (
                      <div>
                        <strong>Expires:</strong> {format(new Date(selectedRequest.expiresAt), "PPP")}
                        {getDaysRemaining(selectedRequest.expiresAt) !== null && (
                          <span className="ml-2 text-muted-foreground">
                            ({getDaysRemaining(selectedRequest.expiresAt)} days)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Publish Settings (for pending requests) */}
                {selectedRequest.status === "pending" && (
                  <div>
                    <h3 className="font-semibold mb-2">Publish Settings</h3>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <Label htmlFor="expiration-days">Expiration (days)</Label>
                        <Input
                          id="expiration-days"
                          type="number"
                          min="1"
                          max="365"
                          value={expirationDays}
                          onChange={(e) => setExpirationDays(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <div className="flex-1 flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirmId(selectedRequest.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
                <div className="flex gap-2">
                {selectedRequest.status === "pending" && (
                  <Button
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                  >
                    {publishMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                )}
                  {selectedRequest.status === "published" && (
                    <Button
                      variant="secondary"
                      onClick={handleUnpublish}
                      disabled={unpublishMutation.isPending}
                    >
                      {unpublishMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <XCircle className="h-4 w-4 mr-2" />
                      Unpublish
                    </Button>
                  )}
                  {selectedRequest.status === "unpublished" && (
                    <Button
                      onClick={handlePublish}
                      disabled={publishMutation.isPending}
                    >
                      {publishMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Republish
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Buyer Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this buyer request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
