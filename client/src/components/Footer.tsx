import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

export default function Footer() {
  const { data: legalDocs } = trpc.platformDocuments.listPublished.useQuery();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{APP_TITLE}</h3>
            <p className="text-sm text-muted-foreground">
              The trusted marketplace for buying and selling MSP businesses.
            </p>
          </div>

          {/* Marketplace Column */}
          <div className="space-y-4">
            <h4 className="font-semibold">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/create-listing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sell Your MSP
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-4">
            <h4 className="font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/professionals" className="text-muted-foreground hover:text-foreground transition-colors">
                  Professional Directory
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="text-muted-foreground hover:text-foreground transition-colors">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
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
          <p>© {currentYear} {APP_TITLE}. All rights reserved.</p>
          <p className="text-xs">
            <strong>DISCLAIMER:</strong> msp.investments is not a broker-dealer, investment adviser, or party to any transaction. We do not verify listings or guarantee deal completion. All data is provided by Sellers and must be independently verified.
          </p>
        </div>
      </div>
    </footer>
  );
}
