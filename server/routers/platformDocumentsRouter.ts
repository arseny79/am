import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { platformDocuments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Admin-only procedure - requires admin role
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const platformDocumentsRouter = router({
  /**
   * List all documents (admin only - includes unpublished)
   */
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    return await db.select().from(platformDocuments).orderBy(platformDocuments.title);
  }),

  /**
   * List published documents (public)
   */
  listPublished: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    return await db
      .select()
      .from(platformDocuments)
      .where(eq(platformDocuments.isPublished, true))
      .orderBy(platformDocuments.title);
  }),

  /**
   * Get document by slug (public if published, admin-only if unpublished)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const results = await db
        .select()
        .from(platformDocuments)
        .where(eq(platformDocuments.slug, input.slug))
        .limit(1);
      
      const doc = results[0];
      
      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }
      
      // If document is unpublished, only allow admin access
      if (!doc.isPublished && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Document not published" });
      }
      
      return doc;
    }),

  /**
   * Create or update a document (upsert by slug)
   */
  upsert: adminProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(100),
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Check if document exists
      const existing = await db
        .select()
        .from(platformDocuments)
        .where(eq(platformDocuments.slug, input.slug))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing document
        await db
          .update(platformDocuments)
          .set({
            title: input.title,
            content: input.content,
            isPublished: input.isPublished ?? existing[0]!.isPublished,
            version: existing[0]!.version + 1,
            updatedBy: ctx.user.id,
            updatedAt: new Date(),
          })
          .where(eq(platformDocuments.slug, input.slug));
      } else {
        // Create new document
        await db.insert(platformDocuments).values({
          slug: input.slug,
          title: input.title,
          content: input.content,
          isPublished: input.isPublished ?? false,
          version: 1,
          updatedBy: ctx.user.id,
        });
      }
      
      // Fetch and return the updated document
      const results = await db
        .select()
        .from(platformDocuments)
        .where(eq(platformDocuments.slug, input.slug))
        .limit(1);
      
      return { success: true, document: results[0] };
    }),

  /**
   * Delete a document
   */
  delete: adminProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db.delete(platformDocuments).where(eq(platformDocuments.slug, input.slug));
      
      return { success: true };
    }),

  /**
   * Toggle publish status
   */
  togglePublish: adminProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const existing = await db
        .select()
        .from(platformDocuments)
        .where(eq(platformDocuments.slug, input.slug))
        .limit(1);
      
      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }
      
      await db
        .update(platformDocuments)
        .set({
          isPublished: !existing[0]!.isPublished,
          updatedAt: new Date(),
        })
        .where(eq(platformDocuments.slug, input.slug));
      
      return { success: true, isPublished: !existing[0]!.isPublished };
    }),
});
