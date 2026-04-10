import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import {
  MapPin, Lock, ChevronLeft, ChevronRight, CheckCircle2,
  Tag, ShoppingCart, BarChart2, Users, Network, ArrowRight, Loader2,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";

function PremiumListingHeroV2() {
  const { data: listing, isLoading } = trpc.listing.getRandomPremium.useQuery();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!listing) return null;

  const isConfidential =
    listing.confidentialityLevel === "nda" ||
    listing.confidentialityLevel === "private";

  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isConfidential ? "Confidential Listing" : listing.businessName}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <MapPin className="h-3 w-3" />
              <span>{listing.location}</span>
            </div>
          </div>
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
            Premium Listing
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-5">
          {[
            { label: "Revenue", value: isConfidential ? "NDA Required" : formatCurrency(listing.annualRevenue), blue: isConfidential },
            { label: "EBITDA", value: isConfidential ? "NDA Required" : formatCurrency(listing.ebitda), blue: isConfidential },
            { label: "Clients", value: isConfidential ? "NDA Required" : String(listing.clientCount), blue: isConfidential },
            { label: "Asking Price", value: listing.askingPrice ? formatCurrency(listing.askingPrice) : "Contact", blue: false },
          ].map(({ label, value, blue }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
              <p className={`text-sm font-semibold ${blue ? "text-blue-600" : "text-gray-900"}`}>{value}</p>
            </div>
          ))}
        </div>

        <button className="w-full border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
          Request Details <Lock className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </div>
    </Link>
  );
}

