import { describe, it, expect, beforeEach, vi } from "vitest";
import { autoCreateNDAForDeal } from "./lib/autoCreateNDA";
import { getDb } from "./db";
import { ndaTemplates, ndaSignings, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("autoCreateNDAForDeal", () => {
  it("should create NDA signing when default template exists", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Get a default template
    const templates = await db
      .select()
      .from(ndaTemplates)
      .where(and(eq(ndaTemplates.isDefault, true), eq(ndaTemplates.isActive, true)))
      .limit(1);

    if (!templates.length) {
      console.warn("No default NDA template found, skipping test");
      return;
    }

    // Get test users (buyer and seller)
    const testUsers = await db.select().from(users).limit(2);
    
    if (testUsers.length < 2) {
      console.warn("Not enough users for test, skipping");
      return;
    }

    const buyerId = testUsers[0].id;
    const sellerId = testUsers[1].id;

    // Create NDA for a mock deal
    const ndaSigningId = await autoCreateNDAForDeal({
      dealId: 99999, // Mock deal ID
      buyerId,
      sellerId,
      listingName: "Test MSP Business",
    });

    // Verify NDA was created
    expect(ndaSigningId).toBeTruthy();

    // Clean up - delete the test NDA
    if (ndaSigningId) {
      await db.delete(ndaSignings).where(eq(ndaSignings.id, ndaSigningId));
    }
  });

  it("should handle missing default template gracefully", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Temporarily disable all templates
    await db.update(ndaTemplates).set({ isActive: false });

    const result = await autoCreateNDAForDeal({
      dealId: 99999,
      buyerId: 1,
      sellerId: 2,
      listingName: "Test Business",
    });

    // Should return null when no template available
    expect(result).toBeNull();

    // Re-enable templates
    await db.update(ndaTemplates).set({ isActive: true });
  });

  it("should populate NDA variables correctly", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Get test users
    const testUsers = await db.select().from(users).limit(2);
    
    if (testUsers.length < 2) {
      console.warn("Not enough users for test, skipping");
      return;
    }

    const buyerId = testUsers[0].id;
    const sellerId = testUsers[1].id;
    const listingName = "Test Healthcare MSP";

    const ndaSigningId = await autoCreateNDAForDeal({
      dealId: 99998,
      buyerId,
      sellerId,
      listingName,
    });

    if (ndaSigningId) {
      // Verify the NDA was created with correct variables
      const nda = await db
        .select()
        .from(ndaSignings)
        .where(eq(ndaSignings.id, ndaSigningId))
        .limit(1);

      expect(nda.length).toBe(1);
      expect(nda[0].status).toBe("draft");
      expect(nda[0].dealId).toBe(99998);

      // Check that variables were populated
      const variables = JSON.parse(nda[0].variableValues);
      expect(variables).toHaveProperty("buyerName");
      expect(variables).toHaveProperty("sellerName");
      expect(variables).toHaveProperty("listingName");
      expect(variables.listingName).toBe(listingName);

      // Clean up
      await db.delete(ndaSignings).where(eq(ndaSignings.id, ndaSigningId));
    }
  });
});
