# Stripe Identity Production Configuration Guide

## Overview

This guide walks you through enabling Stripe Identity for **instant $5 KYC verification** in production. The system is already built and tested - you just need to configure Stripe and switch from test mode to live mode.

---

## Prerequisites

- Stripe account with Identity enabled
- Access to Stripe Dashboard
- Admin access to MSP.investments platform
- SendGrid configured for email notifications (optional but recommended)

---

## Part 1: Enable Stripe Identity

### 1.1 Access Stripe Identity Settings

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Identity** in the left sidebar
3. Click **"Enable Identity"** if not already enabled

### 1.2 Configure Identity Settings

1. Go to **Identity** → **Settings**
2. Configure verification requirements:
   - ✅ **Document verification**: Enabled (required)
   - ✅ **Selfie verification**: Enabled (recommended for fraud prevention)
   - ✅ **Address verification**: Optional (your choice)
3. Set allowed document types:
   - ✅ Passport
   - ✅ Driver's license
   - ✅ National ID card
4. Save settings

### 1.3 Review Pricing

Stripe Identity charges **$3.00 per successful verification**. Your platform charges users **$5.00**, giving you a **$2.00 profit per verification**.

- User pays: **$5.00**
- Stripe charges: **$3.00**
- Platform profit: **$2.00**

---

## Part 2: Configure Webhooks

### 2.1 Get Your Webhook Endpoint URL

Your webhook endpoint is:

```
https://msp.investments/api/stripe/webhook
```

**Note**: This is the same endpoint used for payment webhooks. It handles both payment events AND identity verification events.

### 2.2 Add Webhook in Stripe Dashboard

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://msp.investments/api/stripe/webhook`
4. Click **"Select events"**
5. Add these Identity events:
   - ✅ `identity.verification_session.verified` - User successfully verified
   - ✅ `identity.verification_session.requires_input` - Additional info needed
   - ✅ `identity.verification_session.canceled` - User canceled verification
6. Also ensure these payment events are enabled (should already be configured):
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
7. Click **"Add endpoint"**

### 2.3 Get Webhook Signing Secret

1. After creating the webhook, click on it to view details
2. Click **"Reveal"** next to **Signing secret**
3. Copy the secret (starts with `whsec_...`)
4. Save it securely - you'll need it in the next step

---

## Part 3: Configure Environment Variables

### 3.1 Access Management UI

1. Go to your MSP.investments Management UI
2. Navigate to **Settings** → **Secrets**

### 3.2 Verify/Update Stripe Keys

Ensure these environment variables are set:

#### For Test Mode (Current):
```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Step 2.3)
```

#### For Live Mode (Production):
```
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Step 2.3)
```

**Important**: When switching to live mode, you'll need to:
1. Create a NEW webhook endpoint in live mode (repeat Part 2)
2. Get the NEW webhook signing secret for live mode
3. Update all three environment variables

---

## Part 4: Switch from Test Mode to Live Mode

### 4.1 Test Mode Verification (Do This First!)

Before going live, test the complete flow in test mode:

1. Create a test user account
2. Go to `/verify-stripe` page
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete payment ($5.00)
5. You'll be redirected to Stripe Identity
6. Use Stripe's test documents:
   - Test passport: Upload any image
   - Test selfie: Use webcam or upload image
7. Verify webhook receives `identity.verification_session.verified` event
8. Check that user's `stripeIdentityVerified` field is set to `true`
9. Verify email notification is sent

### 4.2 Switch to Live Mode

Once testing is complete:

1. **Create Live Mode Webhook**:
   - In Stripe Dashboard, toggle to **Live mode** (top right)
   - Go to **Developers** → **Webhooks**
   - Click **"Add endpoint"**
   - Enter URL: `https://msp.investments/api/stripe/webhook`
   - Select the same events as test mode (see Part 2.2)
   - Save and copy the NEW webhook signing secret

2. **Update Environment Variables**:
   - Go to Management UI → Settings → Secrets
   - Update `STRIPE_SECRET_KEY` to your live secret key (`sk_live_...`)
   - Update `VITE_STRIPE_PUBLISHABLE_KEY` to your live publishable key (`pk_live_...`)
   - Update `STRIPE_WEBHOOK_SECRET` to the NEW live webhook secret

3. **Restart Server**:
   - The server should automatically restart when environment variables change
   - If not, manually restart via Management UI

4. **Verify Live Mode**:
   - Check that Stripe Elements loads correctly on `/verify-stripe`
   - Verify the publishable key starts with `pk_live_`
   - Test with a real card (you can refund it immediately)

---

## Part 5: Webhook Event Handling

### 5.1 Events Your System Handles

The webhook endpoint (`/api/stripe/webhook`) processes these events:

#### Identity Verification Events:
- **`identity.verification_session.verified`**:
  - Sets `stripeIdentityVerified = true`
  - Sets `verificationStatus = 'verified'`
  - Records `stripeIdentityVerifiedAt` timestamp
  - Sends success email to user
  - Sends notification to platform owner

- **`identity.verification_session.requires_input`**:
  - Logs warning for manual review
  - Sends email to user requesting additional info

- **`identity.verification_session.canceled`**:
  - Logs cancellation
  - Sends email to user explaining cancellation

#### Payment Events (Already Configured):
- `checkout.session.completed` - Publishes listing after payment
- `checkout.session.expired` - Notifies user of expired session
- `payment_intent.succeeded` - Confirms payment success
- `payment_intent.payment_failed` - Notifies user of payment failure

### 5.2 Webhook Security

Your webhook endpoint includes:
- ✅ Signature verification using `STRIPE_WEBHOOK_SECRET`
- ✅ Idempotency handling (duplicate events ignored)
- ✅ Error logging and monitoring
- ✅ Rate limiting (30 requests per minute)

