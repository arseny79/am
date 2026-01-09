import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.query("ALTER TABLE ndaSignings ADD COLUMN variableValues TEXT");
  console.log("Added variableValues column");
} catch (e) {
  if (e.message.includes("Duplicate column")) {
    console.log("variableValues column already exists");
  } else {
    console.log("ERROR:", e.message);
  }
}

// Verify all columns now exist
const schema = await connection.query("DESCRIBE ndaSignings");
console.log("\nCurrent ndaSignings columns:");
schema[0].forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

await connection.end();
