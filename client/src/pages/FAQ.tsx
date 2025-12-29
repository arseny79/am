import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { APP_TITLE } from "@/const";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export default function FAQ() {
  const faqs = [
    {
      category: "For Sellers",
      questions: [
        {
          q: "How much does it cost to list my MSP business?",
          a: "We offer three tiers: Standard (FREE), Featured ($99/week), and Premium Featured ($249/week). All tiers only charge a 3% success fee when your business sells. There are no upfront costs for the Standard tier."
        },
        {
          q: "How long does it take to sell my MSP?",
          a: "The timeline varies based on your asking price, business metrics, and market conditions. Most listings receive initial buyer interest within 2-4 weeks. The complete sale process typically takes 60-120 days from listing to close."
        },
        {
          q: "Can I list my business anonymously?",
          a: "Yes! You can choose to list anonymously, and your identity will only be revealed to buyers after they sign an NDA and you approve their access request."
        },
        {
          q: "What information do I need to provide?",
          a: "You'll need basic business information (location, founding year), financial metrics (revenue, MRR, EBITDA), client information (count, retention rate), and a business description. You can control which details require NDA access."
        },
        {
          q: "How does the KYC verification process work?",
          a: "KYC verification is FREE and required to create a listing. You'll need to provide a government ID and proof of address. Our team manually reviews submissions within 24-48 hours. This protects both buyers and sellers in high-value transactions."
        }
      ]
    },
    {
      category: "For Buyers",
      questions: [
        {
          q: "Is there a fee to browse listings?",
          a: "No, browsing all public listings is completely free. You only need to sign an NDA (also free) to view confidential business details."
        },
        {
          q: "How do I know the listings are legitimate?",
          a: "All sellers must complete KYC verification before listing. However, we do not verify the financial data provided—buyers must conduct their own due diligence. Our disclaimer clearly states this responsibility."
        },
        {
          q: "What is the NDA process?",
          a: "When you find an interesting listing, you can digitally sign our standard NDA through the platform. Once signed, you can request access to confidential details. The seller reviews your request and decides whether to grant access."
        },
        {
          q: "How does payment work?",
          a: "All transactions are protected by Escrow.com integration. Funds are held securely until both parties confirm the deal terms are met. This eliminates wire transfer risk and provides transparency throughout the transaction."
        },
        {
          q: "Can I negotiate the asking price?",
          a: "Yes! Once you have NDA access and the seller approves your interest, you can communicate directly through our secure messaging system to negotiate terms, ask questions, and conduct due diligence."
        }
      ]
    },
    {
      category: "Platform & Security",
      questions: [
        {
          q: "How do you protect confidential information?",
          a: "We use industry-standard encryption, require NDAs before revealing sensitive details, implement KYC verification for all sellers, and provide granular privacy controls so sellers can choose what information requires NDA access."
        },
        {
          q: "What happens if a deal falls through?",
          a: "If a deal doesn't close, no success fees are charged. Escrow.com funds are returned according to the escrow agreement terms. You can continue browsing other listings or keep your listing active to find other buyers."
        },
        {
          q: "Do you provide legal or financial advice?",
          a: "No. " + APP_TITLE + " is a marketplace platform, not a broker-dealer or investment adviser. We strongly recommend working with qualified M&A attorneys, accountants, and business brokers for professional guidance."
        },
        {
          q: "Can I get help from professionals?",
          a: "Yes! Our Professional Directory connects you with vetted M&A attorneys, accountants, business brokers, and consultants who specialize in MSP transactions. These professionals can guide you through due diligence, valuation, and closing."
        }
      ]
    },
    {
      category: "Fees & Pricing",
      questions: [
        {
          q: "What is the 3% success fee?",
          a: "The success fee is only charged when your business successfully sells. It's calculated as 3% of the final sale price and is paid by the seller at closing. No sale = no fee."
        },
        {
          q: "Are there any hidden fees?",
          a: "No hidden fees from our platform. However, you may incur costs from third parties such as Escrow.com fees (typically 1-2% split between buyer and seller), legal fees, accounting fees, and professional services if you choose to hire advisors."
        },
        {
          q: "Can I upgrade my listing tier later?",
          a: "Yes! You can upgrade from Standard to Featured or Premium at any time through your dashboard. The weekly fee will be prorated based on your listing's remaining duration."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl">
            Everything you need to know about buying and selling MSP businesses on {APP_TITLE}
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {faqs.map((section, idx) => (
            <div key={idx} className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground border-b pb-3">
                {section.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-4">
                {section.questions.map((item, qIdx) => (
                  <AccordionItem
                    key={qIdx}
                    value={`${idx}-${qIdx}`}
                    className="border rounded-lg px-6 bg-card"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-5">
                      <span className="font-semibold text-foreground pr-4">
                        {item.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="max-w-4xl mx-auto mt-16 p-8 bg-muted rounded-lg text-center">
          <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