---

## Part 6: Testing Checklist

### 6.1 Test Mode Checklist

- [ ] Stripe Identity enabled in dashboard
- [ ] Test mode webhook endpoint created
- [ ] All required events selected
- [ ] Webhook signing secret configured
- [ ] Test payment completes successfully ($5.00)
- [ ] Stripe Identity session opens after payment
- [ ] Test document upload works
- [ ] Webhook receives `verified` event
- [ ] User's `stripeIdentityVerified` field updates to `true`
- [ ] Success email sent to user
- [ ] Verification badge appears on profile

### 6.2 Live Mode Checklist

- [ ] Live mode webhook endpoint created
- [ ] Live webhook signing secret configured
- [ ] Live Stripe keys configured in environment
- [ ] Server restarted with new keys
- [ ] Real payment test completed
- [ ] Real identity verification completed
- [ ] Webhook events received in live mode
- [ ] Email notifications working
- [ ] Refund test payment after verification

---

## Part 7: Monitoring & Troubleshooting

### 7.1 Monitor Webhook Events

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click on your webhook endpoint
3. View **"Events"** tab to see all webhook deliveries
4. Check for failed deliveries (red X icons)
5. Click on any event to see request/response details

### 7.2 Common Issues

#### Issue: Webhook Returns 401 Unauthorized
**Cause**: Webhook signing secret is incorrect or missing
**Solution**: 
1. Get the correct signing secret from Stripe Dashboard
2. Update `STRIPE_WEBHOOK_SECRET` in Management UI → Settings → Secrets
3. Restart server

#### Issue: User Not Marked as Verified
**Cause**: Webhook event not received or processed
**Solution**:
1. Check Stripe Dashboard → Webhooks → Events tab
2. Look for `identity.verification_session.verified` event
3. Check if event was delivered successfully (green checkmark)
4. If failed, check error message in Stripe Dashboard
5. Verify webhook endpoint is accessible: `curl https://msp.investments/api/stripe/webhook`

#### Issue: Email Not Sent After Verification
**Cause**: SendGrid not configured or email service error
**Solution**:
1. Check SendGrid configuration in Admin Dashboard → API Keys
2. Verify `SENDGRID_API_KEY` is set in environment
3. Check server logs for email errors
4. Test email sending with `/test-email` endpoint

#### Issue: Payment Succeeds But Identity Session Not Created
**Cause**: Error in `createVerificationSession` procedure
**Solution**:
1. Check server logs for error messages
2. Verify Stripe Identity is enabled in dashboard
3. Ensure `STRIPE_SECRET_KEY` has Identity permissions
4. Check that payment metadata includes correct user info

---

## Part 8: User Flow Diagram

```
User Journey: $5 Stripe Identity Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. User clicks "Get verified instantly ($5)"
   ↓
2. Redirected to /verify-stripe page
   ↓
3. User enters payment info (Stripe Elements)
   ↓
4. Payment processed ($5.00)
   ↓
5. createVerificationPayment mutation creates PaymentIntent
   ↓
6. Payment succeeds → createVerificationSession called
   ↓
7. Stripe Identity session created
   ↓
8. User redirected to Stripe Identity page
   ↓
9. User uploads ID document + takes selfie
   ↓
10. Stripe processes verification (AI + human review)
    ↓
11. Webhook event: identity.verification_session.verified
    ↓
12. Backend updates user: stripeIdentityVerified = true
    ↓
13. Email sent: "You're verified! ✅"
    ↓
14. User can now create listings and access features
```

---

## Part 9: Cost Analysis

### Per-Verification Costs

| Item | Cost |
|------|------|
| User pays | $5.00 |
| Stripe Identity fee | -$3.00 |
| Payment processing (2.9% + $0.30) | -$0.45 |
| **Net profit per verification** | **$1.55** |

### Monthly Revenue Projections

| Verifications/Month | Gross Revenue | Stripe Fees | Net Profit |
|---------------------|---------------|-------------|------------|
| 10 | $50 | $34.50 | $15.50 |
| 50 | $250 | $172.50 | $77.50 |
| 100 | $500 | $345.00 | $155.00 |
| 500 | $2,500 | $1,725.00 | $775.00 |

**Note**: Most users will choose FREE manual verification. Stripe Identity is for users who need instant verification (e.g., urgent listing, time-sensitive deal).

---

## Part 10: Next Steps

### Immediate Actions:
1. ✅ Enable Stripe Identity in dashboard
2. ✅ Create test mode webhook endpoint
3. ✅ Configure webhook signing secret
4. ✅ Test complete flow in test mode
5. ✅ Switch to live mode when ready

### Optional Enhancements:
- Add verification expiry (e.g., re-verify every 12 months)
- Add verification badge tiers (basic, enhanced, premium)
- Add bulk verification discounts for agencies
- Add verification analytics dashboard

---

## Support

If you encounter issues:

1. **Check Webhook Logs**: Stripe Dashboard → Developers → Webhooks → Events
2. **Check Server Logs**: Management UI → Dashboard → Server Logs
3. **Test Email Delivery**: Use `/test-email` endpoint
4. **Review Documentation**: `STRIPE_IDENTITY_SETUP.md` for detailed API info

---

## Summary

Your Stripe Identity integration is **fully built and tested**. To enable in production:

1. Enable Stripe Identity in dashboard
2. Create webhook endpoint with required events
3. Configure webhook signing secret
4. Test in test mode
5. Switch to live mode

**Estimated setup time**: 15-20 minutes

Once configured, users can get instantly verified for $5, and you'll earn $1.55 profit per verification while providing a premium service for time-sensitive buyers and sellers.
