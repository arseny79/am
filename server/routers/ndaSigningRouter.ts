import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { ndaSignings, ndaSigningAuditLog, deals, users, ndaTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * NDA Signing Router
 * 
 * Handles the complete NDA signing workflow:
 * 1. Create NDA signing instance for a deal
 * 2. Get NDA details for display
 * 3. Sign NDA (buyer or seller)
 * 4. Track signing status
 * 5. Audit logging for compliance
 */

export const ndaSigningRouter = router({
  /**
   * Create a new NDA signing instance for a deal
   * Initializes NDA with rendered template and variable values
   */
  createNDASigning: protectedProcedure
    .input(
      z.object({
        dealId: z.number(),
        templateId: z.number(),
        variableValues: z.record(z.string(), z.any()), // Map of variable names to values
        expiresIn: z.number().optional().default(7), // Days until signing window expires
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Verify deal exists and user is party to it
        const deal = await db
          .select()
          .from(deals)
          .where(eq(deals.id, input.dealId))
          .limit(1);

        if (!deal.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
        }

        // Verify user is buyer or seller in this deal
        const isDealParty = deal[0].buyerId === ctx.user.id || deal[0].sellerId === ctx.user.id;
        if (!isDealParty) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not a party to this deal" });
        }

        // Get template
        const template = await db
          .select()
          .from(ndaTemplates)
          .where(eq(ndaTemplates.id, input.templateId))
          .limit(1);

        if (!template.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "NDA template not found" });
        }

        // Render template with variables
        let renderedContent = template[0].content;
        
        for (const [variableName, value] of Object.entries(input.variableValues)) {
          const regex = new RegExp(`{{\\s*${variableName}\\s*}}`, "g");
          
          let formattedValue = String(value);
          
          if (value instanceof Date) {
            formattedValue = value.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          } else if (typeof value === "number") {
            formattedValue = value.toLocaleString("en-US");
          }

          renderedContent = renderedContent.replace(regex, formattedValue);
        }

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresIn);

        // Create NDA signing record
        await db.insert(ndaSignings).values({
          dealId: input.dealId,
          templateId: input.templateId,
          renderedContent,
          variableValues: JSON.stringify(input.variableValues),
          status: "draft",
          expiresAt,
        });

        // Get the inserted NDA signing ID
        const insertedNDA = await db
          .select()
          .from(ndaSignings)
          .where(eq(ndaSignings.dealId, input.dealId))
          .orderBy(ndaSignings.createdAt)
          .limit(1);

        const ndaSigningId = insertedNDA[0]?.id || 0;

        // Log creation
        await db.insert(ndaSigningAuditLog).values({
          ndaSigningId: Number(ndaSigningId),
          action: "created",
          userId: ctx.user.id,
          details: JSON.stringify({
            templateId: input.templateId,
            expiresIn: input.expiresIn,
          }),
        });

        return {
          success: true,
          ndaSigningId: Number(ndaSigningId),
          message: "NDA signing instance created",
        };
      } catch (error) {
        console.error("Failed to create NDA signing:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create NDA signing",
        });
      }
    }),

  /**
   * Get NDA details for display and signing
   */
  getNDASigning: protectedProcedure
    .input(z.object({ ndaSigningId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const ndaSigning = await db
        .select()
        .from(ndaSignings)
        .where(eq(ndaSignings.id, input.ndaSigningId))
        .limit(1);

      if (!ndaSigning.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "NDA signing not found" });
      }

      // Verify user is party to the deal
      const deal = await db
        .select()
        .from(deals)
        .where(eq(deals.id, ndaSigning[0].dealId))
        .limit(1);

      if (!deal.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      const isDealParty = deal[0].buyerId === ctx.user.id || deal[0].sellerId === ctx.user.id;
      if (!isDealParty) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not a party to this deal" });
      }

      // Log view
      await db.insert(ndaSigningAuditLog).values({
        ndaSigningId: input.ndaSigningId,
        action: ctx.user.id === deal[0].buyerId ? "buyer_viewed" : "seller_viewed",
        userId: ctx.user.id,
      });

      // Parse variable values
      let variableValues = {};
      try {
        variableValues = JSON.parse(ndaSigning[0].variableValues);
      } catch (e) {
        console.error("Failed to parse variable values:", e);
      }

      return {
        ...ndaSigning[0],
        variableValues,
        isBuyer: ctx.user.id === deal[0].buyerId,
        isSeller: ctx.user.id === deal[0].sellerId,
        buyerName: deal[0].buyerId ? (await db.select({ name: users.name }).from(users).where(eq(users.id, deal[0].buyerId)).limit(1))[0]?.name : null,
        sellerName: deal[0].sellerId ? (await db.select({ name: users.name }).from(users).where(eq(users.id, deal[0].sellerId)).limit(1))[0]?.name : null,
      };
    }),

  /**
   * Sign NDA (buyer or seller)
   */
  signNDA: protectedProcedure
    .input(
      z.object({
        ndaSigningId: z.number(),
        signature: z.string(), // Base64 encoded signature
        signatureType: z.enum(["drawn", "typed", "initials"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Get NDA signing
        const ndaSigning = await db
          .select()
          .from(ndaSignings)
          .where(eq(ndaSignings.id, input.ndaSigningId))
          .limit(1);

        if (!ndaSigning.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "NDA signing not found" });
        }

        // Check if already fully signed
        if (ndaSigning[0].status === "fully_signed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "NDA is already fully signed" });
        }

        // Check if expired
        if (ndaSigning[0].expiresAt && new Date() > ndaSigning[0].expiresAt) {
          // Mark as expired
          await db
            .update(ndaSignings)
            .set({ status: "expired" })
            .where(eq(ndaSignings.id, input.ndaSigningId));

          throw new TRPCError({ code: "BAD_REQUEST", message: "NDA signing window has expired" });
        }

        // Get deal to determine if user is buyer or seller
        const deal = await db
          .select()
          .from(deals)
          .where(eq(deals.id, ndaSigning[0].dealId))
          .limit(1);

        if (!deal.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
        }

        const isBuyer = ctx.user.id === deal[0].buyerId;
        const isSeller = ctx.user.id === deal[0].sellerId;

        if (!isBuyer && !isSeller) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not a party to this deal" });
        }

        // Check if already signed by this party
        if (isBuyer && ndaSigning[0].buyerSignedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You have already signed this NDA" });
        }

        if (isSeller && ndaSigning[0].sellerSignedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You have already signed this NDA" });
        }

        // Determine new status
        let newStatus: "buyer_signed" | "seller_signed" | "fully_signed";
        
        if (isBuyer) {
          // Buyer is signing
          newStatus = ndaSigning[0].sellerSignedAt ? "fully_signed" : "buyer_signed";
        } else {
          // Seller is signing
          newStatus = ndaSigning[0].buyerSignedAt ? "fully_signed" : "seller_signed";
        }

        if (!newStatus) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to determine NDA status" });
        }

        // Update NDA signing with signature
        await db
          .update(ndaSignings)
          .set({
            ...(isBuyer && {
              buyerSignedAt: new Date(),
              buyerSignature: input.signature,
              buyerSignatureType: input.signatureType,
            }),
            ...(isSeller && {
              sellerSignedAt: new Date(),
              sellerSignature: input.signature,
              sellerSignatureType: input.signatureType,
            }),
            status: newStatus,
          })
          .where(eq(ndaSignings.id, input.ndaSigningId));

        // Log signing
        await db.insert(ndaSigningAuditLog).values({
          ndaSigningId: input.ndaSigningId,
          action: isBuyer ? "buyer_signed" : "seller_signed",
          userId: ctx.user.id,
          details: JSON.stringify({
            signatureType: input.signatureType,
          }),
        });

        // If fully signed, log completion
        if (newStatus === "fully_signed") {
          await db.insert(ndaSigningAuditLog).values({
            ndaSigningId: input.ndaSigningId,
            action: "completed",
            details: JSON.stringify({
              completedAt: new Date().toISOString(),
            }),
          });
        }

        return {
          success: true,
          status: newStatus,
          message: newStatus === "fully_signed" ? "NDA fully signed by both parties" : `NDA signed by ${isBuyer ? "buyer" : "seller"}`,
        };
      } catch (error) {
        console.error("Failed to sign NDA:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sign NDA",
        });
      }
    }),

  /**
   * Get NDA signing status for a deal
   */
  getNDAStatus: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify user is party to deal
      const deal = await db
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);

      if (!deal.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      const isDealParty = deal[0].buyerId === ctx.user.id || deal[0].sellerId === ctx.user.id;
      if (!isDealParty) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not a party to this deal" });
      }

      // Get latest NDA signing for this deal
      const ndaSigning = await db
          .select()
          .from(ndaSignings)
          .where(eq(ndaSignings.dealId, input.dealId))
          .limit(1);

      if (!ndaSigning.length) {
        return {
          exists: false,
          status: null,
          buyerSigned: false,
          sellerSigned: false,
          fullySignedAt: null,
        };
      }

      return {
        exists: true,
        status: ndaSigning[0].status,
        buyerSigned: !!ndaSigning[0].buyerSignedAt,
        sellerSigned: !!ndaSigning[0].sellerSignedAt,
        fullySignedAt: ndaSigning[0].status === "fully_signed" ? ndaSigning[0].updatedAt : null,
        expiresAt: ndaSigning[0].expiresAt,
        isExpired: ndaSigning[0].expiresAt ? new Date() > ndaSigning[0].expiresAt : false,
      };
    }),

  /**
   * Get NDA audit log for compliance
   */
  getAuditLog: protectedProcedure
    .input(z.object({ ndaSigningId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify user has access
      const ndaSigning = await db
        .select()
        .from(ndaSignings)
        .where(eq(ndaSignings.id, input.ndaSigningId))
        .limit(1);

      if (!ndaSigning.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "NDA signing not found" });
      }

      const deal = await db
        .select()
        .from(deals)
        .where(eq(deals.id, ndaSigning[0].dealId))
        .limit(1);

      if (!deal.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      const isDealParty = deal[0].buyerId === ctx.user.id || deal[0].sellerId === ctx.user.id;
      if (!isDealParty) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not a party to this deal" });
      }

      // Get audit log
      const auditLog = await db
        .select()
        .from(ndaSigningAuditLog)
        .where(eq(ndaSigningAuditLog.ndaSigningId, input.ndaSigningId))
        .orderBy(ndaSigningAuditLog.createdAt);

      return auditLog;
    }),

  /**
   * Void/cancel an NDA signing
   */
  voidNDASigning: protectedProcedure
    .input(z.object({ ndaSigningId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Get NDA signing
        const ndaSigning = await db
          .select()
          .from(ndaSignings)
          .where(eq(ndaSignings.id, input.ndaSigningId))
          .limit(1);

        if (!ndaSigning.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "NDA signing not found" });
        }

        // Get deal and verify user is seller (only seller can void)
        const deal = await db
          .select()
          .from(deals)
          .where(eq(deals.id, ndaSigning[0].dealId))
          .limit(1);

        if (!deal.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
        }

        if (deal[0].sellerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can void an NDA" });
        }

        // Update status to voided
        await db
          .update(ndaSignings)
          .set({ status: "voided" })
          .where(eq(ndaSignings.id, input.ndaSigningId));

        // Log void
        await db.insert(ndaSigningAuditLog).values({
          ndaSigningId: input.ndaSigningId,
          action: "voided",
          userId: ctx.user.id,
        });

        return {
          success: true,
          message: "NDA signing voided",
        };
      } catch (error) {
        console.error("Failed to void NDA signing:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to void NDA signing",
        });
      }
    }),
});
