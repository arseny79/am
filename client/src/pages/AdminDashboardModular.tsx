import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Loader2, BarChart3, Key, Search, FileText, Settings, DollarSign, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

// Import tab components
import { AnalyticsTab } from "./admin/tabs/AnalyticsTab";
import { APIKeysTab } from "./admin/tabs/APIKeysTab";
import { SEOTab } from "./admin/tabs/SEOTab";
import { ContentTab } from "./admin/tabs/ContentTab";
import { DocumentsTab } from "./admin/tabs/DocumentsTab";
import { PricingTab } from "./admin/tabs/PricingTab";
import KYCReviewTab from "./admin/tabs/KYCReviewTab";

export default function AdminDashboardModular() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
        <Button asChild>
          <a href={getLoginUrl()}>Log In</a>
        </Button>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your {APP_TITLE} platform settings and configurations
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="kyc-review" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">KYC Review</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-4">
            <APIKeysTab />
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <SEOTab />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <ContentTab />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <DocumentsTab />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <PricingTab />
          </TabsContent>

          <TabsContent value="kyc-review" className="space-y-4">
            <KYCReviewTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
