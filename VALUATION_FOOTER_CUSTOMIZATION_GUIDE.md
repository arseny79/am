# Valuation Tool Footer Customization Guide

## Overview

The valuation tool footer displays data sources and disclaimers at the bottom of the valuation calculator page. This content is fully customizable through the Admin Dashboard to reflect your preferred data sources and legal disclaimers.

---

## How to Customize

### Step 1: Access Admin Dashboard

1. Log in to MSP.Investments as an admin user
2. Navigate to **Admin Dashboard** (top navigation)
3. Click on the **Content** tab

### Step 2: Scroll to Valuation Tool Footer Section

1. Scroll down past the "Homepage Hero Section" and "Homepage Stats Section"
2. Find the **"Valuation Tool Footer"** section at the bottom
3. You'll see two text areas:
   - **Data Sources Text**
   - **Disclaimer Text**

### Step 3: Update Data Sources Text

**Current Default**:
```
Data sources: Aventis Advisors, Drake Star, Greenwich PE, NinjaOne, Worklyn Partners, Evergreen, The 20
```

**Purpose**: Lists the industry sources used to inform valuation multiples and methodologies.

**Customization Tips**:
- Add or remove data sources as your methodology evolves
- Include links to public reports if available
- Keep it concise (1-2 lines max)
- Update when you add new data sources

**Example Customizations**:
```
Data sources: Aventis Advisors, Drake Star Partners, Greenwich PE, NinjaOne M&A Report, Worklyn Partners, Evergreen Services Group, The 20 MSP

Data sources: Industry M&A reports from Aventis Advisors, Drake Star, Greenwich PE, and proprietary transaction data from 200+ closed deals

Data sources: Based on analysis of 500+ MSP transactions (2020-2024) and industry reports from leading M&A advisors
```

### Step 4: Update Disclaimer Text

**Current Default**:
```
This calculator provides an estimate only. Actual valuations may vary based on market conditions, buyer appetite, and due diligence findings.
```

**Purpose**: Legal disclaimer to manage user expectations and limit liability.

**Customization Tips**:
- Consult with legal counsel before making changes
- Keep it clear and readable (avoid legal jargon)
- Balance protection with user-friendliness
- Update if your methodology changes significantly

**Example Customizations**:
```
This calculator provides an estimate only. Actual valuations may vary significantly based on market conditions, buyer appetite, due diligence findings, and deal structure. Not financial or legal advice.

Valuation estimates are for informational purposes only and should not be relied upon as a guarantee of sale price. Consult with a qualified M&A advisor for a comprehensive valuation.

This tool provides a market-based estimate using industry benchmarks. Your actual sale price may be higher or lower depending on buyer competition, business quality, and market timing.
```

### Step 5: Save Changes

1. Click the **"Save Valuation Footer"** button at the bottom
2. You'll see a success message: "Valuation footer content updated successfully"
3. Changes take effect immediately (no page refresh needed)

### Step 6: Verify Changes

1. Open a new tab and navigate to `/valuate` (Valuation Tool page)
2. Scroll to the bottom of the page
3. Verify your updated data sources and disclaimer text appear correctly
4. Check formatting and readability

---

## Where This Content Appears

The valuation footer content appears on:

1. **Valuation Tool Page** (`/valuate`)
   - Bottom of the standalone valuation calculator
   - Visible to all users (logged in or not)

2. **Create Listing Page** (`/create-listing`)
   - Step 2: Valuation Reality Check
   - Shows after user completes valuation wizard
   - Visible only to verified sellers

---

## Technical Details

### Database Storage

The content is stored in the `siteContent` table:

```sql
CREATE TABLE siteContent (
  id INT AUTO_INCREMENT PRIMARY KEY,
  valuationDataSources TEXT,
  valuationDisclaimer TEXT,
  -- other fields...
)
```

### API Endpoint

- **Get Content**: `trpc.system.getSiteContent.useQuery()`
- **Update Content**: `trpc.system.updateSiteContent.useMutation()`

### Frontend Display

The content is rendered in:
- `client/src/pages/Valuate.tsx` (standalone tool)
- `client/src/components/ValuationWizard.tsx` (listing creation)

---

## Best Practices

### Data Sources

✅ **Do**:
- List credible, verifiable sources
- Update regularly (at least annually)
- Include a mix of public reports and proprietary data
- Keep the list concise (5-10 sources max)

❌ **Don't**:
- List sources you haven't actually reviewed
- Include outdated sources (older than 3 years)
- Make claims you can't substantiate
- List competitors' platforms

### Disclaimer

