import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { platformDocuments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "email",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("platformDocuments", () => {
  beforeEach(async () => {
    // Clean up test documents before each test
    const db = await getDb();
    if (db) {
      await db.delete(platformDocuments).where(eq(platformDocuments.slug, "test-terms"));
      await db.delete(platformDocuments).where(eq(platformDocuments.slug, "test-privacy"));
    }
  });

  it("should allow admin to create a new document", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.platformDocuments.upsert({
      slug: "test-terms",
      title: "Test Terms of Service",
      content: "# Terms of Service\n\nTest content",
      isPublished: true,
    });

    expect(result.success).toBe(true);
    expect(result.document).toBeDefined();
    expect(result.document?.slug).toBe("test-terms");
    expect(result.document?.title).toBe("Test Terms of Service");
    expect(result.document?.version).toBe(1);
  });

  it("should increment version when updating existing document", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create initial document
    await caller.platformDocuments.upsert({
      slug: "test-terms",
      title: "Test Terms",
      content: "Version 1",
      isPublished: true,
    });

    // Update document
    const result = await caller.platformDocuments.upsert({
      slug: "test-terms",
      title: "Test Terms Updated",
      content: "Version 2",
      isPublished: true,
    });

    expect(result.success).toBe(true);
    expect(result.document?.version).toBe(2);
    expect(result.document?.title).toBe("Test Terms Updated");
  });

  it("should allow public users to view published documents", async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    // Admin creates a published document
    await adminCaller.platformDocuments.upsert({
      slug: "test-privacy",
      title: "Privacy Policy",
      content: "# Privacy Policy\n\nPublic content",
      isPublished: true,
    });

    // Public user tries to view it
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    const result = await publicCaller.platformDocuments.getBySlug({
      slug: "test-privacy",
    });

    expect(result).toBeDefined();
    expect(result.slug).toBe("test-privacy");
    expect(result.title).toBe("Privacy Policy");
  });

  it("should not allow public users to view unpublished documents", async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    // Admin creates an unpublished document
    await adminCaller.platformDocuments.upsert({
      slug: "test-privacy",
      title: "Privacy Policy Draft",
      content: "# Privacy Policy\n\nDraft content",
      isPublished: false,
    });

    // Public user tries to view it
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    await expect(
      publicCaller.platformDocuments.getBySlug({ slug: "test-privacy" })
    ).rejects.toThrow();
  });

  it("should allow admin to toggle publish status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create published document
    await caller.platformDocuments.upsert({
      slug: "test-terms",
      title: "Test Terms",
      content: "Content",
      isPublished: true,
    });

    // Toggle to unpublished
    const result1 = await caller.platformDocuments.togglePublish({
      slug: "test-terms",
    });
    expect(result1.isPublished).toBe(false);

    // Toggle back to published
    const result2 = await caller.platformDocuments.togglePublish({
      slug: "test-terms",
    });
    expect(result2.isPublished).toBe(true);
  });

  it("should allow admin to delete documents", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create document
    await caller.platformDocuments.upsert({
      slug: "test-terms",
      title: "Test Terms",
      content: "Content",
      isPublished: true,
    });

    // Delete document
    const result = await caller.platformDocuments.delete({
      slug: "test-terms",
    });
    expect(result.success).toBe(true);

    // Verify it's deleted
    await expect(
      caller.platformDocuments.getBySlug({ slug: "test-terms" })
    ).rejects.toThrow();
  });
});
