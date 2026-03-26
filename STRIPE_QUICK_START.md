# Stripe Quick Start Guide

**Get your MSP marketplace accepting payments in 5 minutes**

---

## Step 1: Get Stripe API Keys (2 minutes)

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Toggle **"Test mode"** ON (top-right corner)
3. Click **Developers → API keys** in sidebar
4. Copy these two keys:
   - **Secret key** (starts with `sk_test_...`)
   - **Publishable key** (starts with `pk_test_...`)

---

## Step 2: Add Keys to Your Marketplace (1 minute)

1. Log in to your marketplace as **admin**
2. Open **Management UI** (top-right icon)
3. Go to **Settings → Secrets**
4. Add three secrets:

| Key Name | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | Your secret key (`sk_test_...`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Leave blank for now |

5. Click **"Restart Server"** in Dashboard panel

---

## Step 3: Set Up Webhook (2 minutes)

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **"Add endpoint"**
3. Enter webhook URL:
   ```
   https://your-app.example.com/api/stripe/webhook
   ```
   (Replace `your-domain` with your actual domain)

4. Select these events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. Click **"Add endpoint"**
6. Click **"Reveal"** under **Signing secret**
7. Copy the webhook secret (starts with `whsec_...`)
8. Go back to your marketplace **Settings → Secrets**
9. Update `STRIPE_WEBHOOK_SECRET` with the webhook secret
10. **Restart Server** again

---

## Step 4: Test Payment (1 minute)

1. Log in as a regular user (not admin)
2. Go to **Create Listing**
3. Fill out form and select **Featured** tier
4. At Stripe checkout, use test card:
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: `12/25`
   - **CVC**: `123`
   - **ZIP**: `12345`
5. Click **"Pay"**
6. You should see success page and listing published!

---

## ✅ You're Done!

Your marketplace is now accepting payments. 

**Next Steps:**
- Review full setup guide: `STRIPE_SETUP_GUIDE.md`
- Run complete tests: `STRIPE_TESTING_CHECKLIST.md`
- When ready for real payments, switch to **Live mode** and repeat steps 1-3 with live keys

---

## 🆘 Quick Troubleshooting

**"Stripe is not configured"**
→ Check all three secrets are set and restart server

**Payment succeeds but listing not published**
→ Check webhook secret is correct and matches Stripe Dashboard

**"Invalid API key"**
→ Make sure both keys are from same mode (both test or both live)

---

## 📚 Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0000 0000 9995` | ⏱️ Insufficient funds |

More test cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

**Need help?** Read the full guide in `STRIPE_SETUP_GUIDE.md`
