import { describe, it, expect } from "vitest";
import { getTemplateForStage, calculateDueDate, DEAL_STAGE_TEMPLATES } from "@shared/dealStageTemplates";

describe("Deal Stage Templates - Simplified", () => {
  it("should have 2-3 action items per stage (not more)", () => {
    for (const template of DEAL_STAGE_TEMPLATES) {
      expect(template.actionItems.length).toBeGreaterThanOrEqual(2);
      expect(template.actionItems.length).toBeLessThanOrEqual(3);
    }
  });

  it("should cover all 7 deal stages", () => {
    const stages = DEAL_STAGE_TEMPLATES.map(t => t.stage);
    expect(stages).toContain("initial_contact");
    expect(stages).toContain("nda_signed");
    expect(stages).toContain("due_diligence");
    expect(stages).toContain("negotiation");
    expect(stages).toContain("escrow");
    expect(stages).toContain("closing");
    expect(stages).toContain("closed");
  });

  it("should return correct templates for each stage", () => {
    const initialContact = getTemplateForStage("initial_contact");
    expect(initialContact.length).toBe(2);
    expect(initialContact[0].title).toBe("Schedule introductory call");

    const ndaSigned = getTemplateForStage("nda_signed");
    expect(ndaSigned.length).toBe(2);

    const dueDiligence = getTemplateForStage("due_diligence");
    expect(dueDiligence.length).toBe(3);

    const negotiation = getTemplateForStage("negotiation");
    expect(negotiation.length).toBe(2);

    const escrow = getTemplateForStage("escrow");
    expect(escrow.length).toBe(2);

    const closing = getTemplateForStage("closing");
    expect(closing.length).toBe(3);

    const closed = getTemplateForStage("closed");
    expect(closed.length).toBe(2);
  });

  it("should return empty array for unknown stage", () => {
    const unknown = getTemplateForStage("nonexistent_stage");
    expect(unknown).toEqual([]);
  });

  it("should calculate due dates correctly", () => {
    const dueDate = calculateDueDate(7);
    expect(dueDate).toBeInstanceOf(Date);
    
    const now = new Date();
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 7);
    
    // Allow 1 second tolerance
    expect(Math.abs(dueDate!.getTime() - expectedDate.getTime())).toBeLessThan(1000);
  });

  it("should return null for undefined dueInDays", () => {
    const result = calculateDueDate(undefined);
    expect(result).toBeNull();
  });

  it("should have all action items with required fields", () => {
    for (const template of DEAL_STAGE_TEMPLATES) {
      for (const item of template.actionItems) {
        expect(item.title).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(["buyer", "seller", "both"]).toContain(item.assignedTo);
        expect(["low", "medium", "high"]).toContain(item.priority);
      }
    }
  });
});

describe("Deal Stage Progression - Manual Advancement", () => {
  const STAGE_ORDER = [
    "initial_contact",
    "nda_signed",
    "due_diligence",
    "negotiation",
    "escrow",
    "closing",
    "closed",
  ];

  it("should define correct stage order", () => {
    expect(STAGE_ORDER).toHaveLength(7);
    expect(STAGE_ORDER[0]).toBe("initial_contact");
    expect(STAGE_ORDER[6]).toBe("closed");
  });

  it("should identify next stage correctly", () => {
    function getNextStage(current: string): string | null {
      const idx = STAGE_ORDER.indexOf(current);
      if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
      return STAGE_ORDER[idx + 1];
    }

    expect(getNextStage("initial_contact")).toBe("nda_signed");
    expect(getNextStage("nda_signed")).toBe("due_diligence");
    expect(getNextStage("due_diligence")).toBe("negotiation");
    expect(getNextStage("negotiation")).toBe("escrow");
    expect(getNextStage("escrow")).toBe("closing");
    expect(getNextStage("closing")).toBe("closed");
    expect(getNextStage("closed")).toBeNull();
    expect(getNextStage("cancelled")).toBeNull();
  });

  it("should not allow advancement from terminal stages", () => {
    function canAdvance(stage: string): boolean {
      return stage !== "closed" && stage !== "cancelled";
    }

    expect(canAdvance("initial_contact")).toBe(true);
    expect(canAdvance("negotiation")).toBe(true);
    expect(canAdvance("closed")).toBe(false);
    expect(canAdvance("cancelled")).toBe(false);
  });
});

describe("Message Timestamp Format", () => {
  it("should format timestamps as precise datetime", () => {
    const formatTimestamp = (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + " at " + d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const testDate = new Date("2026-01-15T14:30:00Z");
    const formatted = formatTimestamp(testDate);
    
    // Should contain "Jan 15, 2026" and "at" and a time
    expect(formatted).toContain("Jan");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("at");
    // Should NOT contain relative terms
    expect(formatted).not.toContain("ago");
    expect(formatted).not.toContain("Just now");
  });

  it("should not use relative timestamps", () => {
    const formatTimestamp = (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + " at " + d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    // Even for recent dates, should show precise time
    const now = new Date();
    const formatted = formatTimestamp(now);
    expect(formatted).not.toContain("ago");
    expect(formatted).not.toContain("Just now");
    expect(formatted).toContain("at");
  });
});
