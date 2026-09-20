import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Radar } from "lucide-react";

function formatCurrency(amount: number | null | undefined) {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function HeroDealCard() {
  const { data: premium, isLoading: premiumLoading } = trpc.listing.getRandomPremium.useQuery();
  const { data: listings, isLoading: listingsLoading } = trpc.listing.search.useQuery({});
  const { data: assetTypes = [] } = trpc.taxonomy.listAssetTypes.useQuery({});

  const isLoading = premiumLoading || listingsLoading;
  const listing = premium ?? listings?.[0] ?? null;
  const isPremium = Boolean(premium);

  const CARD_SHELL =
    "bg-card border border-primary/40 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.75)] relative overflow-hidden backdrop-blur-xl min-h-[540px] flex flex-col";

  if (isLoading) {
    return (
      <div className={`${CARD_SHELL} animate-pulse`}>
        {/* Header row */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
            <div className="h-2.5 w-28 rounded bg-white/8" />
          </div>
          <div className="h-2.5 w-24 rounded bg-white/8" />
        </div>
        {/* Title */}
        <div className="space-y-2 mb-4">
          <div className="h-5 w-3/4 rounded bg-white/8" />
          <div className="h-3 w-1/2 rounded bg-white/6" />
        </div>
        {/* Description */}
        <div className="space-y-2 mb-5">
          <div className="h-3 w-full rounded bg-white/6" />
          <div className="h-3 w-5/6 rounded bg-white/6" />
          <div className="h-3 w-4/6 rounded bg-white/6" />
        </div>
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-background/60 border border-border/40 mb-4 flex-1">
          {["Asking Price", "Monthly Rev", "Annual Rev", "Clients"].map((label) => (
            <div key={label} className="p-2 rounded bg-card/40 space-y-1.5">
              <div className="h-2 w-16 rounded bg-white/6" />
              <div className="h-4 w-20 rounded bg-white/10" />
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-2 w-16 rounded bg-white/6" />
            <div className="h-5 w-24 rounded bg-white/10" />
          </div>
          <div className="h-9 w-28 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className={CARD_SHELL}>
        {/* Header: same structure as a real listing */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Radar className="w-3.5 h-3.5 text-[var(--am-accent-lavender)]" />
            <span className="text-[var(--am-accent-lavender)] font-bold uppercase tracking-wide">Curated Opportunity</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-primary/15 text-[var(--am-accent-lavender)] border border-primary/25 text-[10px] font-semibold">
            Manually Reviewed
          </span>
        </div>

        {/* Redacted title area */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-white/70 text-lg tracking-tight">Confidential iGaming Asset</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/15 text-[var(--am-accent-lavender)] border border-primary/30">
              iGaming Operator
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--am-text-dim)]">
            <span>Europe</span>
            <span className="text-zinc-700">•</span>
            <span className="text-[var(--am-accent-lavender)]/70">NDA Required</span>
          </div>
        </div>

        <p className="text-xs text-[var(--am-text-dim)] leading-relaxed mb-5">
          New opportunities are published after manual review. Submit your business or share
          your acquisition mandate to be notified when live listings become available.
        </p>

        {/* Metrics grid — intentional empty state */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-background/60 border border-border/40 mb-5 font-mono flex-1 content-start">
          {[
            { label: "Asking Price", color: "text-white/30" },
            { label: "Monthly Revenue", color: "text-emerald-400/30" },
            { label: "Annual Revenue", color: "text-[var(--am-accent-lavender)]/30" },
            { label: "Clients", color: "text-cyan-400/30" },
          ].map(({ label, color }) => (
            <div key={label} className="p-2 rounded bg-card/40">
              <span className="text-[10px] uppercase text-[var(--am-text-dim)]/60 block mb-0.5">{label}</span>
              <span className={`text-sm font-bold ${color}`}>NDA Required</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[10px] font-mono text-[var(--am-text-dim)]/60 uppercase block">Asking Price</span>
            <span className="text-xl font-mono font-extrabold text-white/30">Confidential</span>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link href="/buy-asset">
              <Button size="sm" variant="outline" className="text-xs border-border/60">Share Mandate</Button>
            </Link>
            <Link href="/create-listing">
              <Button size="sm" className="text-xs">Submit a Business</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isConfidential =
    listing.confidentialityLevel === "nda" || listing.confidentialityLevel === "private";
  const displayName = isConfidential
    ? "Confidential Listing"
    : listing.isAnonymous
    ? "Anonymous Listing"
    : listing.businessName;
  const assetTypeName =
    assetTypes.find((a: any) => a.id === listing.assetTypeId)?.name || "Curated Asset";

  return (
    <div className={`${CARD_SHELL} group hover:border-[var(--am-accent-lavender)] transition-all`}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
          <span className="text-emerald-400 font-bold uppercase">
            {isPremium ? "Premium Listing" : "Curated Opportunity"}
          </span>
        </div>
        <span className="text-[var(--am-text-dim)] text-[11px]">Manually Reviewed</span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-white text-lg">{displayName}</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/15 text-[var(--am-accent-lavender)] border border-primary/30">
            {assetTypeName}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[var(--am-text-dim)]">
          <span>{listing.location}</span>
          {listing.confidentialityLevel === "nda" && (
            <>
              <span className="text-zinc-600">•</span>
              <span className="text-[var(--am-accent-lavender)]">NDA Required</span>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--am-text-dim)] leading-relaxed mb-5 line-clamp-3">
        {listing.description}
      </p>

      <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-background border border-border mb-5 font-mono flex-1 content-start">
        <div className="p-2 rounded bg-card/60">
          <span className="text-[10px] uppercase text-[var(--am-text-dim)] block mb-0.5">Asking Price</span>
          <span className="text-sm font-bold text-white">
            {isConfidential ? "NDA Required" : formatCurrency(listing.askingPrice)}
          </span>
        </div>
        <div className="p-2 rounded bg-card/60">
          <span className="text-[10px] uppercase text-[var(--am-text-dim)] block mb-0.5">Monthly Revenue</span>
          <span className="text-sm font-bold text-emerald-400">
            {isConfidential ? "NDA Required" : formatCurrency(listing.monthlyRecurringRevenue)}
          </span>
        </div>
        <div className="p-2 rounded bg-card/60">
          <span className="text-[10px] uppercase text-[var(--am-text-dim)] block mb-0.5">Annual Revenue</span>
          <span className="text-sm font-bold text-[var(--am-accent-lavender)]">
            {isConfidential ? "NDA Required" : formatCurrency(listing.annualRevenue)}
          </span>
        </div>
        <div className="p-2 rounded bg-card/60">
          <span className="text-[10px] uppercase text-[var(--am-text-dim)] block mb-0.5">Clients</span>
          <span className="text-sm font-bold text-cyan-400">
            {isConfidential ? "NDA Required" : listing.clientCount ?? "N/A"}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-[var(--am-text-dim)] uppercase block">Asking Price</span>
          <span className="text-xl font-mono font-extrabold text-white">
            {isConfidential ? "NDA Required" : formatCurrency(listing.askingPrice)}
          </span>
        </div>
        <Link href={`/listing/${listing.id}`}>
          <Button className="font-mono text-xs font-bold">View Listing</Button>
        </Link>
      </div>
    </div>
  );
}
