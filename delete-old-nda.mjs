import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Delete the old NDA signing record for deal 330002 so a new one can be created
await connection.query("DELETE FROM ndaSigningAuditLog WHERE ndaSigningId = 1");
await connection.query("DELETE FROM ndaSignings WHERE dealId = 330002");

console.log("Deleted old NDA signing record for deal 330002");

await connection.end();
