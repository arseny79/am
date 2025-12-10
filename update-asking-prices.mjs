import { drizzle } from 'drizzle-orm/mysql2';
import { listings } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

// Calculate asking price based on valuation (add 10-15% premium)
const askingPrices = {
  // CloudTech MSP Solutions - $7.4M valuation → $8.1M asking
  270001: 8100000,
  // SecureNet IT Services - $5.8M valuation → $6.4M asking
  270002: 6400000,
  // HealthTech MSP Partners - $4.2M valuation → $4.6M asking
  270003: 4600000,
  // EduCloud Solutions - $3.1M valuation → $3.4M asking
  270004: 3400000,
  // RetailTech MSP Group - $2.8M valuation → $3.1M asking
  270005: 3100000,
  // Financial Services IT - $6.2M valuation → $6.8M asking
  270006: 6800000,
  // Manufacturing IT Solutions - $3.9M valuation → $4.3M asking
  270007: 3900000,
  // Professional Services MSP - $2.1M valuation → $2.3M asking
  270008: 2300000,
};

async function updateAskingPrices() {
  console.log('Updating asking prices for all listings...');
  
  for (const [listingId, askingPrice] of Object.entries(askingPrices)) {
    await db.update(listings)
      .set({ askingPrice: parseInt(askingPrice) })
      .where(eq(listings.id, parseInt(listingId)));
    
    console.log(`Updated listing ${listingId} with asking price: $${parseInt(askingPrice).toLocaleString()}`);
  }
  
  console.log('\n✅ All asking prices updated successfully!');
}

updateAskingPrices().catch(console.error);
