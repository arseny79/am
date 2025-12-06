import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ProposalSubmissionModal } from "@/components/ProposalSubmissionModal";
import { SEOHead } from "@/components/SEOHead";

export default function BuyAsset() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ id: number; title: string } | null>(null);

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
  });

  const { data: allRequests = [], isLoading: requestsLoading, refetch } = trpc.buyerRequest.getAll.useQuery({
    activeOnly: true,
  });

  const { data: myRequests = [] } = trpc.buyerRequest.getMy.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.buyerRequest.create.useMutation({
    onSuccess: () => {
      toast.success("Buyer request posted successfully!");
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
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to post request: " + error.message);
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
    });
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
    "name": "Buy MSP Business - Submit Acquisition Request",
    "description": "Submit your MSP acquisition criteria and connect with sellers. Browse active buyer requests or create your own."
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Buy MSP Business - Submit Acquisition Request"
        description="Submit your MSP acquisition criteria and connect with sellers. Browse active buyer requests or create your own."
        canonical="https://msp.investments/buy-asset"
        structuredData={structuredData}
      />
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_TITLE}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost">Browse Listings</Button>
            </Link>
            <Link href="/buy-asset">
              <Button variant="default">Buy Asset</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/deals">
                  <Button variant="ghost">My Deals</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost">Profile</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Sign In</Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Buyer Requests</h1>
            <p className="text-muted-foreground">
              Post your acquisition criteria and let sellers come to you
            </p>
          </div>

          {isAuthenticated && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Post a Buyer Request</CardTitle>
                    <CardDescription>
                      Describe the MSP business you're looking to acquire
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {showForm ? "Cancel" : "New Request"}
                  </Button>
                </div>
              </CardHeader>
              {showForm && (
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="title">Request Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Seeking MSP in Texas with $1M+ revenue"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your ideal acquisition target in detail..."
                        rows={5}
                        required
                      />
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
                        placeholder="e.g., Must include cybersecurity and cloud services"
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

                    <Button type="submit" disabled={createMutation.isPending} className="w-full">
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post Buyer Request
                    </Button>
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
              <div className="grid gap-4">
                {myRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{request.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {request.description}
                          </CardDescription>
                        </div>
                        <Badge variant={request.status === "active" ? "default" : "secondary"}>
                          {request.status}
                        </Badge>
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
                    </CardContent>
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
    </div>
  );
}
