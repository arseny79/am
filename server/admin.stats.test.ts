import { describe, expect, it, beforeEach } from "vitest";
import { 
  resetMockSiteSettings, 
  getMockSiteSettings, 
  updateMockSiteSettings 
} from "./test-setup";

/**
 * Homepage Stats Tests
 * 
 * IMPORTANT: These tests use mocked data to prevent modifying production database.
 * The mock functions simulate the database behavior without actually writing to it.
 */

describe("admin.updateSiteSettings - Homepage Stats (mocked)", () => {
  beforeEach(() => {
    // Reset mock data before each test
    resetMockSiteSettings();
  });

  it("saves homepage stats successfully", () => {
    updateMockSiteSettings({
      statGmv: "$5M+",
      statGmvLabel: "Total GMV",
      statActiveListings: "15+",
      statActiveListingsLabel: "Active Listings",
      statEscrowProtected: "100% Secure Transactions",
      statEscrowProtectedLabel: "Escrow Protected",
    });

    const saved = getMockSiteSettings();
    expect(saved.statGmv).toBe("$5M+");
    expect(saved.statGmvLabel).toBe("Total GMV");
    expect(saved.statActiveListings).toBe("15+");
    expect(saved.statActiveListingsLabel).toBe("Active Listings");
    expect(saved.statEscrowProtected).toBe("100% Secure Transactions");
    expect(saved.statEscrowProtectedLabel).toBe("Escrow Protected");
  });

  it("saves text descriptions as stat values", () => {
    updateMockSiteSettings({
      statGmv: "Seller-controlled visibility",
      statGmvLabel: "",
      statActiveListings: "Secure document sharing",
      statActiveListingsLabel: "",
      statEscrowProtected: "Escrow supported",
      statEscrowProtectedLabel: "",
    });

    const saved = getMockSiteSettings();
    expect(saved.statGmv).toBe("Seller-controlled visibility");
    expect(saved.statActiveListings).toBe("Secure document sharing");
    expect(saved.statEscrowProtected).toBe("Escrow supported");
  });

  it("supports partial updates for stats fields", () => {
    // Set initial values
    updateMockSiteSettings({
      statGmv: "$2M+",
      statActiveListings: "7+",
      statEscrowProtected: "Escrow Protected",
    });

    // Update only GMV
    updateMockSiteSettings({
      statGmv: "$10M+",
    });

    const saved = getMockSiteSettings();
    expect(saved.statGmv).toBe("$10M+");
    // Other fields should remain unchanged
    expect(saved.statActiveListings).toBe("7+");
    expect(saved.statEscrowProtected).toBe("Escrow Protected");
  });

  it("allows clearing stats fields by setting to null", () => {
    // Set initial values
    updateMockSiteSettings({
      statGmv: "$5M+",
      statActiveListings: "15+",
    });

    // Clear GMV
    updateMockSiteSettings({
      statGmv: null,
    });

    const saved = getMockSiteSettings();
    expect(saved.statGmv).toBeNull();
    expect(saved.statActiveListings).toBe("15+");
  });

  it("records which admin user updated stats settings", () => {
    const adminUserId = 1;
    
    updateMockSiteSettings({
      statGmv: "$5M+",
    }, adminUserId);

    const saved = getMockSiteSettings();
    expect(saved.updatedBy).toBe(adminUserId);
  });

  it("handles stats updates independently from other settings", () => {
    // Set hero content
    updateMockSiteSettings({
      heroHeadline: "Test Headline",
      heroSubheadline: "Test Subheadline",
    });

    // Update stats without affecting hero content
    updateMockSiteSettings({
      statGmv: "$5M+",
      statActiveListings: "15+",
    });

    const saved = getMockSiteSettings();
    expect(saved.heroHeadline).toBe("Test Headline");
    expect(saved.heroSubheadline).toBe("Test Subheadline");
    expect(saved.statGmv).toBe("$5M+");
    expect(saved.statActiveListings).toBe("15+");
  });
});
