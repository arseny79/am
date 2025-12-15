import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { 
  Building2, 
  Loader2, 
  Copy, 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  ExternalLink,
  Gift,
  Percent
} from "lucide-react";

export default function AffiliateDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  
  const { data: affiliateStatus, isLoading: statusLoading, refetch } = trpc.affiliate.getMyStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: referrals } = trpc.affiliate.getMyReferrals.useQuery(undefined, {
    enabled: isAuthenticated && affiliateStatus?.status === "active",
  });
  
  const { data: commissions } = trpc.affiliate.getMyCommissions.useQuery(undefined, {
    enabled: isAuthenticated && affiliateStatus?.status === "active",
  });
  
  const { data: tiers } = trpc.affiliateTier.getAll.useQuery();
  
  const applyMutation = trpc.affiliate.applyForProgram.useMutation({
    onSuccess: () => {
      toast.success("Application submitted! We'll review it shortly.");
      refetch();
      setIsApplying(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updatePaymentMutation = trpc.affiliate.updatePaymentInfo.useMutation({
    onSuccess: () => {
      toast.success("Payment info updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };
  
  const copyReferralLink = () => {
    if (affiliateStatus?.referralCode) {
      const link = `${window.location.origin}/register?ref=${affiliateStatus.referralCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Referral link copied to clipboard!");
    }
  };
  
  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Gift className="h-16 w-16 text-primary" />
        <h1 className="text-2xl font-bold">Affiliate Program</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Earn commissions by referring buyers and sellers to our MSP marketplace.
          Sign in to get started.
        </p>
        <a href={getLoginUrl()}>
          <Button size="lg">Sign In to Apply</Button>
        </a>
      </div>
    );
  }
  
  // Not yet an affiliate - show application form
  if (!affiliateStatus) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <Gift className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-4">Join Our Affiliate Program</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Earn commissions by referring buyers and sellers to the MSP marketplace.
                Help grow the community and get rewarded for every successful deal.
              </p>
            </div>
            
            {/* Commission Tiers */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {tiers?.map((tier) => (
                <Card key={tier.id} className={tier.level === 1 ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {tier.name}
                      {tier.level === 1 && <Badge>Starting Tier</Badge>}
                    </CardTitle>
                    <CardDescription>Level {tier.level}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary mb-4">
                      {tier.commissionPercent}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Commission on platform fees
                    </p>
                    {(tier.minReferrals > 0 || tier.minEarnings > 0) && (
                      <div className="mt-4 pt-4 border-t text-sm">
                        <p className="font-medium mb-1">Requirements:</p>
                        {tier.minReferrals > 0 && (
                          <p className="text-muted-foreground">{tier.minReferrals}+ successful referrals</p>
                        )}
                        {tier.minEarnings > 0 && (
                          <p className="text-muted-foreground">${(tier.minEarnings / 100).toFixed(0)}+ in earnings</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {(!tiers || tiers.length === 0) && (
                <Card className="col-span-3">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Commission tiers are being configured. Check back soon!
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* How It Works */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-primary">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">Share Your Link</h3>
                    <p className="text-sm text-muted-foreground">
                      Get a unique referral link and share it with potential buyers and sellers
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-primary">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">They Sign Up</h3>
                    <p className="text-sm text-muted-foreground">
                      When someone registers using your link, they're tracked as your referral
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-primary">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">Earn Commissions</h3>
                    <p className="text-sm text-muted-foreground">
                      When they complete a deal, you earn a percentage of the platform fee
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Apply Button */}
            <div className="text-center">
              <Dialog open={isApplying} onOpenChange={setIsApplying}>
                <DialogTrigger asChild>
                  <Button size="lg" className="px-8">
                    <Gift className="mr-2 h-5 w-5" />
                    Apply to Become an Affiliate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Affiliate Application</DialogTitle>
                    <DialogDescription>
                      Fill in your details to apply for the affiliate program.
                      We'll review your application and get back to you shortly.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>PayPal Email (for payouts)</Label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional - you can add this later
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsApplying(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => applyMutation.mutate({ paypalEmail: paypalEmail || undefined })}
                      disabled={applyMutation.isPending}
                    >
                      {applyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Submit Application
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Pending application
  if (affiliateStatus.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-2xl text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Application Under Review</h1>
            <p className="text-muted-foreground mb-8">
              Your affiliate application is being reviewed. We'll notify you once it's approved.
              This usually takes 1-2 business days.
            </p>
            <Card>
              <CardContent className="py-6">
                <div className="text-sm text-muted-foreground">
                  Applied on: {affiliateStatus.appliedAt ? new Date(affiliateStatus.appliedAt).toLocaleDateString() : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }
  
  // Rejected application
  if (affiliateStatus.status === "rejected") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-2xl text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Application Not Approved</h1>
            <p className="text-muted-foreground mb-4">
              Unfortunately, your affiliate application was not approved.
            </p>
            {affiliateStatus.rejectionReason && (
              <Card className="mb-8">
                <CardContent className="py-6">
                  <p className="text-sm">
                    <strong>Reason:</strong> {affiliateStatus.rejectionReason}
                  </p>
                </CardContent>
              </Card>
            )}
            <p className="text-sm text-muted-foreground">
              If you believe this was a mistake, please contact support.
            </p>
          </div>
        </main>
      </div>
    );
  }
  
  // Suspended
  if (affiliateStatus.status === "suspended") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-2xl text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Account Suspended</h1>
            <p className="text-muted-foreground mb-8">
              Your affiliate account has been suspended. Please contact support for more information.
            </p>
          </div>
        </main>
      </div>
    );
  }
  
  // Active affiliate dashboard
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Affiliate Dashboard</h1>
              <p className="text-muted-foreground">
                Track your referrals and earnings
              </p>
            </div>
            <Badge className="bg-green-500 text-white">
              {affiliateStatus.tierName} - {affiliateStatus.commissionPercent}% Commission
            </Badge>
          </div>
          
          {/* Referral Link Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>Share this link to earn commissions on successful deals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 bg-muted rounded-lg p-4 font-mono text-sm break-all">
                  {window.location.origin}/register?ref={affiliateStatus.referralCode}
                </div>
                <Button onClick={copyReferralLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Referral Code: <code className="bg-muted px-2 py-1 rounded">{affiliateStatus.referralCode}</code>
              </p>
            </CardContent>
          </Card>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{affiliateStatus.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">
                  {affiliateStatus.successfulReferrals} converted
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(affiliateStatus.totalEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(affiliateStatus.pendingEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(affiliateStatus.paidEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  Total received
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for Referrals and Commissions */}
          <Tabs defaultValue="referrals">
            <TabsList>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle>Your Referrals</CardTitle>
                  <CardDescription>Users who signed up using your referral link</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Signed Up</TableHead>
                        <TableHead>Converted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals?.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{referral.userName || "Anonymous"}</div>
                              <div className="text-sm text-muted-foreground">{referral.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              referral.status === "converted" ? "default" :
                              referral.status === "qualified" ? "secondary" :
                              "outline"
                            }>
                              {referral.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {referral.convertedAt 
                              ? new Date(referral.convertedAt).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {(!referrals || referrals.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No referrals yet. Share your link to get started!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="commissions">
              <Card>
                <CardHeader>
                  <CardTitle>Commission History</CardTitle>
                  <CardDescription>Earnings from successful referral conversions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Deal Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions?.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            {new Date(commission.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{formatCurrency(commission.dealAmount)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(commission.commissionAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              commission.status === "paid" ? "default" :
                              commission.status === "approved" ? "secondary" :
                              commission.status === "cancelled" ? "destructive" :
                              "outline"
                            }>
                              {commission.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {(!commissions || commissions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No commissions yet. Commissions are earned when your referrals complete deals.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>Configure how you receive your payouts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>PayPal Email</Label>
                    <div className="flex gap-4 mt-2">
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        defaultValue={affiliateStatus.paypalEmail || ""}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                      />
                      <Button 
                        onClick={() => updatePaymentMutation.mutate({ paypalEmail })}
                        disabled={updatePaymentMutation.isPending}
                      >
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Commissions will be sent to this PayPal account
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
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
            <Button variant="ghost">Marketplace</Button>
          </Link>
          <Link href="/deals">
            <Button variant="ghost">Deals</Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost">Profile</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
