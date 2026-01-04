import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  brokers, 
  brokerApplications, 
  brokerContracts, 
  brokerListings, 
  brokerCommissions,
  brokerPayouts 
} from "../drizzle/brokerSchema";
import { listings, users } from "../drizzle/schema";
import { storagePut } from "./storage";
import { sendEmail } from "./lib/emailService";
import { ENV } from "./_core/env";

// Helper to check if user is an approved broker
async function getBrokerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(brokers)
    .where(and(eq(brokers.userId, userId), eq(brokers.status, 'approved')))
    .limit(1);
  
  return result[0] || null;
}

// Helper to check if user is admin
function isAdmin(user: { role: string }) {
  return user.role === 'admin';
}

export const brokerRouter = router({
  // ============ APPLICATION WORKFLOW ============
  
  // Submit broker application
  submitApplication: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1),
      companyWebsite: z.string().optional(),
      licenseNumber: z.string().optional(),
      licenseState: z.string().optional(),
      contactName: z.string().min(1),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      yearsExperience: z.number().optional(),
      previousDealsCount: z.number().optional(),
      previousDealVolume: z.number().optional(),
      specializations: z.string().optional(),
      applicationMessage: z.string().min(50),
      resumeUrl: z.string().optional(),
      licenseDocumentUrl: z.string().optional(),
      referenceLetterUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Check if user already has a pending application
      const existingApplication = await db
        .select()
        .from(brokerApplications)
        .where(and(
          eq(brokerApplications.userId, ctx.user.id),
          sql`${brokerApplications.status} IN ('pending', 'under_review')`
        ))
        .limit(1);
      
      if (existingApplication.length > 0) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'You already have a pending broker application' 
        });
      }
      
      // Check if user is already an approved broker
      const existingBroker = await getBrokerByUserId(ctx.user.id);
      if (existingBroker) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'You are already an approved broker' 
        });
      }
      
      // Create application
      const result = await db.insert(brokerApplications).values({
        userId: ctx.user.id,
        ...input,
      });
      
      // Send notification email to admin
      try {
        await sendEmail({
          to: ENV.ownerName ? `${ENV.ownerName}` : 'admin@example.com',
          subject: 'New Broker Application Submitted',
          html: `
            <h2>New Broker Application</h2>
            <p><strong>Company:</strong> ${input.companyName}</p>
            <p><strong>Contact:</strong> ${input.contactName} (${input.contactEmail})</p>
            <p><strong>Experience:</strong> ${input.yearsExperience || 'Not specified'} years</p>
            <p><strong>Previous Deals:</strong> ${input.previousDealsCount || 'Not specified'}</p>
            <p>Please review the application in the admin dashboard.</p>
          `,
        });
      } catch (e) {
        console.error('Failed to send broker application notification:', e);
      }
      
      return { success: true, applicationId: Number(result.insertId) };
    }),
  
  // Get my application status
  getMyApplication: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select()
        .from(brokerApplications)
        .where(eq(brokerApplications.userId, ctx.user.id))
        .orderBy(desc(brokerApplications.createdAt))
        .limit(1);
      
      return result[0] || null;
    }),
  
  // Check if user is a broker
  getMyBrokerStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { isBroker: false, broker: null };
      
      const broker = await getBrokerByUserId(ctx.user.id);
      return { 
        isBroker: !!broker, 
        broker 
      };
    }),
  
  // ============ ADMIN: APPLICATION MANAGEMENT ============
  
  // List all applications (admin only)
  listApplications: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'under_review', 'approved', 'rejected']).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) return { applications: [], total: 0 };
      
      let query = db
        .select({
          application: brokerApplications,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          }
        })
        .from(brokerApplications)
        .leftJoin(users, eq(brokerApplications.userId, users.id))
        .orderBy(desc(brokerApplications.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      if (input.status) {
        query = query.where(eq(brokerApplications.status, input.status)) as typeof query;
      }
      
      const applications = await query;
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(brokerApplications);
      
      return { 
        applications, 
        total: countResult[0]?.count || 0 
      };
    }),
  
  // Review application (admin only)
  reviewApplication: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      action: z.enum(['approve', 'reject', 'request_info']),
      reviewNotes: z.string().optional(),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Get application
      const application = await db
        .select()
        .from(brokerApplications)
        .where(eq(brokerApplications.id, input.applicationId))
        .limit(1);
      
      if (!application[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
      }
      
      const app = application[0];
      
      if (input.action === 'approve') {
        // Create broker profile
        const brokerResult = await db.insert(brokers).values({
          userId: app.userId,
          companyName: app.companyName,
          companyWebsite: app.companyWebsite,
          licenseNumber: app.licenseNumber,
          licenseState: app.licenseState,
          contactName: app.contactName,
          contactEmail: app.contactEmail,
          contactPhone: app.contactPhone,
          yearsExperience: app.yearsExperience,
          specializations: app.specializations,
          status: 'approved',
          approvedAt: sql`NOW()`,
          approvedBy: ctx.user.id,
        });
        
        // Update application
        await db
          .update(brokerApplications)
          .set({
            status: 'approved',
            reviewedAt: sql`NOW()`,
            reviewedBy: ctx.user.id,
            reviewNotes: input.reviewNotes,
            brokerId: Number(brokerResult.insertId),
          })
          .where(eq(brokerApplications.id, input.applicationId));
        
        // Send approval email
        try {
          await sendEmail({
            to: app.contactEmail,
            subject: 'Your Broker Application Has Been Approved!',
            html: `
              <h2>Congratulations!</h2>
              <p>Your broker application for ${app.companyName} has been approved.</p>
              <p>You can now list businesses on behalf of your clients and earn 50% of platform fees on successful deals.</p>
              <p>Log in to your broker dashboard to get started.</p>
            `,
          });
        } catch (e) {
          console.error('Failed to send approval email:', e);
        }
        
        return { success: true, brokerId: Number(brokerResult.insertId) };
      } else if (input.action === 'reject') {
        await db
          .update(brokerApplications)
          .set({
            status: 'rejected',
            reviewedAt: sql`NOW()`,
            reviewedBy: ctx.user.id,
            reviewNotes: input.reviewNotes,
            rejectionReason: input.rejectionReason,
          })
          .where(eq(brokerApplications.id, input.applicationId));
        
        // Send rejection email
        try {
          await sendEmail({
            to: app.contactEmail,
            subject: 'Update on Your Broker Application',
            html: `
              <h2>Application Update</h2>
              <p>Thank you for your interest in becoming a broker on our platform.</p>
              <p>After careful review, we are unable to approve your application at this time.</p>
              ${input.rejectionReason ? `<p><strong>Reason:</strong> ${input.rejectionReason}</p>` : ''}
              <p>You may reapply after 90 days if your circumstances change.</p>
            `,
          });
        } catch (e) {
          console.error('Failed to send rejection email:', e);
        }
        
        return { success: true };
      } else {
        // Request more info
        await db
          .update(brokerApplications)
          .set({
            status: 'under_review',
            reviewNotes: input.reviewNotes,
          })
          .where(eq(brokerApplications.id, input.applicationId));
        
        return { success: true };
      }
    }),
  
  // ============ BROKER PROFILE MANAGEMENT ============
  
  // Get broker profile
  getMyBrokerProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const broker = await getBrokerByUserId(ctx.user.id);
      if (!broker) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Broker profile not found' });
      }
      return broker;
    }),
  
  // Update broker profile
  updateBrokerProfile: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(),
      companyWebsite: z.string().optional(),
      contactPhone: z.string().optional(),
      bio: z.string().optional(),
      profilePhotoUrl: z.string().optional(),
      payoutMethod: z.enum(['bank_transfer', 'paypal', 'check']).optional(),
      paypalEmail: z.string().email().optional(),
      bankAccountName: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      bankRoutingNumber: z.string().optional(),
      bankName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const broker = await getBrokerByUserId(ctx.user.id);
      if (!broker) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Broker profile not found' });
      }
      
      await db
        .update(brokers)
        .set(input)
        .where(eq(brokers.id, broker.id));
      
      return { success: true };
    }),
  
