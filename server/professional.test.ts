import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { professionals } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("professional.create", () => {
  it("creates a professional profile with all fields including photo", async () => {
    const { ctx } = createAuthContext(999); // Use unique ID to avoid conflicts
    const caller = appRouter.createCaller(ctx);

    // Clean up any existing profile first
    const db = await getDb();
    if (db) {
      await db.delete(professionals).where(eq(professionals.userId, 999));
    }

    const result = await caller.professional.create({
      name: "John Smith",
      companyName: "Smith M&A Advisors",
      email: "john@example.com",
      phone: "+1 (555) 123-4567",
      website: "https://www.example.com",
      type: "broker",
      profilePhotoUrl: "https://example.com/photos/john-smith.jpg",
      specialties: ["MSP", "IT Services", "SaaS"],
      bio: "Experienced M&A broker specializing in technology companies.",
      yearsExperience: 15,
      dealsCompleted: 25,
      location: "New York, NY",
      serviceAreas: ["Northeast US", "California"],
      feeStructure: "Success fee: 5% of transaction value",
    });

    expect(result).toHaveProperty("id");
    expect(result.message).toBe("Profile created and pending approval");

    // Verify the profile was created in the database
    if (db) {
      const profile = await db
        .select()
        .from(professionals)
        .where(eq(professionals.userId, 999))
        .limit(1);

      expect(profile[0]).toBeDefined();
      expect(profile[0]?.name).toBe("John Smith");
      expect(profile[0]?.companyName).toBe("Smith M&A Advisors");
      expect(profile[0]?.email).toBe("john@example.com");
      expect(profile[0]?.phone).toBe("+1 (555) 123-4567");
      expect(profile[0]?.website).toBe("https://www.example.com");
      expect(profile[0]?.type).toBe("broker");
      expect(profile[0]?.profilePhotoUrl).toBe("https://example.com/photos/john-smith.jpg");
      expect(profile[0]?.specialties).toEqual(["MSP", "IT Services", "SaaS"]);
      expect(profile[0]?.bio).toBe("Experienced M&A broker specializing in technology companies.");
      expect(profile[0]?.yearsExperience).toBe(15);
      expect(profile[0]?.dealsCompleted).toBe(25);
      expect(profile[0]?.location).toBe("New York, NY");
      expect(profile[0]?.serviceAreas).toEqual(["Northeast US", "California"]);
      expect(profile[0]?.feeStructure).toBe("Success fee: 5% of transaction value");
      expect(profile[0]?.status).toBe("pending");
      expect(profile[0]?.tier).toBe("basic");
    }
  });

  it("creates a professional profile with minimal fields", async () => {
    const { ctx } = createAuthContext(998);
    const caller = appRouter.createCaller(ctx);

    // Clean up any existing profile first
    const db = await getDb();
    if (db) {
      await db.delete(professionals).where(eq(professionals.userId, 998));
    }

    const result = await caller.professional.create({
      name: "Jane Doe",
      email: "jane@example.com",
      type: "lawyer",
    });

    expect(result).toHaveProperty("id");
    expect(result.message).toBe("Profile created and pending approval");

    // Verify the profile was created
    if (db) {
      const profile = await db
        .select()
        .from(professionals)
        .where(eq(professionals.userId, 998))
        .limit(1);

      expect(profile[0]).toBeDefined();
      expect(profile[0]?.name).toBe("Jane Doe");
      expect(profile[0]?.email).toBe("jane@example.com");
      expect(profile[0]?.type).toBe("lawyer");
      expect(profile[0]?.companyName).toBeNull();
      expect(profile[0]?.phone).toBeNull();
      expect(profile[0]?.website).toBeNull();
      expect(profile[0]?.profilePhotoUrl).toBeNull();
    }
  });

  it("rejects duplicate profile creation", async () => {
    const { ctx } = createAuthContext(997);
    const caller = appRouter.createCaller(ctx);

    // Clean up and create first profile
    const db = await getDb();
    if (db) {
      await db.delete(professionals).where(eq(professionals.userId, 997));
    }

    await caller.professional.create({
      name: "First Profile",
      email: "first@example.com",
      type: "accountant",
    });

    // Try to create a second profile
    await expect(
      caller.professional.create({
        name: "Second Profile",
        email: "second@example.com",
        type: "broker",
      })
    ).rejects.toThrow("You already have a professional profile");
  });
});

describe("professional.update", () => {
  it("updates a professional profile including photo", async () => {
    const { ctx } = createAuthContext(996);
    const caller = appRouter.createCaller(ctx);

    // Clean up and create a profile first
    const db = await getDb();
    if (db) {
      await db.delete(professionals).where(eq(professionals.userId, 996));
    }

    await caller.professional.create({
      name: "Original Name",
      email: "original@example.com",
      type: "broker",
      bio: "Original bio",
    });

    // Update the profile
    const result = await caller.professional.update({
      name: "Updated Name",
      bio: "Updated bio with more details",
      profilePhotoUrl: "https://example.com/photos/updated.jpg",
      yearsExperience: 20,
      dealsCompleted: 50,
    });

    expect(result.success).toBe(true);

    // Verify the updates
    if (db) {
      const profile = await db
        .select()
        .from(professionals)
        .where(eq(professionals.userId, 996))
        .limit(1);

      expect(profile[0]?.name).toBe("Updated Name");
      expect(profile[0]?.bio).toBe("Updated bio with more details");
      expect(profile[0]?.profilePhotoUrl).toBe("https://example.com/photos/updated.jpg");
      expect(profile[0]?.yearsExperience).toBe(20);
      expect(profile[0]?.dealsCompleted).toBe(50);
      // Original fields should remain
      expect(profile[0]?.email).toBe("original@example.com");
      expect(profile[0]?.type).toBe("broker");
    }
  });

  it("rejects update when no profile exists", async () => {
    const { ctx } = createAuthContext(995);
    const caller = appRouter.createCaller(ctx);

    // Clean up to ensure no profile exists
    const db = await getDb();
    if (db) {
      await db.delete(professionals).where(eq(professionals.userId, 995));
    }

    await expect(
      caller.professional.update({
        name: "Updated Name",
      })
    ).rejects.toThrow("Professional profile not found");
  });
});
