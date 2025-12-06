import { describe, expect, it } from "vitest";
import { generateSitemap } from "./sitemap";

describe("Sitemap Generation", () => {
  it("should generate valid XML sitemap", async () => {
    const xml = await generateSitemap("https://msp.investments");
    
    // Check XML declaration
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    
    // Check namespace
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    
    // Check closing tag
    expect(xml).toContain('</urlset>');
  });

  it("should include all static pages", async () => {
    const xml = await generateSitemap("https://msp.investments");
    
    // Check all static pages are included
    expect(xml).toContain('<loc>https://msp.investments/</loc>');
    expect(xml).toContain('<loc>https://msp.investments/marketplace</loc>');
    expect(xml).toContain('<loc>https://msp.investments/buy-asset</loc>');
    expect(xml).toContain('<loc>https://msp.investments/create-listing</loc>');
    expect(xml).toContain('<loc>https://msp.investments/pricing</loc>');
    expect(xml).toContain('<loc>https://msp.investments/valuation-tool</loc>');
    expect(xml).toContain('<loc>https://msp.investments/how-it-works</loc>');
  });

  it("should include priority and changefreq for pages", async () => {
    const xml = await generateSitemap("https://msp.investments");
    
    // Homepage should have highest priority
    expect(xml).toContain('<priority>1.0</priority>');
    
    // Should have changefreq values
    expect(xml).toContain('<changefreq>daily</changefreq>');
    expect(xml).toContain('<changefreq>hourly</changefreq>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
    expect(xml).toContain('<changefreq>monthly</changefreq>');
  });

  it("should use custom base URL", async () => {
    const customUrl = "https://custom.example.com";
    const xml = await generateSitemap(customUrl);
    
    expect(xml).toContain(`<loc>${customUrl}/</loc>`);
    expect(xml).toContain(`<loc>${customUrl}/marketplace</loc>`);
  });

  it("should escape XML special characters in URLs", async () => {
    // The generateSitemap function should handle escaping
    const xml = await generateSitemap("https://msp.investments");
    
    // Should not contain unescaped special characters
    expect(xml).not.toMatch(/<loc>[^<]*&[^a][^m][^p];/); // & not followed by amp;
    expect(xml).not.toMatch(/<loc>[^<]*<[^/]/); // < not part of tag
  });

  it("should generate well-formed XML structure", async () => {
    const xml = await generateSitemap("https://msp.investments");
    
    // Count opening and closing url tags
    const openingTags = (xml.match(/<url>/g) || []).length;
    const closingTags = (xml.match(/<\/url>/g) || []).length;
    
    expect(openingTags).toBeGreaterThan(0);
    expect(openingTags).toBe(closingTags);
  });
});
