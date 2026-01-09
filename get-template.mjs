import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get the full template content for template id 1
const result = await connection.query("SELECT id, name, content FROM ndaTemplates WHERE id = 1");
console.log("Template 1 content:");
console.log(result[0][0].content);

await connection.end();
