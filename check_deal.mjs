import { drizzle } from "drizzle-orm/mysql2";
import { deals } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);
const result = await db.select().from(deals).where(eq(deals.id, 1)).limit(1);
console.log("Deal with ID 1:", result[0] || "NOT FOUND");
process.exit(0);
