import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, Users, MapPin, ArrowRight, Search } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";

const MAX_CARDS = 6;

function formatCurrency(amount: number | null | undefined) {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ActiveOpportunities() {
  const { data: listings, isLoading } = trpc.listing.search.useQuery({});
  const { data: assetTypes = [] } = trpc.taxonomy.listAssetTypes.useQuery({});
  const [assetTypeFilter, setAssetTypeFilter] = useState<number | null>(null);

  const allListings = listings ?? [];

  const assetTypeCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const listing of allListings as any[]) {
      if (listing.assetTypeId == null) continue;
      counts.set(listing.assetTypeId, (counts.get(listing.assetTypeId) ?? 0) + 1);
    }
    return counts;
  }, [allListings]);

  const activeAssetTypes = assetTypes.filter((a: any) => assetTypeCounts.has(a.id));

  const filteredListings = assetTypeFilter
    ? allListings.filter((l: any) => l.assetTypeId === assetTypeFilter)
    : allListings;

  const visibleListings = filteredListings.slice(0, MAX_CARDS);

  const eyebrow = (
    <div className="flex items-center gap-2 mb-2">
      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-primary/20 text-[var(--am-accent-lavender)] border border-primary/30">
        Curated Deal Flow
      </span>
      <span className="text-xs font-mono text-[var(--am-text-dim)]">Manually Reviewed</span>
    </div>
  );

  const filterPills = (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
      <button
        onClick={() => setAssetTypeFilter(null)}
        className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
          assetTypeFilter === null
            ? "bg-primary text-primary-foreground font-semibold"
            : "bg-card hover:bg-accent border border-border text-[var(--am-text-dim)] hover:text-white"
        }`}
      >
        All
      </button>
      {["iGaming Operator", "B2B Technology", "Traffic & Affiliates"].map((label) => (
        <button
          key={label}
          className="px-3 py-1.5 rounded-lg bg-card border border-border text-[var(--am-text-dim)] font-mono text-xs whitespace-nowrap opacity-40 cursor-default"
          disabled
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <section className="py-12 border-t border-border/60" id="opportunities">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              {eyebrow}
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Active Opportunities</h2>
            </div>
            {filterPills}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-2xl border border-border/50 bg-card/50 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (allListings.length === 0) {
    const ghostLabels = [
      { type: "iGaming Operator", region: "Malta / Gibraltar", badge: "NDA Required" },
      { type: "B2B Technology", region: "EU Remote", badge: "Private" },
      { type: "Traffic & Affiliates", region: "Multiple GEOs", badge: "NDA Required" },
    ];
    return (
      <section className="py-12 border-t border-border/60" id="opportunities">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              {eyebrow}
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Active Opportunities</h2>
              <p className="text-[var(--am-text-dim)] text-sm mt-1 max-w-xl">
                New iGaming businesses and assets published after manual review.
              </p>
            </div>
            {filterPills}
          </div>
          {/* Intentional ghost cards, not a centered empty-state box */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ghostLabels.map((ghost) => (
              <div key={ghost.type} className="bg-card/40 rounded-2xl border border-border/40 p-6 flex flex-col justify-between h-64 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono bg-card border border-border/50 text-[var(--am-text-dim)] px-2 py-0.5 rounded">
                      {ghost.type}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--am-accent-lavender)]/60 bg-primary/8 border border-primary/20 px-2 py-0.5 rounded">
                      {ghost.badge}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 rounded bg-white/5" />
                    <div className="h-3 w-full rounded bg-white/3" />
                    <div className="h-3 w-5/6 rounded bg-white/3" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                  <div>
                    <div className="h-2 w-16 rounded bg-white/4 mb-1.5" />
                    <div className="h-4 w-24 rounded bg-white/6" />
                  </div>
                  <span className="text-xs font-mono text-[var(--am-text-dim)]/40">{ghost.region}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link href="/create-listing">
              <Button size="lg">Submit a Business</Button>
            </Link>
            <Link href="/buy-asset">
              <Button size="lg" variant="outline">Share Your Mandate</Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 border-t border-border/60" id="opportunities">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            {eyebrow}
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Active Opportunities</h2>
            <p className="text-[var(--am-text-dim)] text-sm mt-1 max-w-xl">
              Curated iGaming businesses, B2B technology and traffic assets currently available through AM.
            </p>
          </div>

          {activeAssetTypes.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
              <button
                onClick={() => setAssetTypeFilter(null)}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  assetTypeFilter === null
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-card hover:bg-accent border border-border text-[var(--am-text-dim)] hover:text-white"
                }`}
              >
                All ({allListings.length})
              </button>
              {activeAssetTypes.map((a: any) => (
                <button
                  key={a.id}
                  onClick={() => setAssetTypeFilter(a.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    assetTypeFilter === a.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card hover:bg-accent border border-border text-[var(--am-text-dim)] hover:text-white"
                  }`}
                >
                  {a.name} ({assetTypeCounts.get(a.id)})
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleListings.map((listing: any) => {
            const isConfidential =
              listing.confidentialityLevel === "nda" || listing.confidentialityLevel === "private";
            const assetTypeName =
              assetTypes.find((a: any) => a.id === listing.assetTypeId)?.name || "Curated Asset";
            const displayName = isConfidential
              ? "Confidential Listing"
              : listing.isAnonymous
              ? "Anonymous Listing"
              : listing.businessName;

            return (
              <Link key={listing.id} href={`/listing/${listing.id}`}>
                <div className="am-card-hover bg-card rounded-2xl border border-border hover:border-[var(--am-accent-lavender)] p-6 flex flex-col justify-between h-full cursor-pointer transition-all group">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <Badge variant="secondary" className="text-[11px] font-mono">
                        {assetTypeName}
                      </Badge>
                      {listing.confidentialityLevel === "nda" ? (
                        <Badge variant="outline" className="text-[11px] font-mono">NDA Required</Badge>
                      ) : listing.confidentialityLevel === "private" ? (
                        <Badge className="text-[11px] font-mono">Private</Badge>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          Public
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-lg text-white group-hover:text-[var(--am-accent-lavender)] transition-colors line-clamp-1">
                      {displayName}
                    </h3>
                    <p className="text-xs text-[var(--am-text-dim)] mt-2 line-clamp-2">
                      {listing.description}
                    </p>

                    <div className="mt-5 p-3 rounded-xl bg-background border border-border grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-[var(--am-text-dim)] mt-0.5" />
                        <div>
                          <span className="text-[var(--am-text-dim)] block text-[10px] uppercase">Asking Price</span>
                          <span className="font-bold text-white text-sm">
                            {isConfidential ? "NDA Required" : formatCurrency(listing.askingPrice)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-[var(--am-text-dim)] mt-0.5" />
                        <div>
                          <span className="text-[var(--am-text-dim)] block text-[10px] uppercase">MRR</span>
                          <span className="font-bold text-emerald-400 text-sm">
                            {isConfidential ? "NDA Required" : formatCurrency(listing.monthlyRecurringRevenue)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="h-3.5 w-3.5 text-[var(--am-text-dim)] mt-0.5" />
                        <div>
                          <span className="text-[var(--am-text-dim)] block text-[10px] uppercase">Clients</span>
                          <span className="font-semibold text-zinc-300 text-sm">
                            {isConfidential ? "NDA Required" : listing.clientCount || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[var(--am-text-dim)] mt-0.5" />
                        <div>
                          <span className="text-[var(--am-text-dim)] block text-[10px] uppercase">Location</span>
                          <span className="font-semibold text-zinc-300 text-sm">{listing.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[var(--am-text-dim)] uppercase block">Asking Price</span>
                      <span className="text-lg font-mono font-bold text-white">
                        {isConfidential ? "NDA Required" : formatCurrency(listing.askingPrice)}
                      </span>
                    </div>
                    <span className="px-3.5 py-2 rounded-lg bg-primary group-hover:bg-primary/90 text-primary-foreground text-xs font-mono font-semibold transition-all flex items-center gap-1">
                      <span>View Listing</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/marketplace">
            <Button size="lg" variant="outline" className="font-mono">
              View All {allListings.length} Listings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
