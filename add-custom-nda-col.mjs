import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.query("ALTER TABLE ndaSignings ADD COLUMN customNdaUrl VARCHAR(500)");
  console.log("Added customNdaUrl column");
} catch (e) {
  if (e.message.includes("Duplicate column")) {
    console.log("customNdaUrl column already exists");
  } else {
    console.log("ERROR:", e.message);
  }
}

try {
  await connection.query("ALTER TABLE ndaSignings ADD COLUMN customNdaFileName VARCHAR(255)");
  console.log("Added customNdaFileName column");
} catch (e) {
  if (e.message.includes("Duplicate column")) {
    console.log("customNdaFileName column already exists");
  } else {
    console.log("ERROR:", e.message);
  }
}

await connection.end();
