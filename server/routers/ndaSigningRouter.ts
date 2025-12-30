import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { ndaSignings, ndaSigningAuditLog, deals, users, ndaTemplates, listings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail, EmailTemplates } from "../lib/emailService";

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

        // Send email notifications
        try {
          // Get buyer and seller info
          const buyer = await db.select().from(users).where(eq(users.id, deal[0].buyerId)).limit(1);
          const seller = await db.select().from(users).where(eq(users.id, deal[0].sellerId)).limit(1);
          const listing = await db.select().from(listings).where(eq(listings.id, deal[0].listingId)).limit(1);

          if (buyer.length && seller.length && listing.length) {
            const listingName = listing[0].businessName;
            const dealUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://mspmarketplace.com'}/deal/${deal[0].id}`;

            // Notify the other party
            const otherParty = isBuyer ? seller[0] : buyer[0];
            const signerName = ctx.user.name || (isBuyer ? "Buyer" : "Seller");
            
            if (otherParty.email) {
              const emailContent = EmailTemplates.ndaSigned({
                recipientName: otherParty.name || "User",
                signerName,
                listingName,
                dealUrl,
                isFullySigned: newStatus === "fully_signed",
              });

              await sendEmail({
                to: otherParty.email,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html,
              });
            }

            // If fully signed, notify both parties
            if (newStatus === "fully_signed") {
              const currentParty = isBuyer ? buyer[0] : seller[0];
              if (currentParty.email) {
                const emailContent = EmailTemplates.ndaSigned({
                  recipientName: currentParty.name || "User",
                  signerName: "Both parties",
                  listingName,
                  dealUrl,
                  isFullySigned: true,
                });

                await sendEmail({
                  to: currentParty.email,
                  subject: emailContent.subject,
                  text: emailContent.text,
                  html: emailContent.html,
                });
              }
            }
          }
        } catch (emailError) {
          console.error("Failed to send NDA signing email notification:", emailError);
          // Don't fail the signing if email fails
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
        id: ndaSigning[0].id,
        status: ndaSigning[0].status,
        buyerSigned: !!ndaSigning[0].buyerSignedAt,
        sellerSigned: !!ndaSigning[0].sellerSignedAt,
        buyerSignedAt: ndaSigning[0].buyerSignedAt,
        sellerSignedAt: ndaSigning[0].sellerSignedAt,
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

        // Get deal and verify user is seller or admin (only seller/admin can void)
        const deal = await db
          .select()
          .from(deals)
          .where(eq(deals.id, ndaSigning[0].dealId))
          .limit(1);

        if (!deal.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
        }

        // Allow seller or admin to void
        const isAdmin = ctx.user.role === "admin";
        if (deal[0].sellerId !== ctx.user.id && !isAdmin) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller or admin can void an NDA" });
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

  /**
   * Admin: Get all NDA signings across the platform
   * For admin dashboard monitoring
   */
  adminGetAllNDAs: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    try {
      const allNDAs = await db
        .select({
          id: ndaSignings.id,
          dealId: ndaSignings.dealId,
          status: ndaSignings.status,
          buyerSignedAt: ndaSignings.buyerSignedAt,
          sellerSignedAt: ndaSignings.sellerSignedAt,
          expiresAt: ndaSignings.expiresAt,
          createdAt: ndaSignings.createdAt,
        })
        .from(ndaSignings)
        .orderBy(ndaSignings.createdAt);

      return allNDAs;
    } catch (error) {
      console.error("Failed to fetch all NDAs:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch NDA signings",
      });
    }
  }),
});
