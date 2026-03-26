# Stripe Identity Setup Guide

This document provides step-by-step instructions for configuring Stripe Identity verification for the MSP M&A Marketplace.

## Overview

The marketplace offers two KYC verification options:
1. **FREE Manual KYC**: Upload documents, admin reviews within 24-48 hours
2. **$5 Stripe Identity**: Instant automated verification via Stripe Identity API

This guide covers setting up the $5 Stripe Identity option.

## Prerequisites

- Active Stripe account
- Stripe API keys already configured in the application
- Access to Stripe Dashboard

## Step 1: Enable Stripe Identity

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings** → **Identity**
3. Click **Enable Identity** if not already enabled
4. Review and accept Stripe Identity terms

## Step 2: Configure Webhook Events

The application uses webhooks to automatically verify users when Stripe Identity checks complete.

### Add Webhook Endpoint

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **+ Add endpoint**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/stripe/webhook
   ```
   Replace `your-domain.com` with your actual domain (e.g., `msp.investments`)

4. Select the following events to listen for:
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `identity.verification_session.canceled`
   - `checkout.session.completed` (already configured for payments)
   - `checkout.session.expired` (already configured for payments)

5. Click **Add endpoint**

### Update Webhook Secret

1. After creating the webhook, click on it to view details
2. Click **Reveal** next to **Signing secret**
3. Copy the webhook signing secret (starts with `whsec_`)
4. Update your environment variable `STRIPE_WEBHOOK_SECRET` with this value
   - Go to Management UI → Settings → Secrets
   - Update `STRIPE_WEBHOOK_SECRET` with the new value

## Step 3: Test the Integration

### Test Mode (Recommended First)

1. Ensure you're using Stripe **test mode** API keys
2. Test the complete flow:
   - Sign up as a new user
   - Go to `/verify-stripe`
   - Use test card: `4242 4242 4242 4242`
   - Complete the Stripe Identity verification flow
   - Verify user is marked as verified in database
   - Check that verification email was sent

### Production Mode

1. Switch to **live mode** in Stripe Dashboard
2. Update API keys in environment:
   - `STRIPE_SECRET_KEY` → Live secret key (starts with `sk_live_`)
   - `VITE_STRIPE_PUBLISHABLE_KEY` → Live publishable key (starts with `pk_live_`)
3. Verify webhook is configured for production URL
4. Test with real payment method

## Step 4: Monitor Verifications

### Stripe Dashboard

- Go to **Identity** → **Verifications** to view all verification sessions
- Monitor success rates and failure reasons
- Review flagged verifications

### Application Database

Check verification status in the `users` table:
```sql
SELECT 
  id, 
  email, 
  stripeIdentityVerified, 
  stripeIdentityVerifiedAt,
  stripeIdentityAmountPaid
FROM users
WHERE stripeIdentityVerified = true;
```

### Email Notifications

Users receive automatic emails:
- ✅ **Success**: "✓ Instant verification complete!"
- ❌ **Failure**: "Verification needs attention" with retry options

## Pricing

- **Stripe Identity Cost**: $3.00 per verification
- **Platform Fee**: $2.00 per verification
- **User Pays**: $5.00 total

The $2 platform fee covers:
- Payment processing fees (~$0.45)
- Email notifications
- Database storage
- Customer support

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct and accessible
2. Verify webhook signing secret matches environment variable
3. Test webhook endpoint:
   ```bash
   curl -X POST https://your-domain.com/api/stripe/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"identity.verification_session.verified"}'
   ```
4. Check server logs for webhook processing errors

### User Not Marked as Verified

1. Check webhook events in Stripe Dashboard → **Developers** → **Webhooks** → **Logs**
2. Verify `identity.verification_session.verified` event was sent
3. Check application logs for webhook processing
4. Verify database `users` table has correct columns:
   - `stripeIdentityVerified` (boolean)
   - `stripeIdentityVerifiedAt` (timestamp)
   - `stripeIdentitySessionId` (varchar)

### Payment Succeeds But Verification Fails

1. Check Stripe Identity session status in Dashboard
2. Review verification failure reason
3. User can retry verification or use FREE manual KYC instead

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
2. **Payment Confirmation**: Verify payment succeeded before creating Identity session
3. **User Association**: Ensure `userId` metadata is correctly attached to sessions
4. **Test Mode**: Use test mode for development, never use test keys in production

## Support

For issues with:
- **Stripe Identity**: Contact [Stripe Support](https://support.stripe.com)
- **Application Integration**: Check application logs and database
- **User Issues**: Direct users to FREE manual KYC as alternative

## Additional Resources

- [Stripe Identity Documentation](https://stripe.com/docs/identity)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Identity Pricing](https://stripe.com/pricing/identity)
