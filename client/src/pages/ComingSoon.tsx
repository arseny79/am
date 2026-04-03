import { useState } from "react";
import { Building2, Mail, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight">acquisitions.market</span>
      </div>

      {/* Main content */}
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
            <Lock className="w-3 h-3" />
            Launching Soon
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Buy &amp; Sell Businesses.
            <br />
            <span className="text-primary">Any Asset. Any Crowd.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            The marketplace that bridges traditional M&amp;A with Web3, iGaming, and beyond.
            One platform. Two worlds.
          </p>
        </div>

        {/* Email capture */}
        <div className="pt-2">
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-primary font-medium py-3">
              <ArrowRight className="w-4 h-4" />
              You're on the list. We'll be in touch.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit">
                <Mail className="w-4 h-4 mr-2" />
                Notify me
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Be first to know when we launch. No spam, ever.
          </p>
        </div>

        {/* What's coming */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          {[
            { label: "MSPs & SaaS", desc: "Traditional businesses" },
            { label: "Web3 & DeFi", desc: "Crypto-native assets" },
            { label: "iGaming", desc: "Licensed platforms" },
          ].map(({ label, desc }) => (
            <div key={label} className="space-y-1">
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-xs text-muted-foreground text-center">
        <p>iGacquire OÜ &mdash; acquisitions.market</p>
      </div>
    </div>
  );
}
