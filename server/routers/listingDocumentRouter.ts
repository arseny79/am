import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { listingDocuments, listings, ndas } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { storagePut } from "../storage";

/**
 * Listing Document Router
 * Handles document uploads to listings with 3-tier access control
 */
export const listingDocumentRouter = router({
  /**
   * Upload document to listing
   * Only listing owner can upload
   */
  upload: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        fileName: z.string().min(1).max(255),
        fileData: z.string(), // base64 encoded
        accessLevel: z.enum(["public", "nda_gated", "request_only"]).default("nda_gated"),
        category: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify listing ownership
      const listing = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      }

      if (listing[0].sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only listing owner can upload documents" });
      }

      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileData, "base64");
      const fileSize = buffer.length;

      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `listing-${input.listingId}/documents/${timestamp}-${randomSuffix}-${input.fileName}`;

      const mimeType = getMimeType(input.fileName);
      const { url: fileUrl } = await storagePut(fileKey, buffer, mimeType);

      // Insert document record
      await db.insert(listingDocuments).values({
        listingId: input.listingId,
        uploadedBy: ctx.user.id,
        fileName: input.fileName,
        fileUrl,
        fileSize,
        mimeType,
        accessLevel: input.accessLevel,
        category: input.category || "general",
        description: input.description,
      });

      return { success: true, fileUrl };
    }),

  /**
   * Get documents for a listing
   * Access control enforced based on document accessLevel
   */
  getByListing: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      // Get listing to check ownership
      const listing = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      }

      const isOwner = listing[0].sellerId === ctx.user.id;

      // Get all documents
      const docs = await db
        .select()
        .from(listingDocuments)
        .where(eq(listingDocuments.listingId, input.listingId))
        .orderBy(desc(listingDocuments.createdAt));

      // Filter based on access level
      const filteredDocs = await Promise.all(
        docs.map(async (doc) => {
          // Owner sees all documents
          if (isOwner) {
            return { ...doc, canAccess: true, accessReason: "owner" };
          }

          // Public documents - everyone can see
          if (doc.accessLevel === "public") {
            return { ...doc, canAccess: true, accessReason: "public" };
          }

          // NDA-gated documents - check if user signed NDA
          if (doc.accessLevel === "nda_gated") {
            const ndaRecord = await db
              .select()
              .from(ndas)
              .where(
                and(
                  eq(ndas.listingId, input.listingId),
                  eq(ndas.buyerId, ctx.user.id),
                  eq(ndas.status, "active")
                )
              )
              .limit(1);

            if (ndaRecord[0]) {
              return { ...doc, canAccess: true, accessReason: "nda_signed" };
            } else {
              // H3: Strip fileUrl for users without NDA to prevent direct URL access
              const { fileUrl: _stripped, ...docWithoutUrl } = doc;
              return { ...docWithoutUrl, fileUrl: null, canAccess: false, accessReason: "nda_required" };
            }
          }

          // Request-only documents - check if access was granted
          if (doc.accessLevel === "request_only") {
            // H3: Strip fileUrl for request-only docs without access
            const { fileUrl: _stripped, ...docWithoutUrl } = doc;
            return { ...docWithoutUrl, fileUrl: null, canAccess: false, accessReason: "request_required" };
          }

          return { ...doc, canAccess: false, accessReason: "unknown" };
        })
      );

      return filteredDocs;
    }),

  /**
   * Update document access level
   * Only listing owner can update
   */
  updateAccessLevel: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        accessLevel: z.enum(["public", "nda_gated", "request_only"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get document and verify ownership
      const doc = await db
        .select({
          doc: listingDocuments,
          listing: listings,
        })
        .from(listingDocuments)
        .leftJoin(listings, eq(listingDocuments.listingId, listings.id))
        .where(eq(listingDocuments.id, input.documentId))
        .limit(1);

      if (!doc[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      if (doc[0].listing?.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only listing owner can update document access" });
      }

      // Update access level
      await db
        .update(listingDocuments)
        .set({ accessLevel: input.accessLevel })
        .where(eq(listingDocuments.id, input.documentId));

      return { success: true };
    }),

  /**
   * Delete document
   * Only listing owner can delete
   */
  delete: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get document and verify ownership
      const doc = await db
        .select({
          doc: listingDocuments,
          listing: listings,
        })
        .from(listingDocuments)
        .leftJoin(listings, eq(listingDocuments.listingId, listings.id))
        .where(eq(listingDocuments.id, input.documentId))
        .limit(1);

      if (!doc[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      if (doc[0].listing?.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only listing owner can delete documents" });
      }

      // M8: Delete from S3 before removing database record
      try {
        const { storageDelete } = await import('../storage');
        if (typeof storageDelete === 'function' && doc[0].doc.fileUrl) {
          // Extract the S3 key from the URL
          const url = doc[0].doc.fileUrl;
          const urlObj = new URL(url);
          const key = urlObj.pathname.replace(/^\//, '');
          await storageDelete(key);
        }
      } catch (err) {
        console.warn('[listingDocumentRouter] Failed to delete file from S3:', err);
        // Continue with database deletion even if S3 deletion fails
      }
      // Delete document record
      await db.delete(listingDocuments).where(eq(listingDocuments.id, input.documentId));

      return { success: true };
    }),
});

/**
 * Helper function to determine MIME type from file extension
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    zip: "application/zip",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}
