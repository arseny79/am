import { describe, expect, it } from "vitest";
import { getTemplateForStage, calculateDueDate, DEAL_STAGE_TEMPLATES } from "@shared/dealStageTemplates";

describe("Deal Stage Templates", () => {
  it("should return action items for initial_contact stage", () => {
    const templates = getTemplateForStage("initial_contact");
    
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]?.title).toContain("Schedule");
  });

  it("should return action items for nda_signed stage", () => {
    const templates = getTemplateForStage("nda_signed");
    
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some(t => t.title.toLowerCase().includes("nda"))).toBe(true);
  });

  it("should return action items for due_diligence stage", () => {
    const templates = getTemplateForStage("due_diligence");
    
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some(t => t.assignedTo === "buyer")).toBe(true);
    expect(templates.some(t => t.assignedTo === "seller")).toBe(true);
  });

  it("should return action items for escrow stage", () => {
    const templates = getTemplateForStage("escrow");
    
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some(t => t.title.toLowerCase().includes("escrow"))).toBe(true);
  });

  it("should return action items for closing stage", () => {
    const templates = getTemplateForStage("closing");
    
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some(t => t.priority === "high")).toBe(true);
  });

  it("should return empty array for unknown stage", () => {
    const templates = getTemplateForStage("unknown_stage");
    
    expect(templates).toBeDefined();
    expect(templates.length).toBe(0);
  });

  it("should calculate due date correctly", () => {
    const dueDate = calculateDueDate(7);
    
    expect(dueDate).toBeInstanceOf(Date);
    
    const today = new Date();
    const expected = new Date();
    expected.setDate(today.getDate() + 7);
    
    // Check if dates are within 1 second of each other (to account for test execution time)
    const diff = Math.abs(dueDate!.getTime() - expected.getTime());
    expect(diff).toBeLessThan(1000);
  });

  it("should return null for undefined dueInDays", () => {
    const dueDate = calculateDueDate(undefined);
    
    expect(dueDate).toBeNull();
  });

  it("should have templates for all major deal stages", () => {
    const stages = ["initial_contact", "nda_signed", "due_diligence", "negotiation", "escrow", "closing", "closed"];
    
    stages.forEach(stage => {
      const templates = getTemplateForStage(stage);
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  it("should have proper assignedTo values", () => {
    DEAL_STAGE_TEMPLATES.forEach(template => {
      template.actionItems.forEach(item => {
        expect(["buyer", "seller", "both"]).toContain(item.assignedTo);
      });
    });
  });

  it("should have proper priority values", () => {
    DEAL_STAGE_TEMPLATES.forEach(template => {
      template.actionItems.forEach(item => {
        expect(["low", "medium", "high"]).toContain(item.priority);
      });
    });
  });
});
