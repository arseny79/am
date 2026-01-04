import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);
// Check for users with role admin or specific verification status
const result = await db.execute(sql`SELECT id, name, email, role, verificationStatus, verificationTier, kycVerified, verifiedAt FROM users WHERE role = 'admin' OR verificationStatus = 'verified' LIMIT 10`);
console.log("Admin or verified users:", JSON.stringify(result[0], null, 2));

// Also check all verification statuses
const result2 = await db.execute(sql`SELECT DISTINCT verificationStatus, COUNT(*) as cnt FROM users GROUP BY verificationStatus`);
console.log("Verification status counts:", JSON.stringify(result2[0], null, 2));
process.exit(0);
