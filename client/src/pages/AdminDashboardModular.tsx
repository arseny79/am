import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_TITLE, getLoginUrl } from "@/const";
import { 
  Loader2, 
  BarChart3, 
  Key, 
  Search, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Users, 
  Building2, 
  Briefcase, 
  Award, 
  Handshake,
  LayoutDashboard,
  UserCheck,
  Megaphone,
  Store,
  Settings
} from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Import tab components
import { AnalyticsTab } from "./admin/tabs/AnalyticsTab";
import { APIKeysTab } from "./admin/tabs/APIKeysTab";
import { SEOTab } from "./admin/tabs/SEOTab";
import { ContentTab } from "./admin/tabs/ContentTab";
import { DocumentsTab } from "./admin/tabs/DocumentsTab";
import { PricingTab } from "./admin/tabs/PricingTab";
import KYCReviewTab from "./admin/tabs/KYCReviewTab";
import { AffiliatesTab } from "@/components/admin/AffiliatesTab";
import { ListingsTab } from "./admin/tabs/ListingsTab";
import ProfessionalsTab from "./admin/tabs/ProfessionalsTab";
import CredentialsVerificationTab from "./admin/tabs/CredentialsVerificationTab";
import { BrokersTab } from "./admin/tabs/BrokersTab";

import { Breadcrumb } from "@/components/Breadcrumb";

// Define tab categories and their sub-tabs
const tabCategories = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    tabs: [
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ]
  },
  {
    id: "users",
    label: "Users & Verification",
    icon: UserCheck,
    tabs: [
      { id: "kyc-review", label: "KYC Review", icon: ShieldCheck },
      { id: "affiliates", label: "Affiliates", icon: Users },
    ]
  },
  {
    id: "content",
    label: "Content & SEO",
    icon: Megaphone,
    tabs: [
      { id: "seo", label: "SEO", icon: Search },
      { id: "content", label: "Content", icon: FileText },
      { id: "documents", label: "Documents", icon: FileText },
    ]
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: Store,
    tabs: [
      { id: "listings", label: "Listings", icon: Building2 },
      { id: "pricing", label: "Pricing", icon: DollarSign },
      { id: "professionals", label: "Professionals", icon: Briefcase },
      { id: "credentials", label: "Credentials", icon: Award },
      { id: "brokers", label: "Brokers", icon: Handshake },
    ]
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    tabs: [
      { id: "api-keys", label: "API Keys", icon: Key },
    ]
  },
];

export default function AdminDashboardModular() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeCategory, setActiveCategory] = useState("overview");
  const [activeTab, setActiveTab] = useState("analytics");

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

  const currentCategory = tabCategories.find(c => c.id === activeCategory);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const category = tabCategories.find(c => c.id === categoryId);
    if (category && category.tabs.length > 0) {
      setActiveTab(category.tabs[0].id);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "analytics":
        return <AnalyticsTab />;
      case "api-keys":
        return <APIKeysTab />;
      case "seo":
        return <SEOTab />;
      case "content":
        return <ContentTab />;
      case "documents":
        return <DocumentsTab />;
      case "pricing":
        return <PricingTab />;
      case "kyc-review":
        return <KYCReviewTab />;
      case "affiliates":
        return <AffiliatesTab />;
      case "listings":
        return <ListingsTab />;
      case "professionals":
        return <ProfessionalsTab />;
      case "credentials":
        return <CredentialsVerificationTab />;
      case "brokers":
        return <BrokersTab />;
      default:
        return <AnalyticsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <div className="container py-8 flex-1">
        <Breadcrumb items={[
          { label: "Admin Dashboard" }
        ]} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your {APP_TITLE} platform settings and configurations
          </p>
        </div>

        {/* Main Category Tabs */}
        <div className="space-y-6">
          {/* Category Navigation */}
          <div className="border-b">
            <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Admin sections">
              {tabCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                      activeCategory === category.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sub-tabs within category */}
          {currentCategory && currentCategory.tabs.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {currentCategory.tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Tab Content */}
          <div className="space-y-4">
            {renderTabContent()}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
