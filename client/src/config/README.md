# Homepage Content Configuration

## Overview

All homepage content is centralized in `homepage.ts` for easy customization without touching code.

## How to Customize

### 1. Open the Configuration File

Navigate to: `client/src/config/homepage.ts`

### 2. Edit the Content

```typescript
export const homepageContent: HomepageContent = {
  // Edit hero section
  hero: {
    headline: "Sell Your MSP for",
    highlightedWord: "FREE", // This word appears in primary color
    subheadline: "Only Pay When You Get Paid",
    description: "Your value proposition here...",
    primaryCTA: {
      text: "List Your MSP Free",
      href: "/create-listing",
    },
    secondaryCTA: {
      text: "Get Featured for $299",
      href: "/pricing",
    },
  },

  // Edit trust signals
  trustSignals: [
    { value: "$2B+", label: "Buyer capital" },
    { value: "500+", label: "MSP owners" },
    // ... add or modify as needed
  ],

  // Edit features section
  featuresHeadline: "Everything You Need in One Place",
  featuresSubheadline: "Your subheadline here...",
  features: [
    {
      icon: Search, // Import from 'lucide-react'
      title: "Find What You're Looking For",
      description: "Simple search and filters...",
    },
    // ... add or modify features
  ],
};
```

### 3. Save and Refresh

Changes appear immediately after saving the file. No code changes needed!

## Common Customizations

### Change Hero Headline

```typescript
hero: {
  headline: "Buy or Sell MSPs",
  highlightedWord: undefined, // No highlight
  // ...
}
```

### Update Trust Signals

```typescript
trustSignals: [
  { value: "$5B+", label: "Transaction volume" },
  { value: "1000+", label: "Happy sellers" },
  { value: "⚡", label: "Fast closings" },
  { value: "24/7", label: "Support" },
],
```

### Add New Feature

```typescript
import { Zap } from "lucide-react"; // Import new icon

features: [
  // ... existing features
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Close deals in record time",
  },
],
```

### Change CTA Buttons

```typescript
primaryCTA: {
  text: "Get Started Now",
  href: "/signup",
},
secondaryCTA: {
  text: "Learn More",
  href: "/about",
},
```

## Available Icons

Browse all available icons at: https://lucide.dev/icons/

Import them in `homepage.ts`:
```typescript
import { IconName } from "lucide-react";
```

## Tips

- Keep trust signals to 4 items for best visual balance
- Recommend 6 features for optimal grid layout
- Headlines work best at 5-10 words
- Descriptions should be 15-25 words

## Need Help?

If you need to customize beyond what's in the config file, you can edit `client/src/pages/Home.tsx` directly, but the config file should cover 95% of use cases.
