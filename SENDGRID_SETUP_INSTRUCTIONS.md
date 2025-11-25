# SendGrid Setup Instructions for MSPdeal.com

## Step 1: Create SendGrid Account

1. Go to https://sendgrid.com/
2. Sign up for free account (100 emails/day free tier)
3. Verify your email address

## Step 2: Get API Key

1. Log in to SendGrid dashboard
2. Navigate to **Settings → API Keys**
3. Click **Create API Key**
4. Name: `msp-marketplace-production`
5. Permissions: **Full Access** (or restricted to "Mail Send" only)
6. **Copy the API key** (you'll only see it once!)
7. Save it securely - you'll need to add it to platform secrets

## Step 3: Authenticate MSPdeal.com Domain

**This is CRITICAL for professional email delivery**

1. In SendGrid dashboard, go to **Settings → Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter domain: `mspdeal.com`
4. DNS Host: Select your domain registrar (where you bought MSPdeal.com)
5. SendGrid will provide DNS records to add:

### DNS Records to Add (Example - yours will be specific):

```
Type: CNAME
Host: em1234.mspdeal.com
Value: u1234567.wl123.sendgrid.net

Type: CNAME  
Host: s1._domainkey.mspdeal.com
Value: s1.domainkey.u1234567.wl123.sendgrid.net

Type: CNAME
Host: s2._domainkey.mspdeal.com
Value: s2.domainkey.u1234567.wl123.sendgrid.net
```

6. Add these records to your domain registrar's DNS settings
7. Wait 5-60 minutes for DNS propagation
8. Return to SendGrid and click **Verify**

## Step 4: Add Secrets to Platform

Once domain is authenticated, add these to your platform via Management UI → Settings → Secrets:

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@mspdeal.com
SENDGRID_FROM_NAME=MSP M&A Marketplace
```

**Recommended sender addresses:**
- `noreply@mspdeal.com` - For automated notifications
- `deals@mspdeal.com` - For deal-related emails
- `notifications@mspdeal.com` - For system notifications

## Step 5: Test Email Sending

After adding secrets:

1. Create a test proposal or send a test message in the platform
2. Check SendGrid dashboard → Activity to see if email was sent
3. Check your inbox to verify email delivery
4. Verify sender shows as `@mspdeal.com`

## Email Notifications Currently Implemented

✅ **Proposal received** - Sent to buyer when seller submits proposal  
✅ **Proposal accepted** - Sent to seller when buyer accepts  
✅ **Proposal declined** - Sent to seller when buyer declines  
✅ **New message** - Sent when someone sends a deal message  
✅ **Listing published** - Sent to seller after payment confirmed

## Monitoring Email Performance

Check SendGrid dashboard regularly for:
- **Delivery rate** (should be 99%+)
- **Open rate** (industry average: 20-30%)
- **Bounce rate** (should be <5%)
- **Spam complaints** (should be <0.1%)

## Troubleshooting

**Emails not sending?**
- Check SENDGRID_API_KEY is correct
- Verify domain authentication is complete
- Check SendGrid dashboard → Activity for errors

**Emails going to spam?**
- Ensure domain authentication is complete (DKIM, SPF)
- Avoid spam trigger words in subject lines
- Include unsubscribe link (required by law)
- Maintain low bounce rate

**Domain authentication failing?**
- Wait longer for DNS propagation (can take up to 48 hours)
- Double-check DNS records are exact match
- Ensure no typos in CNAME values
- Contact domain registrar support if issues persist

## Cost

- **Free tier:** 100 emails/day = 3,000/month (sufficient for early stage)
- **Essentials:** $19.95/month = 50,000 emails/month
- **Pro:** $89.95/month = 100,000 emails/month

Start with free tier, upgrade when you consistently hit 80-100 emails/day.
