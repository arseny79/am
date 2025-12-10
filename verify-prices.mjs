import { drizzle } from 'drizzle-orm/mysql2';
import { listings } from './drizzle/schema.js';
import { gte } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

async function verifyPrices() {
  const allListings = await db.select({
    id: listings.id,
    businessName: listings.businessName,
    askingPrice: listings.askingPrice
  }).from(listings).where(gte(listings.id, 270001));
  
  console.log('Listing Asking Prices:');
  console.log('======================');
  allListings.forEach(l => {
    console.log(`${l.id}: ${l.businessName} - ${l.askingPrice ? '$' + l.askingPrice.toLocaleString() : 'N/A'}`);
  });
}

verifyPrices().catch(console.error);
