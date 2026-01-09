import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const result = await connection.query("SELECT customNdaUrl FROM ndaSignings LIMIT 1");
  console.log("customNdaUrl column exists");
} catch (e) {
  console.log("customNdaUrl column DOES NOT EXIST:", e.message);
}

await connection.end();
