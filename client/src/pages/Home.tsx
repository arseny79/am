import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import ActiveOpportunities from "@/components/ActiveOpportunities";
import HeroDealCard from "@/components/HeroDealCard";
import { SEOHead } from "@/components/SEOHead";
import { homepageContent } from "@/config/homepage";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { PublicHeader } from "@/components/PublicHeader";
import { KYCBanner } from "@/components/KYCBanner";
import { ShieldCheck, Lock, Sparkles } from "lucide-react";
import { useRef, useEffect } from "react";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = spotlightRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.setProperty("--mouse-x", e.clientX + "px");
      el.style.setProperty("--mouse-y", e.clientY + "px");
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  const { data: settings } = trpc.admin.getSiteSettings.useQuery();
  const { data: listings } = trpc.listing.search.useQuery({});

  const activeListingCount = listings?.length ?? 0;

  // Use database values if available, otherwise fall back to config
  const heroHeadline = settings?.heroHeadline || homepageContent.hero.headline;
  const heroSubheadline = settings?.heroSubheadline || homepageContent.hero.subheadline;
  const heroDescription = settings?.heroDescription || homepageContent.hero.description;
  const heroPrimaryButtonText = settings?.heroPrimaryButtonText || homepageContent.hero.primaryCTA.text;
  const heroPrimaryButtonUrl = settings?.heroPrimaryButtonUrl || homepageContent.hero.primaryCTA.href;
  const heroSecondaryButtonText = settings?.heroSecondaryButtonText || homepageContent.hero.secondaryCTA.text;
  const heroSecondaryButtonUrl = settings?.heroSecondaryButtonUrl || homepageContent.hero.secondaryCTA.href;

  // Trust / proof ribbon - use database values if available, otherwise fall back to config.
  // Active listing count is always the live, computed value — never an editable mockup metric.
  const statGmv = settings?.statGmv || homepageContent.trustSignals[0].value;
  const statGmvLabel = settings?.statGmvLabel || homepageContent.trustSignals[0].label;
  const statConfidential = homepageContent.trustSignals[1].value;
  const statConfidentialLabel = homepageContent.trustSignals[1].label;
  const statEscrowProtected = settings?.statEscrowProtected || homepageContent.trustSignals[2].value;
  const statEscrowProtectedLabel = settings?.statEscrowProtectedLabel || homepageContent.trustSignals[2].label;

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
      <div className="am-obsidian dark min-h-screen flex flex-col text-foreground relative">
        {/* Dark base — lowest fixed layer so the wrapper can be transparent */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: -50, background: "#0a0a14" }}
          aria-hidden="true"
        />
        {/* Site-wide static square grid — full page, no fade */}
        <div
          className="fixed inset-0 -z-30 am-cyber-grid pointer-events-none"
          aria-hidden="true"
        />
        {/* Cursor-follow spotlight — updates via JS mousemove */}
        <div
          ref={spotlightRef}
          className="fixed inset-0 -z-20 am-spotlight pointer-events-none"
          aria-hidden="true"
        />
        {/* Violet crown glow */}
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[520px] bg-primary/20 blur-[140px] pointer-events-none -z-20"
          aria-hidden="true"
        />
        {/* Cyan right ambient glow */}
        <div
          className="fixed top-1/4 -right-40 w-[600px] h-[600px] bg-cyan-500/10 blur-[160px] pointer-events-none -z-20"
          aria-hidden="true"
        />
        {/* Violet left ambient accent */}
        <div
          className="fixed top-[35%] -left-40 w-[500px] h-[500px] bg-violet-800/15 blur-[140px] pointer-events-none -z-20"
          aria-hidden="true"
        />

        {/* Compact status bar */}
        <div className="w-full bg-black/70 border-b border-border/50 text-[11px] font-mono py-1.5 px-4">
          <div className="max-w-[1220px] mx-auto flex items-center justify-between gap-6 overflow-x-auto whitespace-nowrap">
            <div className="flex items-center gap-5 text-[var(--am-text-dim)]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-300 font-semibold">MARKETPLACE: LIVE</span>
              </div>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1">
                <span className="text-[var(--am-text-dim)]">Active Listings:</span>
                <span className="text-white font-bold">{activeListingCount}</span>
              </div>
              <span className="hidden sm:inline text-border">|</span>
              <div className="hidden sm:flex items-center gap-1">
                <span className="text-[var(--am-text-dim)]">Access:</span>
                <span className="text-[var(--am-accent-lavender)] font-bold">Manual Review Only</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[var(--am-text-dim)]">
              <Lock className="w-3 h-3" />
              <span>Confidential by Design</span>
            </div>
          </div>
        </div>

        <PublicHeader />
        {isAuthenticated && user && <KYCBanner user={user} />}

        {/* Hero Section */}
        <section className="relative py-14 sm:py-16 lg:py-20 overflow-hidden flex items-center">
          <div className="container relative w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
              {/* Left: headline, CTAs, trust badges */}
              <div className="lg:col-span-7 space-y-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Manually Reviewed Listings
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-zinc-300 bg-card border border-border">
                    <Lock className="w-3 h-3" /> Confidential by Design
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.02em] text-white leading-[1.06] break-words">
                  {heroHeadline.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="bg-gradient-to-br from-[var(--am-accent-lavender)] via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    {heroHeadline.split(" ").slice(-1)[0]}
                  </span>
                </h1>
                <p className="text-lg md:text-xl font-semibold text-[var(--am-accent-lavender)]/90">
                  {heroSubheadline}
                </p>
                <p className="text-base sm:text-lg text-[var(--am-text-dim)] leading-relaxed max-w-xl">
                  {heroDescription}
                </p>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link href={heroPrimaryButtonUrl}>
                    <Button size="lg" className="am-btn-gradient text-base px-8 h-auto py-3.5 font-semibold tracking-wide">
                      {heroPrimaryButtonText}
                    </Button>
                  </Link>
                  <Link href={heroSecondaryButtonUrl}>
                    <Button size="lg" variant="outline" className="text-base px-8 h-auto py-3.5 border-border/80 hover:border-primary/60">
                      {heroSecondaryButtonText}
                    </Button>
                  </Link>
                </div>

                <div className="pt-5 border-t border-border/70 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[var(--am-text-dim)] font-mono">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Seller-Controlled Access</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[var(--am-accent-lavender)]" />
                    <span>Qualified Buyers Only</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span>NDA-Gated Financials</span>
                  </div>
                </div>
              </div>

              {/* Right: real featured listing card */}
              <div className="lg:col-span-5">
                <HeroDealCard />
              </div>
            </div>
          </div>
        </section>

        {/* Proof / capabilities ribbon — four balanced, real signals */}
        <section className="border-y border-border/60 bg-black/25 backdrop-blur-sm py-6">
          <div className="container">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              <div className="text-center py-4 px-6 lg:border-r border-border/40">
                <span className="text-3xl lg:text-4xl font-mono font-black text-[var(--am-accent-lavender)] block tabular-nums">
                  {activeListingCount}
                </span>
                <span className="text-[11px] font-mono text-[var(--am-text-dim)] uppercase tracking-widest mt-1.5 block">
                  Active Listings
                </span>
              </div>
              <div className="text-center py-4 px-6 lg:border-r border-border/40">
                <span className="text-3xl lg:text-4xl font-mono font-black text-white block">{statGmv}</span>
                <span className="text-[11px] font-mono text-[var(--am-text-dim)] uppercase tracking-widest mt-1.5 block">
                  {statGmvLabel}
                </span>
              </div>
              <div className="text-center py-4 px-6 lg:border-r border-border/40">
                <span className="text-3xl lg:text-4xl font-mono font-black text-cyan-400 block">
                  {statEscrowProtected}
                </span>
                <span className="text-[11px] font-mono text-[var(--am-text-dim)] uppercase tracking-widest mt-1.5 block">
                  {statEscrowProtectedLabel}
                </span>
              </div>
              <div className="text-center py-4 px-6">
                <span className="text-3xl lg:text-4xl font-mono font-black text-emerald-400 block">
                  {statConfidential}
                </span>
                <span className="text-[11px] font-mono text-[var(--am-text-dim)] uppercase tracking-widest mt-1.5 block">
                  {statConfidentialLabel}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Active Opportunities — real listing data, filterable */}
        <ActiveOpportunities />

        {/* Features Section */}
        <section className="py-16 border-t border-border/60">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase bg-primary/20 text-[var(--am-accent-lavender)] border border-primary/30">
                {homepageContent.featuresEyebrow}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
                {homepageContent.featuresHeadline}
              </h2>
              <p className="text-[var(--am-text-dim)] text-sm mt-3 leading-relaxed">
                {homepageContent.featuresSubheadline}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homepageContent.features.map((feature, index) => {
                const Icon = feature.icon;
                const accents = ["text-[var(--am-accent-lavender)] bg-primary/20 border-primary/40", "text-cyan-400 bg-cyan-950/60 border-cyan-800/40", "text-emerald-400 bg-emerald-950/60 border-emerald-800/40"];
                const accent = accents[index % accents.length];
                return (
                  <div
                    key={index}
                    className="bg-card p-6 rounded-2xl border border-border hover:border-primary transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 group-hover:scale-105 transition-transform ${accent}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-[var(--am-text-dim)] leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works / Playbook */}
        <section className="py-16 border-t border-border/60">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {homepageContent.howItWorks.eyebrow}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
                {homepageContent.howItWorks.headline}
              </h2>
              <p className="text-[var(--am-text-dim)] text-sm mt-2">
                {homepageContent.howItWorks.subheadline}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* For Sellers */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-[var(--am-accent-lavender)] font-mono font-bold text-sm">
                    01
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">For Sellers</h3>
                    <p className="text-xs font-mono text-[var(--am-text-dim)]">List, get reviewed, exit on your terms</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Submit Your Business", desc: "Share the key details about your iGaming business or asset. AM reviews every submission before it appears in the marketplace." },
                    { title: "Manual Review", desc: "Our team reviews your listing for fit and completeness. Approved listings are published to qualified buyers." },
                    { title: "Seller-Controlled Access", desc: "Choose what is visible publicly and what unlocks only after a buyer signs an NDA or you approve their request." },
                    { title: "Qualified Introduction", desc: "When a serious buyer emerges, AM facilitates the introduction. Diligence and closing are handled by you and your advisors." },
                  ].map((step, i, arr) => (
                    <div
                      key={step.title}
                      className={`flex items-start gap-4 p-4 rounded-xl border ${
                        i === arr.length - 1 ? "border-emerald-500/40 bg-emerald-950/10" : "bg-card border-border"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                          i === arr.length - 1 ? "bg-emerald-500 text-black" : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${i === arr.length - 1 ? "text-emerald-300" : "text-white"}`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-[var(--am-text-dim)] mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* For Buyers */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
                    02
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">For Buyers</h3>
                    <p className="text-xs font-mono text-[var(--am-text-dim)]">Qualify once, access curated opportunities</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Share Your Mandate", desc: "Tell us what you are looking for. Complete your buyer profile to unlock access to confidential listings." },
                    { title: "Review Curated Opportunities", desc: "Browse iGaming businesses, B2B technology platforms and affiliate assets that fit your acquisition thesis." },
                    { title: "Request Access", desc: "Sign an NDA or request seller approval to review confidential financials and operating data." },
                    { title: "Engage Directly", desc: "Once access is granted, communicate directly with the seller. AM does not intermediate negotiations or handle closing." },
                  ].map((step, i, arr) => (
                    <div
                      key={step.title}
                      className={`flex items-start gap-4 p-4 rounded-xl border ${
                        i === arr.length - 1 ? "border-cyan-500/40 bg-cyan-950/10" : "bg-card border-border"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                          i === arr.length - 1 ? "bg-cyan-400 text-black" : "bg-cyan-600 text-white"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${i === arr.length - 1 ? "text-cyan-300" : "text-white"}`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-[var(--am-text-dim)] mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-14 border-t border-border/60">
          <div className="container">
            <div className="am-glow-primary rounded-3xl p-8 sm:p-14 text-center border border-primary/60 relative overflow-hidden bg-gradient-to-br from-card via-accent to-black">
              <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
              <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
              <div className="relative z-10 max-w-2xl mx-auto space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {homepageContent.ctaSection.eyebrow}
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {homepageContent.ctaSection.headline}
                </h2>
                <p className="text-[var(--am-text-dim)] text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                  {homepageContent.ctaSection.description}
                </p>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                  {isAuthenticated ? (
                    <>
                      <Link href="/marketplace">
                        <Button size="lg" className="text-base px-8">Browse Listings</Button>
                      </Link>
                      <Link href="/create-listing">
                        <Button size="lg" variant="outline" className="text-base px-8">List Your Business</Button>
                      </Link>
                    </>
                  ) : (
                    <a href={getLoginUrl()}>
                      <Button size="lg" className="text-base px-8">Sign Up Now</Button>
                    </a>
                  )}
                </div>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-[var(--am-text-dim)]">
                  {homepageContent.trustSignals.map((signal) => (
                    <span key={signal.label}>{signal.value} — {signal.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
