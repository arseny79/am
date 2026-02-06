import { describe, it, expect } from "vitest";

/**
 * Tests for verification status consistency across KYC approval flows.
 * These tests verify that the verificationStatus field is properly set
 * when KYC is approved through various paths.
 */

describe("Verification Status Consistency", () => {
  describe("KYC Approval should set verificationStatus", () => {
    it("kycRouter.adminApprove sets verificationStatus to 'verified'", async () => {
      // Read the kycRouter source to verify it includes verificationStatus in the update
      const fs = await import("fs");
      const path = await import("path");
      const routerPath = path.resolve(__dirname, "routers/kycRouter.ts");
      const source = fs.readFileSync(routerPath, "utf-8");
      
      // The adminApprove mutation should set verificationStatus when approving KYC
      expect(source).toContain("verificationStatus: 'verified'");
      expect(source).toContain("verificationTier: 'verified'");
      expect(source).toContain("verifiedAt: nowTimestamp()");
      expect(source).toContain("verificationExpiresAt:");
    });

    it("adminKYCRouter.approve sets verificationStatus to 'verified'", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const routerPath = path.resolve(__dirname, "routers/adminKYCRouter.ts");
      const source = fs.readFileSync(routerPath, "utf-8");
      
      expect(source).toContain("verificationStatus: 'verified'");
      expect(source).toContain("verificationTier: 'verified'");
      expect(source).toContain("verifiedAt: nowTimestamp()");
      expect(source).toContain("verificationExpiresAt:");
    });

    it("adminKYCReviewRouter.approve sets verificationStatus to 'verified'", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const routerPath = path.resolve(__dirname, "routers/adminKYCReviewRouter.ts");
      const source = fs.readFileSync(routerPath, "utf-8");
      
      expect(source).toContain("verificationStatus: 'verified'");
      expect(source).toContain("verificationTier: 'verified'");
      expect(source).toContain("verifiedAt:");
      expect(source).toContain("verificationExpiresAt:");
    });

    it("Stripe Identity webhook sets verificationStatus to 'verified'", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const webhookPath = path.resolve(__dirname, "stripe/webhook.ts");
      const source = fs.readFileSync(webhookPath, "utf-8");
      
      expect(source).toContain("verificationStatus: 'verified'");
      expect(source).toContain("verificationTier: 'verified'");
      expect(source).toContain("verifiedAt:");
      expect(source).toContain("verificationExpiresAt:");
    });
  });

  describe("Message sending uses verifiedProcedure", () => {
    it("dealMessage.send uses verifiedProcedure for authorization", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const routerPath = path.resolve(__dirname, "routers/dealRouters.ts");
      const source = fs.readFileSync(routerPath, "utf-8");
      
      // The message router should use verifiedProcedure
      expect(source).toContain("send: verifiedProcedure");
    });

    it("verifiedProcedure checks verificationStatus field", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const trpcPath = path.resolve(__dirname, "_core/trpc.ts");
      const source = fs.readFileSync(trpcPath, "utf-8");
      
      // The requireVerified middleware should check verificationStatus
      expect(source).toContain('ctx.user.verificationStatus !== "verified"');
    });
  });

  describe("Email URLs use correct domain", () => {
    it("no server files use VITE_FRONTEND_FORGE_API_URL for email URLs", async () => {
      const fs = await import("fs");
      const path = await import("path");
      
      // Check key files that send emails
      const filesToCheck = [
        "routers/kycRouter.ts",
        "routers/adminKYCRouter.ts",
        "routers/adminKYCReviewRouter.ts",
        "routers/dealRouters.ts",
        "routers/ndaSigningRouter.ts",
        "routers/accessRequestRouters.ts",
        "routers/buyerRequestProposalRouter.ts",
        "lib/emailService.ts",
        "lib/brokerOnboardingService.ts",
        "jobs/adminKYCNotification.ts",
        "jobs/kycReminderJob.ts",
        "stripe/webhook.ts",
      ];
      
      for (const file of filesToCheck) {
        const filePath = path.resolve(__dirname, file);
        if (fs.existsSync(filePath)) {
          const source = fs.readFileSync(filePath, "utf-8");
          // Should not use VITE_FRONTEND_FORGE_API_URL for constructing user-facing URLs
          const urlMatches = source.match(/VITE_FRONTEND_FORGE_API_URL.*(?:\/deal|\/listing|\/dashboard|\/verify|\/create)/g);
          expect(urlMatches, `${file} should not use VITE_FRONTEND_FORGE_API_URL for email URLs`).toBeNull();
        }
      }
    });
  });
});
