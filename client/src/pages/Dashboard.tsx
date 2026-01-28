import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { 
  Loader2, 
  Building2, 
  Handshake, 
  TrendingUp, 
  Plus, 
  Eye, 
  ArrowRight,
  Bell,
  MessageSquare,
  DollarSign,
  FileText,
  UserPlus,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  X,
  ExternalLink,
  Search,
  Store
} from "lucide-react";
import { Link, useLocation } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
}

function AuthenticatedDashboardContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fetch user's listings
  const { data: listings, isLoading: listingsLoading, isError: listingsError } = trpc.listing.getMyListings.useQuery();
  
  // Fetch user's buyer requests
  const { data: buyerRequests, isLoading: buyerRequestsLoading, isError: buyerRequestsError } = trpc.buyerRequest.getMy.useQuery();
  
  // Fetch user's deals
  const { data: deals, isLoading: dealsLoading } = trpc.deal.getMyDeals.useQuery();
  
  // Fetch unread notifications count
  const { data: unreadNotifications } = trpc.notification.getUnreadCount.useQuery();
  
  // Fetch unread messages count
  const { data: unreadMessages } = trpc.message.getUnreadCount.useQuery();
  
  // Fetch recent notifications for activity timeline
  const { data: notifications, refetch: refetchNotifications } = trpc.notification.getMy.useQuery({ unreadOnly: false });
  
  // Mark notification as read mutation
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
    }
  });

  const isLoading = listingsLoading || dealsLoading || buyerRequestsLoading;

  // Calculate metrics
  const totalListings = listings?.length || 0;
  const publishedListings = listings?.filter(l => l.status === 'published').length || 0;
  const draftListings = listings?.filter(l => l.status === 'draft').length || 0;
  
  const totalDeals = deals?.length || 0;
  const activeDeals = deals?.filter(d => d.status === 'active' || d.status === 'nda_signed').length || 0;
  const pendingDeals = deals?.filter(d => d.status === 'pending').length || 0;
  
  const unreadNotifCount = unreadNotifications?.count || 0;
  const unreadMsgCount = unreadMessages?.count || 0;

  // Combine listings and buyer requests into unified list
  type UnifiedItem = {
    id: number;
    type: 'listing' | 'buyerRequest';
    title: string;
    subtitle: string;
    status: string;
    createdAt: string;
    price?: number;
    budget?: number;
    responseCount?: number;
  };

  const unifiedItems: UnifiedItem[] = [
    // Add listings
    ...(listings || []).map(listing => ({
      id: listing.id,
      type: 'listing' as const,
      title: listing.businessName,
      subtitle: listing.location || 'No location',
      status: listing.status,
      createdAt: listing.createdAt,
      price: listing.askingPrice,
    })),
    // Add buyer requests
    ...(buyerRequests || []).map(request => ({
      id: request.id,
      type: 'buyerRequest' as const,
      title: request.title,
      subtitle: request.preferredLocations || 'Any location',
      status: request.status,
      createdAt: request.createdAt,
      budget: request.budget,
      responseCount: request.proposalCount || 0,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Get recent unified items (last 5)
  const recentUnifiedItems = unifiedItems.slice(0, 5);
  
  // Get recent deals (last 3 items)
  const recentDeals = deals?.slice(0, 3) || [];
  
  // Check if there are any data errors
  const hasPartialError = (listingsError && !buyerRequestsError) || (!listingsError && buyerRequestsError);
  
  // Get recent notifications for activity timeline (last 10)
  const recentActivity = (notifications?.slice(0, 10) || []) as ActivityItem[];
  
  // Get unread notifications for dropdown (last 5)
  const unreadNotificationsList = (notifications?.filter(n => !n.isRead).slice(0, 5) || []) as ActivityItem[];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'active':
      case 'nda_signed':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_deal':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'deal_update':
      case 'deal_stage_change':
        return <Handshake className="h-4 w-4 text-green-600" />;
      case 'new_message':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'nda_signed':
        return <FileText className="h-4 w-4 text-amber-600" />;
      case 'proposal_received':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'listing_view':
        return <Eye className="h-4 w-4 text-gray-600" />;
      case 'buyer_request_match':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    // Mark as read if not already
    if (!activity.isRead) {
      markAsRead.mutate({ id: activity.id });
    }
    
    // If there's an action URL, navigate to it
    if (activity.actionUrl) {
      setLocation(activity.actionUrl);
      return;
    }
    
    // Otherwise show the detail modal
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const handleNotificationClick = (notification: ActivityItem) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead.mutate({ id: notification.id });
    }
    
    // Close dropdown
    setShowNotifications(false);
    
    // Navigate if there's an action URL
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
    } else {
      // Show modal for details
      setSelectedActivity(notification);
      setShowActivityModal(true);
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'new_deal': return 'New Deal';
      case 'deal_update': return 'Deal Update';
      case 'deal_stage_change': return 'Stage Change';
      case 'new_message': return 'New Message';
      case 'nda_signed': return 'NDA Signed';
      case 'proposal_received': return 'Proposal Received';
      case 'listing_view': return 'Listing View';
      case 'buyer_request_match': return 'Buyer Request Match';
      default: return 'Notification';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12 bg-gray-50">
        <div className="container max-w-6xl">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your marketplace activity
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Quick Stats with Notification Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Listings</p>
                        <p className="text-3xl font-bold">{totalListings}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 text-sm">
                      <span className="text-green-600">{publishedListings} published</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{draftListings} drafts</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                        <p className="text-3xl font-bold">{activeDeals}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center relative">
                        <Handshake className="h-6 w-6 text-green-600" />
                        {pendingDeals > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {pendingDeals}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 text-sm">
                      <span className="text-yellow-600">{pendingDeals} pending</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{totalDeals} total</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications Card with Clickable Bell */}
                <div className="relative" ref={notificationRef}>
                  <Card 
                    className="relative cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                          <p className="text-3xl font-bold">{unreadNotifCount}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center relative hover:scale-110 transition-transform">
                          <Bell className="h-6 w-6 text-purple-600" />
                          {unreadNotifCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
                              {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {unreadNotifCount > 0 ? 'Click to view' : 'All caught up!'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {unreadNotificationsList.length === 0 ? (
                          <div className="p-6 text-center text-slate-500">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No new notifications</p>
                          </div>
                        ) : (
                          unreadNotificationsList.map((notification) => (
                            <div 
                              key={notification.id} 
                              className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                              onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getActivityIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                                  <p className="text-xs text-slate-400 mt-2">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-200">
                        <Link href="/notifications">
                          <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowNotifications(false)}>
                            View All Notifications
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Card className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Messages</p>
                        <p className="text-3xl font-bold">{unreadMsgCount}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center relative">
                        <MessageSquare className="h-6 w-6 text-amber-600" />
                        {unreadMsgCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {unreadMsgCount > 0 ? 'Unread messages' : 'No new messages'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Link href="/create-listing">
                  <Card className="cursor-pointer hover:shadow-lg transition-all border-dashed border-2 hover:border-primary">
                    <CardContent className="pt-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Create New Listing</p>
                        <p className="text-sm text-muted-foreground">List your MSP for sale</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/browse">
                  <Card className="cursor-pointer hover:shadow-lg transition-all">
                    <CardContent className="pt-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Eye className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Browse Listings</p>
                        <p className="text-sm text-muted-foreground">Find MSPs to acquire</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/valuate">
                  <Card className="cursor-pointer hover:shadow-lg transition-all">
                    <CardContent className="pt-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Get Valuation</p>
                        <p className="text-sm text-muted-foreground">Estimate your MSP's value</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Listings and Deals */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Unified Listings & Buyer Requests */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Your Listings & Requests</CardTitle>
                        <CardDescription>Your For Sale listings and Buyer Requests</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/my-listings">
                          <Button variant="ghost" size="sm">
                            Listings <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href="/my-buyer-requests">
                          <Button variant="ghost" size="sm">
                            Requests <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Show partial error notification if one API failed */}
                      {hasPartialError && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>Some data couldn't be loaded. Showing available items.</span>
                        </div>
                      )}
                      
                      {recentUnifiedItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>You haven't created any listings or buyer requests yet</p>
                          <div className="flex justify-center gap-4 mt-4">
                            <Link href="/create-listing">
                              <Button variant="outline" size="sm">
                                <Store className="h-4 w-4 mr-2" />
                                Create Listing
                              </Button>
                            </Link>
                            <Link href="/create-buyer-request">
                              <Button variant="outline" size="sm">
                                <Search className="h-4 w-4 mr-2" />
                                Post Buyer Request
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentUnifiedItems.map((item) => (
                            <Link 
                              key={`${item.type}-${item.id}`} 
                              href={item.type === 'listing' ? `/edit-listing/${item.id}` : `/buyer-request/${item.id}`}
                            >
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {/* Type Icon */}
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    item.type === 'listing' ? 'bg-blue-100' : 'bg-purple-100'
                                  }`}>
                                    {item.type === 'listing' ? (
                                      <Store className="h-5 w-5 text-blue-600" />
                                    ) : (
                                      <Search className="h-5 w-5 text-purple-600" />
                                    )}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium truncate">{item.title}</p>
                                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${
                                        item.type === 'listing' ? 'border-blue-300 text-blue-700' : 'border-purple-300 text-purple-700'
                                      }`}>
                                        {item.type === 'listing' ? 'For Sale' : 'Buyer Request'}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span className="truncate">{item.subtitle}</span>
                                      {item.type === 'listing' && item.price && (
                                        <>
                                          <span>•</span>
                                          <span className="font-medium text-green-600">
                                            ${item.price.toLocaleString()}
                                          </span>
                                        </>
                                      )}
                                      {item.type === 'buyerRequest' && item.budget && (
                                        <>
                                          <span>•</span>
                                          <span className="font-medium text-purple-600">
                                            Budget: ${item.budget.toLocaleString()}
                                          </span>
                                        </>
                                      )}
                                      {item.type === 'buyerRequest' && item.responseCount !== undefined && (
                                        <>
                                          <span>•</span>
                                          <span>{item.responseCount} responses</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Status Badge */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {getStatusBadge(item.status)}
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Deals */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Your Deals</CardTitle>
                        <CardDescription>Active negotiations and transactions</CardDescription>
                      </div>
                      <Link href="/my-deals">
                        <Button variant="ghost" size="sm">
                          View All <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent>
                      {recentDeals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Handshake className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No deals yet</p>
                          <Link href="/browse">
                            <Button variant="link" className="mt-2">Browse listings to start a deal</Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentDeals.map((deal) => (
                            <Link key={deal.id} href={`/deal/${deal.id}`}>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{deal.listing?.businessName || 'Unknown Listing'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {deal.role === 'seller' ? `Buyer: ${deal.buyerName || 'Anonymous'}` : `Seller: ${deal.sellerName || 'Anonymous'}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(deal.status)}
                                  <Button variant="ghost" size="sm">View</Button>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Activity Timeline */}
                <div className="lg:col-span-1">
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Activity Timeline
                      </CardTitle>
                      <CardDescription>Recent actions and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No recent activity</p>
                          <p className="text-sm mt-1">Your activity will appear here</p>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                          
                          <div className="space-y-4">
                            {recentActivity.map((activity) => (
                              <div 
                                key={activity.id} 
                                className="relative flex gap-4 pl-2 cursor-pointer hover:bg-yellow-50 rounded-lg p-2 -ml-2 transition-colors"
                                onClick={() => handleActivityClick(activity)}
                              >
                                {/* Timeline dot */}
                                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                  activity.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                                }`}>
                                  {getActivityIcon(activity.type)}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0 pb-4">
                                  <p className={`text-sm ${activity.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                    {activity.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {activity.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                  </p>
                                </div>
                                
                                {/* Hover indicator */}
                                <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Activity Detail Modal */}
      {showActivityModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowActivityModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  selectedActivity.isRead ? 'bg-gray-100' : 'bg-blue-100'
                }`}>
                  {getActivityIcon(selectedActivity.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedActivity.title}</h3>
                  <Badge variant="outline" className="mt-1">{getActivityTypeLabel(selectedActivity.type)}</Badge>
                </div>
              </div>
              <button 
                onClick={() => setShowActivityModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-700">{selectedActivity.message}</p>
              </div>
              
              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">Details:</h4>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {Object.entries(selectedActivity.metadata).map(([key, value]) => (
                      <li key={key}>• {key}: {String(value)}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(selectedActivity.createdAt), { addSuffix: true })}
              </p>
              
              <div className="flex gap-3 pt-2">
                {selectedActivity.actionUrl && (
                  <Link href={selectedActivity.actionUrl}>
                    <Button onClick={() => setShowActivityModal(false)}>
                      View Details
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Button variant="outline" onClick={() => setShowActivityModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function Dashboard() {
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
        <p className="text-lg text-muted-foreground">Please sign in to access your dashboard</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  return <AuthenticatedDashboardContent />;
}
