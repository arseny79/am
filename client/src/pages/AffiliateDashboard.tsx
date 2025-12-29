import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/UserDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
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
  Gift,
  Percent,
  Zap,
  Shield,
  BarChart3,
  Wallet,
  ArrowRight,
  Star
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
      const link = `${window.location.origin}/signup?ref=${affiliateStatus.referralCode}`;
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
  
  // Not authenticated or not yet an affiliate - show landing page
  if (!isAuthenticated || !affiliateStatus) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
            <div className="container max-w-6xl">
              <div className="text-center mb-12">
                <Badge className="mb-4 px-4 py-1" variant="secondary">
                  <Gift className="h-3 w-3 mr-1" /> Partner Program
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Earn Money Referring MSP Deals
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                  Join our affiliate program and earn <span className="text-primary font-semibold">25% commission</span> on 
                  every successful deal from your referrals. Help MSP owners buy and sell businesses while building 
                  a passive income stream.
                </p>
                {isAuthenticated ? (
                  <Dialog open={isApplying} onOpenChange={setIsApplying}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="px-8">
                        <Gift className="mr-2 h-5 w-5" />
                        Apply Now - It's Free
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Affiliate Application</DialogTitle>
                        <DialogDescription>
                          Fill in your details to apply for the affiliate program.
                          We'll review your application and get back to you within 24-48 hours.
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
                            Optional. You can add this later before your first payout.
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
                ) : (
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="px-8">
                      Sign In to Apply
                    </Button>
                  </a>
                )}
              </div>
              
              {/* Key Stats */}
              <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-primary mb-2">25%</div>
                    <p className="text-sm text-muted-foreground">Commission Rate</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-primary mb-2">90</div>
                    <p className="text-sm text-muted-foreground">Day Cookie Duration</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-primary mb-2">$50</div>
                    <p className="text-sm text-muted-foreground">Minimum Payout</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          
          {/* How Commission Works */}
          <section className="py-20">
            <div className="container max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How You Earn Commission</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our commission structure is simple and transparent. You earn a percentage of the platform fee 
                  whenever your referral completes a successful deal.
                </p>
              </div>
              
              <Card className="mb-12">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Commission Calculation Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Deal Value</th>
                          <th className="text-left py-3 px-4">Platform Fee (3%)</th>
                          <th className="text-left py-3 px-4">Your Commission (25%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4">$100,000</td>
                          <td className="py-3 px-4">$3,000</td>
                          <td className="py-3 px-4 font-semibold text-primary">$750</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">$500,000</td>
                          <td className="py-3 px-4">$15,000</td>
                          <td className="py-3 px-4 font-semibold text-primary">$3,750</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">$1,000,000</td>
                          <td className="py-3 px-4">$30,000</td>
                          <td className="py-3 px-4 font-semibold text-primary">$7,500</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">$2,500,000</td>
                          <td className="py-3 px-4">$75,000</td>
                          <td className="py-3 px-4 font-semibold text-primary">$18,750</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    MSP deals typically range from $50,000 to $5,000,000+. Even one successful referral can 
                    generate significant commission income.
                  </p>
                </CardContent>
              </Card>
              
              {/* Commission Tiers */}
              {tiers && tiers.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-center mb-8">Commission Tiers</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {tiers.map((tier, index) => (
                      <Card key={tier.id} className={index === 0 ? "border-primary border-2 relative" : ""}>
                        {index === 0 && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-primary">Starting Tier</Badge>
                          </div>
                        )}
                        <CardHeader className="text-center">
                          <CardTitle>{tier.name}</CardTitle>
                          <CardDescription>Level {tier.level}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                          <div className="text-5xl font-bold text-primary mb-4">
                            {tier.commissionPercent}%
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            of platform fees
                          </p>
                          {(tier.minReferrals > 0 || tier.minEarnings > 0) && (
                            <div className="pt-4 border-t text-sm">
                              <p className="font-medium mb-2">Requirements:</p>
                              {tier.minReferrals > 0 && (
                                <p className="text-muted-foreground">{tier.minReferrals}+ successful referrals</p>
                              )}
                              {tier.minEarnings > 0 && (
                                <p className="text-muted-foreground">${(tier.minEarnings / 100).toLocaleString()}+ in earnings</p>
                              )}
                            </div>
                          )}
                          {tier.minReferrals === 0 && tier.minEarnings === 0 && (
                            <div className="pt-4 border-t text-sm">
                              <p className="text-muted-foreground">No minimum requirements</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* How It Works */}
          <section className="py-20 bg-muted/30">
            <div className="container max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Getting started is easy. Follow these simple steps to begin earning commissions.
                </p>
              </div>
              
              <div className="grid md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Apply</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit your application. Approval typically takes 24-48 hours.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Get Your Link</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive a unique referral link to share with your network.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Refer Users</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your link. When someone signs up, they're tracked as your referral.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">4</span>
                  </div>
                  <h3 className="font-semibold mb-2">Earn Commission</h3>
                  <p className="text-sm text-muted-foreground">
                    When they complete a deal, you earn 25% of the platform fee.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Benefits */}
          <section className="py-20">
            <div className="container max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Why Partner With Us</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our affiliate program is designed to reward you generously for helping grow the MSP marketplace.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <Percent className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">High Commission Rate</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn 25% of platform fees. MSP deals are high-value, meaning significant earnings per referral.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Clock className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">90-Day Cookie</h3>
                    <p className="text-sm text-muted-foreground">
                      Your referral link tracks visitors for 90 days. If they sign up within that window, you get credit.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <BarChart3 className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">Real-Time Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor your referrals, conversions, and earnings in real-time through your dashboard.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Wallet className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">Monthly Payouts</h3>
                    <p className="text-sm text-muted-foreground">
                      Get paid monthly via PayPal once you reach the $50 minimum threshold.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Shield className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">Trusted Platform</h3>
                    <p className="text-sm text-muted-foreground">
                      We use Escrow.com for secure transactions. Your referrals are in good hands.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Zap className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">Free to Join</h3>
                    <p className="text-sm text-muted-foreground">
                      No fees, no minimums, no obligations. Apply today and start earning.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          
          {/* FAQ */}
          <section className="py-20 bg-muted/30">
            <div className="container max-w-3xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Who can become an affiliate?</AccordionTrigger>
                  <AccordionContent>
                    Anyone with a network in the MSP industry can apply. This includes MSP consultants, 
                    industry bloggers, podcast hosts, M&A advisors, accountants, and anyone who works with 
                    MSP business owners. We review each application to ensure quality partnerships.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How long does approval take?</AccordionTrigger>
                  <AccordionContent>
                    Most applications are reviewed within 24-48 hours. Once approved, you'll receive an 
                    email with your unique referral link and access to your affiliate dashboard.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>When do I get paid?</AccordionTrigger>
                  <AccordionContent>
                    Commissions are paid monthly via PayPal. You need a minimum balance of $50 to receive 
                    a payout. Commissions become eligible for payout 30 days after the deal closes to 
                    account for any potential refunds or cancellations.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>How is commission calculated?</AccordionTrigger>
                  <AccordionContent>
                    You earn 25% of the platform fee. Our platform fee is 3% of the deal value. So for a 
                    $500,000 deal, the platform fee is $15,000, and your commission would be $3,750 (25% of $15,000).
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>How long does the referral cookie last?</AccordionTrigger>
                  <AccordionContent>
                    Our referral tracking cookie lasts 90 days. If someone clicks your link and signs up 
                    within 90 days, they'll be attributed to you. The attribution stays with you even if 
                    they complete a deal months later.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>Can I refer both buyers and sellers?</AccordionTrigger>
                  <AccordionContent>
                    Yes! You earn commission whether your referral is a buyer or a seller. As long as 
                    they're part of a completed deal on our platform, you'll receive your commission.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger>Is there a limit to how much I can earn?</AccordionTrigger>
                  <AccordionContent>
                    No limits! The more successful referrals you bring, the more you earn. Top affiliates 
                    can earn thousands of dollars per month from MSP deal commissions.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>
          
          {/* CTA */}
          <section className="py-20">
            <div className="container max-w-4xl text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join our affiliate program today and start earning commissions on MSP deals. 
                It's free to join and takes less than a minute to apply.
              </p>
              {isAuthenticated ? (
                <Dialog open={isApplying} onOpenChange={setIsApplying}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="px-8">
                      <Gift className="mr-2 h-5 w-5" />
                      Apply Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Affiliate Application</DialogTitle>
                      <DialogDescription>
                        Fill in your details to apply for the affiliate program.
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
                          Optional. You can add this later.
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
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="px-8">
                    Sign In to Apply
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              )}
            </div>
          </section>
        </main>
        <Footer />
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
              This usually takes 24-48 hours.
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
        <Footer />
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
        <Footer />
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
        <Footer />
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
                  {window.location.origin}/signup?ref={affiliateStatus.referralCode}
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
      <Footer />
    </div>
  );
}

function Header() {
  const { user } = useAuth();
  
  return (
    <PublicHeader />
  );
}
