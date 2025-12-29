import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowRight, Eye, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { useState } from "react";

const DEAL_STAGES = [
  { id: "initial_contact", label: "Initial Contact", color: "bg-blue-500" },
  { id: "nda_signed", label: "NDA Signed", color: "bg-purple-500" },
  { id: "due_diligence", label: "Due Diligence", color: "bg-yellow-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { id: "escrow", label: "Escrow", color: "bg-cyan-500" },
  { id: "closing", label: "Closing", color: "bg-green-500" },
  { id: "closed", label: "Closed", color: "bg-gray-500" },
  { id: "cancelled", label: "Cancelled", color: "bg-red-500" },
] as const;

type DealStage = typeof DEAL_STAGES[number]["id"];

// Authenticated content component
function AuthenticatedDealPipelineContent() {
  const { user } = useAuth();
  
  // Extra safety check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const [selectedStage, setSelectedStage] = useState<DealStage | "all">("all");

  const { data: deals = [], isLoading, refetch } = trpc.deal.getMyDeals.useQuery();

  const updateStageMutation = trpc.deal.updateStage.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredDeals = selectedStage === "all" 
    ? deals 
    : deals.filter((d: any) => d.stage === selectedStage);

  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    acc[stage.id] = deals.filter((d: any) => d.stage === stage.id);
    return acc;
  }, {} as Record<DealStage, typeof deals>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PublicHeader />

      {/* Stats Overview */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStage("all")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">All Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deals.length}</div>
            </CardContent>
          </Card>
          
          {DEAL_STAGES.map((stage) => (
            <Card 
              key={stage.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedStage(stage.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stage.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dealsByStage[stage.id]?.length || 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-4 min-w-full">
            {DEAL_STAGES.filter(s => s.id !== "cancelled" && s.id !== "closed").map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <h3 className="font-semibold">{stage.label}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {dealsByStage[stage.id]?.length || 0}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {dealsByStage[stage.id]?.map((deal: any) => (
                      <Card key={deal.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium line-clamp-2">
                              Deal #{deal.id}
                            </CardTitle>
                            <Link href={`/deal/${deal.id}`}>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                          <CardDescription className="text-xs">
                            {deal.buyerId === user?.id ? "Buying" : "Selling"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Started {new Date(deal.createdAt).toLocaleDateString()}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex gap-2">
                            <Link href={`/deal/${deal.id}`}>
                              <Button variant="outline" size="sm" className="text-xs h-7">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </Link>
                            
                            {/* Move to next stage */}
                            {stage.id !== "closing" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => {
                                  const currentIndex = DEAL_STAGES.findIndex(s => s.id === stage.id);
                                  const nextStage = DEAL_STAGES[currentIndex + 1];
                                  if (nextStage) {
                                updateStageMutation.mutate({
                                  dealId: deal.id,
                                  stage: nextStage.id as any,
                                });
                                  }
                                }}
                                disabled={updateStageMutation.isPending}
                              >
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {dealsByStage[stage.id]?.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No deals in this stage
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closed/Cancelled Deals */}
        {(dealsByStage.closed?.length > 0 || dealsByStage.cancelled?.length > 0) && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Completed Deals</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Closed Deals */}
              {dealsByStage.closed?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      Closed ({dealsByStage.closed.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dealsByStage.closed.map((deal: any) => (
                      <Link key={deal.id} href={`/deal/${deal.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Deal #{deal.id}</div>
                                <div className="text-xs text-muted-foreground">
                                  Closed {deal.closedAt ? new Date(deal.closedAt).toLocaleDateString() : "Recently"}
                                </div>
                              </div>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Cancelled Deals */}
              {dealsByStage.cancelled?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      Cancelled ({dealsByStage.cancelled.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dealsByStage.cancelled.map((deal: any) => (
                      <Link key={deal.id} href={`/deal/${deal.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Deal #{deal.id}</div>
                                <div className="text-xs text-muted-foreground">
                                  Cancelled {new Date(deal.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

// Main component with auth checks
export default function DealPipeline() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to view your deal pipeline</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  return <AuthenticatedDealPipelineContent />;
}
