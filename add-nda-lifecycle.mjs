import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: { rejectUnauthorized: false }
});

async function addColumns() {
  const conn = await pool.getConnection();
  try {
    // Add NDA lifecycle columns
    const columns = [
      "ALTER TABLE deals ADD COLUMN IF NOT EXISTS ndaExpiresAt TIMESTAMP NULL",
      "ALTER TABLE deals ADD COLUMN IF NOT EXISTS ndaRevokedAt TIMESTAMP NULL",
      "ALTER TABLE deals ADD COLUMN IF NOT EXISTS ndaRevokedBy INT NULL",
      "ALTER TABLE deals ADD COLUMN IF NOT EXISTS ndaRevocationReason TEXT NULL",
      "ALTER TABLE deals ADD COLUMN IF NOT EXISTS buyerNdaConfirmed TINYINT DEFAULT 0",
      "ALTER TABLE deals ADD COLUMN IF NOT EXISTS sellerNdaConfirmed TINYINT DEFAULT 0",
      "ALTER TABLE deals ADD COLUMN IF NOT EXISTS buyerNdaSignedAt TIMESTAMP NULL",
      "ALTER TABLE deals ADD COLUMN IF NOT EXISTS sellerNdaSignedAt TIMESTAMP NULL",
    ];
    
    for (const sql of columns) {
      try {
        await conn.query(sql);
        console.log('Added column:', sql.match(/ADD COLUMN.*?(\w+)/)?.[1]);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log('Column already exists');
        } else {
          console.log('Error:', e.message);
        }
      }
    }
    
    console.log('Done!');
  } finally {
    conn.release();
    await pool.end();
  }
}

addColumns();