function FeaturedListingsV2() {
  const { data: listings, isLoading } = trpc.listing.search.useQuery({});
  const featuredListings = listings?.slice(0, 9) || [];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  };

  if (isLoading || featuredListings.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Opportunities</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Access the most exclusive deals currently on the market.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={scrollPrev} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button onClick={scrollNext} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {featuredListings.map((listing: any) => {
              const isConfidential = listing.confidentialityLevel === "nda" || listing.confidentialityLevel === "private";
              const categoryLabel = listing.categoryName ?? null;

              return (
                <div key={listing.id} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-5 first:pl-0">
                  <Link href={`/listing/${listing.id}`}>
                    <div className="bg-slate-50 rounded-xl p-5 h-full hover:shadow-sm transition-shadow cursor-pointer flex flex-col border border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                        {categoryLabel ? (
                          <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest">
                            {categoryLabel}
                          </Badge>
                        ) : <div />}
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="h-3 w-3" />
                          <span>{listing.location}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-gray-900 text-base mb-4 flex-1">
                        {isConfidential ? "Confidential Listing" : listing.isAnonymous ? "Anonymous Listing" : listing.businessName}
                      </h3>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Asking Price</p>
                          <p className="font-bold text-gray-900 text-sm">{isConfidential ? "NDA Req." : formatCurrency(listing.askingPrice)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">MRR</p>
                          <p className="font-bold text-gray-900 text-sm">{isConfidential ? "NDA Req." : formatCurrency(listing.monthlyRecurringRevenue)}</p>
                        </div>
                      </div>

                      <button className="w-full border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-800 hover:bg-white transition-colors bg-white">
                        View Details
                      </button>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePreview() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-12 items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 border border-gray-300 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                </div>
                Institutional Grade Marketplace
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1]">
                The Premier Marketplace<br />for Business Acquisitions
              </h1>

              <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
                Connect with pre-vetted buyers and sellers in a secure, confidential environment designed for professional deal execution.
              </p>

              <div className="flex gap-3 flex-wrap pt-2">
                <Link href="/marketplace">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 h-auto text-base font-semibold rounded-lg gap-2">
                    Browse Listings <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/create-listing">
                  <Button variant="outline" className="px-7 py-3 h-auto text-base font-semibold rounded-lg border-gray-300 text-gray-800">
                    List Your Business
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:pt-2">
              <PremiumListingHeroV2 />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-100 border-y border-slate-200">
        <div className="container">
          <div className="grid grid-cols-3 divide-x divide-slate-200">
            {[
              { label: "Transaction Volume", value: "$500M+" },
              { label: "Vetted Buyers", value: "150+" },
              { label: "Confidentiality", value: "100% Guaranteed" },
            ].map(({ label, value }) => (
              <div key={label} className="py-8 px-6 lg:px-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
                <p className="text-2xl lg:text-3xl font-extrabold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedListingsV2 />

      {/* Tailored for Both Sides */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Tailored for Both Sides</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-base">
              We've built specialized toolsets for buyers and sellers to ensure a frictionless transition from initial contact to close.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Tag, title: "For Sellers",
                items: ["Anonymous listing options to protect client and employee relationships.", "Valuation tools based on real-time market multiples.", "Vetted buyer pool ensuring only qualified principals see your data."],
                link: "/create-listing", linkText: "Learn about selling",
              },
              {
                icon: ShoppingCart, title: "For Buyers",
                items: ["Custom alerts for deals matching your geographical and vertical criteria.", "Comprehensive data rooms with standardized reporting formats.", "Direct messaging with verified sellers and their representatives."],
                link: "/marketplace", linkText: "Learn about buying",
              },
            ].map(({ icon: Icon, title, items, link, linkText }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
                <ul className="space-y-3 mb-6">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
                <Link href={link} className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                  {linkText} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 max-w-5xl mx-auto items-start">
            <div>
              {[
                { n: 1, title: "Verify Identity", desc: "Undergo a rigorous verification process to maintain marketplace integrity." },
                { n: 2, title: "Access Deal Room", desc: "Once approved, explore detailed financials and operational data in a secure VDR." },
                { n: 3, title: "Connect with Principals", desc: "Facilitate meetings and negotiations through our managed communication portal." },
                { n: 4, title: "Transact & Close", desc: "Leverage integrated escrow and legal support to finalize the transaction." },
              ].map((step, i, arr) => (
                <div key={step.n} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${step.n === 1 ? "bg-blue-600 text-white" : "border-2 border-gray-200 text-gray-400"}`}>
                      {step.n}
                    </div>
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[2rem]" />}
                  </div>
                  <div className="pb-8">
                    <h4 className="font-bold text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">The Modern Standard for Acquisitions</h2>
              <p className="text-gray-500">Our platform replaces outdated spreadsheets and unsecured emails with a professional deal-making environment.</p>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex gap-4 items-start">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Accelerated Close Times</h4>
                  <p className="text-sm text-gray-500">Users close deals 40% faster than traditional brokered transactions thanks to our standardized data formats.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brokers & Partners */}
      <section className="py-20 bg-[#0F172A]">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-6">
              <Tag className="h-3 w-3" />
              Strategic Alliance Program
            </div>
            <h2 className="text-4xl font-extrabold text-white">Brokers & Partners</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { icon: BarChart2, title: "Deal Flow Analytics", desc: "Advanced dashboarding for M&A professionals to track portfolio movement and market pricing trends in real-time." },
              { icon: Users, title: "White-Label Portals", desc: "Empower your brokerage with our institutional infrastructure under your own trusted brand identity." },
              { icon: Network, title: "Partner Ecosystem", desc: "Connect with legal, tax, and technical due diligence experts to accelerate your clients' transition and closing." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-auto text-base font-semibold rounded-lg gap-2">
              Become a Partner <Network className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Ready to explore opportunities?</h2>
          <p className="text-gray-500 mb-8 text-base">Join 1,000+ professionals on the most trusted acquisition platform.</p>
          {isAuthenticated ? (
            <Link href="/marketplace">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 h-auto text-base font-semibold rounded-xl shadow-[0_0_40px_rgba(37,99,235,0.35)]">
                Browse Listings
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 h-auto text-base font-semibold rounded-xl shadow-[0_0_40px_rgba(37,99,235,0.35)]">
                Register Now
              </Button>
            </a>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
