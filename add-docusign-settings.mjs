import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Add DocuSign settings columns to siteSettings table (camelCase table name)
const settingsColumns = [
  "ALTER TABLE siteSettings ADD COLUMN IF NOT EXISTS docusign_integration_key VARCHAR(255)",
  "ALTER TABLE siteSettings ADD COLUMN IF NOT EXISTS docusign_user_id VARCHAR(255)",
  "ALTER TABLE siteSettings ADD COLUMN IF NOT EXISTS docusign_account_id VARCHAR(255)",
  "ALTER TABLE siteSettings ADD COLUMN IF NOT EXISTS docusign_environment VARCHAR(50) DEFAULT 'sandbox'",
  "ALTER TABLE siteSettings ADD COLUMN IF NOT EXISTS docusign_rsa_private_key TEXT",
];

for (const sql of settingsColumns) {
  try {
    await conn.execute(sql);
    console.log("OK:", sql.substring(0, 70) + "...");
  } catch (e) {
    console.log("Skip:", e.message.substring(0, 60));
  }
}

await conn.end();
console.log("Done!");
