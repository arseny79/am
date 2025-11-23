# Escrow.com Integration Guide

This document outlines the plan for integrating Escrow.com payment processing into the MSP M&A Marketplace.

## Overview

Escrow.com provides a partnership program with **Escrow Pay API** for marketplaces. This allows the MSP marketplace to:
- Integrate escrow payments with a single API call
- Collect platform success fees (3-5%) automatically via broker commission
- Provide secure transactions for deals from $100 to $10M+
- Offer professional escrow service without building payment infrastructure

**Key Benefit**: Escrow.com collects both the deal funds AND platform success fees in one transaction, then disburses separately.

## Integration Steps

### 1. Register as Escrow.com Partner
- Review [Escrow Terms of Using the Escrow Platform](https://www.escrow.com/partners/get-started)
- Provide business information (contact details, industry, expected volume)
- Register for a [partner account](https://www.escrow.com/partners/get-started)
- Receive API credentials for sandbox environment
- Contact sales engineer for implementation support

### 2. API Integration Approach

**Use Escrow Pay API** (not SDK) for simplified integration:
- Single REST API call to create escrow transactions
- Buyer redirected to Escrow.com wizard for payment
- Returns to marketplace via `return_url` after completion
- Webhook notifications for status updates

### 3. Add Environment Variables
Add these to your project secrets via the Management UI:
- `ESCROW_API_KEY` - Your Escrow.com API key
- `ESCROW_API_SECRET` - Your Escrow.com API secret
- `ESCROW_ENVIRONMENT` - Either "sandbox" or "production"

### 4. Implementation Plan

#### A. Create Escrow Transaction with Platform Fee
When a deal reaches "Escrow" stage:
1. Calculate platform success fee based on listing tier (3-5%)
2. Create escrow transaction via Escrow Pay API including:
   - Deal amount (purchase price)
   - Broker commission (platform success fee)
   - Buyer and seller details
   - Return URL to marketplace
3. Store escrow transaction ID in `deals` table
4. Redirect buyer to Escrow.com payment wizard

#### B. Deal Flow with Escrow Stage
Deal stages now include:
- `negotiation` - Terms being negotiated
- `escrow` - Escrow transaction initiated, awaiting funding
- `closing` - Funds in escrow, final documents being exchanged
- `closed` - Transaction complete, funds released
- `cancelled` - Deal cancelled

#### C. Webhook Handler
Create a webhook endpoint to receive Escrow.com notifications:
- Payment received
- Transaction completed
- Dispute filed
- Funds released

### 5. Code Structure

```typescript
// server/escrow/client.ts
import { PRICING_TIERS } from '@shared/pricing';

export async function createEscrowTransaction(params: {
  dealId: number;
  purchasePrice: number;
  listingTier: 'basic' | 'featured' | 'premium';
  buyer: { email: string; name: string };
  seller: { email: string; name: string };
}) {
  const tier = PRICING_TIERS[params.listingTier];
  const platformFee = Math.round(params.purchasePrice * (tier.successFeePercent / 100));

  const response = await fetch('https://api.escrow.com/2017-09-01/escrow-pay/transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ESCROW_API_KEY}`
    },
    body: JSON.stringify({
      parties: {
        buyer: params.buyer,
        seller: params.seller,
        broker: {
          email: 'platform@msp-marketplace.com',
          commission: {
            amount: platformFee,
            currency: 'USD'
          }
        }
      },
      items: [{
        title: 'MSP Business Acquisition',
        description: `Deal #${params.dealId}`,
        type: 'general_merchandise',
        inspection_period: 30, // Days for due diligence
        quantity: 1,
        price: {
          amount: params.purchasePrice,
          currency: 'USD'
        }
      }],
      return_url: `https://msp-marketplace.com/deal/${params.dealId}/escrow-complete`,
      redirect_type: 'manual'
    })
  });

  const { landing_page, transaction_id, token } = await response.json();
  return { landing_page, transaction_id, token };
}
```

### 6. UI Components

#### Deal Room Enhancements
- Add "Initiate Escrow" button when deal reaches negotiation stage
- Display escrow status and payment instructions
- Show escrow transaction timeline
- Add "Release Funds" button for seller (after conditions met)

#### Payment Flow
1. Buyer clicks "Proceed to Payment"
2. System creates Escrow.com transaction
3. Buyer is redirected to Escrow.com to fund the account
4. Webhook updates deal status when funded
5. Seller completes asset transfer
6. Buyer confirms receipt
7. Funds are released to seller

### 7. Fees

**Escrow.com fees**: As low as 0.89% (paid by buyer or split per agreement)
**Platform success fees**: Collected automatically via broker commission:
- Basic tier: 5% of purchase price
- Featured tier: 4% of purchase price
- Premium tier: 3% of purchase price

**Example**: $500K MSP sale with Featured tier:
- Purchase price: $500,000
- Platform fee (4%): $20,000
- Escrow.com fee (~0.89%): ~$4,450
- Total collected from buyer: $524,450
- Disbursed to seller: $500,000
- Disbursed to platform: $20,000
- Escrow.com keeps: $4,450

### 8. Testing

Use Escrow.com sandbox environment for testing:
1. Create test transactions
2. Simulate payment flows
3. Test webhook handling
4. Verify fund release process

### 9. Compliance

Ensure compliance with:
- Anti-money laundering (AML) regulations
- Know Your Customer (KYC) requirements
- Data privacy laws (GDPR, CCPA)

### 10. Next Steps

1. Create Escrow.com business account
2. Obtain API credentials
3. Implement the escrow service module
4. Add escrow-related fields to deals table
5. Build UI components for payment flow
6. Set up webhook endpoint
7. Test in sandbox environment
8. Go live with production credentials

## Resources

- [Escrow.com API Documentation](https://www.escrow.com/api-guide)
- [Escrow.com Developer Portal](https://developer.escrow.com/)
- [Integration Examples](https://github.com/escrow-com/examples)

## Support

For integration questions, contact Escrow.com support:
- Email: support@escrow.com
- Phone: 1-888-ESCROW-1
