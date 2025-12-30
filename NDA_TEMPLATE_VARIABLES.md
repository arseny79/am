# NDA Template Variables Guide

## Overview

When creating or editing NDA templates, you can use **variables** that will be automatically replaced with real data when an NDA is generated for a deal.

## How to Use Variables

In your NDA template, insert variables using double curly braces: `{{variableName}}`

**Example:**
```
This Non-Disclosure Agreement ("Agreement") is entered into on {{currentDate}} 
between {{buyerName}} ("Buyer") and {{sellerName}} ("Seller") regarding the 
potential acquisition of {{listingName}}.
```

## Available Variables

### Buyer Information

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{buyerName}}` | Full name of the buyer | "John Smith" |
| `{{buyerCompanyName}}` | Buyer's company name | "Smith Investments LLC" |
| `{{buyerEmail}}` | Buyer's email address | "john@smithinvest.com" |

### Seller Information

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{sellerName}}` | Full name of the seller | "Jane Doe" |
| `{{sellerCompanyName}}` | Seller's company name | "TechCare MSP Inc" |
| `{{sellerEmail}}` | Seller's email address | "jane@techcaremsp.com" |

### Business Information

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{listingName}}` | Name of the MSP business being sold | "TechCare MSP" |
| `{{listingRevenue}}` | Annual revenue of the MSP | "$1,250,000" |
| `{{listingEBITDA}}` | EBITDA of the MSP | "$375,000" |

### Deal Information

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{dealId}}` | Unique identifier for this deal | "210001" |
| `{{currentDate}}` | Today's date (auto-filled) | "December 30, 2024" |
| `{{expirationDate}}` | NDA expiration date | "January 6, 2025" |
| `{{effectiveDate}}` | Date NDA becomes effective | "December 30, 2024" |

## Complete Example Template

```markdown
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{currentDate}} 
("Effective Date") by and between:

DISCLOSING PARTY:
Name: {{sellerName}}
Company: {{sellerCompanyName}}
Email: {{sellerEmail}}

RECEIVING PARTY:
Name: {{buyerName}}
Company: {{buyerCompanyName}}
Email: {{buyerEmail}}

WHEREAS, the Disclosing Party possesses certain confidential and proprietary 
information relating to {{listingName}}, an MSP business with annual revenue 
of approximately {{listingRevenue}} and EBITDA of {{listingEBITDA}};

WHEREAS, the Receiving Party desires to evaluate the potential acquisition of 
said business (Deal ID: {{dealId}});

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained 
herein, the parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION
   [Your terms here...]

2. OBLIGATIONS OF RECEIVING PARTY
   [Your terms here...]

3. TERM
   This Agreement shall remain in effect until {{expirationDate}}, unless 
   terminated earlier by mutual written consent.

[Additional clauses...]

AGREED AND ACCEPTED:

Buyer: {{buyerName}}
Date: _________________

Seller: {{sellerName}}
Date: _________________
```

## Where to Edit Templates

1. Log in as an **admin user**
2. Navigate to **Admin Dashboard**
3. Click on the **"NDA Templates"** tab
4. Click **"Upload New Template"** to create a new template
5. Enter template name, description, and content with variables
6. Click **"Upload Template"**

## Tips

- **Use descriptive names**: Name your templates clearly (e.g., "Standard MSP NDA", "California NDA")
- **Set one as default**: Mark your most commonly used template as the default
- **Test with preview**: Use the preview function to see how variables will be replaced
- **Keep it simple**: Don't over-complicate variable usage - the system handles formatting automatically

## Variable Formatting

The system automatically formats variables based on their type:

- **Dates**: Formatted as "Month Day, Year" (e.g., "December 30, 2024")
- **Currency**: Formatted with commas and dollar signs (e.g., "$1,250,000")
- **Text**: Inserted as-is from the database

## Need Help?

If you need to add new variables or customize the NDA system, contact your development team.
