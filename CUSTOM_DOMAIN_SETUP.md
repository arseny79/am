# Custom Domain Setup: MSPdeal.com → Your Platform

## Overview

You want users to access your platform at **https://mspdeal.com** instead of the default Manus domain.

This requires configuring DNS records at your domain registrar (where you bought MSPdeal.com).

---

## Step 1: Publish Your Platform First

**IMPORTANT:** You must publish the platform before connecting a custom domain.

1. In Manus platform, click **Publish** button (top-right)
2. Wait for deployment to complete
3. You'll get a default URL like: `https://msp-marketplace-xxx.manus.space`
4. Test that the published site works

---

## Step 2: Access Custom Domain Settings

1. Open the **Management UI** (right panel)
2. Click **Settings** (left sidebar)
3. Click **Domains** section
4. You'll see:
   - Current domain: `msp-marketplace-xxx.manus.space`
   - Option to add custom domain

---

## Step 3: Add MSPdeal.com as Custom Domain

1. In the Domains section, click **Add Custom Domain**
2. Enter: `mspdeal.com`
3. Also add: `www.mspdeal.com` (optional but recommended)
4. Manus will provide DNS records to configure

### Expected DNS Records (Example):

```
Type: CNAME
Name: mspdeal.com (or @)
Value: msp-marketplace-xxx.manus.space
TTL: 3600

Type: CNAME
Name: www
Value: msp-marketplace-xxx.manus.space
TTL: 3600
```

**Note:** Exact records will be shown in the Manus UI after you add the domain.

---

## Step 4: Configure DNS at Your Domain Registrar

Go to where you bought **MSPdeal.com** (e.g., GoDaddy, Namecheap, Cloudflare, Google Domains):

### If Your Registrar is GoDaddy:

1. Log in to GoDaddy
2. Go to **My Products → Domains**
3. Click **DNS** next to mspdeal.com
4. Click **Add** to create new records
5. Add the CNAME records provided by Manus
6. Save changes

### If Your Registrar is Namecheap:

1. Log in to Namecheap
2. Go to **Domain List → Manage** (next to mspdeal.com)
3. Click **Advanced DNS** tab
4. Click **Add New Record**
5. Add the CNAME records provided by Manus
6. Save changes

### If Your Registrar is Cloudflare:

1. Log in to Cloudflare
2. Select **mspdeal.com** domain
3. Go to **DNS → Records**
4. Click **Add record**
5. Add the CNAME records provided by Manus
6. **IMPORTANT:** Set proxy status to **DNS only** (gray cloud, not orange)
7. Save changes

### If Your Registrar is Google Domains:

1. Log in to Google Domains
2. Select **mspdeal.com**
3. Click **DNS** in left sidebar
4. Scroll to **Custom resource records**
5. Add the CNAME records provided by Manus
6. Save changes

---

## Step 5: Wait for DNS Propagation

- **Typical time:** 5-60 minutes
- **Maximum time:** Up to 48 hours (rare)
- **Check status:** Use https://dnschecker.org/ to verify CNAME records

---

## Step 6: Verify Domain in Manus

1. Return to Manus → Settings → Domains
2. Click **Verify** next to mspdeal.com
3. If DNS is propagated, verification will succeed
4. Manus will automatically provision SSL certificate (HTTPS)

---

## Step 7: Test Your Custom Domain

1. Open https://mspdeal.com in browser
2. Verify it loads your platform
3. Check that HTTPS (padlock icon) is working
4. Test www.mspdeal.com also works

---

## Common Issues & Solutions

### Issue: "Domain verification failed"

**Solution:**
- Wait longer for DNS propagation (use dnschecker.org)
- Double-check CNAME records are exact match
- Ensure no typos in CNAME values
- Remove any conflicting A records for same hostname

### Issue: "SSL certificate pending"

**Solution:**
- This is normal, wait 5-15 minutes
- Manus automatically provisions Let's Encrypt SSL
- Don't access site until SSL is ready (may cause browser warnings)

### Issue: "www.mspdeal.com works but mspdeal.com doesn't" (or vice versa)

**Solution:**
- Add both as custom domains in Manus
- Configure CNAME for both `@` (apex) and `www`
- Some registrars don't support CNAME on apex - use A record instead

### Issue: Cloudflare proxy causing issues

**Solution:**
- Set Cloudflare proxy to **DNS only** (gray cloud)
- Orange cloud (proxied) can interfere with Manus routing
- After domain is working, you can try re-enabling proxy

---

## Alternative: Subdomain Setup

If you have issues with apex domain (mspdeal.com), use a subdomain:

**Option 1:** `app.mspdeal.com`  
**Option 2:** `marketplace.mspdeal.com`  
**Option 3:** `deals.mspdeal.com`

Subdomains are easier to configure (always use CNAME, no apex issues).

---

## After Domain is Connected

### Update Platform Configuration:

1. Go to Settings → General
2. Update **Website URL** to: `https://mspdeal.com`
3. This ensures:
   - Email links point to correct domain
   - OAuth redirects work properly
   - Social sharing uses correct URL

### Update SendGrid Email Links:

Email templates currently use placeholder domain. After custom domain is live, emails will automatically use `https://mspdeal.com` for all links.

### Update SEO:

1. Submit `https://mspdeal.com` to Google Search Console
2. Add sitemap: `https://mspdeal.com/sitemap.xml`
3. Update any marketing materials with new domain

---

## Cost

**Custom domains on Manus:** Included in your plan (no extra charge)  
**SSL certificate:** Free (Let's Encrypt, auto-renewed)  
**Domain registration:** $10-15/year (paid to registrar)

---

## Summary

1. ✅ Publish platform first
2. ✅ Add mspdeal.com in Manus → Settings → Domains
3. ✅ Copy DNS records shown by Manus
4. ✅ Add CNAME records at your domain registrar
5. ✅ Wait for DNS propagation (5-60 min)
6. ✅ Verify domain in Manus
7. ✅ Test https://mspdeal.com

**Need help?** The Manus UI provides step-by-step instructions specific to your setup after you add the custom domain.
