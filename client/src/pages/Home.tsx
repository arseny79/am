import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
import { Loader2, ArrowRight, CheckCircle2, ShieldCheck, Zap, Handshake } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { KYCBanner } from "@/components/KYCBanner";

function PremiumListingHero() {
  const { data: premiumListing, isLoading } = trpc.listing.getRandomPremium.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!premiumListing) return null;

  return (
    <div className="lg:sticky lg:top-24">
      <PremiumListingCard listing={premiumListing} />
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: settings } = trpc.admin.getSiteSettings.useQuery();

  const heroHeadline = settings?.heroHeadline || homepageContent.hero.headline;
  const heroSubheadline = settings?.heroSubheadline || homepageContent.hero.subheadline;
  const heroDescription = settings?.heroDescription || homepageContent.hero.description;
  const heroPrimaryButtonText = settings?.heroPrimaryButtonText || homepageContent.hero.primaryCTA.text;
  const heroPrimaryButtonUrl = settings?.heroPrimaryButtonUrl || homepageContent.hero.primaryCTA.href;
  const heroSecondaryButtonText = settings?.heroSecondaryButtonText || homepageContent.hero.secondaryCTA.text;
  const heroSecondaryButtonUrl = settings?.heroSecondaryButtonUrl || homepageContent.hero.secondaryCTA.href;

  const statGmv = settings?.statGmv || homepageContent.trustSignals[0].value;
  const statGmvLabel = settings?.statGmvLabel || homepageContent.trustSignals[0].label;
  const statActiveListings = settings?.statActiveListings || homepageContent.trustSignals[1].value;
  const statActiveListingsLabel = settings?.statActiveListingsLabel || homepageContent.trustSignals[1].label;
  const statEscrowProtected = settings?.statEscrowProtected || homepageContent.trustSignals[2].value;
  const statEscrowProtectedLabel = settings?.statEscrowProtectedLabel || homepageContent.trustSignals[2].label;

  const isShortValue = (val: string) => val.length <= 15;

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

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="hero-gradient pt-20 pb-32 px-4 sm:px-8 overflow-hidden">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold tracking-widest uppercase border border-primary/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                Institutional Grade Marketplace
              </div>

              <h1 className="text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] text-foreground">
                {heroHeadline.split(" ").slice(0, -1).join(" ")}{" "}
                <span className="text-primary">{heroHeadline.split(" ").slice(-1)[0]}</span>
              </h1>

              {heroSubheadline && (
                <p className="text-xl font-semibold text-primary/80">{heroSubheadline}</p>
              )}

              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                {heroDescription}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link href={heroPrimaryButtonUrl}>
                  <Button size="lg" className="px-8 py-4 h-auto font-bold text-base shadow-lg shadow-primary/15 flex items-center gap-2">
                    {heroPrimaryButtonText}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={heroSecondaryButtonUrl}>
                  <Button size="lg" variant="outline" className="px-8 py-4 h-auto font-bold text-base">
                    {heroSecondaryButtonText}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — hero listing card */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] blur-2xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
              <div className="relative">
                <PremiumListingHero />
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust strip ──────────────────────────────────────── */}
        <div className="bg-secondary border-y border-border/50">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-8">
            {[
              { value: statGmv, label: statGmvLabel, short: isShortValue(statGmv) },
              { value: statActiveListings, label: statActiveListingsLabel, short: isShortValue(statActiveListings) },
              ...(statEscrowProtected ? [{ value: statEscrowProtected, label: statEscrowProtectedLabel ?? "", short: isShortValue(statEscrowProtected) }] : []),
            ].flatMap((stat, i, arr) => [
              <div key={i} className="text-center md:text-left">
                <p className="text-[10px] font-black tracking-[0.18em] text-muted-foreground uppercase mb-1">{stat.label}</p>
                {stat.short ? (
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                ) : (
                  <p className="text-base font-semibold text-foreground leading-tight max-w-[200px]">{stat.value}</p>
                )}
              </div>,
              i < arr.length - 1 ? (
                <div key={`div-${i}`} className="h-8 w-px bg-border/40 hidden md:block" />
              ) : null,
            ])}
          </div>
        </div>

        {/* ── Featured Listings ─────────────────────────────────── */}
        <section className="py-24 px-4 sm:px-8 max-w-[1280px] mx-auto w-full">
          <div className="mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
              Featured Opportunities
            </h2>
            <p className="text-muted-foreground">
              Access the most exclusive deals currently on the market.
            </p>
          </div>
          <FeaturedListings />
        </section>

        {/* ── Tailored for Both Sides ───────────────────────────── */}
        <section className="bg-secondary py-24 px-4 sm:px-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-4">
                Tailored for Both Sides
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We've built specialised toolsets for buyers and sellers to ensure a frictionless transition from initial contact to close.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* For Sellers */}
              <div className="bg-card p-10 rounded-3xl shadow-sm border border-border/30">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-6">For Sellers</h3>
                <ul className="space-y-4 mb-10">
                  {[
                    "Anonymous listing options to protect client and employee relationships.",
                    "Valuation tools based on real-time market multiples.",
                    "Vetted buyer pool ensuring only qualified principals see your data.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{item}</p>
                    </li>
                  ))}
                </ul>
                <Link href="/create-listing" className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  Learn about selling <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* For Buyers */}
              <div className="bg-card p-10 rounded-3xl shadow-sm border border-border/30">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-6">For Buyers</h3>
                <ul className="space-y-4 mb-10">
                  {[
                    "Custom alerts for deals matching your geographical and vertical criteria.",
                    "Comprehensive data rooms with standardised reporting formats.",
                    "Direct messaging with verified sellers and their representatives.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{item}</p>
                    </li>
                  ))}
                </ul>
                <Link href="/buy-asset" className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  Learn about buying <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Deal Process ──────────────────────────────────────── */}
        <section className="py-24 px-4 sm:px-8">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-primary/20" />
              <div className="space-y-12 relative">
                {[
                  { n: "1", title: "Verify Identity", desc: "Undergo a rigorous verification process to maintain marketplace integrity.", active: true },
                  { n: "2", title: "Access Deal Room", desc: "Once approved, explore detailed financials and operational data in a secure virtual data room.", active: false },
                  { n: "3", title: "Connect with Principals", desc: "Facilitate meetings and negotiations through our managed communication portal.", active: false },
                  { n: "4", title: "Transact & Close", desc: "Leverage integrated escrow and legal support to finalise the transaction.", active: false },
                ].map((step) => (
                  <div key={step.n} className="flex gap-6">
                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold z-10 ${step.active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {step.n}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-foreground mb-2">{step.title}</h4>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
                The Modern Standard for Professional Transactions
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Our platform replaces outdated spreadsheets and unsecured emails with a professional deal-making environment built for serious principals.
              </p>
              <div className="p-8 bg-secondary rounded-3xl border border-border/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-foreground">Accelerated Close Times</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Buyers and sellers on our platform close deals significantly faster than traditional brokered transactions thanks to standardised data formats and automated workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Partners / Brokers (dark) ──────────────────────────── */}
        <section className="partner-gradient text-white py-24 px-4 sm:px-8 overflow-hidden relative">
          {/* Decorative lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[200%] rotate-45 border-r border-white/20" />
            <div className="absolute top-[-50%] left-[20%] w-[100%] h-[200%] rotate-45 border-r border-white/20" />
          </div>

          <div className="max-w-[1280px] mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-blue-200 text-[10px] font-bold tracking-widest uppercase mb-8">
              <Handshake className="h-3.5 w-3.5" />
              Strategic Alliance Program
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold mb-16 tracking-tight">
              Brokers &amp; Partners
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="h-7 w-7 text-blue-300" />,
                  title: "Deal Flow Analytics",
                  desc: "Advanced dashboarding for M&A professionals to track portfolio movement and market pricing trends in real-time.",
                },
                {
                  icon: <ShieldCheck className="h-7 w-7 text-blue-300" />,
                  title: "White-Label Portals",
                  desc: "Empower your brokerage with our institutional infrastructure under your own trusted brand identity.",
                },
                {
                  icon: <Handshake className="h-7 w-7 text-blue-300" />,
                  title: "Partner Ecosystem",
                  desc: "Connect with legal, tax, and technical due diligence experts to accelerate your clients' transition and closing.",
                },
              ].map((card) => (
                <div key={card.title} className="space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                    {card.icon}
                  </div>
                  <h4 className="text-xl font-bold">{card.title}</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16">
              <Link href="/broker/apply">
                <Button size="lg" className="px-8 py-4 h-auto font-bold text-base flex items-center gap-2 mx-auto shadow-lg">
                  Become a Partner <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="py-32 px-4 sm:px-8 text-center bg-background relative overflow-hidden">
          <div className="absolute inset-0 hero-gradient opacity-60 pointer-events-none" />
          <div className="max-w-[800px] mx-auto relative z-10">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground mb-6">
              Ready to explore opportunities?
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              Join professionals on the most trusted marketplace platform.
            </p>
            {isAuthenticated ? (
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/marketplace">
                  <Button size="lg" className="px-10 py-5 h-auto text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    Browse Listings
                  </Button>
                </Link>
                <Link href="/create-listing">
                  <Button size="lg" variant="outline" className="px-10 py-5 h-auto text-lg font-bold">
                    List Your Business
                  </Button>
                </Link>
              </div>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="px-10 py-5 h-auto text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  Register Now
                </Button>
              </a>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
