import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Check the status enum values
const result = await connection.query("SHOW COLUMNS FROM ndaSignings WHERE Field = 'status'");
console.log("Status enum:", result[0][0].Type);

// Try to update with 'buyer_signed' status
try {
  await connection.query("UPDATE ndaSignings SET status = 'buyer_signed' WHERE id = 1");
  console.log("Successfully updated to buyer_signed");
} catch (e) {
  console.log("Error updating to buyer_signed:", e.message);
}

// Try to update with 'partially_signed' status
try {
  await connection.query("UPDATE ndaSignings SET status = 'partially_signed' WHERE id = 1");
  console.log("Successfully updated to partially_signed");
} catch (e) {
  console.log("Error updating to partially_signed:", e.message);
}

// Reset to pending
await connection.query("UPDATE ndaSignings SET status = 'pending' WHERE id = 1");
console.log("Reset to pending");

await connection.end();
