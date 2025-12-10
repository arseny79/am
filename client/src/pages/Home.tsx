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
import Footer from "@/components/Footer";
import { PremiumListingCard } from "@/components/PremiumListingCard";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

function PremiumListingHero() {
  const { data: premiumListing, isLoading } = trpc.listing.getRandomPremium.useQuery();

  if (isLoading) {
    return (
      <div className="hidden lg:flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!premiumListing) {
    return null;
  }

  return (
    <div className="hidden lg:block">
      <PremiumListingCard listing={premiumListing} />
    </div>
  );
}

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
            <Link href="/valuation-tool" className="text-foreground hover:text-primary font-medium transition-colors">
              Valuate
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
          <div className="grid lg:grid-cols-[1fr,400px] gap-8 items-center">
          <div className="text-center lg:text-left space-y-6">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 text-sm">
              {homepageContent.trustSignals.map((signal, index) => (
                <div key={index} className="flex flex-col items-center lg:items-start">
                  <div className="text-3xl font-bold text-primary">{signal.value}</div>
                  <div className="text-muted-foreground">{signal.label}</div>
                </div>
              ))}
            </div>
          </div>
          <PremiumListingHero />
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

      <Footer />
    </div>
    </>
  );
}
