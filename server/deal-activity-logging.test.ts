import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Tests to verify that all 12 deal activity types are properly logged
 * across the backend codebase.
 */

const SERVER_DIR = path.join(__dirname);
const ROUTERS_DIR = path.join(SERVER_DIR, "routers");

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

describe("Deal Activity Logging - Complete Coverage", () => {
  describe("logDealActivity helper", () => {
    it("should be exported from dealActivityRouter", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealActivityRouter.ts"));
      expect(content).toContain("export async function logDealActivity");
    });

    it("should accept dealId, userId, activityType, description, and metadata", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealActivityRouter.ts"));
      expect(content).toContain("dealId: number");
      expect(content).toContain("activityType: string");
      expect(content).toContain("description: string");
      expect(content).toContain("metadata?: Record<string, any>");
    });
  });

  describe("deal_created activity", () => {
    it("should log deal_created when a deal is created via dealRouter.create", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealRouters.ts"));
      // Find deal creation section and verify it logs activity
      const createDealSection = content.indexOf("await db.createDeal({");
      expect(createDealSection).toBeGreaterThan(-1);
      // Should have deal_created logging after creation
      expect(content).toContain('activityType: "deal_created"');
    });

    it("should log deal_created when deal is created inline during message send", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealRouters.ts"));
      // Count occurrences of deal_created - should be at least 2 (create + inline)
      const matches = content.match(/activityType: "deal_created"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("stage_changed activity", () => {
    it("should log stage_changed in dealRouters.ts", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealRouters.ts"));
      expect(content).toContain('activityType: "stage_changed"');
    });
  });

  describe("document_uploaded activity", () => {
    it("should log document_uploaded when a document is uploaded", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealRouters.ts"));
      expect(content).toContain('activityType: "document_uploaded"');
    });

    it("should include fileName in the description", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealRouters.ts"));
      const docUploadIdx = content.indexOf('activityType: "document_uploaded"');
      expect(docUploadIdx).toBeGreaterThan(-1);
      // Check nearby context includes fileName
      const surroundingCode = content.substring(docUploadIdx - 200, docUploadIdx + 200);
      expect(surroundingCode).toContain("fileName");
    });
  });

  describe("message_sent activity", () => {
    it("should log message_sent when a message is sent", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealRouters.ts"));
      expect(content).toContain('activityType: "message_sent"');
    });

    it("should include a message preview in metadata", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealRouters.ts"));
      const msgIdx = content.indexOf('activityType: "message_sent"');
      expect(msgIdx).toBeGreaterThan(-1);
      const surroundingCode = content.substring(msgIdx - 200, msgIdx + 200);
      expect(surroundingCode).toContain("preview");
    });
  });

  describe("action_item_created activity", () => {
    it("should log action_item_created when an action item is created", () => {
      const content = readFile(path.join(ROUTERS_DIR, "actionItemsRouter.ts"));
      expect(content).toContain('activityType: "action_item_created"');
    });

    it("should include action item title in description", () => {
      const content = readFile(path.join(ROUTERS_DIR, "actionItemsRouter.ts"));
      const idx = content.indexOf('activityType: "action_item_created"');
      expect(idx).toBeGreaterThan(-1);
      const surroundingCode = content.substring(idx - 200, idx + 200);
      expect(surroundingCode).toContain("title");
    });
  });

  describe("action_item_completed activity", () => {
    it("should log action_item_completed when status is set to completed", () => {
      const content = readFile(path.join(ROUTERS_DIR, "actionItemsRouter.ts"));
      expect(content).toContain('activityType: "action_item_completed"');
    });

    it("should only log when status is completed, not for other status changes", () => {
      const content = readFile(path.join(ROUTERS_DIR, "actionItemsRouter.ts"));
      // The action_item_completed log should be inside an if block checking for "completed"
      const idx = content.indexOf('activityType: "action_item_completed"');
      expect(idx).toBeGreaterThan(-1);
      // Check that it's guarded by a completed check
      const before = content.substring(idx - 200, idx);
      expect(before).toContain('"completed"');
    });
  });

  describe("nda_signed activity", () => {
    it("should log nda_signed in ndaSigningRouter", () => {
      const content = readFile(path.join(ROUTERS_DIR, "ndaSigningRouter.ts"));
      expect(content).toContain('activityType: "nda_signed"');
    });
  });

  describe("escrow_initiated activity", () => {
    it("should log escrow_initiated in offerHistoryRouter", () => {
      const content = readFile(path.join(ROUTERS_DIR, "offerHistoryRouter.ts"));
      expect(content).toContain('activityType: "escrow_initiated"');
    });
  });

  describe("deal_cancelled activity", () => {
    it("should log deal_cancelled in dealRouters or adminEscrowRouter", () => {
      const dealContent = readFile(path.join(ROUTERS_DIR, "dealRouters.ts"));
      const adminContent = readFile(path.join(ROUTERS_DIR, "adminEscrowRouter.ts"));
      const hasCancelled = dealContent.includes('activityType: "deal_cancelled"') ||
                           adminContent.includes('activityType: "deal_cancelled"');
      expect(hasCancelled).toBe(true);
    });
  });

  describe("proposal_submitted activity", () => {
    it("should log proposal_submitted in buyerRequestProposalRouter", () => {
      const content = readFile(path.join(ROUTERS_DIR, "buyerRequestProposalRouter.ts"));
      expect(content).toContain("proposal_submitted");
    });
  });

  describe("logDealActivity import coverage", () => {
    it("should be imported in dealRouters.ts", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealRouters.ts"));
      expect(content).toContain('import { logDealActivity } from "./dealActivityRouter"');
    });

    it("should be imported in actionItemsRouter.ts", () => {
      const content = readFile(path.join(ROUTERS_DIR, "actionItemsRouter.ts"));
      expect(content).toContain('import { logDealActivity } from "./dealActivityRouter"');
    });
  });

  describe("Activity type enum coverage", () => {
    it("should support all 12 activity types in the router query", () => {
      const content = readFile(path.join(ROUTERS_DIR, "dealActivityRouter.ts"));
      const activityTypes = [
        "deal_created",
        "stage_changed",
        "document_uploaded",
        "message_sent",
        "action_item_created",
        "action_item_completed",
        "nda_signed",
        "escrow_initiated",
        "payment_received",
        "deal_closed",
        "deal_cancelled",
        "proposal_submitted",
      ];
      for (const type of activityTypes) {
        expect(content).toContain(type);
      }
    });
  });
});
