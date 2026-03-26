# Stripe Integration Testing Checklist

**Quick verification steps after configuring Stripe API keys**

---

## ✅ Pre-Flight Checks

Before testing payments, verify these configurations are in place:

### 1. Environment Variables Set
- [ ] `STRIPE_SECRET_KEY` added to Settings → Secrets
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` added to Settings → Secrets
- [ ] `STRIPE_WEBHOOK_SECRET` added to Settings → Secrets
- [ ] Application restarted after adding secrets

### 2. Webhook Endpoint Registered
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook URL: `https://your-app.example.com/api/stripe/webhook`
- [ ] Events selected: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.*`
- [ ] Webhook signing secret copied to Management UI

### 3. Stripe Account Mode
- [ ] Using **Test Mode** for initial testing (recommended)
- [ ] Test keys start with `sk_test_...` and `pk_test_...`

---

## 🧪 Test Scenarios

### Scenario 1: Standard Listing Payment

**Objective**: Verify basic listing fee payment flow

**Steps**:
1. Log in as a regular user (not admin)
2. Navigate to **Create Listing** page
3. Fill out listing form with test data:
   - Business Name: "Test MSP Company"
   - MRR: $10,000
   - EBITDA: $50,000
   - Location: "New York, USA"
4. Select **Standard** tier (free)
5. Click **"Create Listing"**
6. Verify listing is created immediately (no payment required)

**Expected Result**:
- ✅ Listing created without payment
- ✅ Listing appears in marketplace
- ✅ Status: "Active"

---

### Scenario 2: Featured Listing Payment (Success)

**Objective**: Test successful Stripe checkout for paid tier

**Steps**:
1. Log in as a regular user
2. Navigate to **Create Listing** page
3. Fill out listing form
4. Select **Featured** tier ($99)
5. Click **"Create Listing"**
6. You'll be redirected to Stripe Checkout
7. Enter test card details:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: `12/25` (any future date)
   - **CVC**: `123` (any 3 digits)
   - **ZIP**: `12345` (any 5 digits)
8. Click **"Pay"**
9. Wait for redirect to success page

**Expected Result**:
- ✅ Redirected to `/payment-success` page
- ✅ Success message displayed
- ✅ Listing automatically published
- ✅ Listing appears in marketplace with "Featured" badge
- ✅ Payment status: "Paid"
- ✅ Email receipt sent to user

**Verify in Stripe Dashboard**:
1. Go to Stripe Dashboard → **Payments**
2. Find the $99 payment
3. Status should be "Succeeded"
4. Metadata should include `user_id`, `tier`, `listing_id`

**Verify Webhook**:
1. Go to Stripe Dashboard → **Developers → Webhooks**
2. Click on your webhook endpoint
3. Find `checkout.session.completed` event
4. Status should be ✅ (green checkmark)

---

### Scenario 3: Premium Listing Payment (Success)

**Objective**: Test highest tier payment

**Steps**:
1. Follow same steps as Scenario 2
2. Select **Premium** tier ($199)
3. Complete checkout with test card

**Expected Result**:
- ✅ Payment of $199 processed
- ✅ Listing published with "Premium" badge
- ✅ Featured placement in marketplace
- ✅ Email receipt sent

---

### Scenario 4: Payment Cancellation

**Objective**: Verify user can cancel payment without issues

**Steps**:
1. Start creating a Featured or Premium listing
2. Proceed to Stripe Checkout
3. Click browser **"Back"** button or close tab
4. Return to marketplace

**Expected Result**:
- ✅ Listing saved as draft (not published)
- ✅ Payment status: "Pending"
- ✅ User can resume payment later
- ✅ No errors or broken states

---

### Scenario 5: Payment Failure (Declined Card)

**Objective**: Test handling of declined payments

**Steps**:
1. Start creating a Featured listing
2. Proceed to Stripe Checkout
3. Use **declined test card**: `4000 0000 0000 0002`
4. Enter any future expiry, CVC, and ZIP
5. Click **"Pay"**

**Expected Result**:
- ✅ Payment declined message shown
- ✅ User can try again with different card
- ✅ Listing remains unpublished
- ✅ Payment failure email sent to user

**Verify Webhook**:
1. Check webhook events for `payment_intent.payment_failed`
2. Status should be ✅

---

### Scenario 6: Expired Checkout Session

**Objective**: Test handling of expired sessions

**Steps**:
1. Start creating a Featured listing
2. Proceed to Stripe Checkout
3. Leave the checkout page open for 25+ minutes (Stripe sessions expire after 24 hours, but you can trigger manually)
4. Alternatively, trigger expiration via Stripe Dashboard:
   - Go to **Payments → Checkout Sessions**
   - Find your session
   - Click **"Expire session"**

**Expected Result**:
- ✅ Session expired message shown
- ✅ User redirected to create new session
- ✅ Expiration email sent to user

**Verify Webhook**:
1. Check webhook events for `checkout.session.expired`
2. Status should be ✅

---

### Scenario 7: Professional Subscription (Monthly)

**Objective**: Test recurring subscription payment

**Steps**:
1. Navigate to **Professional Directory** page
2. Click **"Join as Professional"**
3. Fill out professional profile:
   - Name: "John Doe"
   - Title: "M&A Advisor"
   - Company: "Doe Advisory"
   - Bio: "Experienced M&A advisor..."
4. Select **Professional** tier ($99/month)
5. Complete Stripe checkout with test card
6. Wait for redirect

**Expected Result**:
- ✅ Subscription created successfully
- ✅ Professional profile activated
- ✅ Status: "Active"
- ✅ Tier: "Professional"
- ✅ Subscription ID stored in database
- ✅ Confirmation email sent

**Verify in Stripe Dashboard**:
1. Go to **Customers → Subscriptions**
2. Find the new subscription
3. Status: "Active"
4. Billing cycle: Monthly

---

### Scenario 8: Professional Subscription Cancellation

**Objective**: Test subscription cancellation flow

**Steps**:
1. As a professional user with active subscription
2. Navigate to **My Professional Profile**
3. Click **"Cancel Subscription"**
4. Confirm cancellation
5. Wait for processing

**Expected Result**:
- ✅ Subscription canceled in Stripe
- ✅ Professional tier downgraded to "Basic"
- ✅ Profile remains visible but with limited features
- ✅ Cancellation confirmation email sent

**Verify Webhook**:
1. Check webhook events for `customer.subscription.deleted`
2. Status should be ✅

---

### Scenario 9: Payment History View

**Objective**: Verify users can view their payment history

**Steps**:
1. Log in as user who made payments
2. Navigate to **My Account** or **Payment History**
3. View list of past payments

**Expected Result**:
- ✅ All payments listed with dates
- ✅ Payment amounts displayed correctly
- ✅ Payment status shown (Paid/Pending/Failed)
- ✅ Download receipt links available
- ✅ Receipts download as PDF

---

### Scenario 10: Admin Refund Processing

**Objective**: Test admin refund workflow

**Steps**:
1. Log in as **admin user**
2. Navigate to **Admin Dashboard → Refunds**
3. Find a completed payment
4. Click **"Issue Refund"**
5. Enter refund reason: "Customer request"
6. Confirm refund

**Expected Result**:
- ✅ Refund processed in Stripe
- ✅ Payment status updated to "Refunded"
- ✅ Listing unpublished (if applicable)
- ✅ Refund confirmation email sent to customer
- ✅ Refund appears in Stripe Dashboard

---

## 🔍 Verification Points

After running all test scenarios, verify:

### Database Checks
- [ ] Listings table has correct `paymentStatus` values
- [ ] `stripeSessionId` and `stripePaymentIntentId` populated
- [ ] `paidAt` timestamp recorded for successful payments
- [ ] Professional subscriptions have `stripeSubscriptionId`

### Stripe Dashboard Checks
- [ ] All test payments appear in **Payments** section
- [ ] Webhook events show ✅ green checkmarks
- [ ] No failed webhook deliveries
- [ ] Subscription status matches database

### Email Checks
- [ ] Payment receipt emails received
- [ ] Payment failure emails received
- [ ] Subscription confirmation emails received
- [ ] Refund confirmation emails received

### User Experience Checks
- [ ] No broken pages or error messages
- [ ] Loading states display correctly
- [ ] Success/error messages are clear
- [ ] Redirects work smoothly

---

## 🚨 Common Issues & Solutions

### Issue: "Stripe is not configured"

**Solution**: Verify all three environment variables are set in Settings → Secrets and restart application.

### Issue: Webhook events failing (❌ red X)

**Solution**: 
1. Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Verify webhook URL is correct
3. Check application logs for errors

### Issue: Payment succeeds but listing not published

**Solution**: 
1. Check webhook events in Stripe Dashboard
2. Verify `checkout.session.completed` event is being sent
3. Check application logs for webhook processing errors

### Issue: "Invalid API key" error

**Solution**: Ensure you're using matching test/live keys (not mixing test and live).

---

## 📊 Test Results Template

Use this template to track your testing:

```
Date: _______________
Tester: _______________
Environment: [ ] Test Mode  [ ] Live Mode

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Standard Listing | ☐ Pass ☐ Fail | |
| 2. Featured Payment | ☐ Pass ☐ Fail | |
| 3. Premium Payment | ☐ Pass ☐ Fail | |
| 4. Payment Cancel | ☐ Pass ☐ Fail | |
| 5. Payment Failure | ☐ Pass ☐ Fail | |
| 6. Expired Session | ☐ Pass ☐ Fail | |
| 7. Professional Sub | ☐ Pass ☐ Fail | |
| 8. Sub Cancellation | ☐ Pass ☐ Fail | |
| 9. Payment History | ☐ Pass ☐ Fail | |
| 10. Admin Refund | ☐ Pass ☐ Fail | |

Overall Result: ☐ All Pass  ☐ Issues Found

Issues Identified:
_________________________________________________
_________________________________________________
```

---

## 🎯 Ready for Production?

Before switching to live mode, ensure:

- [ ] All 10 test scenarios pass
- [ ] Webhook events show 100% success rate
- [ ] No errors in application logs
- [ ] Email notifications working correctly
- [ ] Admin refund workflow tested
- [ ] Payment history displays correctly
- [ ] Stripe account fully verified
- [ ] Business bank account connected
- [ ] Terms of Service and Privacy Policy updated with payment terms

---

**Document Version**: 1.0  
**Last Updated**: December 28, 2024  
**Author**: Platform Team
