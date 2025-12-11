import { drizzle } from 'drizzle-orm/mysql2';
import { listings } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

const result = await db.select({
  id: listings.id,
  businessName: listings.businessName,
  listingTier: listings.listingTier
}).from(listings).where(eq(listings.id, 420001)).limit(1);

console.log(JSON.stringify(result, null, 2));
