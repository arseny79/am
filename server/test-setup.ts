/**
 * Test Setup - Database Isolation
 * 
 * This file provides utilities to prevent tests from modifying production data.
 * Tests that modify siteSettings should use mocked data instead of the real database.
 */

import { vi } from "vitest";

// Store for mocked site settings
let mockSiteSettings: Record<string, any> = {
  id: 1,
  googleAnalyticsId: null,
  statcounterId: null,
  statcounterSecurity: null,
  updatedAt: new Date().toISOString(),
  updatedBy: null,
  seoTitle: null,
  seoDescription: null,
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  logoUrl: null,
  heroHeadline: null,
  heroSubheadline: null,
  heroDescription: null,
  heroPrimaryButtonText: null,
  heroPrimaryButtonUrl: null,
  heroSecondaryButtonText: null,
  heroSecondaryButtonUrl: null,
  statGmv: null,
  statActiveListings: null,
  statEscrowProtected: null,
  valuationDataSources: null,
  valuationDisclaimer: null,
  valuationToolHeading: null,
  valuationToolSubheading: null,
  marketplaceHeading: null,
  marketplaceSubheading: null,
  buyAssetHeading: null,
  buyAssetSubheading: null,
  statGmvLabel: null,
  statActiveListingsLabel: null,
  statEscrowProtectedLabel: null,
};

/**
 * Reset mock site settings to default values
 */
export function resetMockSiteSettings() {
  mockSiteSettings = {
    id: 1,
    googleAnalyticsId: null,
    statcounterId: null,
    statcounterSecurity: null,
    updatedAt: new Date().toISOString(),
    updatedBy: null,
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    logoUrl: null,
    heroHeadline: null,
    heroSubheadline: null,
    heroDescription: null,
    heroPrimaryButtonText: null,
    heroPrimaryButtonUrl: null,
    heroSecondaryButtonText: null,
    heroSecondaryButtonUrl: null,
    statGmv: null,
    statActiveListings: null,
    statEscrowProtected: null,
    valuationDataSources: null,
    valuationDisclaimer: null,
    valuationToolHeading: null,
    valuationToolSubheading: null,
    marketplaceHeading: null,
    marketplaceSubheading: null,
    buyAssetHeading: null,
    buyAssetSubheading: null,
    statGmvLabel: null,
    statActiveListingsLabel: null,
    statEscrowProtectedLabel: null,
  };
}

/**
 * Get current mock site settings
 */
export function getMockSiteSettings() {
  return { ...mockSiteSettings };
}

/**
 * Update mock site settings (simulates database update)
 */
export function updateMockSiteSettings(updates: Partial<typeof mockSiteSettings>, userId?: number) {
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      mockSiteSettings[key] = value;
    }
  }
  mockSiteSettings.updatedAt = new Date().toISOString();
  if (userId) {
    mockSiteSettings.updatedBy = userId;
  }
  return { ...mockSiteSettings };
}

/**
 * Check if we're in a test environment
 */
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}
