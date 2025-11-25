# SendGrid Integration Guide for MSP M&A Marketplace

## Overview

**What is SendGrid?**  
SendGrid is a cloud-based email delivery service that handles transactional and marketing emails. It ensures high deliverability, provides analytics, and manages email infrastructure so you don't have to.

**Why SendGrid for this platform?**
- ✅ High deliverability (99%+ inbox rate)
- ✅ Transactional email templates
- ✅ Email analytics (open rates, click rates)
- ✅ Free tier: 100 emails/day (sufficient for early stage)
- ✅ Easy API integration
- ✅ Scales to millions of emails

**Estimated Integration Effort:** 4-6 hours total

---

## Step 1: SendGrid Account Setup (30 minutes)

### 1.1 Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for free account (no credit card required for free tier)
3. Verify your email address

### 1.2 Get API Key
1. Navigate to **Settings → API Keys**
2. Click **Create API Key**
3. Name: `msp-marketplace-production`
4. Permissions: **Full Access** (or restricted to Mail Send only)
5. Copy the API key (you'll only see it once!)

### 1.3 Verify Sender Identity
**Critical:** SendGrid requires sender verification to prevent spam.

**Option A: Single Sender Verification (Fastest - 5 minutes)**
1. Go to **Settings → Sender Authentication → Single Sender Verification**
2. Add your email (e.g., `noreply@mspmarketplace.com`)
3. Verify via email link
4. **Limitation:** Can only send from this one email address

**Option B: Domain Authentication (Recommended - 30 minutes)**
1. Go to **Settings → Sender Authentication → Authenticate Your Domain**
2. Enter your domain (e.g., `mspmarketplace.com`)
3. Add DNS records to your domain registrar:
   - CNAME records for domain verification
   - DKIM and SPF records for email authentication
4. Wait for DNS propagation (5-60 minutes)
5. **Benefit:** Can send from any `@mspmarketplace.com` address

**Recommendation:** Start with Single Sender for testing, upgrade to Domain Authentication before public launch.

---

## Step 2: Add SendGrid to Your Project (15 minutes)

### 2.1 Install SendGrid SDK

```bash
cd /home/ubuntu/msp-marketplace
pnpm add @sendgrid/mail
```

### 2.2 Add API Key to Environment

Add to your environment secrets via Management UI → Settings → Secrets:

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@mspmarketplace.com
SENDGRID_FROM_NAME=MSP M&A Marketplace
```

### 2.3 Create Email Service Helper

Create `server/lib/emailService.ts`:

```typescript
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('[Email] SENDGRID_API_KEY not set - emails will not be sent');
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@mspmarketplace.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'MSP M&A Marketplace';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[Email] Skipping email send - SENDGRID_API_KEY not configured');
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>'),
    });

    console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

/**
 * Email template helpers
 */
