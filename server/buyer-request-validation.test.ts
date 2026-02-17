import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Buyer Request Form Validation (BuyAsset.tsx)", () => {
  const buyAssetContent = readFileSync(
    join(__dirname, "../client/src/pages/BuyAsset.tsx"),
    "utf-8"
  );

  describe("Title field validation", () => {
    it("should have maxLength={200} on title input", () => {
      expect(buyAssetContent).toContain('maxLength={200}');
    });

    it("should show character counter for title", () => {
      expect(buyAssetContent).toContain("formData.title.length");
      expect(buyAssetContent).toContain("/200 characters");
    });

    it("should show green text when title meets minimum (10 chars)", () => {
      expect(buyAssetContent).toContain("formData.title.length >= 10 ? 'text-green-600'");
    });

    it("should show amber text when title is partially filled but below minimum", () => {
      expect(buyAssetContent).toContain("formData.title.length > 0 ? 'text-amber-500'");
    });

    it("should indicate minimum 10 characters in label", () => {
      expect(buyAssetContent).toContain("minimum 10 characters");
    });
  });

  describe("Description/Investment Thesis field validation", () => {
    it("should have maxLength={1000} on description textarea", () => {
      expect(buyAssetContent).toContain('maxLength={1000}');
    });

    it("should show character counter for description", () => {
      expect(buyAssetContent).toContain("formData.description.length");
      expect(buyAssetContent).toContain("/1000 characters");
    });

    it("should show green text when description meets minimum (50 chars)", () => {
      expect(buyAssetContent).toContain("formData.description.length >= 50 ? 'text-green-600'");
    });

    it("should show amber text when description is partially filled but below minimum", () => {
      expect(buyAssetContent).toContain("formData.description.length > 0 ? 'text-amber-500'");
    });

    it("should indicate minimum 50 characters in label", () => {
      expect(buyAssetContent).toContain("minimum 50 characters");
    });

    it("should label the field as Investment Thesis", () => {
      expect(buyAssetContent).toContain("Investment Thesis *");
    });
  });

  describe("Submit button validation", () => {
    it("should disable submit when title is too short", () => {
      expect(buyAssetContent).toContain("formData.title.length < 10");
    });

    it("should disable submit when description is too short", () => {
      expect(buyAssetContent).toContain("formData.description.length < 50");
    });

    it("should have both conditions in the disabled prop", () => {
      // The button disabled prop should check both title and description length
      expect(buyAssetContent).toMatch(
        /disabled=\{.*formData\.title\.length < 10.*formData\.description\.length < 50/s
      );
    });

    it("should show helpful validation message when requirements not met", () => {
      expect(buyAssetContent).toContain("Title needs at least 10 characters and Investment Thesis needs at least 50 characters");
      expect(buyAssetContent).toContain("Title needs at least 10 characters");
      expect(buyAssetContent).toContain("Investment Thesis needs at least 50 characters");
    });
  });

  describe("Requirement met feedback", () => {
    it("should show 'requirement met' text when title is long enough", () => {
      expect(buyAssetContent).toContain("requirement met");
    });

    it("should show 'more needed' text when title is too short", () => {
      expect(buyAssetContent).toContain("more needed");
    });
  });
});
