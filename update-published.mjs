import { drizzle } from "drizzle-orm/mysql2";
import { listings } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

console.log("Updating all listings to isPublished=true...");
await db.update(listings)
  .set({ isPublished: true })
  .where(eq(listings.status, "active"));

const allListings = await db.select().from(listings);
console.log(`\n✅ Updated ${allListings.length} listings`);
allListings.forEach(l => {
  console.log(`- ${l.businessName}: isPublished=${l.isPublished}, status=${l.status}`);
});

process.exit(0);
