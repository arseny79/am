import { getDb } from '../server/db';
import { users, kycDocuments } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  // Find user
  const userResults = await db.select().from(users).where(eq(users.email, 'arsenijs.kardass@gmail.com'));
  
  if (userResults.length === 0) {
    console.log('User not found');
    process.exit(1);
  }
  
  const user = userResults[0];
  console.log('User data:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  KYC Verified:', user.kycVerified);
  console.log('  KYC Submitted At:', user.kycSubmittedAt);
  console.log('  KYC Reviewed At:', user.kycReviewedAt);
  console.log('  Email Verified:', user.emailVerified);
  
  // Check KYC documents
  const docs = await db.select().from(kycDocuments).where(eq(kycDocuments.userId, user.id));
  console.log('\nKYC Documents:', docs.length);
  docs.forEach((doc, i) => {
    console.log(`  Document ${i + 1}:`);
    console.log('    Type:', doc.documentType);
    console.log('    File:', doc.fileName);
    console.log('    URL:', doc.fileUrl);
    console.log('    Status:', doc.reviewStatus);
  });
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
