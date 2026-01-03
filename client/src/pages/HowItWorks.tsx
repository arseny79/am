import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText, Lock, MessageSquare, Search, TrendingUp, UserCheck, Handshake } from "lucide-react";
import { Link } from "wouter";
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How MSP.Investments Works</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A simple, transparent process for buying and selling MSP businesses. We connect serious buyers with qualified sellers through a secure, efficient platform.
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
                <CardTitle>Marketplace Platform</CardTitle>
                <CardDescription>
                  We provide the technology to connect buyers and sellers, but we are NOT a broker or advisor
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Confidential & Secure</CardTitle>
                <CardDescription>
                  Three-tier confidentiality system with NDA protection and seller-controlled access
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Handshake className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Direct Transactions</CardTitle>
                <CardDescription>
                  Buyers and sellers negotiate directly. We facilitate connections, not deals
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Important Notice */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">⚠️ Important Notice</CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                MSP.Investments is a technology platform, NOT a broker, investment advisor, or financial advisor. We do not provide investment, legal, or tax advice. All transactions occur directly between buyers and sellers. You are responsible for your own due diligence and should consult qualified professionals before making any investment decisions.
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
              List your MSP business and connect with qualified buyers actively seeking acquisition opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <CardTitle className="text-lg">Create Your Listing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your MSP's key metrics: revenue, EBITDA, client count, service mix, and technology stack
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Choose confidentiality level (Public, NDA, or Private)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Option to list anonymously</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Get instant valuation estimate</span>
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
                <CardTitle className="text-lg">Manage Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Control who sees your confidential information based on your chosen confidentiality level
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Public:</strong> All details visible to everyone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>NDA:</strong> Buyers sign NDA to view details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Private:</strong> You approve each access request</span>
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
                <CardTitle className="text-lg">Connect with Buyers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Qualified buyers will contact you directly through the platform's secure messaging system
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Automatic deal room creation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Secure document sharing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Track deal progress with Kanban board</span>
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
                <CardTitle className="text-lg">Close the Deal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Negotiate terms directly with buyers and complete the transaction with professional advisors
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Conduct due diligence in deal room</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use Escrow.com for secure payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Engage legal/financial advisors</span>
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
              Discover MSP acquisition opportunities and connect directly with sellers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <CardTitle className="text-lg">Browse Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Search and filter MSP businesses by revenue, EBITDA, location, service mix, and more
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Advanced search filters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Save searches for alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>View public listing details</span>
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
                <CardTitle className="text-lg">Review Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Analyze standardized financial and operational data to evaluate opportunities
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>MRR, ARR, and EBITDA metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Client count and retention rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Service mix and technology stack</span>
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
                <CardTitle className="text-lg">Sign NDA & Access Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  For confidential listings, sign an NDA or request access to view full business details
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Click-wrap NDA signing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Upload signed PDF NDA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Request access for private listings</span>
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
                <CardTitle className="text-lg">Negotiate & Acquire</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Contact sellers, conduct due diligence, and complete the acquisition with your advisors
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Direct messaging with sellers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Document vault for due diligence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Track deal stages to closing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tools and features designed specifically for MSP M&A transactions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Valuation Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get instant EBITDA-based valuation estimates using MSP-specific multiples. Adjust for growth rate, client concentration, and service mix.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Three-Tier Confidentiality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Choose Public, NDA-protected, or Private listings. Control exactly who can see your confidential business information.
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
                  Automatically created workspaces for each deal with messaging, document vault, and Kanban-style progress tracking.
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
                  Version-controlled document storage. Upload financials, client lists, and contracts. Always access the latest version.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <UserCheck className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Access Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  For private listings, review buyer requests and approve or decline access. Request more information before granting access.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Handshake className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Escrow Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Secure payment processing through Escrow.com integration. Funds held safely until transaction completion.
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
                    MSP.Investments is a technology platform that facilitates connections between buyers and sellers. We are NOT a registered broker-dealer, investment advisor, or financial advisor.
                  </p>
                  <p>
                    We do NOT:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide investment, legal, or tax advice</li>
                    <li>Negotiate deal terms on your behalf</li>
                    <li>Guarantee the accuracy of listing information</li>
                    <li>Participate in transactions as a principal or agent</li>
                    <li>Hold or handle transaction funds (except through licensed third-party processors)</li>
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
                    <li><strong>Due Diligence:</strong> Verifying all information about businesses you're considering</li>
                    <li><strong>Professional Advice:</strong> Engaging qualified legal, financial, and tax advisors</li>
                    <li><strong>Decision Making:</strong> Making your own independent investment decisions</li>
                    <li><strong>Compliance:</strong> Ensuring compliance with all applicable laws and regulations</li>
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
                    <li><strong>Legal Counsel:</strong> To review contracts and advise on legal matters</li>
                    <li><strong>Accountants:</strong> To review financial statements and tax implications</li>
                    <li><strong>Business Valuation Experts:</strong> To assess fair market value</li>
                    <li><strong>Industry Specialists:</strong> Familiar with MSP businesses and market conditions</li>
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
            Join MSP.Investments today and connect with serious buyers or discover your next acquisition
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="lg" variant="secondary">
                Browse Listings
              </Button>
            </Link>
            <Link href="/create-listing">
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                List Your Business
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
