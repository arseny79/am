import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

export default function Footer() {
  const { data: legalDocs } = trpc.platformDocuments.listPublished.useQuery();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary border-t border-border/10 py-20 px-4 sm:px-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <span className="text-xl font-bold tracking-tight text-foreground mb-6 block">
              {APP_TITLE}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The definitive platform for institutional-grade mergers and acquisitions.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">
              Marketplace
            </h5>
            <ul className="space-y-4 text-sm font-medium">
              {[
                { href: "/marketplace", label: "Browse Listings" },
                { href: "/create-listing", label: "Sell Your Business" },
                { href: "/pricing", label: "Pricing" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">
              Platform
            </h5>
            <ul className="space-y-4 text-sm font-medium">
              {[
                { href: "/how-it-works", label: "How it Works" },
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact Us" },
                { href: "/professionals", label: "Professional Directory" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Brokers */}
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">
              For Brokers
            </h5>
            <ul className="space-y-4 text-sm font-medium">
              {[
                { href: "/broker", label: "Broker Program" },
                { href: "/broker/how-it-works", label: "How it Works" },
                { href: "/broker/faq", label: "Broker FAQ" },
                { href: "/broker/apply", label: "Apply Now" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">
              Legal
            </h5>
            <ul className="space-y-4 text-sm font-medium">
              {legalDocs && legalDocs.length > 0 ? (
                legalDocs.map((doc) => (
                  <li key={doc.id}>
                    <Link href={`/legal/${doc.slug}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {doc.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  {[
                    { href: "/legal/terms-of-service", label: "Terms of Service" },
                    { href: "/legal/privacy-policy", label: "Privacy Policy" },
                    { href: "/legal/ccpa", label: "Do Not Sell My Info" },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/70">
            © {currentYear} {APP_TITLE}. Institutional Grade M&amp;A. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-2xl text-center md:text-right">
            <strong>DISCLAIMER:</strong> This platform is not a broker-dealer, investment adviser, or party to any transaction. All data is provided by sellers and must be independently verified.
          </p>
        </div>
      </div>
    </footer>
  );
}
