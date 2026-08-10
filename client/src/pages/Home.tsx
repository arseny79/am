import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import FeaturedListings from "@/components/FeaturedListings";
import { SEOHead } from "@/components/SEOHead";
import { homepageContent } from "@/config/homepage";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { PublicHeader } from "@/components/PublicHeader";
import { KYCBanner } from "@/components/KYCBanner";

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
  const siteName = settings?.siteName || "Acquisitions.market";
  const siteUrl = settings?.siteUrl || "https://acquisitions.market";
  const homeStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
      description:
        settings?.homeSeoDescription ||
        settings?.seoDescription ||
        "Curated private acquisitions of crypto-friendly iGaming businesses, B2B technology and traffic assets.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
      description:
        settings?.seoDescription ||
        "Private M&A marketplace for crypto-friendly iGaming businesses and assets.",
      logo: settings?.logoUrl || undefined,
    },
  ];

  return (
    <>
      <SEOHead
        pageKey="home"
        title="Acquisitions.market | Private iGaming M&A Marketplace"
        description="Curated private acquisitions of crypto-friendly iGaming businesses, B2B technology and traffic assets."
        structuredData={homeStructuredData}
      />
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
                    <h4 className="font-semibold mb-1">Submit Your Business</h4>
                    <p className="text-sm text-muted-foreground">
                      Share the key details about your iGaming business or asset. AM reviews every submission before it appears in the marketplace.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Manual Review</h4>
                    <p className="text-sm text-muted-foreground">
                      Our team reviews your listing for fit and completeness. Approved listings are published to qualified buyers.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Seller-Controlled Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose what is visible publicly and what unlocks only after a buyer signs an NDA or you approve their request.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Qualified Introduction</h4>
                    <p className="text-sm text-muted-foreground">
                      When a serious buyer emerges, AM facilitates the introduction. Diligence and closing are handled by you and your advisors.
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
                    <h4 className="font-semibold mb-1">Share Your Mandate</h4>
                    <p className="text-sm text-muted-foreground">
                      Tell us what you are looking for. Complete your buyer profile to unlock access to confidential listings.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Review Curated Opportunities</h4>
                    <p className="text-sm text-muted-foreground">
                      Browse iGaming businesses, B2B technology platforms and affiliate assets that fit your acquisition thesis.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Request Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Sign an NDA or request seller approval to review confidential financials and operating data.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Engage Directly</h4>
                    <p className="text-sm text-muted-foreground">
                      Once access is granted, communicate directly with the seller. AM does not intermediate negotiations or handle closing.
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
                <h2 className="text-3xl font-bold">Ready to Start a Confidential Deal Process?</h2>
                <p className="text-lg opacity-90">
                  List an iGaming asset for acquisition, share your mandate, or explore what is currently available on the marketplace.
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
