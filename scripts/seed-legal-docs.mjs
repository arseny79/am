import { drizzle } from "drizzle-orm/mysql2";
import { platformDocuments } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const legalDocs = [
  {
    slug: "terms-of-service",
    title: "MSPdeal.com Terms of Service",
    content: `# Terms of Service

**Last Updated:** ${new Date().toLocaleDateString()}

## 1. Agreement to Terms

By accessing MSPdeal.com ("Platform"), you agree to these Terms of Service. If you disagree with any part, you may not access the service.

## 2. Use License

Permission is granted to temporarily access the Platform for personal, non-commercial transitory viewing only.

### This license does NOT include the right to:
- Modify or copy materials
- Use materials for commercial purposes without authorization
- Attempt to reverse engineer any software
- Remove copyright or proprietary notations
- Transfer materials to another person
- Use the Platform in any way that violates applicable laws

## 3. User Accounts

### Registration
- You must provide accurate, complete information
- You are responsible for maintaining account security
- You must be at least 18 years old
- One person or entity per account

### Account Termination
We reserve the right to terminate accounts that violate these terms.

## 4. Listing Guidelines

### Sellers Must:
- Provide accurate business information
- Own or have authority to sell the listed business
- Respond to qualified buyer inquiries promptly
- Maintain confidentiality of buyer information

### Prohibited Content:
- False or misleading information
- Businesses involved in illegal activities
- Spam or irrelevant listings

## 5. Fees and Payments

### Listing Fees
- Standard: FREE (5% success fee)
- Featured: $299 upfront (4% success fee)
- Premium: $599 upfront (3% success fee)

### Success Fees
- Paid only upon successful sale completion
- Calculated as percentage of final sale price
- Non-refundable once transaction completes

### Payment Processing
- All payments processed through Stripe
- Subject to Stripe's terms and conditions

## 6. Escrow Protection

- Transactions completed through Escrow.com
- Funds held securely until deal closes
- Both parties must agree to release funds

## 7. Confidentiality

### NDAs
- Buyers must sign NDA before accessing confidential information
- Platform provides NDA management tools
- Violations may result in legal action

### Data Protection
- We protect user data per our Privacy Policy
- Confidential business information encrypted
- Access limited to authorized parties only

## 8. Disclaimer of Warranties

THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.

We do not warrant that:
- The service will be uninterrupted or error-free
- Defects will be corrected
- The Platform is free of viruses or harmful components

## 9. Limitation of Liability

MSPdeal.com SHALL NOT BE LIABLE FOR:
- Indirect, incidental, or consequential damages
- Loss of profits, data, or business opportunities
- Damages exceeding fees paid in the past 12 months

## 10. Indemnification

You agree to indemnify MSPdeal.com against claims arising from:
- Your use of the Platform
- Violation of these Terms
- Violation of any third-party rights

## 11. Dispute Resolution

### Governing Law
These Terms are governed by the laws of [Your Jurisdiction].

### Arbitration
Disputes will be resolved through binding arbitration, not in court.

### Class Action Waiver
You agree to resolve disputes individually, not as part of a class action.

## 12. Changes to Terms

We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance.

## 13. Contact Information

For questions about these Terms, contact us at:
- Email: legal@mspdeal.com
- Address: [Your Business Address]

---

By using MSPdeal.com, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
`,
    isPublished: true,
    version: 1,
  },
  {
    slug: "privacy-policy",
    title: "MSPdeal.com Privacy & Cookie Policy",
    content: `# Privacy & Cookie Policy

**Last Updated:** ${new Date().toLocaleDateString()}

## 1. Introduction

MSPdeal.com ("we," "our," "us") respects your privacy. This Policy explains how we collect, use, disclose, and safeguard your information.

## 2. Information We Collect

### Personal Information
- Name and contact details (email, phone)
- Business information (company name, website)
- Financial information (for transactions)
- Account credentials

### Business Listing Data
- Financial metrics (revenue, EBITDA, client count)
- Operational details (tools, services, employees)
- Confidential business information

### Automatically Collected Data
- IP address and browser type
- Device information
- Usage data and analytics
- Cookies and tracking technologies

## 3. How We Use Your Information

### To Provide Services
- Create and manage your account
- Process transactions and payments
- Facilitate buyer-seller communications
- Provide customer support

### To Improve Our Platform
- Analyze usage patterns
- Develop new features
- Enhance user experience
- Prevent fraud and abuse

### Marketing Communications
- Send newsletters and updates
- Promote relevant listings
- Notify about new features
- You can opt-out anytime

## 4. How We Share Your Information

### With Your Consent
- Share listing details with qualified buyers
- Provide contact information after NDA signing

### Service Providers
- Payment processors (Stripe)
- Escrow services (Escrow.com)
- Analytics providers (Google Analytics)
- Email service providers

### Legal Requirements
- Comply with legal obligations
- Protect rights and safety
- Enforce our Terms of Service

### We NEVER sell your personal information to third parties.

## 5. Data Security

### Security Measures
- Encryption of sensitive data (SSL/TLS)
- Secure authentication
- Regular security audits
- Access controls and monitoring

### Your Responsibility
- Keep login credentials secure
- Use strong passwords
- Report suspicious activity immediately

## 6. Cookies and Tracking

### Types of Cookies We Use

**Essential Cookies**
- Required for platform functionality
- Authentication and security
- Cannot be disabled

**Analytics Cookies**
- Google Analytics
- StatCounter
- Track usage patterns
- Help improve our service

**Preference Cookies**
- Remember your settings
- Enhance user experience

### Managing Cookies
You can control cookies through your browser settings. Disabling cookies may limit functionality.

## 7. Your Privacy Rights

### Access and Correction
- View your personal information
- Update inaccurate data
- Request data export

### Deletion
- Request account deletion
- Remove personal information
- Some data may be retained for legal compliance

### Opt-Out
- Unsubscribe from marketing emails
- Disable non-essential cookies
- Limit data collection

## 8. Data Retention

We retain your information:
- As long as your account is active
- As needed to provide services
- To comply with legal obligations
- For legitimate business purposes

## 9. Children's Privacy

Our Platform is not intended for users under 18. We do not knowingly collect data from children.

## 10. International Data Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.

## 11. Third-Party Links

Our Platform may contain links to third-party websites. We are not responsible for their privacy practices.

## 12. California Privacy Rights (CCPA)

California residents have additional rights:
- Right to know what data we collect
- Right to delete personal information
- Right to opt-out of data sales (we don't sell data)
- Right to non-discrimination

## 13. GDPR Compliance (EU Users)

EU users have rights under GDPR:
- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to object to processing

## 14. Changes to This Policy

We may update this Policy periodically. We will notify you of significant changes via email or platform notice.

## 15. Contact Us

For privacy-related questions or requests:
- Email: privacy@mspdeal.com
- Address: [Your Business Address]

---

By using MSPdeal.com, you consent to this Privacy & Cookie Policy.
`,
    isPublished: true,
    version: 1,
  },
  {
    slug: "nda-template",
    title: "MSPdeal.com Standard Confidentiality Agreement (NDA)",
    content: `# Standard Confidentiality Agreement (NDA)

**Effective Date:** [Date]

## Parties

**Disclosing Party (Seller):**
- Business Name: [Business Name]
- Representative: [Name]
- Email: [Email]

**Receiving Party (Buyer):**
- Name/Entity: [Name]
- Representative: [Name]
- Email: [Email]

## 1. Purpose

The Disclosing Party wishes to share confidential business information with the Receiving Party for the purpose of evaluating a potential acquisition transaction.

## 2. Definition of Confidential Information

"Confidential Information" includes all information disclosed by the Disclosing Party, including but not limited to:

- Financial statements and projections
- Customer lists and contracts
- Pricing information
- Business strategies and plans
- Employee information
- Vendor relationships
- Proprietary processes and systems
- Trade secrets
- Any information marked "Confidential"

### Exclusions
Confidential Information does NOT include information that:
- Is publicly available through no fault of Receiving Party
- Was known to Receiving Party before disclosure
- Is independently developed by Receiving Party
- Is rightfully received from a third party

## 3. Obligations of Receiving Party

The Receiving Party agrees to:

### Maintain Confidentiality
- Keep all Confidential Information strictly confidential
- Not disclose to any third party without prior written consent
- Use the same degree of care as with own confidential information

### Limited Use
- Use Confidential Information ONLY for evaluating the potential transaction
- Not use for any competitive purpose
- Not reverse engineer or attempt to discover trade secrets

### Limited Disclosure
- Disclose only to employees, advisors, or representatives who:
  - Have a legitimate need to know
  - Are bound by confidentiality obligations
  - Understand the confidential nature

### Secure Storage
- Store Confidential Information securely
- Implement reasonable security measures
- Prevent unauthorized access

## 4. No Rights Granted

This Agreement does NOT:
- Grant any license or rights to Confidential Information
- Create any partnership or joint venture
- Obligate either party to proceed with a transaction
- Guarantee accuracy of Confidential Information

## 5. Return or Destruction

Upon request or termination of discussions, Receiving Party must:
- Return all Confidential Information
- Delete all electronic copies
- Destroy all notes and derivatives
- Provide written certification of compliance

## 6. No Solicitation

For [12] months after signing, Receiving Party agrees NOT to:
- Solicit or hire Disclosing Party's employees
- Interfere with Disclosing Party's business relationships
- Contact Disclosing Party's customers or vendors without consent

## 7. Term

This Agreement remains in effect for:
- **2 years** from the Effective Date
- Obligations survive termination for the full term

## 8. Legal Compliance

### Required Disclosure
If legally compelled to disclose Confidential Information:
- Notify Disclosing Party immediately
- Cooperate in seeking protective order
- Disclose only minimum required information

### Regulatory Compliance
Nothing prevents disclosure required by law or regulation.

## 9. Remedies

### Injunctive Relief
Receiving Party acknowledges that breach may cause irreparable harm. Disclosing Party may seek injunctive relief without proving damages.

### Damages
Receiving Party liable for all damages resulting from breach, including attorney's fees.

### No Limitation
These remedies are in addition to all other legal remedies.

## 10. General Provisions

### Governing Law
This Agreement is governed by the laws of [Your Jurisdiction].

### Entire Agreement
This constitutes the entire agreement regarding confidentiality.

### Amendments
Modifications must be in writing and signed by both parties.

### Severability
If any provision is invalid, the remainder remains in effect.

### No Waiver
Failure to enforce any provision does not waive future enforcement.

### Assignment
This Agreement may not be assigned without written consent.

## 11. Acknowledgment

By signing below, Receiving Party acknowledges:
- Understanding of obligations
- Agreement to be bound by terms
- Authority to enter into this Agreement

---

## Signatures

**Disclosing Party (Seller):**

Signature: ___________________________  
Name: [Name]  
Title: [Title]  
Date: _______________

**Receiving Party (Buyer):**

Signature: ___________________________  
Name: [Name]  
Title: [Title]  
Date: _______________

---

*This NDA template is provided by MSPdeal.com for use in connection with transactions facilitated through the Platform. Parties should consult legal counsel before signing.*
`,
    isPublished: true,
    version: 1,
  },
];

async function seedDocs() {
  try {
    console.log("Seeding legal documents...");
    
    for (const doc of legalDocs) {
      await db.insert(platformDocuments).values(doc).onDuplicateKeyUpdate({
        set: {
          content: doc.content,
          isPublished: doc.isPublished,
          version: doc.version,
        },
      });
      console.log(`✓ Created/updated: ${doc.title}`);
    }
    
    console.log("\n✅ Legal documents seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding documents:", error);
    process.exit(1);
  }
}

seedDocs();
