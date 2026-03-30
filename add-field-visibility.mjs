import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.query(
    "ALTER TABLE listings ADD COLUMN field_visibility JSON NULL"
  );
  console.log("SUCCESS: Added field_visibility column to listings");
} catch (e) {
  if (e.message.includes("Duplicate column")) {
    console.log("ALREADY EXISTS: field_visibility column");
  } else {
    console.log("ERROR:", e.message);
  }
}

await connection.end();
console.log("Done!");
