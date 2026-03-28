/**
 * Seed script: iGaming categories for Acquisitions.market
 *
 * Run with: npx tsx scripts/seedIgamingCategories.ts
 *
 * This is idempotent — it skips categories that already exist by slug.
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { listingCategories } from "../drizzle/schema";
import { SEED_CATEGORIES } from "../shared/igamingCategories";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("Seeding iGaming categories...");

  // Build a slug → id map for parent resolution
  const slugToId = new Map<string, number>();

  for (const cat of SEED_CATEGORIES) {
    // Check if already exists
    const existing = await db
      .select({ id: listingCategories.id })
      .from(listingCategories)
      .where(eq(listingCategories.slug, cat.slug))
      .limit(1);

    if (existing.length > 0) {
      slugToId.set(cat.slug, existing[0].id);
      console.log(`  skip  ${cat.slug} (already exists, id=${existing[0].id})`);
      continue;
    }

    // Resolve parentId from slug
    const parentId = cat.parentSlug ? (slugToId.get(cat.parentSlug) ?? null) : null;

    const [result] = await db
      .insert(listingCategories)
      .values({
        name: cat.name,
        slug: cat.slug,
        type: cat.type,
        businessType: cat.businessType ?? null,
        parentId,
        displayOrder: cat.displayOrder,
        isActive: 1,
      })
      .$returningId();

    slugToId.set(cat.slug, result.id);
    console.log(`  created ${cat.slug} (id=${result.id})`);
  }

  console.log("Done.");
  await connection.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
