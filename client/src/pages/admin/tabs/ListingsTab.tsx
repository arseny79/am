import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Search, Star, Crown, Building2, CheckCircle2, Clock, XCircle, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from "lucide-react";

type ListingTier = "free" | "featured" | "premium_featured";
type ListingStatus = "draft" | "active" | "under_negotiation" | "sold" | "withdrawn";
type ModerationStatus = "pending_review" | "needs_information" | "approved" | "rejected";
type ModerationAction = "approve" | "request_info" | "reject" | "publish";

const tierLabels: Record<ListingTier, string> = {
  free: "Free",
  featured: "Featured",
  premium_featured: "Premium Featured",
};

const tierColors: Record<ListingTier, string> = {
  free: "bg-gray-100 text-gray-800",
  featured: "bg-blue-100 text-blue-800",
  premium_featured: "bg-amber-100 text-amber-800",
};

const tierIcons: Record<ListingTier, React.ReactNode> = {
  free: <Building2 className="h-3 w-3" />,
  featured: <Star className="h-3 w-3" />,
  premium_featured: <Crown className="h-3 w-3" />,
};

const statusIcons: Record<ListingStatus, React.ReactNode> = {
  draft: <Clock className="h-3 w-3" />,
  active: <CheckCircle2 className="h-3 w-3" />,
  under_negotiation: <Clock className="h-3 w-3" />,
  sold: <CheckCircle2 className="h-3 w-3" />,
  withdrawn: <XCircle className="h-3 w-3" />,
};

const statusColors: Record<ListingStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  under_negotiation: "bg-yellow-100 text-yellow-800",
  sold: "bg-blue-100 text-blue-800",
  withdrawn: "bg-red-100 text-red-800",
};

const moderationLabels: Record<ModerationStatus, string> = {
  pending_review: "Pending Review",
  needs_information: "Needs Info",
  approved: "Approved",
  rejected: "Rejected",
};