export const EmailTemplates = {
  /**
   * Deal update notification
   */
  dealUpdate: (params: {
    recipientName: string;
    dealTitle: string;
    updateMessage: string;
    dealUrl: string;
  }) => ({
    subject: `Update on ${params.dealTitle}`,
    text: `Hi ${params.recipientName},\n\n${params.updateMessage}\n\nView deal: ${params.dealUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <p>Hi ${params.recipientName},</p>
      <p>${params.updateMessage}</p>
      <p><a href="${params.dealUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Deal</a></p>
      <p>Best regards,<br>MSP M&A Marketplace</p>
    `,
  }),

  /**
   * Proposal received notification
   */
  proposalReceived: (params: {
    recipientName: string;
    requestTitle: string;
    sellerName: string;
    proposalUrl: string;
  }) => ({
    subject: `New proposal for "${params.requestTitle}"`,
    text: `Hi ${params.recipientName},\n\n${params.sellerName} has submitted a proposal for your buyer request "${params.requestTitle}".\n\nReview proposal: ${params.proposalUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <p>Hi ${params.recipientName},</p>
      <p><strong>${params.sellerName}</strong> has submitted a proposal for your buyer request "<strong>${params.requestTitle}</strong>".</p>
      <p><a href="${params.proposalUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Proposal</a></p>
      <p>Best regards,<br>MSP M&A Marketplace</p>
    `,
  }),

  /**
   * NDA signature request
   */
  ndaRequest: (params: {
    recipientName: string;
    listingTitle: string;
    ndaUrl: string;
  }) => ({
    subject: `NDA required to view "${params.listingTitle}"`,
    text: `Hi ${params.recipientName},\n\nTo access confidential details for "${params.listingTitle}", please sign the Non-Disclosure Agreement.\n\nSign NDA: ${params.ndaUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <p>Hi ${params.recipientName},</p>
      <p>To access confidential details for "<strong>${params.listingTitle}</strong>", please sign the Non-Disclosure Agreement.</p>
      <p><a href="${params.ndaUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign NDA</a></p>
      <p>Best regards,<br>MSP M&A Marketplace</p>
    `,
  }),

  /**
   * New message notification
   */
  newMessage: (params: {
    recipientName: string;
    senderName: string;
    dealTitle: string;
    messagePreview: string;
    dealUrl: string;
  }) => ({
    subject: `New message from ${params.senderName}`,
    text: `Hi ${params.recipientName},\n\n${params.senderName} sent you a message about "${params.dealTitle}":\n\n"${params.messagePreview}"\n\nView conversation: ${params.dealUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <p>Hi ${params.recipientName},</p>
      <p><strong>${params.senderName}</strong> sent you a message about "<strong>${params.dealTitle}</strong>":</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 15px; color: #666;">${params.messagePreview}</blockquote>
      <p><a href="${params.dealUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Conversation</a></p>
      <p>Best regards,<br>MSP M&A Marketplace</p>
    `,
  }),

  /**
   * Listing published confirmation
   */
  listingPublished: (params: {
    recipientName: string;
    listingTitle: string;
    listingUrl: string;
  }) => ({
    subject: `Your listing "${params.listingTitle}" is now live!`,
    text: `Hi ${params.recipientName},\n\nGreat news! Your listing "${params.listingTitle}" has been published and is now visible to buyers.\n\nView listing: ${params.listingUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <p>Hi ${params.recipientName},</p>
      <p>Great news! Your listing "<strong>${params.listingTitle}</strong>" has been published and is now visible to buyers.</p>
      <p><a href="${params.listingUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Listing</a></p>
      <p>Best regards,<br>MSP M&A Marketplace</p>
    `,
  }),
};
```

---

## Step 3: Integrate Email Notifications (2-3 hours)

### 3.1 Update Proposal Submission to Send Email

Edit `server/routers/buyerRequestProposalRouter.ts`:

```typescript
import { sendEmail, EmailTemplates } from '../lib/emailService';

// In submitProposal mutation, after creating proposal:
const buyerRequest = await db.getBuyerRequestById(input.requestId);
const buyer = await db.getUserById(buyerRequest.buyerId);
const seller = await db.getUserById(ctx.user.id);

if (buyer?.email) {
  const proposalUrl = `${process.env.VITE_FRONTEND_URL || 'https://mspmarketplace.com'}/my-proposals`;
  
  await sendEmail({
    to: buyer.email,
    ...EmailTemplates.proposalReceived({
      recipientName: buyer.name || 'there',
      requestTitle: buyerRequest.title,
      sellerName: seller.name || 'A seller',
      proposalUrl,
    }),
  });
}
```

### 3.2 Update Deal Messaging to Send Email

Edit `server/routers/dealRouters.ts`:

```typescript
import { sendEmail, EmailTemplates } from '../lib/emailService';

// In sendMessage mutation, after creating message:
const deal = await db.getDealById(input.dealId);
const listing = await db.getListingById(deal.listingId);
const recipient = deal.buyerId === ctx.user.id 
  ? await db.getUserById(deal.sellerId)
  : await db.getUserById(deal.buyerId);

if (recipient?.email) {
  const dealUrl = `${process.env.VITE_FRONTEND_URL || 'https://mspmarketplace.com'}/deal/${deal.id}`;
  
  await sendEmail({
    to: recipient.email,
    ...EmailTemplates.newMessage({
      recipientName: recipient.name || 'there',
      senderName: ctx.user.name || 'Someone',
      dealTitle: listing.businessName,
      messagePreview: input.content.substring(0, 100) + (input.content.length > 100 ? '...' : ''),
      dealUrl,
    }),
  });
}
```

### 3.3 Update NDA Access Request to Send Email

Edit `server/routers.ts` (or wherever access requests are handled):

```typescript
import { sendEmail, EmailTemplates } from './lib/emailService';

// When buyer requests NDA access:
const seller = await db.getUserById(listing.sellerId);
const buyer = ctx.user;

if (seller?.email) {
  const ndaUrl = `${process.env.VITE_FRONTEND_URL}/access-requests`;
  
  await sendEmail({
    to: seller.email,
    ...EmailTemplates.ndaRequest({
      recipientName: seller.name || 'there',
      listingTitle: listing.businessName,
      ndaUrl,
    }),
  });
}
```

### 3.4 Update Listing Publication to Send Email

Edit `server/stripe/webhook.ts`:

```typescript
import { sendEmail, EmailTemplates } from '../lib/emailService';

// After updating listing to published:
const seller = await db.getUserById(listing.sellerId);

