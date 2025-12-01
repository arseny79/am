import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { adminVerificationRouter } from "./adminVerificationRouter";
import { getDb } from "../db";
import { siteSettings, users } from "../../drizzle/schema";
import { desc, sql, and, gte, lte } from "drizzle-orm";

export const adminRouter = router({
  verification: adminVerificationRouter,
  // Get site settings (analytics configuration)
  getSiteSettings: adminProcedure.query(async () => {
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
});
