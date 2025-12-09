import { drizzle } from "drizzle-orm/mysql2";
import { listings } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);
const allListings = await db.select().from(listings);

console.log(`Found ${allListings.length} listings in database:`);
allListings.forEach(l => {
  console.log(`- ${l.businessName}: $${l.askingPrice?.toLocaleString() || 'N/A'} (Status: ${l.status})`);
});

process.exit(0);
