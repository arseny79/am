import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Check NDA templates
const templates = await connection.query("SELECT id, name, LEFT(content, 500) as content_preview FROM ndaTemplates");
console.log("NDA Templates:", JSON.stringify(templates[0], null, 2));

// Check NDA signings for deal 330002
const signings = await connection.query("SELECT * FROM ndaSignings WHERE dealId = 330002");
console.log("\nNDA Signings for deal 330002:", JSON.stringify(signings[0], null, 2));

// Check deal 330002
const deals = await connection.query("SELECT id, buyerId, sellerId, listingId, stage FROM deals WHERE id = 330002");
console.log("\nDeal 330002:", JSON.stringify(deals[0], null, 2));

await connection.end();
