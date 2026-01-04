import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, HelpCircle, DollarSign, FileText, Shield, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "What is the MSP.investments Broker Program?",
    answer: "The Broker Program allows M&A professionals, business brokers, and intermediaries to list MSP businesses they represent on our marketplace. You earn 50% of the platform's success fee when a deal closes, giving you access to qualified buyers while we handle the technology and marketing."
  },
  {
    category: "Getting Started",
    question: "Who can become a broker on the platform?",
    answer: "We welcome licensed business brokers, M&A advisors, investment bankers, and experienced intermediaries who have valid brokerage contracts with MSP business owners. You don't need to own the business, just have the legal authority to represent it in a sale."
  },
  {
    category: "Getting Started",
    question: "How do I apply to become a broker?",
    answer: "Click 'Apply Now' in the footer or visit /broker/apply. You'll need to provide your professional credentials, company information, and details about your experience in M&A transactions. Our team reviews applications within 2-3 business days."
  },
  {
    category: "Getting Started",
    question: "Is there a cost to join the Broker Program?",
    answer: "No, joining the Broker Program is completely free. There are no monthly fees, subscription costs, or upfront charges. You only pay when a deal successfully closes, through the 50/50 commission split."
  },

  // Commission & Earnings
  {
    category: "Commission & Earnings",
    question: "How does the 50/50 commission split work?",
    answer: "When a deal closes through our platform, the total success fee is split evenly between you and MSP.investments. For example, if the platform fee is 3% on a $1M deal ($30,000), you receive $15,000 and we receive $15,000. This is in addition to any separate fee arrangement you have with your client."
  },
  {
    category: "Commission & Earnings",
    question: "When do I get paid?",
    answer: "Commissions are paid within 14 business days after the deal closes and funds are released from escrow. You can track your earnings in real-time through your Broker Dashboard and request payouts once they're approved."
  },
  {
    category: "Commission & Earnings",
    question: "What payment methods are available for payouts?",
    answer: "We support bank wire transfers (ACH for US, SWIFT for international), PayPal, and direct deposit. You can set your preferred payment method in your Broker Dashboard settings."
  },
  {
    category: "Commission & Earnings",
    question: "Is there a minimum payout threshold?",
    answer: "Yes, the minimum payout threshold is $100. Earnings below this amount will accumulate until they reach the threshold. You can request a payout at any time once you've reached the minimum."
  },

  // Listing & Contracts
  {
    category: "Listing & Contracts",
    question: "What documents do I need to list a business?",
    answer: "You'll need to upload a valid brokerage contract or engagement letter that proves you have the authority to represent the business. This document must be signed by the business owner and clearly state your role as their representative."
  },
  {
    category: "Listing & Contracts",
    question: "How long does contract verification take?",
    answer: "Our team typically reviews and verifies contracts within 24-48 hours. Once approved, your listing goes live immediately. If we need additional information, we'll contact you directly."
  },
  {
    category: "Listing & Contracts",
    question: "Can I list multiple businesses?",
    answer: "Absolutely! There's no limit to the number of businesses you can list. Each listing requires its own verified brokerage contract. Your Broker Dashboard makes it easy to manage multiple listings at once."
  },
  {
    category: "Listing & Contracts",
    question: "What happens if my contract expires?",
    answer: "If your brokerage contract expires, your listing will be paused until you upload a renewed contract. We'll notify you 30 days before expiration so you have time to renew with your client."
  },

  // Platform & Support
  {
    category: "Platform & Support",
    question: "How does the platform protect confidentiality?",
    answer: "We offer three-tier confidentiality: Public (basic info visible), NDA-Protected (requires signed NDA), and Private (requires seller approval). You control what information is visible at each level, and all buyer inquiries go through our secure deal room."
  },
  {
    category: "Platform & Support",
    question: "Do I communicate directly with buyers?",
    answer: "Yes, once a buyer initiates a deal, you can communicate directly through our secure messaging system. All conversations are logged for your records, and you maintain full control over the sales process."
  },
  {
    category: "Platform & Support",
    question: "What support do brokers receive?",
    answer: "Brokers receive priority email support, access to our deal room tools, document vault for due diligence materials, and marketing exposure through our featured listings. We also provide analytics on listing views and buyer interest."
  },
  {
    category: "Platform & Support",
    question: "Can I use my own NDA template?",
    answer: "Yes, you can upload your own NDA template for each listing. Alternatively, you can use our standard click-wrap NDA. Both options are supported and tracked through the platform."
  },

  // Legal & Compliance
  {
    category: "Legal & Compliance",
    question: "Is MSP.investments a licensed broker?",
    answer: "No, MSP.investments operates as a technology marketplace platform, not a licensed broker-dealer. We provide the technology infrastructure to connect buyers and sellers, while you maintain your independent broker relationship with your clients."
  },
  {
    category: "Legal & Compliance",
    question: "Who handles the transaction closing?",
    answer: "You and your client handle the actual transaction closing, just as you would with any other deal. We provide Escrow.com integration for secure fund transfers, but the legal closing process remains between the parties and their advisors."
  },
  {
    category: "Legal & Compliance",
    question: "What are my obligations as a broker on the platform?",
    answer: "You must maintain valid brokerage contracts for all listings, provide accurate information, respond to buyer inquiries in a timely manner, and comply with all applicable laws and regulations in your jurisdiction."
  }
];

const categories = ["Getting Started", "Commission & Earnings", "Listing & Contracts", "Platform & Support", "Legal & Compliance"];

export default function BrokerFAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = activeCategory === "all" 
    ? faqItems 
    : faqItems.filter(item => item.category === activeCategory);

  const categoryIcons: Record<string, React.ReactNode> = {
    "Getting Started": <Users className="h-4 w-4" />,
    "Commission & Earnings": <DollarSign className="h-4 w-4" />,
    "Listing & Contracts": <FileText className="h-4 w-4" />,
    "Platform & Support": <Shield className="h-4 w-4" />,
    "Legal & Compliance": <Clock className="h-4 w-4" />
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <HelpCircle className="h-4 w-4" />
                Broker FAQ
              </div>
              <h1 className="text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about the MSP.investments Broker Program. 
                Can't find what you're looking for? Contact our support team.
              </p>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 border-b">
          <div className="container">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("all")}
              >
                All Questions
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="gap-2"
                >
                  {categoryIcons[category]}
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ List */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto space-y-4">
              {filteredFAQs.map((item, index) => {
                const globalIndex = faqItems.indexOf(item);
                const isOpen = openItems.has(globalIndex);
                
                return (
                  <Card key={globalIndex} className="overflow-hidden">
                    <button
                      onClick={() => toggleItem(globalIndex)}
                      className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          {categoryIcons[item.category]}
                          {item.category}
                        </div>
                        <h3 className="font-semibold text-lg">{item.question}</h3>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </button>
                    {isOpen && (
                      <CardContent className="pt-0 pb-6 px-6">
                        <p className="text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-8">
                Join our network of successful M&A professionals and start earning 50% commission on every deal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/broker/apply">
                  <Button size="lg" className="gap-2">
                    Apply Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/broker/how-it-works">
                  <Button size="lg" variant="outline">
                    Learn How It Works
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 border-t">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="font-semibold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                Our broker support team is here to help you succeed.
              </p>
              <Link href="/contact">
                <Button variant="link" className="gap-2">
                  Contact Support <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
