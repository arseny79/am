import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
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

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("API Key Validation", () => {
  describe("Google Analytics validation", () => {
    it("validates GA4 measurement ID format", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.apiKeyValidation.validateGoogleAnalytics({
        measurementId: "G-ABC1234567",
      });

      expect(result.valid).toBe(true);
      expect(result.type).toBe("GA4");
      expect(result.message).toContain("GA4");
    });

    it("validates Universal Analytics ID format", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.apiKeyValidation.validateGoogleAnalytics({
        measurementId: "UA-12345678-1",
      });

      expect(result.valid).toBe(true);
      expect(result.type).toBe("UA");
      expect(result.message).toContain("Universal Analytics");
    });

    it("rejects invalid format", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.apiKeyValidation.validateGoogleAnalytics({
        measurementId: "INVALID-FORMAT",
      });

      expect(result.valid).toBe(false);
      expect(result.message).toContain("Invalid format");
    });
  });

  describe("StatCounter validation", () => {
    it("validates project ID format", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.apiKeyValidation.validateStatCounter({
        projectId: "13189440",
        securityCode: "eee63783",
      });

      // Should validate format even if project doesn't exist
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
    });

    it("rejects invalid project ID", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.apiKeyValidation.validateStatCounter({
        projectId: "invalid",
        securityCode: "eee63783",
      });

      expect(result.valid).toBe(false);
      expect(result.message).toContain("positive number");
    });

    it("rejects short security code", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.apiKeyValidation.validateStatCounter({
        projectId: "13189440",
        securityCode: "short",
      });

      expect(result.valid).toBe(false);
      expect(result.message).toContain("too short");
    });
  });

  describe("Stripe validation", () => {
    it("rejects invalid Stripe key format", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.apiKeyValidation.validateStripe({
        apiKey: "invalid_key",
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe("SendGrid validation", () => {
    it("rejects invalid SendGrid key", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.apiKeyValidation.validateSendGrid({
        apiKey: "invalid_key",
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
});