// ============ BROKER CONTRACTS ============

  // Create a broker contract for a listing
  createContract: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      clientName: z.string().min(1),
      clientEmail: z.string().email(),
      clientPhone: z.string().optional(),
      clientCompanyName: z.string().min(1),
      contractType: z.enum(['exclusive', 'non_exclusive']),
      contractStartDate: z.string(),
      contractEndDate: z.string(),
      clientCommissionRate: z.string().optional(),
      contractDocumentUrl: z.string(),
      contractFileName: z.string(),
      contractFileSize: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const broker = await getBrokerByUserId(ctx.user.id);
      if (!broker) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not an approved broker' });
      }
      
      // Create the contract with pending_verification status
      // Contract must be verified by admin before listing goes live
      const contractResult = await db.insert(brokerContracts).values({
        brokerId: broker.id,
        listingId: input.listingId,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        clientCompanyName: input.clientCompanyName,
        contractType: input.contractType,
        contractStartDate: new Date(input.contractStartDate),
        contractEndDate: new Date(input.contractEndDate),
        clientCommissionRate: input.clientCommissionRate ? parseFloat(input.clientCommissionRate).toFixed(2) : null,
        contractDocumentUrl: input.contractDocumentUrl,
        contractFileName: input.contractFileName,
        contractFileSize: input.contractFileSize,
        status: 'pending_verification', // Requires admin verification
        isVerified: 0,
      });
      
      const contractId = Number(contractResult.insertId);
      
      // Create broker listing link
      await db.insert(brokerListings).values({
        brokerId: broker.id,
        listingId: input.listingId,
        contractId: contractId,
        status: 'active',
      });
      
      // Update the listing to mark it as broker-managed
      // Keep listing in draft status until contract is verified
      await db
        .update(listings)
        .set({ 
          brokerId: broker.id,
          status: 'draft',
          isPublished: 0,
        })
        .where(eq(listings.id, input.listingId));
      
      // Send notification to admin about new contract pending verification
      try {
        await sendEmail({
          to: ENV.ownerName ? `${ENV.ownerName}` : 'admin@example.com',
          subject: 'New Broker Contract Pending Verification',
          html: `
            <h2>New Contract Submitted</h2>
            <p><strong>Broker:</strong> ${broker.companyName}</p>
            <p><strong>Client:</strong> ${input.clientCompanyName} (${input.clientName})</p>
            <p><strong>Contract Type:</strong> ${input.contractType}</p>
            <p>Please review and verify the contract in the admin dashboard before the listing can go live.</p>
          `,
        });
      } catch (e) {
        console.error('Failed to send contract notification:', e);
      }
      
      return { success: true, contractId, pendingVerification: true };
    }),

  // ============ BROKER LISTINGS ============

  // Get broker's listings
  getMyBrokerListings: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      const broker = await getBrokerByUserId(ctx.user.id);
      if (!broker) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not an approved broker' });
      }
      
      const result = await db
        .select({
          brokerListing: brokerListings,
          listing: listings,
          contract: brokerContracts,
        })
        .from(brokerListings)
        .leftJoin(listings, eq(brokerListings.listingId, listings.id))
        .leftJoin(brokerContracts, eq(brokerListings.contractId, brokerContracts.id))
        .where(eq(brokerListings.brokerId, broker.id))
        .orderBy(desc(brokerListings.createdAt));
      
      return result;
    }),
  
  // ============ BROKER EARNINGS ============
  
  // Get broker earnings summary
  getMyEarnings: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      
      const broker = await getBrokerByUserId(ctx.user.id);
      if (!broker) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not an approved broker' });
      }
      
      // Get commissions
      const commissions = await db
        .select()
        .from(brokerCommissions)
        .where(eq(brokerCommissions.brokerId, broker.id))
        .orderBy(desc(brokerCommissions.createdAt));
      
      // Get payouts
      const payouts = await db
        .select()
        .from(brokerPayouts)
        .where(eq(brokerPayouts.brokerId, broker.id))
        .orderBy(desc(brokerPayouts.createdAt));
      
      return {
        broker,
        commissions,
        payouts,
        summary: {
          totalEarnings: broker.totalEarnings,
          pendingEarnings: broker.pendingEarnings,
          paidEarnings: broker.paidEarnings,
        }
      };
    }),
  
  // Request payout
  requestPayout: protectedProcedure
    .input(z.object({
      amount: z.number().min(100), // Minimum $100 payout
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const broker = await getBrokerByUserId(ctx.user.id);
      if (!broker) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not an approved broker' });
      }
      
      if (broker.pendingEarnings < input.amount) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Insufficient pending earnings' 
        });
      }
      
      if (!broker.payoutMethod) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Please set up your payout method first' 
        });
      }
      
      // Create payout request
      await db.insert(brokerPayouts).values({
        brokerId: broker.id,
        amount: input.amount,
        payoutMethod: broker.payoutMethod,
        status: 'pending',
      });
      
      return { success: true };
    }),
  
  // ============ ADMIN: BROKER MANAGEMENT ============
  
  // List all brokers (admin only)
  listBrokers: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'suspended', 'rejected']).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) return { brokers: [], total: 0 };
      
      let query = db
        .select({
          broker: brokers,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          }
        })
        .from(brokers)
        .leftJoin(users, eq(brokers.userId, users.id))
        .orderBy(desc(brokers.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      if (input.status) {
        query = query.where(eq(brokers.status, input.status)) as typeof query;
      }
      
      const brokerList = await query;
      
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(brokers);
      
      return { 
        brokers: brokerList, 
        total: countResult[0]?.count || 0 
      };
    }),
  
  // Suspend/unsuspend broker (admin only)
  updateBrokerStatus: protectedProcedure
    .input(z.object({
      brokerId: z.number(),
      status: z.enum(['approved', 'suspended']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      await db
        .update(brokers)
        .set({
          status: input.status,
          suspensionReason: input.status === 'suspended' ? input.reason : null,
        })
        .where(eq(brokers.id, input.brokerId));
      
      return { success: true };
    }),
  
  // ============ ADMIN: PAYOUT MANAGEMENT ============
  
  // List pending payouts (admin only)
  listPendingPayouts: protectedProcedure
    .query(async ({ ctx }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) return [];
      
      const payouts = await db
        .select({
          payout: brokerPayouts,
          broker: brokers,
        })
        .from(brokerPayouts)
        .leftJoin(brokers, eq(brokerPayouts.brokerId, brokers.id))
        .where(eq(brokerPayouts.status, 'pending'))
        .orderBy(desc(brokerPayouts.createdAt));
      
      return payouts;
    }),
  
  // Process payout (admin only)
  processPayout: protectedProcedure
    .input(z.object({
      payoutId: z.number(),
      action: z.enum(['approve', 'complete', 'fail']),
      paymentReference: z.string().optional(),
      failureReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Get payout
      const payout = await db
        .select()
        .from(brokerPayouts)
        .where(eq(brokerPayouts.id, input.payoutId))
        .limit(1);
      
      if (!payout[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Payout not found' });
      }
      
      const p = payout[0];
      
      if (input.action === 'approve') {
        await db
          .update(brokerPayouts)
          .set({
            status: 'processing',
            processedBy: ctx.user.id,
            processedAt: sql`NOW()`,
          })
          .where(eq(brokerPayouts.id, input.payoutId));
      } else if (input.action === 'complete') {
        // Update payout
        await db
          .update(brokerPayouts)
          .set({
            status: 'completed',
            paymentReference: input.paymentReference,
            paymentDate: sql`NOW()`,
          })
          .where(eq(brokerPayouts.id, input.payoutId));
        
        // Update broker earnings
        await db
          .update(brokers)
          .set({
            pendingEarnings: sql`${brokers.pendingEarnings} - ${p.amount}`,
            paidEarnings: sql`${brokers.paidEarnings} + ${p.amount}`,
          })
          .where(eq(brokers.id, p.brokerId));
      } else {
        await db
          .update(brokerPayouts)
          .set({
            status: 'failed',
            failureReason: input.failureReason,
          })
          .where(eq(brokerPayouts.id, input.payoutId));
      }
      
      return { success: true };
    }),
  
  // ============ ADMIN: COMMISSION MANAGEMENT ============
  
  // List all commissions (admin only)
  listCommissions: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'paid', 'cancelled']).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) return { commissions: [], total: 0 };
      
      let query = db
        .select({
          commission: brokerCommissions,
          broker: brokers,
          listing: listings,
        })
        .from(brokerCommissions)
        .leftJoin(brokers, eq(brokerCommissions.brokerId, brokers.id))
        .leftJoin(listings, eq(brokerCommissions.listingId, listings.id))
        .orderBy(desc(brokerCommissions.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      if (input.status) {
        query = query.where(eq(brokerCommissions.status, input.status)) as typeof query;
      }
      
      const commissions = await query;
      
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(brokerCommissions);
      
      return { 
        commissions, 
        total: countResult[0]?.count || 0 
      };
    }),
  
  // ============ ADMIN: CONTRACT VERIFICATION ============
  
  // List contracts pending verification (admin only)
  listPendingContracts: protectedProcedure
    .query(async ({ ctx }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) return [];
      
      const contracts = await db
        .select({
          contract: brokerContracts,
          broker: brokers,
          listing: listings,
        })
        .from(brokerContracts)
        .leftJoin(brokers, eq(brokerContracts.brokerId, brokers.id))
        .leftJoin(listings, eq(brokerContracts.listingId, listings.id))
        .where(eq(brokerContracts.status, 'pending_verification'))
        .orderBy(desc(brokerContracts.createdAt));
      
      return contracts;
    }),
  
  // Verify contract (admin only)
  verifyContract: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      action: z.enum(['approve', 'reject']),
      verificationNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Get contract
      const contract = await db
        .select()
        .from(brokerContracts)
        .where(eq(brokerContracts.id, input.contractId))
        .limit(1);
      
      if (!contract[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }
      
      const c = contract[0];
      
      if (input.action === 'approve') {
        // Update contract status to active and mark as verified
        await db
          .update(brokerContracts)
          .set({
            status: 'active',
            isVerified: 1,
            verifiedAt: sql`NOW()`,
            verifiedBy: ctx.user.id,
            verificationNotes: input.verificationNotes,
          })
          .where(eq(brokerContracts.id, input.contractId));
        
        // Update the associated listing to be publishable
        // The listing should now be visible in marketplace
        await db
          .update(listings)
          .set({
            status: 'active',
            isPublished: 1,
          })
          .where(eq(listings.id, c.listingId));
        
        // Get broker info for notification
        const broker = await db
          .select()
          .from(brokers)
          .where(eq(brokers.id, c.brokerId))
          .limit(1);
        
        // Send approval email to broker
        if (broker[0]) {
          try {
            await sendEmail({
              to: broker[0].contactEmail,
              subject: 'Contract Verified - Listing Now Active',
              html: `
                <h2>Contract Verified</h2>
                <p>Your contract for ${c.clientCompanyName} has been verified and approved.</p>
                <p>The listing is now active and visible in the marketplace.</p>
                ${input.verificationNotes ? `<p><strong>Notes:</strong> ${input.verificationNotes}</p>` : ''}
              `,
            });
          } catch (e) {
            console.error('Failed to send contract approval email:', e);
          }
        }
        
        return { success: true, status: 'approved' };
      } else {
        // Reject the contract
        await db
          .update(brokerContracts)
          .set({
            status: 'terminated',
            isVerified: 0,
            verifiedAt: sql`NOW()`,
            verifiedBy: ctx.user.id,
            verificationNotes: input.verificationNotes,
          })
          .where(eq(brokerContracts.id, input.contractId));
        
        // Keep the listing in draft status
        await db
          .update(listings)
          .set({
            status: 'draft',
            isPublished: 0,
          })
          .where(eq(listings.id, c.listingId));
        
        // Get broker info for notification
        const broker = await db
          .select()
          .from(brokers)
          .where(eq(brokers.id, c.brokerId))
          .limit(1);
        
        // Send rejection email to broker
        if (broker[0]) {
          try {
            await sendEmail({
              to: broker[0].contactEmail,
              subject: 'Contract Verification Issue',
              html: `
                <h2>Contract Verification Issue</h2>
                <p>We were unable to verify your contract for ${c.clientCompanyName}.</p>
                ${input.verificationNotes ? `<p><strong>Reason:</strong> ${input.verificationNotes}</p>` : ''}
                <p>Please upload a valid contract document and resubmit for verification.</p>
              `,
            });
          } catch (e) {
            console.error('Failed to send contract rejection email:', e);
          }
        }
        
        return { success: true, status: 'rejected' };
      }
    }),
  
  // Get all contracts for a broker (for admin view)
  getContractsByBroker: protectedProcedure
    .input(z.object({
      brokerId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) return [];
      
      const contracts = await db
        .select({
          contract: brokerContracts,
          listing: listings,
        })
        .from(brokerContracts)
        .leftJoin(listings, eq(brokerContracts.listingId, listings.id))
        .where(eq(brokerContracts.brokerId, input.brokerId))
        .orderBy(desc(brokerContracts.createdAt));
      
      return contracts;
    }),

  // Approve commission (admin only)
  approveCommission: protectedProcedure
    .input(z.object({
      commissionId: z.number(),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Get commission
      const commission = await db
        .select()
        .from(brokerCommissions)
        .where(eq(brokerCommissions.id, input.commissionId))
        .limit(1);
      
      if (!commission[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Commission not found' });
      }
      
      const c = commission[0];
      
      // Update commission status
      await db
        .update(brokerCommissions)
        .set({
          status: 'approved',
          approvedAt: sql`NOW()`,
          approvedBy: ctx.user.id,
          adminNotes: input.adminNotes,
        })
        .where(eq(brokerCommissions.id, input.commissionId));
      
      // Update broker pending earnings
      await db
        .update(brokers)
        .set({
          pendingEarnings: sql`${brokers.pendingEarnings} + ${c.brokerShare}`,
          totalEarnings: sql`${brokers.totalEarnings} + ${c.brokerShare}`,
        })
        .where(eq(brokers.id, c.brokerId));
      
      return { success: true };
    }),
});

export type BrokerRouter = typeof brokerRouter;
