import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Flag, Trash2, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
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

export function BuyerRequestsTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | "active" | "flagged" | "withdrawn">("all");
  const [spamLevel, setSpamLevel] = useState<"all" | "low" | "medium" | "high">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<"delete" | "flag" | "unflag" | null>(null);

  const { data, isLoading, refetch } = trpc.adminBuyerRequests.getAll.useQuery({
    page,
    pageSize: 20,
    status,
    spamLevel,
    search,
  });

  const bulkDeleteMutation = trpc.adminBuyerRequests.bulkDelete.useMutation({
    onSuccess: () => {
      toast.success("Requests withdrawn successfully");
      setSelectedIds([]);
      setBulkAction(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to withdraw requests: " + error.message);
    },
  });

  const bulkFlagMutation = trpc.adminBuyerRequests.bulkFlag.useMutation({
    onSuccess: () => {
      toast.success("Requests flagged successfully");
      setSelectedIds([]);
      setBulkAction(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to flag requests: " + error.message);
    },
  });

  const bulkUnflagMutation = trpc.adminBuyerRequests.bulkUnflag.useMutation({
    onSuccess: () => {
      toast.success("Requests unflagged successfully");
      setSelectedIds([]);
      setBulkAction(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to unflag requests: " + error.message);
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleBulkAction = (action: "delete" | "flag" | "unflag") => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one request");
      return;
    }
    setBulkAction(action);
  };

  const confirmBulkAction = () => {
    if (bulkAction === "delete") {
      bulkDeleteMutation.mutate({ ids: selectedIds });
    } else if (bulkAction === "flag") {
      bulkFlagMutation.mutate({ ids: selectedIds });
    } else if (bulkAction === "unflag") {
      bulkUnflagMutation.mutate({ ids: selectedIds });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data?.requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data?.requests.map((r) => r.id) || []);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getSpamLevelBadge = (score: number | null) => {
    if (score === null || score === undefined) return null;
    
    if (score <= 30) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">🟢 Low ({score})</Badge>;
    } else if (score <= 70) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">🟡 Medium ({score})</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">🔴 High ({score})</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buyer Requests Management</CardTitle>
          <CardDescription>
            Manage buyer requests with spam detection and filtering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={status} onValueChange={(v: any) => { setStatus(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Spam Level</label>
              <Select value={spamLevel} onValueChange={(v: any) => { setSpamLevel(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="low">🟢 Low (0-30)</SelectItem>
                  <SelectItem value="medium">🟡 Medium (31-70)</SelectItem>
                  <SelectItem value="high">🔴 High (71-100)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by buyer name, email, or content..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("flag")}
                disabled={bulkFlagMutation.isPending}
              >
                <Flag className="h-4 w-4 mr-2" />
                Flag
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("unflag")}
                disabled={bulkUnflagMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Unflag
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("delete")}
                disabled={bulkDeleteMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data && data.requests.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === data.requests.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Request Summary</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Spam Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(request.id)}
                            onCheckedChange={() => toggleSelect(request.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{request.buyerName || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{request.buyerEmail}</div>
                            {request.buyerCompanyName && (
                              <div className="text-xs text-muted-foreground">{request.buyerCompanyName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-md">
                            <div className="font-medium">{request.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {request.description}
                            </div>
                            {request.budget && (
                              <div className="text-xs text-muted-foreground">
                                Budget: ${request.budget.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{getSpamLevelBadge(request.spamScore)}</TableCell>
                        <TableCell>
                          <Badge variant={request.status === "active" ? "default" : "secondary"}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.flaggedAt && (
                            <div className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">Flagged</span>
                            </div>
                          )}
                          {request.spamScore && request.spamScore >= 70 && !request.flaggedAt && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">High Spam</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} requests
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        Page {page} of {data.totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No buyer requests found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkAction !== null} onOpenChange={(open) => !open && setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "delete" && "Withdraw Selected Requests?"}
              {bulkAction === "flag" && "Flag Selected Requests?"}
              {bulkAction === "unflag" && "Unflag Selected Requests?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "delete" && `You are about to withdraw ${selectedIds.length} buyer request(s). They will be marked as withdrawn and removed from public listings.`}
              {bulkAction === "flag" && `You are about to flag ${selectedIds.length} buyer request(s) for review.`}
              {bulkAction === "unflag" && `You are about to remove flags from ${selectedIds.length} buyer request(s).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              className={bulkAction === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {bulkDeleteMutation.isPending || bulkFlagMutation.isPending || bulkUnflagMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
