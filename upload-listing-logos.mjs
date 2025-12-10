import { storagePut } from './server/storage.ts';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Mapping of listing IDs to logo files
const logoMapping = {
  420001: '/home/ubuntu/msp-marketplace/listing-images/securenet-msp-logo.png',
  420002: '/home/ubuntu/msp-marketplace/listing-images/cloudfirst-logo.png',
  420003: '/home/ubuntu/msp-marketplace/listing-images/apex-it-logo.png',
  420004: '/home/ubuntu/msp-marketplace/listing-images/medtech-it-logo.png',
  420005: '/home/ubuntu/msp-marketplace/listing-images/velocity-msp-logo.png',
  420006: '/home/ubuntu/msp-marketplace/listing-images/guardian-managed-logo.png',
  420007: '/home/ubuntu/msp-marketplace/listing-images/retail-it-pros-logo.png',
  420008: '/home/ubuntu/msp-marketplace/listing-images/edutech-solutions-logo.png',
};

console.log('Uploading listing logos to S3 and updating database...\n');

for (const [listingId, logoPath] of Object.entries(logoMapping)) {
  try {
    // Read the image file
    const imageBuffer = readFileSync(logoPath);
    
    // Generate unique key for S3
    const randomSuffix = randomBytes(8).toString('hex');
    const fileName = logoPath.split('/').pop();
    const fileKey = `listing-logos/${listingId}-${randomSuffix}-${fileName}`;
    
    // Upload to S3
    console.log(`Uploading logo for listing ${listingId}...`);
    const { url } = await storagePut(fileKey, imageBuffer, 'image/png');
    console.log(`✓ Uploaded: ${url}`);
    
    // Update database
    await connection.query(
      'UPDATE listings SET logoUrl = ? WHERE id = ?',
      [url, listingId]
    );
    console.log(`✓ Updated database for listing ${listingId}\n`);
    
  } catch (error) {
    console.error(`✗ Error processing listing ${listingId}:`, error.message);
  }
}

console.log('All logos uploaded and database updated!');
await connection.end();
