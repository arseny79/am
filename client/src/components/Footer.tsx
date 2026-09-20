import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

const DEFAULT_FOOTER_LINKS = {
  columns: [
    {
      heading: "Marketplace",
      links: [
        { label: "Browse Deals", href: "/marketplace" },
        { label: "Submit a Business", href: "/create-listing" },
        { label: "Buyer Mandates", href: "/buy-asset" },
      ],
    },
    {
      heading: "Resources",
      links: [
        { label: "How It Works", href: "/how-it-works" },
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ],
  legalHeading: "Legal",
};

export default function Footer() {
  const { data: legalDocs } = trpc.platformDocuments.listPublished.useQuery();
  const { data: settings } = trpc.admin.getSiteSettings.useQuery();

  const footerTagline = settings?.footerTagline || "Curated M&A marketplace for crypto-friendly iGaming businesses and assets.";
  const footerDisclaimer = settings?.footerDisclaimer || `${APP_TITLE} is a technology marketplace, not a broker-dealer, investment adviser, or party to any transaction. We do not guarantee deal completion, and all listing information should be independently verified.`;
  const footerCopyrightText = settings?.footerCopyrightText || "All rights reserved.";

  const footerLinks = (() => {
    try { return settings?.footerLinksJson ? { ...DEFAULT_FOOTER_LINKS, ...JSON.parse(settings.footerLinksJson) } : DEFAULT_FOOTER_LINKS; }
    catch (e) { return DEFAULT_FOOTER_LINKS; }
  })();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{APP_TITLE}</h3>
            <p className="text-sm text-muted-foreground">
              {footerTagline}
            </p>
          </div>

          {/* Dynamic link columns from footerLinksJson */}
          {footerLinks.columns.map((col: { heading: string; links: { label: string; href: string }[] }) => (
            <div key={col.heading} className="space-y-4">
              <h4 className="font-semibold">{col.heading}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Legal Column — links driven by DB platform documents */}
          <div className="space-y-4">
            <h4 className="font-semibold">{footerLinks.legalHeading}</h4>
            <ul className="space-y-2 text-sm">
              {legalDocs && legalDocs.length > 0 ? (
                legalDocs.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/legal/${doc.slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {doc.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/legal/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/ccpa" className="text-muted-foreground hover:text-foreground transition-colors">
                      Do Not Sell My Info
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground space-y-3">
          <p>© {currentYear} {APP_TITLE}. {footerCopyrightText}</p>
          <p className="text-xs">
            <strong>DISCLAIMER:</strong> {footerDisclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
}
