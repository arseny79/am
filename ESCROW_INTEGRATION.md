# Escrow.com Integration Guide

This document outlines the plan for integrating Escrow.com payment processing into the MSP M&A Marketplace.

## Overview

Escrow.com will be used to facilitate secure transactions between buyers and sellers. When a deal reaches the "Closing" stage, funds will be held in escrow until all conditions are met.

## Integration Steps

### 1. Set Up Escrow.com Account
- Create a business account at [Escrow.com](https://www.escrow.com/)
- Complete business verification
- Obtain API credentials (API Key and Secret)

### 2. Install Escrow.com SDK
```bash
pnpm add @escrow/escrow-js
```

### 3. Add Environment Variables
Add these to your project secrets via the Management UI:
- `ESCROW_API_KEY` - Your Escrow.com API key
- `ESCROW_API_SECRET` - Your Escrow.com API secret
- `ESCROW_ENVIRONMENT` - Either "sandbox" or "production"

### 4. Implementation Plan

#### A. Create Escrow Transaction
When a deal reaches "Negotiation" stage and terms are agreed:
1. Create an escrow transaction via Escrow.com API
2. Store the escrow transaction ID in the `deals` table
3. Send payment instructions to the buyer

#### B. Update Deal Flow
Add new deal stages:
- `awaiting_payment` - Buyer needs to fund escrow
- `escrow_funded` - Funds are in escrow
- `closing` - Final documents being exchanged
- `completed` - Transaction complete, funds released

#### C. Webhook Handler
Create a webhook endpoint to receive Escrow.com notifications:
- Payment received
- Transaction completed
- Dispute filed
- Funds released

### 5. Code Structure

```typescript
// server/escrow.ts
import Escrow from '@escrow/escrow-js';

const escrow = new Escrow({
  apiKey: process.env.ESCROW_API_KEY,
  apiSecret: process.env.ESCROW_API_SECRET,
  environment: process.env.ESCROW_ENVIRONMENT,
});

export async function createEscrowTransaction(dealId: number, amount: number) {
  const transaction = await escrow.transactions.create({
    parties: {
      buyer: { /* buyer details */ },
      seller: { /* seller details */ },
    },
    items: [{
      title: 'MSP Business Acquisition',
      description: `Deal #${dealId}`,
      type: 'domain_name', // or appropriate category
      inspection_period: 259200, // 3 days in seconds
      quantity: 1,
      price: amount,
    }],
  });
  
  return transaction;
}

export async function releaseEscrowFunds(transactionId: string) {
  await escrow.transactions.release(transactionId);
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

Escrow.com charges a fee based on transaction amount:
- Under $5,000: 3.25% (minimum $25)
- $5,000 - $25,000: 0.89% + $25
- Over $25,000: Custom pricing

**Important:** Decide who pays the escrow fee (buyer, seller, or split) and implement this in the transaction creation.

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
