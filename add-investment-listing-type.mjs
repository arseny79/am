import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const alterations = [
  [`ALTER TABLE listings ADD COLUMN listing_type ENUM('for_sale','seeking_investment') NOT NULL DEFAULT 'for_sale'`, "listing_type"],
  [`ALTER TABLE listings ADD COLUMN investment_type ENUM('equity','debt','convertible_note','revenue_share','other') NULL`, "investment_type"],
  [`ALTER TABLE listings ADD COLUMN investment_amount INT NULL`, "investment_amount"],
  [`ALTER TABLE listings ADD COLUMN equity_offered DECIMAL(5,2) NULL`, "equity_offered"],
  [`ALTER TABLE listings ADD COLUMN current_valuation INT NULL`, "current_valuation"],
  [`ALTER TABLE listings ADD COLUMN use_of_funds TEXT NULL`, "use_of_funds"],
];

for (const [sql, col] of alterations) {
  try {
    await connection.query(sql);
    console.log(`SUCCESS: Added ${col}`);
  } catch (e) {
    if (e.message.includes("Duplicate column")) {
      console.log(`ALREADY EXISTS: ${col}`);
    } else {
      console.log(`ERROR adding ${col}:`, e.message);
    }
  }
}

await connection.end();
console.log("Done!");
