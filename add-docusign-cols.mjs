import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Add DocuSign columns to deals table
const columns = [
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS docusign_envelope_id VARCHAR(255)",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS docusign_status VARCHAR(50)",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS docusign_buyer_status VARCHAR(50)",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS docusign_seller_status VARCHAR(50)",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS docusign_sent_at TIMESTAMP NULL",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS docusign_completed_at TIMESTAMP NULL",
];

// Add DocuSign settings columns to site_settings table
const settingsColumns = [
  "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS docusign_integration_key VARCHAR(255)",
  "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS docusign_user_id VARCHAR(255)",
  "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS docusign_account_id VARCHAR(255)",
  "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS docusign_environment VARCHAR(50) DEFAULT 'sandbox'",
  "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS docusign_rsa_private_key TEXT",
];

for (const sql of [...columns, ...settingsColumns]) {
  try {
    await conn.execute(sql);
    console.log("OK:", sql.substring(0, 60) + "...");
  } catch (e) {
    console.log("Skip:", e.message.substring(0, 50));
  }
}

await conn.end();
console.log("Done!");
