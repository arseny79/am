import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Check ndaSignings schema
const schema = await connection.query("DESCRIBE ndaSignings");
console.log("ndaSignings schema:", JSON.stringify(schema[0], null, 2));

await connection.end();
