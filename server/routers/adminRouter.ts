import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { adminVerificationRouter } from "./adminVerificationRouter";
import { adminKYCRouter } from "./adminKYCRouter";
import { apiKeyValidationRouter } from "./apiKeyValidationRouter";
import { adminEscrowRouter } from "./adminEscrowRouter";
import { getDb } from "../db";
import { siteSettings, users } from "../../drizzle/schema";
import { desc, sql, and, gte, lte } from "drizzle-orm";
import { generateSitemap } from "../sitemap";

export const adminRouter = router({
  verification: adminVerificationRouter,
  kyc: adminKYCRouter,
  apiKeyValidation: apiKeyValidationRouter,
  escrow: adminEscrowRouter,
  // Get site settings (analytics configuration) - public so logo can be fetched by anyone
  getSiteSettings: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(siteSettings).limit(1);
    
    // Return first row or default empty values
    return result[0] || {
      id: 0,
      googleAnalyticsId: null,
      statcounterId: null,
      statcounterSecurity: null,
      updatedAt: new Date(),
      updatedBy: null,
    };
  }),

  // Update site settings (analytics configuration + SEO metadata)
  updateSiteSettings: adminProcedure
    .input(
      z.object({
        // Analytics
        googleAnalyticsId: z.string().nullable().optional(),
        statcounterId: z.string().nullable().optional(),
        statcounterSecurity: z.string().nullable().optional(),
        // SEO Metadata
        seoTitle: z.string().nullable().optional(),
        seoDescription: z.string().nullable().optional(),
        ogTitle: z.string().nullable().optional(),
        ogDescription: z.string().nullable().optional(),
        ogImage: z.string().nullable().optional(),
        // Homepage Hero Content
        heroHeadline: z.string().nullable().optional(),
        heroSubheadline: z.string().nullable().optional(),
        heroDescription: z.string().nullable().optional(),
        heroPrimaryButtonText: z.string().nullable().optional(),
        heroPrimaryButtonUrl: z.string().nullable().optional(),
        heroSecondaryButtonText: z.string().nullable().optional(),
        heroSecondaryButtonUrl: z.string().nullable().optional(),
        // Homepage Stats Section
        statGmv: z.string().nullable().optional(),
        statActiveListings: z.string().nullable().optional(),
        statEscrowProtected: z.string().nullable().optional(),
        // Valuation Tool Footer
        valuationDataSources: z.string().nullable().optional(),
        valuationDisclaimer: z.string().nullable().optional(),
        // Valuation Tool Header
        valuationToolHeading: z.string().nullable().optional(),
        valuationToolSubheading: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if settings row exists
      const existing = await db.select().from(siteSettings).limit(1);

      if (existing.length === 0) {
        // Insert new row
        await db.insert(siteSettings).values({
          googleAnalyticsId: input.googleAnalyticsId !== undefined ? input.googleAnalyticsId : null,
          statcounterId: input.statcounterId !== undefined ? input.statcounterId : null,
          statcounterSecurity: input.statcounterSecurity !== undefined ? input.statcounterSecurity : null,
          seoTitle: input.seoTitle !== undefined ? input.seoTitle : null,
          seoDescription: input.seoDescription !== undefined ? input.seoDescription : null,
          ogTitle: input.ogTitle !== undefined ? input.ogTitle : null,
          ogDescription: input.ogDescription !== undefined ? input.ogDescription : null,
          ogImage: input.ogImage !== undefined ? input.ogImage : null,
          heroHeadline: input.heroHeadline !== undefined ? input.heroHeadline : null,
          heroSubheadline: input.heroSubheadline !== undefined ? input.heroSubheadline : null,
          heroDescription: input.heroDescription !== undefined ? input.heroDescription : null,
          heroPrimaryButtonText: input.heroPrimaryButtonText !== undefined ? input.heroPrimaryButtonText : null,
          heroPrimaryButtonUrl: input.heroPrimaryButtonUrl !== undefined ? input.heroPrimaryButtonUrl : null,
          heroSecondaryButtonText: input.heroSecondaryButtonText !== undefined ? input.heroSecondaryButtonText : null,
          heroSecondaryButtonUrl: input.heroSecondaryButtonUrl !== undefined ? input.heroSecondaryButtonUrl : null,
          statGmv: input.statGmv !== undefined ? input.statGmv : null,
          statActiveListings: input.statActiveListings !== undefined ? input.statActiveListings : null,
          statEscrowProtected: input.statEscrowProtected !== undefined ? input.statEscrowProtected : null,
          valuationDataSources: input.valuationDataSources !== undefined ? input.valuationDataSources : null,
          valuationDisclaimer: input.valuationDisclaimer !== undefined ? input.valuationDisclaimer : null,
          valuationToolHeading: input.valuationToolHeading !== undefined ? input.valuationToolHeading : null,
          valuationToolSubheading: input.valuationToolSubheading !== undefined ? input.valuationToolSubheading : null,
          updatedBy: ctx.user.id,
        });
      } else {
        // Update existing row - only update fields that are provided
        const updateData: Record<string, unknown> = {
          updatedBy: ctx.user.id,
          updatedAt: new Date(),
        };
        
        // Only include fields that were explicitly provided in the input
        if (input.googleAnalyticsId !== undefined) {
          updateData.googleAnalyticsId = input.googleAnalyticsId;
        }
        if (input.statcounterId !== undefined) {
          updateData.statcounterId = input.statcounterId;
        }
        if (input.statcounterSecurity !== undefined) {
          updateData.statcounterSecurity = input.statcounterSecurity;
        }
        if (input.seoTitle !== undefined) {
          updateData.seoTitle = input.seoTitle;
        }
        if (input.seoDescription !== undefined) {
          updateData.seoDescription = input.seoDescription;
        }
        if (input.ogTitle !== undefined) {
          updateData.ogTitle = input.ogTitle;
        }
        if (input.ogDescription !== undefined) {
          updateData.ogDescription = input.ogDescription;
        }
        if (input.ogImage !== undefined) {
          updateData.ogImage = input.ogImage;
        }
        if (input.heroHeadline !== undefined) {
          updateData.heroHeadline = input.heroHeadline;
        }
        if (input.heroSubheadline !== undefined) {
          updateData.heroSubheadline = input.heroSubheadline;
        }
        if (input.heroDescription !== undefined) {
          updateData.heroDescription = input.heroDescription;
        }
        if (input.heroPrimaryButtonText !== undefined) {
          updateData.heroPrimaryButtonText = input.heroPrimaryButtonText;
        }
        if (input.heroPrimaryButtonUrl !== undefined) {
          updateData.heroPrimaryButtonUrl = input.heroPrimaryButtonUrl;
        }
        if (input.heroSecondaryButtonText !== undefined) {
          updateData.heroSecondaryButtonText = input.heroSecondaryButtonText;
        }
        if (input.heroSecondaryButtonUrl !== undefined) {
          updateData.heroSecondaryButtonUrl = input.heroSecondaryButtonUrl;
        }
        if (input.statGmv !== undefined) {
          updateData.statGmv = input.statGmv;
        }
        if (input.statActiveListings !== undefined) {
          updateData.statActiveListings = input.statActiveListings;
        }
        if (input.statEscrowProtected !== undefined) {
          updateData.statEscrowProtected = input.statEscrowProtected;
        }
        if (input.valuationDataSources !== undefined) {
          updateData.valuationDataSources = input.valuationDataSources;
        }
        if (input.valuationDisclaimer !== undefined) {
          updateData.valuationDisclaimer = input.valuationDisclaimer;
        }
        if (input.valuationToolHeading !== undefined) {
          updateData.valuationToolHeading = input.valuationToolHeading;
        }
        if (input.valuationToolSubheading !== undefined) {
          updateData.valuationToolSubheading = input.valuationToolSubheading;
        }
        
        await db.update(siteSettings).set(updateData);
      }

      return { success: true };
    }),

  // Get TOS acceptance audit log for compliance reporting
  getTOSAcceptanceAuditLog: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(), // ISO date string
        acceptanceStatus: z.enum(["all", "accepted", "not_accepted"]).optional().default("all"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Build filter conditions
      const conditions = [];
      
      if (input.acceptanceStatus === "accepted") {
        conditions.push(sql`${users.tosAcceptedAt} IS NOT NULL`);
      } else if (input.acceptanceStatus === "not_accepted") {
        conditions.push(sql`${users.tosAcceptedAt} IS NULL`);
      }

      if (input.startDate) {
        const startDate = new Date(input.startDate);
        conditions.push(gte(users.tosAcceptedAt, startDate));
      }

      if (input.endDate) {
        const endDate = new Date(input.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        conditions.push(lte(users.tosAcceptedAt, endDate));
      }

      // Fetch all users with TOS acceptance data
      let query = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        tosAcceptedAt: users.tosAcceptedAt,
        privacyPolicyAcceptedAt: users.privacyPolicyAcceptedAt,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      const result = await query.orderBy(desc(users.tosAcceptedAt));

      return result;
    }),

  // Update site logo
  updateLogo: adminProcedure
    .input(
      z.object({
        fileData: z.string(), // base64 encoded image
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Import storage helper
      const { storagePut } = await import("../storage");

      // Convert base64 to buffer
      const base64Data = input.fileData.split(",")[1] || input.fileData;
      const buffer = Buffer.from(base64Data, "base64");

      // Generate unique file key
      const timestamp = Date.now();
      const ext = input.fileName.split(".").pop() || "png";
      const fileKey = `site-logo/logo-${timestamp}.${ext}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Update or insert site settings
      const existing = await db.select().from(siteSettings).limit(1);

      if (existing.length === 0) {
        await db.insert(siteSettings).values({
          logoUrl: url,
          updatedBy: ctx.user.id,
        });
      } else {
        await db.update(siteSettings).set({
          logoUrl: url,
          updatedBy: ctx.user.id,
          updatedAt: new Date(),
        });
      }

      return { success: true, logoUrl: url };
    }),

  // Generate sitemap.xml
  generateSitemap: adminProcedure
    .input(
      z.object({
        baseUrl: z.string().url().optional(),
      })
    )
    .query(async ({ input }) => {
      const xml = await generateSitemap(input.baseUrl);
      return { xml };
    }),
});
