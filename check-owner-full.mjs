import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);
// Check the owner user (id=1) with all verification fields
const result = await db.execute(sql`SELECT id, name, email, role, verificationStatus, verificationTier, kycVerified, verifiedAt, kycSubmittedAt, kycReviewedAt FROM users WHERE id = 1`);
console.log("Owner user:", JSON.stringify(result[0], null, 2));
process.exit(0);
