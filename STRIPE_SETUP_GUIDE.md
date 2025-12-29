# Stripe Integration Setup Guide

**MSP M&A Marketplace - Complete Configuration Instructions**

---

## Overview

Your MSP M&A Marketplace has a fully functional Stripe integration for processing listing fee payments and professional directory subscriptions. This guide provides step-by-step instructions for configuring your Stripe API keys through the Management UI's **Settings → Secrets** panel.

**What's Already Built:**
- ✅ Stripe checkout flow for listing fees (Standard/Featured/Premium tiers)
- ✅ Stripe webhook handler for automatic payment processing
- ✅ Professional directory subscription management
- ✅ Payment receipt generation and email notifications
- ✅ Refund workflow for admins
- ✅ Payment retry logic for failed transactions

**What You Need to Configure:**
- 🔑 Stripe API keys (Secret Key and Publishable Key)
- 🔑 Stripe Webhook Secret for secure webhook verification
- 📧 Webhook endpoint URL registration in Stripe Dashboard

---

## Prerequisites

Before you begin, ensure you have:

1. **Stripe Account**: Sign up at [https://stripe.com](https://stripe.com) if you don't have an account
2. **Admin Access**: You must be logged in as an admin user on your MSP marketplace
3. **Domain**: Your marketplace must be deployed and accessible via a public URL

---

## Part 1: Obtain Stripe API Keys

### Step 1: Access Stripe Dashboard

1. Log in to your Stripe account at [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. You'll see a toggle in the top-right corner that says **"Test mode"** or **"Live mode"**

### Step 2: Decide on Test vs. Production Mode

**For Initial Setup (Recommended):**
- Use **Test Mode** to safely test payments without processing real money
- Test mode uses special test card numbers (e.g., `4242 4242 4242 4242`)
- All transactions are simulated

**For Production Launch:**
- Switch to **Live Mode** once testing is complete
- Live mode processes real payments and charges real credit cards
- Requires completed Stripe account verification

### Step 3: Retrieve Your API Keys

#### For Test Mode:
1. Ensure **"Test mode"** toggle is ON (top-right corner)
2. Navigate to **Developers → API keys** in the left sidebar
3. You'll see two keys:
   - **Publishable key**: Starts with `pk_test_...` (safe to expose in frontend)
   - **Secret key**: Starts with `sk_test_...` (⚠️ NEVER expose publicly)

#### For Live Mode:
1. Toggle to **"Live mode"** (top-right corner)
2. Navigate to **Developers → API keys**
3. You'll see:
   - **Publishable key**: Starts with `pk_live_...`
   - **Secret key**: Starts with `sk_live_...`

**Security Note:** The Secret Key has full access to your Stripe account. Never commit it to version control or share it publicly.

---

## Part 2: Configure API Keys in Management UI

### Step 4: Access Settings → Secrets Panel

1. Log in to your MSP marketplace as an **admin user**
2. Click the **"Management UI"** icon in the top-right corner (or navigate to the admin dashboard)
3. In the Management UI panel, click **"Settings"** in the left sidebar
4. Select the **"Secrets"** sub-panel

### Step 5: Add Stripe Secret Key

1. In the Secrets panel, look for the **"STRIPE_SECRET_KEY"** field
2. If it doesn't exist, click **"Add New Secret"**
3. Enter the following:
   - **Key Name**: `STRIPE_SECRET_KEY`
   - **Value**: Paste your Secret Key (starts with `sk_test_...` or `sk_live_...`)
4. Click **"Save"**

### Step 6: Add Stripe Publishable Key

1. Click **"Add New Secret"** again
2. Enter:
   - **Key Name**: `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Value**: Paste your Publishable Key (starts with `pk_test_...` or `pk_live_...`)
3. Click **"Save"**

**Note:** The `VITE_` prefix indicates this key is safe to expose in the frontend code.

---

## Part 3: Configure Webhook Endpoint

Webhooks allow Stripe to notify your application when events occur (e.g., payment succeeded, subscription canceled). This is **critical** for automatic payment processing.

### Step 7: Register Webhook Endpoint in Stripe

1. In Stripe Dashboard, navigate to **Developers → Webhooks**
2. Click **"Add endpoint"** button
3. Enter your webhook URL:
   ```
   https://your-domain.manus.space/api/stripe/webhook
   ```
   Replace `your-domain.manus.space` with your actual deployed domain

4. Under **"Select events to listen to"**, choose:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. Click **"Add endpoint"**

### Step 8: Retrieve Webhook Signing Secret

1. After creating the endpoint, click on it to view details
2. In the **"Signing secret"** section, click **"Reveal"**
3. Copy the webhook signing secret (starts with `whsec_...`)

### Step 9: Add Webhook Secret to Management UI

1. Return to your marketplace's **Settings → Secrets** panel
2. Click **"Add New Secret"**
3. Enter:
   - **Key Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Paste your webhook signing secret (starts with `whsec_...`)
4. Click **"Save"**

**Why This Matters:** The webhook secret verifies that webhook requests actually come from Stripe, preventing attackers from sending fake payment confirmations.

---

## Part 4: Restart Application

### Step 10: Apply Configuration Changes

After adding all three secrets, you need to restart your application for the changes to take effect:

1. In the Management UI, navigate to the **"Dashboard"** panel
2. Click the **"Restart Server"** button
3. Wait 10-15 seconds for the application to restart
4. Refresh your browser

---

## Part 5: Test the Integration

### Step 11: Test Listing Fee Payment

1. Log in as a regular user (not admin)
2. Navigate to **"Create Listing"** page
3. Fill out the listing form
4. Select a tier (Standard/Featured/Premium)
5. Click **"Create Listing"**
6. You'll be redirected to Stripe Checkout
7. Use a test card number:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
8. Click **"Pay"**
9. You should be redirected to a success page
10. Your listing should now be published and visible in the marketplace

### Step 12: Verify Webhook Processing

1. Go to Stripe Dashboard → **Developers → Webhooks**
2. Click on your webhook endpoint
3. Scroll to **"Events"** section
4. You should see a `checkout.session.completed` event with a ✅ green checkmark
5. If you see a ❌ red X, click on the event to view error details

### Step 13: Test Professional Subscription (Optional)

1. Navigate to **"Professional Directory"** page
2. Click **"Join as Professional"**
3. Fill out the professional profile form
4. Select **"Professional"** or **"Premium"** tier
5. Complete Stripe checkout with test card
6. Verify your professional profile is now active

---

## Configuration Summary

After completing all steps, you should have the following environment variables configured:

| Environment Variable | Description | Example Value |
|---------------------|-------------|---------------|
| `STRIPE_SECRET_KEY` | Server-side API key for Stripe operations | `sk_test_...` or `sk_live_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client-side key for Stripe.js | `pk_test_...` or `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification secret | `whsec_...` |

---

## Switching from Test to Production

When you're ready to accept real payments:

1. **Complete Stripe Account Verification**:
   - Stripe Dashboard → **Settings → Account details**
   - Provide business information, bank account, and identity verification

2. **Obtain Live API Keys**:
   - Toggle to **"Live mode"** in Stripe Dashboard
   - Navigate to **Developers → API keys**
   - Copy your live keys (starting with `pk_live_...` and `sk_live_...`)

3. **Create Live Webhook Endpoint**:
   - Navigate to **Developers → Webhooks** (in Live mode)
   - Add endpoint with same URL: `https://your-domain.manus.space/api/stripe/webhook`
   - Select same events as test mode
   - Copy the new webhook signing secret

4. **Update Secrets in Management UI**:
   - Replace `STRIPE_SECRET_KEY` with live secret key
   - Replace `VITE_STRIPE_PUBLISHABLE_KEY` with live publishable key
   - Replace `STRIPE_WEBHOOK_SECRET` with live webhook secret

5. **Restart Application**:
   - Click **"Restart Server"** in Management UI Dashboard

6. **Test with Real Card**:
   - Create a test listing with a real credit card
   - Verify payment processes correctly
   - Check that listing is published automatically

---

## Troubleshooting

### Issue: "Stripe is not configured" Error

**Cause:** API keys are missing or incorrect.

**Solution:**
1. Verify all three secrets are set in **Settings → Secrets**
2. Ensure keys don't have extra spaces or line breaks
3. Restart the application after adding keys

### Issue: Payment Succeeds but Listing Not Published

**Cause:** Webhook not configured or failing.

**Solution:**
1. Check Stripe Dashboard → **Developers → Webhooks**
2. Look for failed webhook events (red X)
3. Click on failed event to see error message
4. Common issues:
   - Wrong webhook URL (should end with `/api/stripe/webhook`)
   - Missing `STRIPE_WEBHOOK_SECRET` in Management UI
   - Webhook secret doesn't match Stripe Dashboard

### Issue: "Invalid API Key" Error

**Cause:** Using test key in live mode or vice versa.

**Solution:**
1. Verify you're using matching keys (both test or both live)
2. Check Stripe Dashboard mode toggle (Test vs. Live)
3. Ensure `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` are from the same mode

### Issue: Webhook Events Not Appearing

**Cause:** Webhook endpoint not registered or URL incorrect.

**Solution:**
1. Verify webhook endpoint exists in Stripe Dashboard
2. Check webhook URL matches your deployed domain
3. Ensure your application is publicly accessible (not localhost)
4. Test webhook endpoint manually:
   ```bash
   curl -X POST https://your-domain.manus.space/api/stripe/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"test"}'
   ```

---

## Security Best Practices

1. **Never Commit API Keys to Git**:
   - All keys are stored in Management UI Secrets panel
   - Keys are injected as environment variables at runtime
   - Never hardcode keys in source code

2. **Use Test Mode for Development**:
   - Always test with test keys before going live
   - Test mode prevents accidental real charges

3. **Rotate Keys Regularly**:
   - Stripe allows you to roll API keys without downtime
   - Rotate keys if you suspect they've been compromised

4. **Monitor Webhook Events**:
   - Regularly check Stripe Dashboard for failed webhooks
   - Set up email alerts for webhook failures

5. **Enable Stripe Radar** (Live Mode):
   - Stripe's built-in fraud detection
   - Automatically blocks suspicious payments
   - Available in Stripe Dashboard → **Radar**

---

## Additional Resources

- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe API Reference**: [https://stripe.com/docs/api](https://stripe.com/docs/api)
- **Stripe Test Cards**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhook Best Practices**: [https://stripe.com/docs/webhooks/best-practices](https://stripe.com/docs/webhooks/best-practices)

---

## Support

If you encounter issues not covered in this guide:

1. Check the application logs in Management UI → **Dashboard** panel
2. Review Stripe Dashboard → **Developers → Logs** for API errors
3. Contact support at support@msp.investments with:
   - Error message or screenshot
   - Steps to reproduce the issue
   - Whether you're using test or live mode

---

**Document Version**: 1.0  
**Last Updated**: December 28, 2024  
**Author**: Manus AI
