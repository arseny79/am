import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Building2 } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { updateMetaTags, injectStructuredData, generateOrganizationStructuredData, defaultSEO } from "@/lib/seo";
import FeaturedListings from "@/components/FeaturedListings";
import SEOMetaTags from "@/components/SEOMetaTags";
import { homepageContent } from "@/config/homepage";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  // SEO: Update meta tags and structured data
  useEffect(() => {
    updateMetaTags(defaultSEO.home);
    injectStructuredData(generateOrganizationStructuredData());
  }, []);

  return (
    <>
      <SEOMetaTags />
      <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_TITLE}</span>
            </div>
          </Link>
          
          {/* Main Navigation - Center */}
          <nav className="flex items-center gap-8">
            <Link href="/buy-asset" className="text-foreground hover:text-primary font-medium transition-colors">
              Buy
            </Link>
            <Link href="/marketplace" className="text-foreground hover:text-primary font-medium transition-colors">
              Browse
            </Link>
            <Link href="/create-listing" className="text-foreground hover:text-primary font-medium transition-colors">
              Sell
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin-dashboard" className="text-foreground hover:text-primary font-medium transition-colors">
                Admin
              </Link>
            )}
          </nav>
          
          {/* Login Button - Right */}
          <div>
            {isAuthenticated ? (
              <Link href="/profile">
                <Button variant="default">Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">Login</Button>
                </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              {homepageContent.hero.headline}{" "}
              {homepageContent.hero.highlightedWord && (
                <span className="text-primary">{homepageContent.hero.highlightedWord}</span>
              )}
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              {homepageContent.hero.subheadline}
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {homepageContent.hero.description.split("only when your business sells").map((part, i, arr) => (
                i < arr.length - 1 ? (
                  <span key={i}>{part}<strong>only when your business sells</strong></span>
                ) : part
              ))}
            </p>
            <div className="flex gap-4 justify-center pt-6 flex-wrap">
              <Link href={homepageContent.hero.primaryCTA.href}>
                <Button size="lg" className="text-lg px-10 py-6 h-auto">
                  {homepageContent.hero.primaryCTA.text}
                </Button>
              </Link>
              <Link href={homepageContent.hero.secondaryCTA.href}>
                <Button size="lg" variant="outline" className="text-lg px-10 py-6 h-auto">
                  {homepageContent.hero.secondaryCTA.text}
                </Button>
              </Link>
            </div>
            
            {/* Trust Signals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto pt-8 text-sm">
              {homepageContent.trustSignals.map((signal, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-primary">{signal.value}</div>
                  <div className="text-muted-foreground">{signal.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <FeaturedListings />

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{homepageContent.featuresHeadline}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {homepageContent.featuresSubheadline}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homepageContent.features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <Icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
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
                    <h4 className="font-semibold mb-1">Close with Escrow Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Funds held securely by Escrow.com. No wire transfers, no risk
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
      <footer className="border-t py-8 mt-auto bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-semibold">{APP_TITLE}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting buyers and sellers of managed service provider businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/marketplace" className="hover:text-primary">Browse Listings</Link></li>
                <li><Link href="/valuation" className="hover:text-primary">Valuation Tool</Link></li>
                <li><Link href="/buy-asset" className="hover:text-primary">Post Buyer Request</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="/how-it-works" className="hover:text-primary">How It Works</Link></li>
                <li><a href="/legal/DISCLAIMER.md" target="_blank" className="hover:text-primary">Disclaimer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/legal/TERMS_OF_SERVICE.md" target="_blank" className="hover:text-primary">Terms of Service</a></li>
                <li><a href="/legal/PRIVACY_POLICY.md" target="_blank" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="/legal/COOKIE_POLICY.md" target="_blank" className="hover:text-primary">Cookie Policy</a></li>
                <li><a href="/legal/ACCEPTABLE_USE_POLICY.md" target="_blank" className="hover:text-primary">Acceptable Use</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 mspsmarket.com. Operated by iGacquire OÜ.</p>
            <p className="mt-1">Toostuse tn 75-71, 10416, Tallinn, Estonia</p>
            <p className="mt-2">
              <strong>Disclaimer:</strong> mspsmarket.com is a technology platform, not a broker or advisor. Seek professional advice before making investment decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
