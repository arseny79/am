import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Add missing columns to ndaSignings table
const alterQueries = [
  "ALTER TABLE ndaSignings ADD COLUMN buyerSignature TEXT",
  "ALTER TABLE ndaSignings ADD COLUMN sellerSignature TEXT",
  "ALTER TABLE ndaSignings ADD COLUMN buyerSignatureType VARCHAR(50)",
  "ALTER TABLE ndaSignings ADD COLUMN sellerSignatureType VARCHAR(50)",
  "ALTER TABLE ndaSignings ADD COLUMN variableValues TEXT DEFAULT '{}'"
];

for (const query of alterQueries) {
  try {
    await connection.query(query);
    console.log("SUCCESS:", query.substring(0, 60) + "...");
  } catch (e) {
    if (e.message.includes("Duplicate column")) {
      console.log("ALREADY EXISTS:", query.substring(0, 60) + "...");
    } else {
      console.log("ERROR:", e.message);
    }
  }
}

await connection.end();
console.log("\nDone!");