✅ **Do**:
- Clearly state it's an estimate, not a guarantee
- Mention key variables that affect actual price
- Suggest consulting with professionals
- Keep language accessible to non-lawyers

❌ **Don't**:
- Use all caps or aggressive language
- Make it so long nobody reads it
- Contradict your marketing messaging
- Skip legal review before publishing

---

## Example Configurations

### Configuration 1: Conservative (Risk-Averse)

**Data Sources**:
```
Data sources: Industry benchmarks from Aventis Advisors, Drake Star Partners, and Greenwich PE. Multiples based on 200+ MSP transactions (2020-2024).
```

**Disclaimer**:
```
This calculator provides a preliminary estimate only and should not be relied upon for financial or business decisions. Actual valuations may vary significantly based on market conditions, business quality, buyer competition, and due diligence findings. We strongly recommend consulting with a qualified M&A advisor or business broker for a comprehensive valuation. This tool is for informational purposes only and does not constitute financial, legal, or tax advice.
```

### Configuration 2: Balanced (Recommended)

**Data Sources**:
```
Data sources: Aventis Advisors, Drake Star, Greenwich PE, NinjaOne, Worklyn Partners, Evergreen, The 20
```

**Disclaimer**:
```
This calculator provides an estimate only. Actual valuations may vary based on market conditions, buyer appetite, and due diligence findings. Consult with a qualified M&A advisor for a comprehensive valuation.
```

### Configuration 3: Confident (Marketing-Focused)

**Data Sources**:
```
Data sources: Analysis of 500+ MSP transactions and industry reports from leading M&A advisors including Aventis, Drake Star, and Greenwich PE.
```

**Disclaimer**:
```
This tool provides a market-based estimate using proven industry benchmarks. Your actual sale price may be higher or lower depending on buyer competition, business quality, and market timing. Not financial advice.
```

---

## Frequently Asked Questions

### Q: How often should I update this content?

**A**: Review and update at least annually, or whenever:
- You add new data sources to your methodology
- Industry reports are published (typically Q1 each year)
- Your legal counsel recommends changes
- You receive user feedback about clarity

### Q: Can I include links in the text?

**A**: Currently, the text areas don't support HTML formatting. Links will display as plain text. If you need clickable links, contact support for a custom implementation.

### Q: What if I want to remove the footer entirely?

**A**: The footer is an important trust signal and legal protection. We recommend keeping it. If you must remove it, clear both text areas and save (footer will be hidden if both fields are empty).

### Q: Can I customize this per listing?

**A**: No, this is a global setting that applies to all valuation calculations. If you need per-listing disclaimers, add them to the listing description field.

### Q: What character limits apply?

**A**: 
- Data Sources: 500 characters max (typically 1-2 lines)
- Disclaimer: 1000 characters max (typically 2-4 lines)

### Q: Will changes affect existing listings?

**A**: Yes, the footer is dynamically loaded, so changes apply to all pages immediately, including existing listings with saved valuations.

---

## Legal Considerations

### Important Notes

1. **Not Legal Advice**: This guide is for informational purposes only. Consult with a qualified attorney before publishing any disclaimer text.

2. **Liability Protection**: A well-crafted disclaimer helps protect your platform from liability claims related to valuation accuracy.

3. **Regulatory Compliance**: Ensure your disclaimer complies with:
   - FTC guidelines on advertising claims
   - State laws regarding business valuation services
   - Securities regulations (if applicable)

4. **International Users**: If you serve international users, consider adding jurisdiction-specific disclaimers.

### Recommended Legal Review

Before launching or making significant changes, have your legal counsel review:
- Data source claims (can you substantiate them?)
- Disclaimer language (does it adequately protect you?)
- Compliance with local regulations
- Consistency with Terms of Service

---

## Support

If you need help customizing the valuation footer:

1. **Technical Issues**: Check server logs for error messages
2. **Content Guidance**: Review this guide and example configurations
3. **Legal Questions**: Consult with your attorney
4. **Feature Requests**: Submit feedback at https://help.example.com

---

## Summary

The valuation footer is a critical trust and legal element of your marketplace. Keep it:

- ✅ **Accurate**: Only list sources you actually use
- ✅ **Current**: Update annually or when methodology changes
- ✅ **Clear**: Use plain language, avoid jargon
- ✅ **Protective**: Include appropriate disclaimers
- ✅ **Concise**: Keep it readable (2-4 lines total)

**To customize**: Admin Dashboard → Content tab → Scroll to "Valuation Tool Footer" → Edit → Save

Changes take effect immediately and apply to all valuation calculations across the platform.
