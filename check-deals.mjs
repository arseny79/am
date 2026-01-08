import { drizzle } from 'drizzle-orm/mysql2';
import { deals } from './drizzle/schema.js';
import { desc } from 'drizzle-orm';

async function main() {
  const db = drizzle(process.env.DATABASE_URL);
  const result = await db.select().from(deals).orderBy(desc(deals.id)).limit(5);
  console.log('Recent deals:', JSON.stringify(result, null, 2));
  process.exit(0);
}
main().catch(console.error);
