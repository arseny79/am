// Database Backup Script
// Run with: node scripts/backup-database.mjs

import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('📦 Creating database backup...');
  console.log(`Timestamp: ${timestamp}`);
  
  // Import drizzle and schema
  const { drizzle } = await import('drizzle-orm/mysql2');
  const mysql = await import('mysql2/promise');
  
  // Parse DATABASE_URL
  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  });
  
  const db = drizzle(connection);
  
  // Get all data from critical tables (with error handling)
  let users = [];
  let listings = [];
  let pricePlans = [];
  
  try { [users] = await connection.query('SELECT * FROM users'); } catch (e) { console.log('users table not found'); }
  try { [listings] = await connection.query('SELECT * FROM listings'); } catch (e) { console.log('listings table not found'); }
  try { [pricePlans] = await connection.query('SELECT * FROM price_plans'); } catch (e) { console.log('price_plans table not found'); }
  
  // Try to get other tables if they exist
  let deals = [];
  let kycDocuments = [];
  let messages = [];
  let offers = [];
  let documents = [];
  let siteSettings = [];
  
  try { [deals] = await connection.query('SELECT * FROM deals'); } catch (e) { console.log('deals table not found'); }
  try { [kycDocuments] = await connection.query('SELECT * FROM kyc_documents'); } catch (e) { console.log('kyc_documents table not found'); }
  try { [messages] = await connection.query('SELECT * FROM messages'); } catch (e) { console.log('messages table not found'); }
  try { [offers] = await connection.query('SELECT * FROM offers'); } catch (e) { console.log('offers table not found'); }
  try { [documents] = await connection.query('SELECT * FROM documents'); } catch (e) { console.log('documents table not found'); }
  try { [siteSettings] = await connection.query('SELECT * FROM site_settings'); } catch (e) { console.log('site_settings table not found'); }
  
  const data = {
    users,
    listings,
    deals,
    kycDocuments,
    pricePlans,
    messages,
    offers,
    documents,
    siteSettings,
    timestamp: new Date().toISOString(),
    backupVersion: '1.0'
  };
  
  // Create backup directory
  const backupDir = path.join(process.cwd(), 'database-backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
  
  console.log('');
  console.log('✅ Backup created successfully!');
  console.log(`📁 File: ${backupFile}`);
  console.log('');
  console.log('📊 Backup contents:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Listings: ${listings.length}`);
  console.log(`   Deals: ${deals.length}`);
  console.log(`   KYC Documents: ${kycDocuments.length}`);
  console.log(`   Price Plans: ${pricePlans.length}`);
  console.log(`   Messages: ${messages.length}`);
  console.log(`   Offers: ${offers.length}`);
  console.log(`   Documents: ${documents.length}`);
  console.log(`   Site Settings: ${siteSettings.length}`);
  
  await connection.end();
  
  return { 
    success: true, 
    file: backupFile,
    counts: {
      users: users.length,
      listings: listings.length,
      deals: deals.length,
      kycDocuments: kycDocuments.length,
      pricePlans: pricePlans.length
    }
  };
}

backupDatabase()
  .then(result => {
    console.log('');
    console.log('🎉 Backup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Backup failed:', err.message);
    process.exit(1);
  });
