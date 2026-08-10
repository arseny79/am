import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText, Lock, MessageSquare, Search, UserCheck, Handshake } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How {APP_TITLE} Works</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A private, curated marketplace for buying and selling crypto-friendly iGaming businesses and assets. We connect qualified buyers with vetted sellers through a structured, confidential introduction process.
          </p>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Technology Marketplace</CardTitle>
                <CardDescription>
                  We provide the infrastructure to connect buyers and sellers. We are NOT a broker, adviser, or party to any transaction.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Confidential & Private</CardTitle>
                <CardDescription>
                  NDA-gated access, seller-controlled visibility, and manually reviewed opportunities — no public exposure without your approval.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Handshake className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Direct Introductions</CardTitle>
                <CardDescription>
                  After mutual approval, buyers and sellers connect directly to negotiate terms and close with their own legal and financial advisors.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Important Notice */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">⚠️ Important Notice</CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                {APP_TITLE} is a technology marketplace and introduction layer, NOT a broker, investment advisor, or financial advisor. We do not provide investment, legal, or tax advice. All transactions occur directly between buyers and sellers. You are responsible for your own due diligence and should consult qualified professionals before making any investment decisions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* For Sellers */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">For Sellers</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Submit your iGaming business or asset and connect with qualified buyers actively seeking acquisitions in this niche
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <CardTitle className="text-lg">Submit Your Business or Asset</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Provide key details: sector, licensing jurisdiction, revenue profile, and asking range. We review every submission before it reaches any buyer.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Operating iGaming businesses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>B2B iGaming technology</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Affiliate, media and traffic assets</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <CardTitle className="text-lg">Manual Review & Positioning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The AM team reviews your submission for market fit and positions it as a confidential teaser. You stay anonymous until you approve each buyer.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Manually reviewed for fit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Positioned as a private teaser</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>No public exposure without your approval</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <CardTitle className="text-lg">Buyer Interest & NDA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Qualified buyers request access. You review their mandate and profile, then approve or decline. No identity or detailed information is shared without your consent.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Buyer mandate and profile shared with you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>You approve each access request</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>NDA signed before details are disclosed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  4
                </div>
                <CardTitle className="text-lg">Diligence & Closing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Approved buyers access your data room. All negotiation and closing happen directly between parties with their own legal and financial advisors.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Secure document sharing in deal room</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Direct buyer communication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Close with your own advisors</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Buyers */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">For Buyers</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Share your acquisition mandate and receive curated, confidential iGaming opportunities matched to your criteria
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <CardTitle className="text-lg">Share Your Mandate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Register and submit an acquisition mandate: sector preferences, geography, size range, and deal structure. Our team matches mandates to available opportunities.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>iGaming operations, B2B tech, affiliates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Size and structure preferences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Geographic and license focus</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <CardTitle className="text-lg">Review Curated Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We present opportunities matched to your mandate as confidential teasers. Public information is limited; full details require NDA and seller approval.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Anonymous teasers matched to your criteria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Manually curated — no automated listings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>New matches as they become available</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <CardTitle className="text-lg">Sign NDA & Request Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  For listings of interest, sign a platform NDA and submit an access request with your buyer profile. The seller reviews and approves or declines.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Platform NDA signing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Access request with your buyer profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Seller approval required</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  4
                </div>
                <CardTitle className="text-lg">Engage Directly & Acquire</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Once approved, access the seller's data room and communicate directly. All terms, due diligence, and closing are handled between you and the seller with qualified advisors.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Secure data room access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Direct seller communication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Engage your own legal and financial advisors</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tools designed for confidential iGaming M&A introductions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Search className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Curated Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every opportunity is manually reviewed before appearing on the platform. No automated self-serve listings — quality and fit are assessed first.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Confidential Access Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  NDA-gated and seller-approved access tiers. Buyers see only what sellers explicitly approve, and seller identity stays protected until they consent.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Handshake className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Buyer Mandates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Buyers share acquisition criteria and receive matched opportunities. Mandates are matched privately — no public listing of buyer intent.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Deal Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Secure workspaces for approved buyer-seller pairs with messaging and document vault for confidential diligence exchange.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Document Vault</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Version-controlled, access-restricted document storage. Upload financials, licenses, and operational materials for approved buyers only.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <UserCheck className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Seller Access Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Review buyer profiles and approve or decline each access request individually. Full control over who can see your confidential business information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Important Disclaimers */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Important Information</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>We Are NOT a Broker</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {APP_TITLE} is a technology marketplace and introduction layer. We are NOT a registered broker-dealer, investment advisor, or financial advisor.
                  </p>
                  <p>
                    We do NOT:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide investment, legal, or tax advice</li>
                    <li>Negotiate deal terms on your behalf</li>
                    <li>Guarantee the accuracy of listing information</li>
                    <li>Participate in transactions as a principal or agent</li>
                    <li>Hold or handle transaction funds</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Responsibilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    You are solely responsible for:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Due Diligence:</strong> Verifying all information about businesses or assets you are considering</li>
                    <li><strong>Professional Advice:</strong> Engaging qualified legal, financial, and tax advisors</li>
                    <li><strong>Decision Making:</strong> Making your own independent investment decisions</li>
                    <li><strong>Compliance:</strong> Ensuring compliance with all applicable laws and regulations, including licensing requirements</li>
                    <li><strong>Negotiations:</strong> Negotiating all deal terms directly with the other party</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Seek Professional Advice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Before entering into any transaction, consult with:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Legal Counsel:</strong> To review contracts and advise on legal and regulatory matters</li>
                    <li><strong>Accountants:</strong> To review financial statements and tax implications</li>
                    <li><strong>Business Valuation Experts:</strong> To assess fair market value independently</li>
                    <li><strong>Industry Specialists:</strong> Familiar with iGaming M&A, licensing, and regulatory considerations</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Browse curated iGaming opportunities or submit your business for a private introduction to qualified buyers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="lg" variant="secondary">
                Browse Listings
              </Button>
            </Link>
            <Link href="/create-listing">
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                Submit Your Business
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
