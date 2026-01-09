import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get the full template content for template id 30002
const result = await connection.query("SELECT id, name, content FROM ndaTemplates WHERE id = 30002");
console.log("Template 30002 content:");
console.log(result[0][0].content);

await connection.end();
