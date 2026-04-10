import { useState } from "react";
import { Link } from "wouter";

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: wire up to waitlist backend
    setSubmitted(true);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff22 1px, transparent 1px), linear-gradient(to bottom, #ffffff22 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full gap-8">
        {/* Logo / wordmark */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center font-black text-white text-sm">
            AM
          </div>
          <span className="text-xl font-semibold tracking-tight text-white/90">
            acquisitions.market
          </span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Getting Ready for Launch
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none">
          The marketplace for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            every acquisition
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-white/60 max-w-lg leading-relaxed">
          Buy and sell traditional businesses, SaaS, crypto protocols, and
          web3 assets — all in one place. We're putting the finishing touches on
          something big.
        </p>

        {/* Waitlist form */}
        {submitted ? (
          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            You're on the list. We'll notify you at launch.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all text-sm"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors whitespace-nowrap"
            >
              Notify me
            </button>
          </form>
        )}

        {/* Stats teaser */}
        <div className="flex flex-wrap justify-center gap-8 pt-4 border-t border-white/10 w-full">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Both</p>
            <p className="text-xs text-white/40 mt-0.5">Legacy & Web3 assets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">0%</p>
            <p className="text-xs text-white/40 mt-0.5">Upfront to list a business</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Escrow</p>
            <p className="text-xs text-white/40 mt-0.5">Protected transactions</p>
          </div>
        </div>
      </div>

      {/* Staff login link */}
      <div className="absolute bottom-6 right-6 z-10">
        <Link
          href="/login"
          className="text-xs text-white/20 hover:text-white/50 transition-colors"
        >
          Staff login
        </Link>
      </div>
    </div>
  );
}
