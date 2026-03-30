import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ProposalSubmissionModal } from "@/components/ProposalSubmissionModal";
import { SEOHead } from "@/components/SEOHead";
import { VerificationRequired } from "@/components/VerificationRequired";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { BuyerRequestEditForm } from "@/components/BuyerRequestEditForm";
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

export default function BuyAsset() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ id: number; title: string } | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    minRevenue: "",
    maxRevenue: "",
    minEbitda: "",
    maxEbitda: "",
    preferredLocations: "",
    requiredServiceMix: "",
    budget: "",
    timeline: "",
    additionalRequirements: "",
    isAnonymous: false,
  });

  const { data: allRequests = [], isLoading: requestsLoading, refetch } = trpc.buyerRequest.getAll.useQuery({
    activeOnly: true,
  });
  
  // Fetch site settings for customizable header
  const { data: siteSettings } = trpc.admin.getSiteSettings.useQuery();

  const { data: myRequests = [], refetch: refetchMyRequests } = trpc.buyerRequest.getMy.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.buyerRequest.create.useMutation({
    onSuccess: () => {
      toast.success("Buyer request submitted! It will be reviewed by our team and published within 24 hours.");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        minRevenue: "",
        maxRevenue: "",
        minEbitda: "",
        maxEbitda: "",
        preferredLocations: "",
        requiredServiceMix: "",
        budget: "",
        timeline: "",
        additionalRequirements: "",
        isAnonymous: false,
      });
      refetch();
      refetchMyRequests();
    },
    onError: (error) => {
      toast.error("Failed to post request: " + error.message);
    },
  });

  const deleteMutation = trpc.buyerRequest.delete.useMutation({
    onSuccess: () => {
      toast.success("Request withdrawn successfully");
      setDeleteConfirmId(null);
      refetch();
      refetchMyRequests();
    },
    onError: (error) => {
      toast.error("Failed to withdraw request: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      minRevenue: formData.minRevenue ? parseInt(formData.minRevenue) : undefined,
      maxRevenue: formData.maxRevenue ? parseInt(formData.maxRevenue) : undefined,
      minEbitda: formData.minEbitda ? parseInt(formData.minEbitda) : undefined,
      maxEbitda: formData.maxEbitda ? parseInt(formData.maxEbitda) : undefined,
      preferredLocations: formData.preferredLocations || undefined,
      requiredServiceMix: formData.requiredServiceMix || undefined,
      budget: formData.budget ? parseInt(formData.budget) : undefined,
      timeline: formData.timeline || undefined,
      additionalRequirements: formData.additionalRequirements || undefined,
      isPublic: true,
      isAnonymous: formData.isAnonymous,
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  if (authLoading || requestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Structured data for buy asset page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Buy an iGaming Business — Post Acquisition Criteria",
    "description": "Submit your iGaming business acquisition criteria and connect with sellers. Browse active buyer requests or create your own."
  };

  const deleteTarget = myRequests.find((r) => r.id === deleteConfirmId);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Buy an iGaming Business — Post Acquisition Criteria"
        description="Submit your iGaming business acquisition criteria and connect with sellers. Browse active buyer requests or create your own."
        canonical="https://acq.market/buy-asset"
        structuredData={structuredData}
      />
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {siteSettings?.buyAssetHeading || "Buyer Requests"}
            </h1>
            <p className="text-muted-foreground">
              {siteSettings?.buyAssetSubheading || "Post your acquisition criteria and let sellers come to you"}
            </p>
          </div>

          {isAuthenticated && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Post a Buyer Request</CardTitle>
                    <CardDescription>
                      Describe the iGaming business you're looking to acquire
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowForm(!showForm)} disabled={user?.verificationStatus !== "verified"}>
                    <Plus className="h-4 w-4 mr-2" />
                    {showForm ? "Cancel" : "New Request"}
                  </Button>
                </div>
              </CardHeader>
              {user && user.verificationStatus !== "verified" && (
                <CardContent>
                  <VerificationRequired action="post a buyer request" />
                </CardContent>
              )}
              {showForm && user?.verificationStatus === "verified" && (
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="title">Request Title * <span className="text-xs font-normal text-muted-foreground">(minimum 10 characters)</span></Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., e.g., Seeking iGaming affiliate in Tier-1 markets with $500K+ revenue"
                        maxLength={200}
                        required
                      />
                      <p className={`text-xs mt-1 ${formData.title.length >= 10 ? 'text-green-600' : formData.title.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {formData.title.length}/200 characters ({formData.title.length >= 10 ? 'requirement met' : `${10 - formData.title.length} more needed`})
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description">Investment Thesis * <span className="text-xs font-normal text-muted-foreground">(minimum 50 characters)</span></Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your ideal acquisition target — include the business type, target markets, revenue range, and what makes this a strategic fit..."
                        rows={5}
                        maxLength={1000}
                        required
                      />
                      <p className={`text-xs mt-1 ${formData.description.length >= 50 ? 'text-green-600' : formData.description.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {formData.description.length}/1000 characters ({formData.description.length >= 50 ? 'requirement met' : `${50 - formData.description.length} more needed`})
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minRevenue">Min Annual Revenue ($)</Label>
                        <Input
                          id="minRevenue"
                          type="number"
                          min="0"
                          max="999999999"
                          step="10000"
                          value={formData.minRevenue}
                          onChange={(e) => setFormData({ ...formData, minRevenue: e.target.value })}
                          placeholder="500000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxRevenue">Max Annual Revenue ($)</Label>
                        <Input
                          id="maxRevenue"
                          type="number"
                          min="0"
                          max="999999999"
                          step="10000"
                          value={formData.maxRevenue}
                          onChange={(e) => setFormData({ ...formData, maxRevenue: e.target.value })}
                          placeholder="2000000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minEbitda">Min EBITDA ($)</Label>
                        <Input
                          id="minEbitda"
                          type="number"
                          min="0"
                          max="999999999"
                          step="10000"
                          value={formData.minEbitda}
                          onChange={(e) => setFormData({ ...formData, minEbitda: e.target.value })}
                          placeholder="150000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxEbitda">Max EBITDA ($)</Label>
                        <Input
                          id="maxEbitda"
                          type="number"
                          min="0"
                          max="999999999"
                          step="10000"
                          value={formData.maxEbitda}
                          onChange={(e) => setFormData({ ...formData, maxEbitda: e.target.value })}
                          placeholder="600000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="preferredLocations">Preferred Locations</Label>
                      <Input
                        id="preferredLocations"
                        value={formData.preferredLocations}
                        onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
                        placeholder="Texas, California, Remote"
                      />
                    </div>

                    <div>
                      <Label htmlFor="requiredServiceMix">Required Service Mix</Label>
                      <Textarea
                        id="requiredServiceMix"
                        value={formData.requiredServiceMix}
                        onChange={(e) => setFormData({ ...formData, requiredServiceMix: e.target.value })}
                        placeholder="e.g., e.g., Must have valid EU license, affiliate program required"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="budget">Budget ($)</Label>
                        <Input
                          id="budget"
                          type="number"
                          min="0"
                          max="999999999"
                          step="10000"
                          value={formData.budget}
                          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                          placeholder="2500000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeline">Timeline</Label>
                        <Input
                          id="timeline"
                          value={formData.timeline}
                          onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                          placeholder="3-6 months"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="additionalRequirements">Additional Requirements</Label>
                      <Textarea
                        id="additionalRequirements"
                        value={formData.additionalRequirements}
                        onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                        placeholder="Any other specific requirements..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                      <input
                        type="checkbox"
                        id="isAnonymous"
                        checked={formData.isAnonymous}
                        onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div>
                        <Label htmlFor="isAnonymous" className="font-medium cursor-pointer">Post Anonymously</Label>
                        <p className="text-sm text-muted-foreground">Your name will be hidden from sellers until you choose to reveal it</p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={createMutation.isPending || formData.title.length < 10 || formData.description.length < 50}
                      className="w-full"
                    >
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post Buyer Request
                    </Button>
                    {(formData.title.length < 10 || formData.description.length < 50) && (formData.title.length > 0 || formData.description.length > 0) && (
                      <p className="text-xs text-amber-500 text-center mt-2">
                        {formData.title.length < 10 && formData.description.length < 50
                          ? "Title needs at least 10 characters and Investment Thesis needs at least 50 characters"
                          : formData.title.length < 10
                            ? "Title needs at least 10 characters"
                            : "Investment Thesis needs at least 50 characters"}
                      </p>
                    )}
                  </form>
                </CardContent>
              )}
            </Card>
          )}

          {!isAuthenticated && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Post Your Acquisition Criteria</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign in to post a buyer request and let sellers find you
                  </p>
                  <a href={getLoginUrl()}>
                    <Button>Sign In to Post Request</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Requests */}
          {isAuthenticated && myRequests.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">My Requests</h2>
              {myRequests.some(r => r.status === "pending") && (
                <Card className="mb-4 border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-amber-600 mt-0.5">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 mb-1">Pending Admin Review</h3>
                        <p className="text-sm text-amber-800">
                          Your requests marked as "Pending Review" are being reviewed by our team to ensure quality and prevent spam. They will be published and visible to sellers within 24 hours.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid gap-4">
                {myRequests.map((request) => (
                  <Card 
                    key={request.id}
                    className={request.status === "pending" ? "opacity-75 border-amber-200" : ""}
                  >
                    {editingRequestId === request.id ? (
                      <CardContent className="pt-6">
                        <BuyerRequestEditForm
                          request={request}
                          onCancel={() => setEditingRequestId(null)}
                          onSaved={() => {
                            setEditingRequestId(null);
                            refetch();
                            refetchMyRequests();
                          }}
                        />
                      </CardContent>
                    ) : (
                      <>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <CardTitle>{request.title}</CardTitle>
                              <CardDescription className="mt-2">
                                {request.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge 
                                variant={
                                  request.status === "published" ? "default" : 
                                  request.status === "pending" ? "outline" :
                                  request.status === "unpublished" ? "secondary" :
                                  request.status === "expired" ? "destructive" :
                                  "secondary"
                                }
                                className={
                                  request.status === "pending" ? "border-amber-500 text-amber-700 bg-amber-50" :
                                  request.status === "published" ? "bg-green-600" :
                                  ""
                                }
                              >
                                {request.status === "pending" ? "⏳ Pending Review" :
                                 request.status === "published" ? "✓ Published" :
                                 request.status === "unpublished" ? "Unpublished" :
                                 request.status === "expired" ? "Expired" :
                                 request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {request.minRevenue && (
                              <div>
                                <p className="text-muted-foreground">Min Revenue</p>
                                <p className="font-semibold">${request.minRevenue.toLocaleString()}</p>
                              </div>
                            )}
                            {request.maxRevenue && (
                              <div>
                                <p className="text-muted-foreground">Max Revenue</p>
                                <p className="font-semibold">${request.maxRevenue.toLocaleString()}</p>
                              </div>
                            )}
                            {request.budget && (
                              <div>
                                <p className="text-muted-foreground">Budget</p>
                                <p className="font-semibold">${request.budget.toLocaleString()}</p>
                              </div>
                            )}
                            {request.timeline && (
                              <div>
                                <p className="text-muted-foreground">Timeline</p>
                                <p className="font-semibold">{request.timeline}</p>
                              </div>
                            )}
                          </div>
                          {request.preferredLocations && (
                            <p className="text-sm text-muted-foreground mt-3">
                              <span className="font-semibold">Locations:</span> {request.preferredLocations}
                            </p>
                          )}
                          {request.requiredServiceMix && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-semibold">Service Mix:</span> {request.requiredServiceMix}
                            </p>
                          )}
                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRequestId(request.id)}
                              disabled={request.status === "withdrawn"}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmId(request.id)}
                              disabled={request.status === "withdrawn" || deleteMutation.isPending}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Withdraw
                            </Button>
                          </div>
                        </CardContent>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Public Requests */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Active Buyer Requests</h2>
            {allRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">
                    No active buyer requests at the moment
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {allRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <CardTitle>{request.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {request.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        {request.minRevenue && (
                          <div>
                            <p className="text-muted-foreground">Min Revenue</p>
                            <p className="font-semibold">${request.minRevenue.toLocaleString()}</p>
                          </div>
                        )}
                        {request.maxRevenue && (
                          <div>
                            <p className="text-muted-foreground">Max Revenue</p>
                            <p className="font-semibold">${request.maxRevenue.toLocaleString()}</p>
                          </div>
                        )}
                        {request.budget && (
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p className="font-semibold">${request.budget.toLocaleString()}</p>
                          </div>
                        )}
                        {request.timeline && (
                          <div>
                            <p className="text-muted-foreground">Timeline</p>
                            <p className="font-semibold">{request.timeline}</p>
                          </div>
                        )}
                      </div>
                      {request.preferredLocations && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Locations:</span> {request.preferredLocations}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Posted {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            setSelectedRequest({ id: request.id, title: request.title });
                            setProposalModalOpen(true);
                          }}
                          className="w-full sm:w-auto"
                        >
                          Match Your Listing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedRequest && (
        <ProposalSubmissionModal
          requestId={selectedRequest.id}
          requestTitle={selectedRequest.title}
          open={proposalModalOpen}
          onOpenChange={setProposalModalOpen}
        />
      )}

      {/* Delete/Withdraw Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Buyer Request?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Are you sure you want to withdraw <strong>"{deleteTarget.title}"</strong>? This will mark the request as withdrawn and remove it from the public listings. This action cannot be undone.
                </>
              ) : (
                "Are you sure you want to withdraw this request?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
