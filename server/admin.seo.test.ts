import { describe, expect, it, beforeEach, vi } from "vitest";
import { 
  resetMockSiteSettings, 
  getMockSiteSettings, 
  updateMockSiteSettings 
} from "./test-setup";

/**
 * SEO Settings Tests
 * 
 * IMPORTANT: These tests use mocked data to prevent modifying production database.
 * The mock functions simulate the database behavior without actually writing to it.
 */

describe("admin.siteSettings - SEO metadata (mocked)", () => {
  beforeEach(() => {
    // Reset mock data before each test
    resetMockSiteSettings();
  });

  it("returns default empty values for SEO fields when no settings exist", () => {
    const settings = getMockSiteSettings();

    expect(settings.seoTitle).toBeNull();
    expect(settings.seoDescription).toBeNull();
    expect(settings.ogTitle).toBeNull();
    expect(settings.ogDescription).toBeNull();
    expect(settings.ogImage).toBeNull();
  });

  it("saves SEO metadata successfully", () => {
    updateMockSiteSettings({
      seoTitle: "MSP M&A Marketplace - Buy & Sell MSP Businesses",
      seoDescription: "Discover MSP businesses for sale. Connect with serious buyers and sellers.",
      ogTitle: "Buy or Sell Your MSP Business with Confidence",
      ogDescription: "The simplest way to connect with serious buyers and sellers.",
      ogImage: "https://example.com/og-image.png",
    });

    const saved = getMockSiteSettings();
    expect(saved.seoTitle).toBe("MSP M&A Marketplace - Buy & Sell MSP Businesses");
    expect(saved.seoDescription).toBe("Discover MSP businesses for sale. Connect with serious buyers and sellers.");
    expect(saved.ogTitle).toBe("Buy or Sell Your MSP Business with Confidence");
    expect(saved.ogDescription).toBe("The simplest way to connect with serious buyers and sellers.");
    expect(saved.ogImage).toBe("https://example.com/og-image.png");
  });

  it("supports partial updates for SEO fields", () => {
    // Set initial values
    updateMockSiteSettings({
      seoTitle: "Initial Title",
      seoDescription: "Initial Description",
      ogTitle: "Initial OG Title",
    });

    // Update only seoTitle
    updateMockSiteSettings({
      seoTitle: "Updated Title",
    });

    const saved = getMockSiteSettings();
    expect(saved.seoTitle).toBe("Updated Title");
    // Other fields should remain unchanged
    expect(saved.seoDescription).toBe("Initial Description");
    expect(saved.ogTitle).toBe("Initial OG Title");
  });

  it("allows clearing SEO fields by setting to null", () => {
    // Set initial values
    updateMockSiteSettings({
      seoTitle: "Test Title",
      ogImage: "https://example.com/image.png",
    });

    // Clear seoTitle
    updateMockSiteSettings({
      seoTitle: null,
    });

    const saved = getMockSiteSettings();
    expect(saved.seoTitle).toBeNull();
    expect(saved.ogImage).toBe("https://example.com/image.png");
  });

  it("handles long SEO content correctly", () => {
    const longTitle = "A".repeat(200); // Max length for varchar(200)
    const longDescription = "B".repeat(500); // Text field, no limit

    updateMockSiteSettings({
      seoTitle: longTitle,
      seoDescription: longDescription,
    });

    const saved = getMockSiteSettings();
    expect(saved.seoTitle).toBe(longTitle);
    expect(saved.seoDescription).toBe(longDescription);
  });

  it("records which admin user updated SEO settings", () => {
    const adminUserId = 1;
    
    updateMockSiteSettings({
      seoTitle: "Test Title",
    }, adminUserId);

    const saved = getMockSiteSettings();
    expect(saved.updatedBy).toBe(adminUserId);
  });
});
