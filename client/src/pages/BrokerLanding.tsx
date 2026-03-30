import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Briefcase, 
  DollarSign, 
  Users, 
  Shield, 
  TrendingUp, 
  FileCheck,
  Building2,
  ArrowRight,
  CheckCircle2,
  Percent
} from "lucide-react";
import { getLoginUrl } from "@/const";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export default function BrokerLanding() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const { data: brokerStatus, isLoading: brokerLoading } = trpc.broker.getMyBrokerStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const isLoading = authLoading || brokerLoading;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Briefcase className="h-4 w-4" />
              For M&A Brokers
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Partner With Us to Sell iGaming Businesses
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              List your clients' businesses on our marketplace and earn 50% of platform fees on every successful deal. 
              No upfront costs, no monthly fees.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoading ? (
                <Button disabled size="lg">Loading...</Button>
              ) : brokerStatus?.isBroker ? (
                <Button asChild size="lg">
                  <Link href="/broker/dashboard">
                    Go to Broker Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : isAuthenticated ? (
                <Button asChild size="lg">
                  <Link href="/broker/apply">
                    Apply to Become a Broker
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <a href={getLoginUrl()}>
                    Sign In to Apply
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
              
              <Button variant="outline" size="lg" asChild>
                <a href="#how-it-works">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">50%</div>
              <div className="text-sm text-muted-foreground">Commission Share</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">$0</div>
              <div className="text-sm text-muted-foreground">Upfront Costs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">100+</div>
              <div className="text-sm text-muted-foreground">Active Buyers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">Global</div>
              <div className="text-sm text-muted-foreground">Reach</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Become a broker in three simple steps and start earning on every deal
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="relative">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Apply
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Submit your broker application with your credentials and experience. We review applications within 2-3 business days.
                </p>
              </CardContent>
            </Card>
            
            <Card className="relative">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  List Businesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload your brokerage contract and list your clients' businesses. Each listing requires a valid contract.
                </p>
              </CardContent>
            </Card>
            
            <Card className="relative">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Earn Commission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  When a deal closes, you earn 50% of the platform fee. Payouts are processed monthly via your preferred method.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Benefits */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Partner With Us?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide the platform, buyers, and tools. You bring the deals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <Percent className="h-8 w-8 text-primary mb-2" />
                <CardTitle>50/50 Fee Split</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Earn 50% of the platform success fee on every deal you facilitate. Our standard fee is 3% of deal value.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Access to Buyers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tap into our network of qualified buyers actively looking to acquire iGaming businesses worldwide.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Secure Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All deals are protected through Escrow.com integration, ensuring safe and secure transactions.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Deal Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track all your deals in one dashboard. Manage communications, documents, and milestones easily.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <FileCheck className="h-8 w-8 text-primary mb-2" />
                <CardTitle>NDA & Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built-in NDA signing, document vault, and due diligence tracking for every deal.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <CardTitle>No Upfront Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Zero listing fees, zero monthly fees. You only pay when a deal closes successfully.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Commission Calculator */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Commission Calculator</CardTitle>
                <CardDescription>
                  See how much you could earn as a broker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="p-4 bg-background rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">Deal Value</div>
                    <div className="text-2xl font-bold">$500,000</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">Platform Fee (3%)</div>
                    <div className="text-2xl font-bold">$15,000</div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <div className="text-sm text-primary mb-1">Your Commission (50%)</div>
                    <div className="text-2xl font-bold text-primary">$7,500</div>
                  </div>
                </div>
                
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Example based on a $500,000 deal with 3% platform fee
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Requirements */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Broker Requirements</h2>
              <p className="text-muted-foreground">
                To maintain quality and trust, we have a few requirements for brokers
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                "Valid brokerage contract required for each listing",
                "Professional experience in M&A, business brokerage, or related fields",
                "Commitment to ethical business practices",
                "Responsive communication with buyers and platform",
                "Accurate representation of listed businesses",
              ].map((requirement, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{requirement}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8">
              Join our broker network and start earning on every deal you bring to the platform.
            </p>
            
            {isLoading ? (
              <Button disabled size="lg">Loading...</Button>
            ) : brokerStatus?.isBroker ? (
              <Button asChild size="lg">
                <Link href="/broker/dashboard">
                  Go to Broker Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : isAuthenticated ? (
              <Button asChild size="lg">
                <Link href="/broker/apply">
                  Apply to Become a Broker
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <a href={getLoginUrl()}>
                  Sign In to Apply
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
