import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Users, DollarSign, FileText, Eye, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AnalyticsTab() {
  const { data: allListings = [], isLoading: listingsLoading } = trpc.listing.search.useQuery({});
  const { data: allDeals = [], isLoading: dealsLoading } = trpc.deal.getMyDeals.useQuery();

  if (listingsLoading || dealsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate statistics
  const totalListings = allListings.length;
  const activeListings = allListings.filter((l: any) => l.status === "active").length;
  const totalUsers = 0; // TODO: Add getAllUsers query to admin router
  const totalDeals = allDeals.length;
  const activeDeals = allDeals.filter((d: any) => !["closed", "lost"].includes(d.stage)).length;
  const closedDeals = allDeals.filter((d: any) => d.stage === "closed").length;

  // Calculate total transaction value from closed deals
  const totalTransactionValue = allDeals
    .filter((d: any) => d.stage === "closed")
    .reduce((sum: number, deal: any) => {
      const listing = allListings.find((l) => l.id === deal.listingId);
      return sum + (listing?.askingPrice || 0);
    }, 0);

  // Calculate estimated revenue (3% of closed deals)
  const estimatedRevenue = totalTransactionValue * 0.03;

  // Recent activity metrics
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const newListingsLast30Days = allListings.filter(
    (l) => new Date(l.createdAt) > last30Days
  ).length;

  const newUsersLast30Days = 0; // TODO: Calculate from getAllUsers

  const newDealsLast30Days = allDeals.filter(
    (d: any) => new Date(d.createdAt) > last30Days
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Platform Analytics</h2>
        <p className="text-muted-foreground">
          Overview of platform performance and key metrics
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{estimatedRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {closedDeals} closed deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{newUsersLast30Days} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeListings}</div>
            <p className="text-xs text-muted-foreground">
              {totalListings} total listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals}</div>
            <p className="text-xs text-muted-foreground">
              {totalDeals} total deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Value Card */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
          <CardDescription>Total value of closed deals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Transaction Value</span>
              <span className="text-2xl font-bold">
                €{totalTransactionValue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Platform Revenue (3%)</span>
              <span className="text-xl font-semibold text-primary">
                €{estimatedRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Closed Deals</span>
              <Badge variant="secondary">{closedDeals} deals</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 30 Days)</CardTitle>
          <CardDescription>Platform growth and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">New Listings</span>
              </div>
              <span className="text-lg font-semibold">{newListingsLast30Days}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">New Users</span>
              </div>
              <span className="text-lg font-semibold">{newUsersLast30Days}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">New Deals</span>
              </div>
              <span className="text-lg font-semibold">{newDealsLast30Days}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deal Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Pipeline Overview</CardTitle>
          <CardDescription>Distribution of deals across stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { stage: "initial_contact", label: "Initial Contact" },
              { stage: "nda_signed", label: "NDA Signed" },
              { stage: "due_diligence", label: "Due Diligence" },
              { stage: "negotiation", label: "Negotiation" },
              { stage: "loi_signed", label: "LOI Signed" },
              { stage: "final_diligence", label: "Final Diligence" },
              { stage: "escrow", label: "Escrow" },
              { stage: "closed", label: "Closed" },
            ].map(({ stage, label }) => {
              const count = allDeals.filter((d: any) => d.stage === stage).length;
              const percentage = totalDeals > 0 ? (count / totalDeals) * 100 : 0;
              return (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
