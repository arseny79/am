import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
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
import { PublicHeader } from "@/components/PublicHeader";
import { KYCBanner } from "@/components/KYCBanner";

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
    <div className="hidden lg:block sticky top-24">
      <PremiumListingCard listing={premiumListing} />
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: settings } = trpc.admin.getSiteSettings.useQuery();

  // Use database values if available, otherwise fall back to config
  const heroHeadline = settings?.heroHeadline || homepageContent.hero.headline;
  const heroSubheadline = settings?.heroSubheadline || homepageContent.hero.subheadline;
  const heroDescription = settings?.heroDescription || homepageContent.hero.description;
  const heroPrimaryButtonText = settings?.heroPrimaryButtonText || homepageContent.hero.primaryCTA.text;
  const heroPrimaryButtonUrl = settings?.heroPrimaryButtonUrl || homepageContent.hero.primaryCTA.href;
  const heroSecondaryButtonText = settings?.heroSecondaryButtonText || homepageContent.hero.secondaryCTA.text;
  const heroSecondaryButtonUrl = settings?.heroSecondaryButtonUrl || homepageContent.hero.secondaryCTA.href;
  
  // Stats section - use database values if available, otherwise fall back to config
  const statGmv = settings?.statGmv || homepageContent.trustSignals[0].value;
  const statGmvLabel = settings?.statGmvLabel || homepageContent.trustSignals[0].label;
  const statActiveListings = settings?.statActiveListings || homepageContent.trustSignals[1].value;
  const statActiveListingsLabel = settings?.statActiveListingsLabel || homepageContent.trustSignals[1].label;
  const statEscrowProtected = settings?.statEscrowProtected || homepageContent.trustSignals[2].value;
  const statEscrowProtectedLabel = settings?.statEscrowProtectedLabel || homepageContent.trustSignals[2].label;
  
  // Helper to determine if a value looks like a number/stat (short) or text description (long)
  const isShortValue = (val: string) => val.length <= 15;

  // SEO: Update meta tags and structured data
  useEffect(() => {
    updateMetaTags(defaultSEO.home);
    injectStructuredData(generateOrganizationStructuredData());
  }, []);

  return (
    <>
      <SEOMetaTags />
      <div className="min-h-screen flex flex-col">
      <PublicHeader />
      {isAuthenticated && user && <KYCBanner user={user} />}

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="hero-grid gap-12 items-start">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight break-words">
              {heroHeadline.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-primary">{heroHeadline.split(" ").slice(-1)[0]}</span>
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              {heroSubheadline}
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              {heroDescription}
            </p>
            <div className="flex gap-4 pt-6 flex-wrap">
              <Link href={heroPrimaryButtonUrl}>
                <Button size="lg" className="text-lg px-10 py-6 h-auto">
                  {heroPrimaryButtonText}
                </Button>
              </Link>
              <Link href={heroSecondaryButtonUrl}>
                <Button size="lg" variant="outline" className="text-lg px-10 py-6 h-auto">
                  {heroSecondaryButtonText}
                </Button>
              </Link>
            </div>
            
            {/* Trust Signals */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="flex flex-col items-start">
                {isShortValue(statGmv) ? (
                  <>
                    <div className="text-3xl font-bold text-primary">{statGmv}</div>
                    {statGmvLabel && <div className="text-sm text-muted-foreground">{statGmvLabel}</div>}
                  </>
                ) : (
                  <>
                    <div className="text-base font-semibold text-foreground leading-tight">{statGmv}</div>
                    {statGmvLabel && <div className="text-xs text-muted-foreground mt-1">{statGmvLabel}</div>}
                  </>
                )}
              </div>
              <div className="flex flex-col items-start">
                {isShortValue(statActiveListings) ? (
                  <>
                    <div className="text-3xl font-bold text-primary">{statActiveListings}</div>
                    {statActiveListingsLabel && <div className="text-sm text-muted-foreground">{statActiveListingsLabel}</div>}
                  </>
                ) : (
                  <>
                    <div className="text-base font-semibold text-foreground leading-tight">{statActiveListings}</div>
                    {statActiveListingsLabel && <div className="text-xs text-muted-foreground mt-1">{statActiveListingsLabel}</div>}
                  </>
                )}
              </div>
              <div className="flex flex-col items-start">
                {statEscrowProtected && (
                  isShortValue(statEscrowProtected) ? (
                    <>
                      <div className="text-3xl font-bold text-primary">{statEscrowProtected}</div>
                      {statEscrowProtectedLabel && <div className="text-sm text-muted-foreground">{statEscrowProtectedLabel}</div>}
                    </>
                  ) : (
                    <>
                      <div className="text-base font-semibold text-foreground leading-tight">{statEscrowProtected}</div>
                      {statEscrowProtectedLabel && <div className="text-xs text-muted-foreground mt-1">{statEscrowProtectedLabel}</div>}
                    </>
                  )
                )}
              </div>
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
