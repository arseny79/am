import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Set template 30002 as the default
await connection.query("UPDATE ndaTemplates SET isDefault = 0 WHERE isDefault = 1");
await connection.query("UPDATE ndaTemplates SET isDefault = 1 WHERE id = 30002");

console.log("Set template 30002 as default");

// Verify
const result = await connection.query("SELECT id, name, isDefault FROM ndaTemplates WHERE isDefault = 1");
console.log("Default template:", result[0][0]);

await connection.end();