if (seller?.email) {
  const listingUrl = `${process.env.VITE_FRONTEND_URL}/listing/${listing.id}`;
  
  await sendEmail({
    to: seller.email,
    ...EmailTemplates.listingPublished({
      recipientName: seller.name || 'there',
      listingTitle: listing.businessName,
      listingUrl,
    }),
  });
}
```

---

## Step 4: Testing (1 hour)

### 4.1 Local Testing

1. Add your SendGrid API key to environment
2. Use your own email as recipient for testing
3. Trigger each email type:
   - Submit a proposal → Check for proposal email
   - Send a message in deal → Check for message email
   - Request NDA access → Check for NDA email
   - Complete payment → Check for listing published email

### 4.2 Check SendGrid Dashboard

1. Go to SendGrid dashboard → Activity
2. Verify emails were sent successfully
3. Check open rates, click rates (after 24 hours)

### 4.3 Test Failure Scenarios

- What happens if email is invalid?
- What happens if SendGrid is down?
- Ensure app doesn't crash if email fails

**Best Practice:** Email sending should be async and non-blocking. If email fails, log error but don't fail the main operation.

---

## Step 5: Production Deployment (30 minutes)

### 5.1 Add Environment Variables

In Management UI → Settings → Secrets:
```
SENDGRID_API_KEY=SG.your_production_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=MSP M&A Marketplace
VITE_FRONTEND_URL=https://yourdomain.com
```

### 5.2 Verify Domain Authentication

Ensure domain authentication is complete (see Step 1.3 Option B)

### 5.3 Monitor Email Deliverability

- Check SendGrid dashboard daily for first week
- Look for bounces, spam complaints
- Adjust templates if open rates are low (<20%)

---

## Cost Breakdown

### Free Tier (Sufficient for Early Stage)
- **100 emails/day** = 3,000 emails/month
- Covers ~100 active users with moderate activity
- No credit card required

### Paid Plans (When You Scale)
- **Essentials:** $19.95/month = 50,000 emails/month
- **Pro:** $89.95/month = 100,000 emails/month
- **Premier:** Custom pricing for millions of emails

**Recommendation:** Start with free tier, upgrade when you hit 80-100 emails/day consistently.

---

## Email Notification Priority

Based on user impact, implement in this order:

### P0 (Critical - Implement First)
1. **New message in deal** - Users need to know about replies
2. **Proposal received** - Buyers need to review proposals
3. **NDA request** - Sellers need to approve access

### P1 (High - Week 2)
4. **Listing published** - Confirmation for sellers
5. **Deal stage changed** - Keep both parties informed
6. **Payment confirmation** - Receipt for listing fees

### P2 (Medium - Month 1)
7. **Weekly digest** - Summary of activity
8. **Listing expiring soon** - Remind sellers to renew
9. **Inactive deal reminder** - Nudge stalled negotiations

---

## Alternative: Use Built-in Notification API

Your template already has a built-in notification system (`server/_core/notification.ts`). You could:

**Option A:** Use SendGrid for all emails (recommended for professional appearance)

**Option B:** Use built-in notifications for in-app alerts, SendGrid for critical emails only

**Option C:** Start with built-in, migrate to SendGrid later

**Recommendation:** Go with **Option A** (SendGrid for all) because:
- Professional email appearance
- Higher deliverability
- Email analytics
- Users check email more than in-app notifications

---

## Common Issues & Solutions

### Issue 1: Emails Going to Spam
**Solution:**
- Complete domain authentication (DKIM, SPF)
- Avoid spam trigger words ("free", "urgent", "act now")
- Include unsubscribe link (required by law)
- Maintain low bounce rate (<5%)

### Issue 2: Emails Not Sending
**Solution:**
- Check API key is correct
- Verify sender email is authenticated
- Check SendGrid dashboard for errors
- Ensure recipient email is valid

### Issue 3: Slow Email Delivery
**Solution:**
- SendGrid typically delivers in <1 second
- If slow, check SendGrid status page
- Consider async/background job processing

---

## Summary

**Total Integration Effort:** 4-6 hours

| Task | Time |
|------|------|
| SendGrid account setup | 30 min |
| Install SDK + environment setup | 15 min |
| Create email service helper | 30 min |
| Integrate into 5-6 key flows | 2-3 hours |
| Testing | 1 hour |
| Production deployment | 30 min |

**Cost:** Free (up to 100 emails/day)

**Complexity:** Low - SendGrid API is straightforward

**Impact:** High - Email notifications are critical for user engagement

**Recommendation:** Implement SendGrid integration as your first P0 item before launch. It's quick, cheap, and dramatically improves user experience.
