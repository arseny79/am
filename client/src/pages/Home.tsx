import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Building2, TrendingUp, Shield, MessageSquare, Calculator, Search } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">{APP_TITLE}</span>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/marketplace">
                  <Button variant="ghost">Browse Listings</Button>
                </Link>
                <Link href="/valuation">
                  <Button variant="ghost">Valuation Tool</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="default">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/marketplace">
                  <Button variant="ghost">Browse Listings</Button>
                </Link>
                <Link href="/valuation">
                  <Button variant="ghost">Valuation Tool</Button>
                </Link>
                <a href={getLoginUrl()}>
                  <Button variant="default">Sign In</Button>
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              The Premier Marketplace for MSP Acquisitions
            </h1>
            <p className="text-xl text-muted-foreground">
              Connect buyers and sellers of Managed Service Provider businesses. Streamlined due diligence, 
              data-driven valuations, and secure transactions all in one platform.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <>
                  <Link href="/marketplace">
                    <Button size="lg" className="text-lg px-8">
                      Browse Opportunities
                    </Button>
                  </Link>
                  <Link href="/create-listing">
                    <Button size="lg" variant="outline" className="text-lg px-8">
                      List Your MSP
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="text-lg px-8">
                      Get Started
                    </Button>
                  </a>
                  <Link href="/valuation">
                    <Button size="lg" variant="outline" className="text-lg px-8">
                      Free Valuation Tool
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Marketplace?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for MSP M&A transactions with industry-specific tools and workflows
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Discovery</CardTitle>
                <CardDescription>
                  Search and filter MSP businesses by revenue, EBITDA, location, and service mix
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Calculator className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Data-Driven Valuations</CardTitle>
                <CardDescription>
                  Get instant, market-based valuations using MSP-specific multiples and metrics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure Due Diligence</CardTitle>
                <CardDescription>
                  NDA-protected confidential information and structured data rooms
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Direct Communication</CardTitle>
                <CardDescription>
                  Connect directly with buyers and sellers through our secure messaging system
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Market Insights</CardTitle>
                <CardDescription>
                  Track listing performance and understand market trends in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Building2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Standardized Listings</CardTitle>
                <CardDescription>
                  Consistent data format makes comparison and analysis effortless
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* For Sellers */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-center">For Sellers</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Create Your Listing</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter your MSP's key metrics, financials, and business details
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Get Instant Valuation</h4>
                    <p className="text-sm text-muted-foreground">
                      Our calculator provides a market-based valuation estimate
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Connect with Buyers</h4>
                    <p className="text-sm text-muted-foreground">
                      Qualified buyers reach out directly through secure messaging
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Close the Deal</h4>
                    <p className="text-sm text-muted-foreground">
                      Share confidential details after NDA and negotiate terms
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Buyers */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-center">For Buyers</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Browse Opportunities</h4>
                    <p className="text-sm text-muted-foreground">
                      Search and filter MSP businesses by your acquisition criteria
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Review Key Metrics</h4>
                    <p className="text-sm text-muted-foreground">
                      See standardized financial and operational data for easy comparison
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Sign NDA & Access Details</h4>
                    <p className="text-sm text-muted-foreground">
                      Digitally sign NDA to unlock confidential business information
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Negotiate & Acquire</h4>
                    <p className="text-sm text-muted-foreground">
                      Communicate directly with sellers and complete due diligence
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
                <p className="text-lg opacity-90">
                  Join the marketplace today and connect with serious buyers or discover your next acquisition
                </p>
                <div className="flex gap-4 justify-center pt-4">
                  {isAuthenticated ? (
                    <>
                      <Link href="/marketplace">
                        <Button size="lg" variant="secondary" className="text-lg px-8">
                          Browse Listings
                        </Button>
                      </Link>
                      <Link href="/create-listing">
                        <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                          List Your Business
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <a href={getLoginUrl()}>
                      <Button size="lg" variant="secondary" className="text-lg px-8">
                        Sign Up Now
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">{APP_TITLE}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 MSP M&A Marketplace. Connecting buyers and sellers of managed service providers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
