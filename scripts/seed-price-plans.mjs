import { drizzle } from "drizzle-orm/mysql2";
import { pricePlans } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const defaultPlans = [
  {
    tier: "free",
    name: "Free Listing",
    description: "List your MSP business at no upfront cost",
    price: 0,
    billingPeriod: "one_time",
    features: [
      "Basic listing in marketplace",
      "Search visibility",
      "Unlimited duration",
      "3% success fee only when sold",
      "Secure messaging with buyers",
      "NDA protection"
    ],
    displayOrder: 1,
    isActive: true,
    isFeatured: false,
    allowsThumbnail: false,
    carouselPlacement: false,
    prioritySupport: false,
  },
  {
    tier: "featured",
    name: "Featured",
    description: "Stand out with top carousel placement",
    price: 9900, // $99 in cents
    billingPeriod: "weekly",
    features: [
      "Everything in Free",
      "Top carousel placement on homepage",
      "\"Featured\" badge on listing",
      "3x more visibility",
      "Priority in search results",
      "3% success fee when sold"
    ],
    displayOrder: 2,
    isActive: true,
    isFeatured: true, // Mark as "Most Popular"
    allowsThumbnail: false,
    carouselPlacement: true,
    prioritySupport: false,
  },
  {
    tier: "premium_featured",
    name: "Premium Featured",
    description: "Maximum visibility with custom branding",
    price: 24900, // $249 in cents
    billingPeriod: "weekly",
    features: [
      "Everything in Featured",
      "Custom thumbnail image",
      "\"Premium\" badge",
      "5x more visibility",
      "Top of carousel priority",
      "Priority email support",
      "3% success fee when sold"
    ],
    displayOrder: 3,
    isActive: true,
    isFeatured: false,
    allowsThumbnail: true,
    carouselPlacement: true,
    prioritySupport: true,
  },
];

async function seed() {
  console.log("Seeding price plans...");
  
  for (const plan of defaultPlans) {
    try {
      await db.insert(pricePlans).values(plan).onDuplicateKeyUpdate({
        set: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          billingPeriod: plan.billingPeriod,
          features: plan.features,
          displayOrder: plan.displayOrder,
          isActive: plan.isActive,
          isFeatured: plan.isFeatured,
          allowsThumbnail: plan.allowsThumbnail,
          carouselPlacement: plan.carouselPlacement,
          prioritySupport: plan.prioritySupport,
        },
      });
      console.log(`✓ Seeded plan: ${plan.name}`);
    } catch (error) {
      console.error(`✗ Failed to seed plan ${plan.name}:`, error.message);
    }
  }
  
  console.log("Price plans seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
