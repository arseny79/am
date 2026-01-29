import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Users, DollarSign, FileText, RefreshCw, Clock, ShieldCheck, MessageSquare, FolderOpen, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsTab() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const { 
    data: metrics, 
    isLoading, 
    isError, 
    error,
    refetch,
    isRefetching 
  } = trpc.analytics.getDashboardMetrics.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Update last refresh time when data changes
  useEffect(() => {
    if (metrics) {
      setLastRefresh(new Date());
    }
  }, [metrics]);

  const handleRefresh = () => {
    refetch();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Platform Analytics</h2>
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Platform Analytics</h2>
          <p className="text-muted-foreground">Overview of platform performance and key metrics</p>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Failed to Load Metrics
            </CardTitle>
            <CardDescription>
              {error?.message || "An error occurred while loading analytics data."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Platform Analytics</h2>
          <p className="text-muted-foreground">
            Overview of platform performance and key metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {formatTime(lastRefresh)}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.users.new30Days || 0} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.listings.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.listings.total || 0} total listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.deals.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.deals.total || 0} total deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.deals.closed || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.deals.new30Days || 0} new deals this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Metrics
          </CardTitle>
          <CardDescription>User registration and verification statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{metrics?.users.total || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active (30 days)</p>
              <p className="text-2xl font-bold">{metrics?.users.active || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">KYC Verified</p>
              <p className="text-2xl font-bold text-green-600">{metrics?.users.verified || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pending KYC</p>
              <p className="text-2xl font-bold text-amber-600">{metrics?.users.pendingKYC || 0}</p>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Users</p>
                <p className="text-xl font-bold">{metrics?.users.new30Days || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Listings</p>
                <p className="text-xl font-bold">{metrics?.listings.new30Days || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Deals</p>
                <p className="text-xl font-bold">{metrics?.deals.new30Days || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-amber-100">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-xl font-bold">{metrics?.activity.messages || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {metrics?.users.pendingKYC && metrics.users.pendingKYC > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 px-3 py-1.5">
                <ShieldCheck className="h-4 w-4 mr-2" />
                {metrics.users.pendingKYC} KYC reviews pending
              </Badge>
            )}
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 px-3 py-1.5">
              <FolderOpen className="h-4 w-4 mr-2" />
              {metrics?.activity.accessRequests || 0} access requests (30d)
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