const moderationColors: Record<ModerationStatus, string> = {
  pending_review: "bg-yellow-100 text-yellow-800",
  needs_information: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const moderationIcons: Record<ModerationStatus, React.ReactNode> = {
  pending_review: <ShieldQuestion className="h-3 w-3" />,
  needs_information: <ShieldAlert className="h-3 w-3" />,
  approved: <ShieldCheck className="h-3 w-3" />,
  rejected: <ShieldX className="h-3 w-3" />,
};

export function ListingsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "all">("all");
  const [tierFilter, setTierFilter] = useState<ListingTier | "all">("all");
  const [moderationFilter, setModerationFilter] = useState<ModerationStatus | "all">("all");
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [newTier, setNewTier] = useState<ListingTier>("free");
  const [duration, setDuration] = useState<string>("30");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState<ModerationAction>("approve");
  const [moderationListing, setModerationListing] = useState<{ id: number; businessName: string; moderationStatus: ModerationStatus; isPublished: number | boolean } | null>(null);
  const [moderationNote, setModerationNote] = useState("");
  const [isModerationDialogOpen, setIsModerationDialogOpen] = useState(false);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.adminListing.getAll.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    tier: tierFilter !== "all" ? tierFilter : undefined,
    moderationStatus: moderationFilter !== "all" ? moderationFilter : undefined,
    limit: 100,
  });

  const { data: stats } = trpc.adminListing.getStats.useQuery();

  const updateTierMutation = trpc.adminListing.updateTier.useMutation({
    onSuccess: () => {
      toast.success("Listing tier updated successfully");
      utils.adminListing.getAll.invalidate();
      utils.adminListing.getStats.invalidate();
      setIsDialogOpen(false);
      setSelectedListing(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update listing tier");
    },
  });

  const requestInfoMutation = trpc.adminListing.requestMoreInfo.useMutation({
    onSuccess: () => {
      toast.success("Seller asked for more information");
      utils.adminListing.getAll.invalidate();
      utils.adminListing.getStats.invalidate();
      setIsModerationDialogOpen(false);
      setModerationListing(null);
      setModerationNote("");
    },
    onError: (error) => toast.error(error.message || "Failed to request more information"),
  });

  const approveMutation = trpc.adminListing.approve.useMutation({
    onSuccess: () => {
      toast.success("Listing approved");
      utils.adminListing.getAll.invalidate();
      utils.adminListing.getStats.invalidate();
      setIsModerationDialogOpen(false);
      setModerationListing(null);
      setModerationNote("");
    },
    onError: (error) => toast.error(error.message || "Failed to approve listing"),
  });

  const rejectMutation = trpc.adminListing.reject.useMutation({
    onSuccess: () => {
      toast.success("Listing rejected");
      utils.adminListing.getAll.invalidate();
      utils.adminListing.getStats.invalidate();
      setIsModerationDialogOpen(false);
      setModerationListing(null);
      setModerationNote("");
    },
    onError: (error) => toast.error(error.message || "Failed to reject listing"),
  });

  const publishMutation = trpc.adminListing.publish.useMutation({
    onSuccess: () => {
      toast.success("Listing published");
      utils.adminListing.getAll.invalidate();
      utils.adminListing.getStats.invalidate();
      setIsModerationDialogOpen(false);
      setModerationListing(null);
      setModerationNote("");
    },
    onError: (error) => toast.error(error.message || "Failed to publish listing"),
  });

  const handleUpdateTier = () => {
    if (!selectedListing) return;
    
    updateTierMutation.mutate({
      listingId: selectedListing,
      tier: newTier,
      featuredDuration: newTier !== "free" ? parseInt(duration) : undefined,
    });
  };

  const openTierDialog = (listingId: number, currentTier: ListingTier) => {
    setSelectedListing(listingId);
    setNewTier(currentTier);
    setIsDialogOpen(true);
  };

  const openModerationDialog = (
    listing: { id: number; businessName: string; moderationStatus: ModerationStatus; isPublished: number | boolean },
    action: ModerationAction,
  ) => {
    setModerationListing(listing);
    setModerationAction(action);
    setModerationNote("");
    setIsModerationDialogOpen(true);
  };

  const handleModerationAction = () => {
    if (!moderationListing) return;

    if (moderationAction === "request_info") {
      if (!moderationNote.trim()) {
        toast.error("Please add a note for the seller");
        return;
      }
      requestInfoMutation.mutate({ listingId: moderationListing.id, notes: moderationNote.trim() });
      return;
    }

    if (moderationAction === "reject") {
      if (!moderationNote.trim()) {
        toast.error("Please provide a rejection reason");
        return;
      }
      rejectMutation.mutate({ listingId: moderationListing.id, reason: moderationNote.trim() });
      return;
    }

    if (moderationAction === "approve") {
      approveMutation.mutate({ listingId: moderationListing.id, notes: moderationNote.trim() || undefined });
      return;
    }

    publishMutation.mutate({ listingId: moderationListing.id });
  };

  const moderationPending =
    requestInfoMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    publishMutation.isPending;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Listings</CardDescription>
            <CardTitle className="text-2xl">{data?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Free Listings</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              {stats?.byTier?.free || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Featured</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              {stats?.byTier?.featured || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Premium Featured</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              {stats?.byTier?.premium_featured || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ShieldQuestion className="h-5 w-5 text-yellow-500" />
              {stats?.byModerationStatus?.pending_review || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Listings</CardTitle>
          <CardDescription>
            View and manage listing tiers. Set listings as Featured or Premium Featured to promote them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by business name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ListingStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="under_negotiation">Under Negotiation</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as ListingTier | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="premium_featured">Premium Featured</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moderationFilter} onValueChange={(v) => setModerationFilter(v as ModerationStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by moderation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Moderation</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="needs_information">Needs Info</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.listings?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No listings found matching your criteria.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Moderation</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Asking Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{listing.businessName}</div>
                          <div className="text-sm text-muted-foreground">{listing.location}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{listing.sellerName || "—"}</div>
                          <div className="text-xs text-muted-foreground">{listing.sellerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[listing.status as ListingStatus]}>
                          {statusIcons[listing.status as ListingStatus]}
                          <span className="ml-1 capitalize">{listing.status.replace("_", " ")}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {listing.moderationStatus && (
                          <Badge variant="outline" className={moderationColors[listing.moderationStatus as ModerationStatus]}>
                            {moderationIcons[listing.moderationStatus as ModerationStatus]}
                            <span className="ml-1">{moderationLabels[listing.moderationStatus as ModerationStatus]}</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tierColors[listing.tier as ListingTier]}>
                          {tierIcons[listing.tier as ListingTier]}
                          <span className="ml-1">{tierLabels[listing.tier as ListingTier]}</span>
                        </Badge>
                        {listing.featuredUntil && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Until {new Date(listing.featuredUntil).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(listing.annualRevenue)}</TableCell>
                      <TableCell>{formatCurrency(listing.askingPrice)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTierDialog(listing.id, listing.tier as ListingTier)}
                          >
                            Change Tier
                          </Button>
                          {listing.moderationStatus !== "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModerationDialog({
                                id: listing.id,
                                businessName: listing.businessName,
                                moderationStatus: listing.moderationStatus as ModerationStatus,
                                isPublished: listing.isPublished,
                              }, "approve")}
                            >
                              Approve
                            </Button>
                          )}
                          {listing.moderationStatus !== "rejected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModerationDialog({
                                id: listing.id,
                                businessName: listing.businessName,
                                moderationStatus: listing.moderationStatus as ModerationStatus,
                                isPublished: listing.isPublished,
                              }, "request_info")}
                            >
                              Request Info
                            </Button>
                          )}
                          {listing.moderationStatus !== "rejected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModerationDialog({
                                id: listing.id,
                                businessName: listing.businessName,
                                moderationStatus: listing.moderationStatus as ModerationStatus,
                                isPublished: listing.isPublished,
                              }, "reject")}
                            >
                              Reject
                            </Button>
                          )}
                          {listing.moderationStatus === "approved" && !listing.isPublished && (
                            <Button
                              size="sm"
                              onClick={() => openModerationDialog({
                                id: listing.id,
                                businessName: listing.businessName,
                                moderationStatus: listing.moderationStatus as ModerationStatus,
                                isPublished: listing.isPublished,
                              }, "publish")}
                            >
                              Publish
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Tier Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Listing Tier</DialogTitle>
            <DialogDescription>
              Change the tier for this listing. Featured and Premium Featured listings get better visibility.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Tier</Label>
              <Select value={newTier} onValueChange={(v) => setNewTier(v as ListingTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Free - Standard listing
                    </div>
                  </SelectItem>
                  <SelectItem value="featured">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-500" />
                      Featured - Highlighted in search
                    </div>
                  </SelectItem>
                  <SelectItem value="premium_featured">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      Premium Featured - Top placement + carousel
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newTier !== "free" && (
              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days (6 months)</SelectItem>
                    <SelectItem value="365">365 days (1 year)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The listing will be {tierLabels[newTier]} for this duration.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTier} disabled={updateTierMutation.isPending}>
              {updateTierMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModerationDialogOpen} onOpenChange={setIsModerationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationAction === "approve" && "Approve Listing"}
              {moderationAction === "request_info" && "Request More Information"}
              {moderationAction === "reject" && "Reject Listing"}
              {moderationAction === "publish" && "Publish Listing"}
            </DialogTitle>
            <DialogDescription>
              {moderationListing ? `Listing: ${moderationListing.businessName}` : ""}
            </DialogDescription>
          </DialogHeader>

          {(moderationAction === "approve" || moderationAction === "request_info" || moderationAction === "reject") && (
            <div className="space-y-2 py-4">
              <Label>
                {moderationAction === "reject" ? "Rejection Reason" : moderationAction === "request_info" ? "Seller Note" : "Review Note (optional)"}
              </Label>
              <Textarea
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                rows={4}
                placeholder={
                  moderationAction === "reject"
                    ? "Explain why the listing is being rejected..."
                    : moderationAction === "request_info"
                      ? "Explain what the seller needs to update or clarify..."
                      : "Optional note for the approval record..."
                }
              />
            </div>
          )}

          {moderationAction === "publish" && (
            <div className="py-4 text-sm text-muted-foreground">
              This will make the approved listing live and set its lifecycle status to Active.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModerationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleModerationAction} disabled={moderationPending}>
              {moderationPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
