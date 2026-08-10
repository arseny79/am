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
          q: "What types of businesses and assets can I submit?",
          a: "We list operating iGaming businesses (online casinos, sportsbooks, poker rooms), B2B iGaming technology (platforms, aggregators, payment tools, compliance software), and affiliate, media and traffic assets with iGaming exposure. We do not list unlicensed projects, token-only ventures, or fundraising campaigns."
        },
        {
          q: "Can I submit anonymously?",
          a: "Yes. Your identity is not disclosed to any buyer until you have reviewed their profile and explicitly approved their access request. Approved buyers sign a platform NDA before any confidential business details are shared."
        },
        {
          q: "What information do I need to provide?",
          a: "Key business details including sector and license jurisdiction, revenue and operating profile, asking range, and a description of the asset or business. You control which details are visible publicly versus which require NDA access and your individual approval."
        },
        {
          q: "How does the review and listing process work?",
          a: "Every submission is manually reviewed by the AM team for market fit and positioning. If approved, your opportunity is presented as a confidential teaser and matched to relevant buyer mandates. You are notified before any information is presented to potential buyers."
        },
        {
          q: "How does KYC verification work?",
          a: "KYC verification is required before your listing goes live. You provide a government-issued ID and proof of identity, and the AM team reviews submissions manually. This protects both parties in high-value transactions."
        }
      ]
    },
    {
      category: "For Buyers",
      questions: [
        {
          q: "Is there a fee to browse listings or submit a mandate?",
          a: "Browsing public teasers is free. Submitting a buyer mandate is free. Access to confidential listing details requires signing a platform NDA and receiving seller approval."
        },
        {
          q: "How do buyer mandates work?",
          a: "Register and submit your acquisition criteria: sector focus, size range, geography, deal structure, and any licensing preferences. The AM team matches your mandate against available opportunities and presents relevant teasers to you confidentially."
        },
        {
          q: "What can I see publicly versus after approval?",
          a: "Public teasers show general sector, approximate size range, and a high-level business description with no identifying information. After signing a platform NDA and receiving seller approval, you gain access to the full data room with detailed operational and financial information."
        },
        {
          q: "How does the NDA and access process work?",
          a: "When you find an opportunity of interest, you sign a platform NDA and submit an access request that includes your buyer profile. The seller reviews your profile independently and decides whether to approve access. AM does not override the seller's decision."
        },
        {
          q: "How do I know listing information is accurate?",
          a: "Sellers must complete KYC verification before listing. However, AM does not audit or guarantee the accuracy of financial or operational data provided by sellers. All buyers are responsible for conducting independent due diligence before entering any transaction."
        }
      ]
    },
    {
      category: "Platform & Process",
      questions: [
        {
          q: "Do you provide legal, financial, or investment advice?",
          a: APP_TITLE + " is a technology marketplace and introduction layer, not a broker-dealer, investment adviser, or party to any transaction. We do not provide investment, legal, or tax advice. We strongly recommend working with qualified M&A legal counsel, accountants, and iGaming sector specialists."
        },
        {
          q: "What is AM's role in negotiations and closing?",
          a: "AM's role ends at introduction. Once a buyer is approved for access, all negotiations, term sheets, due diligence, and closing documents are handled directly between the buyer and seller with their own advisors. AM does not participate in or guarantee any transaction outcome."
        },
        {
          q: "How is my information kept confidential?",
          a: "We use industry-standard encryption and require NDA execution before revealing sensitive business details. Seller identity is not disclosed until the seller individually approves each access request. KYC is required for all sellers, and buyer profiles are shared only with the relevant seller."
        },
        {
          q: "What if a deal does not close?",
          a: "AM does not charge success fees or transaction fees of any kind. If discussions between a buyer and seller do not result in a transaction, both parties remain on the platform and can pursue other opportunities at no additional cost."
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
            Everything you need to know about buying and selling iGaming businesses and assets on {APP_TITLE}
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
            Can't find the answer you're looking for? Our team is here to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
