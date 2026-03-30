import { Link } from "wouter";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Users, 
  DollarSign, 
  Shield, 
  TrendingUp,
  Clock,
  Globe,
  MessageSquare,
  BarChart3,
  Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export default function BrokerHowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Apply to Join",
      description: "Submit your application with your professional credentials and experience. Our team reviews applications within 2-3 business days.",
      icon: <FileText className="h-6 w-6" />,
      details: [
        "Provide company information",
        "Share your M&A experience",
        "No upfront fees or costs"
      ]
    },
    {
      number: "02",
      title: "Upload Your Contract",
      description: "For each business you represent, upload your brokerage contract or engagement letter. This proves your authority to list the business.",
      icon: <Shield className="h-6 w-6" />,
      details: [
        "Valid brokerage agreement required",
        "Contract verified within 24-48 hours",
        "Listing goes live after approval"
      ]
    },
    {
      number: "03",
      title: "Create Your Listing",
      description: "Build a compelling listing with financials, operations details, and growth potential. Control what information is public vs. NDA-protected.",
      icon: <BarChart3 className="h-6 w-6" />,
      details: [
        "Three-tier confidentiality controls",
        "Upload supporting documents",
        "Set your own asking price"
      ]
    },
    {
      number: "04",
      title: "Engage with Buyers",
      description: "Receive inquiries from qualified buyers through our secure deal room. Manage NDAs, share documents, and negotiate terms.",
      icon: <MessageSquare className="h-6 w-6" />,
      details: [
        "Secure messaging system",
        "Document vault for due diligence",
        "Track deal progress in real-time"
      ]
    },
    {
      number: "05",
      title: "Close & Get Paid",
      description: "When the deal closes, you receive 50% of the platform's success fee. Payments are processed within 14 business days.",
      icon: <DollarSign className="h-6 w-6" />,
      details: [
        "50/50 commission split",
        "Secure escrow integration",
        "Multiple payout options"
      ]
    }
  ];

  const benefits = [
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: "Expanded Reach",
      description: "Access our network of qualified iGaming buyers actively looking for acquisition opportunities. No more cold outreach."
    },
    {
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      title: "Generous Commission",
      description: "Earn 50% of the platform fee on every closed deal. This is in addition to your existing fee arrangement with clients."
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Save Time",
      description: "We handle marketing, buyer qualification, and platform technology. You focus on what you do best: closing deals."
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Confidentiality First",
      description: "Three-tier confidentiality system protects your clients' sensitive information until buyers are properly vetted."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Deal Analytics",
      description: "Track listing views, buyer interest, and deal progress through your personalized Broker Dashboard."
    },
    {
      icon: <Handshake className="h-8 w-8 text-primary" />,
      title: "Escrow Protection",
      description: "Secure transactions through Escrow.com integration. Funds are protected until all conditions are met."
    }
  ];

  const comparisonItems = [
    { feature: "Upfront Fees", traditional: "Often required", mspInvestments: "None" },
    { feature: "Buyer Access", traditional: "Your network only", mspInvestments: "Global marketplace" },
    { feature: "Marketing", traditional: "Your responsibility", mspInvestments: "Platform handles it" },
    { feature: "Deal Room Tools", traditional: "Varies", mspInvestments: "Full suite included" },
    { feature: "Commission Split", traditional: "N/A", mspInvestments: "50/50 on platform fee" },
    { feature: "Confidentiality", traditional: "Manual process", mspInvestments: "Built-in 3-tier system" },
    { feature: "Escrow Integration", traditional: "Separate setup", mspInvestments: "One-click integration" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Users className="h-4 w-4" />
                For M&A Professionals
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                How the Broker Program Works
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                List iGaming businesses you represent, access qualified buyers, and earn 50% commission on every closed deal. 
                No upfront costs, no monthly fees.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/broker/apply">
                  <Button size="lg" className="gap-2">
                    Apply Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/broker/faq">
                  <Button size="lg" variant="outline">
                    View FAQ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Commission Highlight */}
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">50%</div>
                <div className="text-primary-foreground/80">Commission Split</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">$0</div>
                <div className="text-primary-foreground/80">Upfront Costs</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">14 Days</div>
                <div className="text-primary-foreground/80">Payout Timeline</div>
              </div>
            </div>
          </div>
        </section>

        {/* Step by Step Process */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple 5-Step Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From application to payout, here's exactly how the Broker Program works.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Brokers Choose Us</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join a growing network of M&A professionals who trust AM iGaming Marketplace to expand their reach and close more deals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="mb-4">{benefit.icon}</div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Traditional vs. AM iGaming Marketplace</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See how partnering with us compares to traditional broker operations.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold">Traditional</th>
                      <th className="text-center p-4 font-semibold bg-primary/10 text-primary">AM iGaming Marketplace</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonItems.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-4 font-medium">{item.feature}</td>
                        <td className="text-center p-4 text-muted-foreground">{item.traditional}</td>
                        <td className="text-center p-4 bg-primary/5 font-medium">{item.mspInvestments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Commission Calculator Example */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Your Earnings Potential</h2>
                <p className="text-muted-foreground">
                  See how much you could earn with our 50/50 commission split.
                </p>
              </div>

              <Card>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-6 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">Deal Size</div>
                      <div className="text-2xl font-bold">$500,000</div>
                      <div className="text-sm text-muted-foreground mt-2">Platform Fee: $15,000 (3%)</div>
                      <div className="text-lg font-semibold text-primary mt-2">Your Earnings: $7,500</div>
                    </div>
                    <div className="p-6 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">Deal Size</div>
                      <div className="text-2xl font-bold">$1,000,000</div>
                      <div className="text-sm text-muted-foreground mt-2">Platform Fee: $30,000 (3%)</div>
                      <div className="text-lg font-semibold text-primary mt-2">Your Earnings: $15,000</div>
                    </div>
                    <div className="p-6 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">Deal Size</div>
                      <div className="text-2xl font-bold">$2,500,000</div>
                      <div className="text-sm text-muted-foreground mt-2">Platform Fee: $75,000 (3%)</div>
                      <div className="text-lg font-semibold text-primary mt-2">Your Earnings: $37,500</div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-6">
                    * These earnings are in addition to your existing fee arrangement with your client.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Business?</h2>
              <p className="text-primary-foreground/80 mb-8 text-lg">
                Join our network of successful M&A professionals. No upfront costs, no monthly fees. 
                Just results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/broker/apply">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Apply Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/broker/faq">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Read FAQ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
