import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { siteSettings } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const adminUser: AuthenticatedUser = {
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

  const ctx: TrpcContext = {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

// Builds a syntactically valid base64 PNG-ish data URL of roughly the requested byte size.
function buildDataUrl(sizeInBytes: number, mimeType = "image/png"): string {
  // base64 encodes 3 bytes as 4 chars, so approximate the raw byte count needed.
  const rawByteCount = Math.ceil((sizeInBytes * 3) / 4);
  const buffer = Buffer.alloc(rawByteCount, 1);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

describe("admin.updateLogo", () => {
  it("rejects an oversized (>2MB) payload with BAD_REQUEST mentioning 2MB", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const oversizedDataUrl = buildDataUrl(3 * 1024 * 1024); // 3MB, well over the 2MB cap

    expect.assertions(3);
    try {
      await caller.admin.updateLogo({
        fileData: oversizedDataUrl,
        fileName: "logo.png",
        mimeType: "image/png",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
      expect((error as TRPCError).message).toMatch(/2MB/);
    }
  });

  it("rejects an invalid MIME type with BAD_REQUEST", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const smallDataUrl = buildDataUrl(1024, "application/pdf");

    expect.assertions(2);
    try {
      await caller.admin.updateLogo({
        fileData: smallDataUrl,
        fileName: "document.pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
    }
  });

  it("rejects a malformed data URL with BAD_REQUEST", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    expect.assertions(2);
    try {
      await caller.admin.updateLogo({
        fileData: "not-a-data-url",
        fileName: "logo.png",
        mimeType: "image/png",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
    }
  });

  describe("valid payload between 500KB and 2MB", () => {
    // Requires a reachable, migrated test database (siteSettings.logoUrl must already be
    // LONGTEXT, or a >500KB payload will fail with ER_DATA_TOO_LONG). Save/restore the
    // original row so this test doesn't leave test data behind.
    let originalLogoUrl: string | null | undefined;
    let hadExistingRow = false;

    beforeEach(async () => {
      const db = await getDb();
      if (db) {
        const existing = await db.select().from(siteSettings).limit(1);
        if (existing.length > 0) {
          hadExistingRow = true;
          originalLogoUrl = existing[0].logoUrl;
        }
      }
    });

    afterEach(async () => {
      const db = await getDb();
      if (db && hadExistingRow) {
        await db.update(siteSettings).set({ logoUrl: originalLogoUrl ?? null });
      }
    });

    it("accepts a payload sized between 500KB and 2MB and stores it as a data URL", async () => {
      const db = await getDb();
      if (!db) {
        console.warn("[logoUpload.test] Skipping DB-backed storage assertion: DATABASE_URL is not configured");
        return;
      }

      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const midSizedDataUrl = buildDataUrl(1024 * 1024); // 1MB — over the old 500KB ceiling, under the new 2MB cap

      const result = await caller.admin.updateLogo({
        fileData: midSizedDataUrl,
        fileName: "logo.png",
        mimeType: "image/png",
      });

      expect(result.success).toBe(true);
      expect(result.logoUrl).toMatch(/^data:image\/png;base64,/);

      const saved = await caller.admin.getSiteSettings();
      expect(saved.logoUrl).toBe(result.logoUrl);
    });
  });
});
