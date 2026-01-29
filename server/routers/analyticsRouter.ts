import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, count, sql, inArray, isNotNull, notInArray } from "drizzle-orm";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, deals, listings, accessRequests, messages, documents, dealActivities } from "../../drizzle/schema";

/**
 * Analytics Router - Real-time platform metrics for admin dashboard
 */
export const analyticsRouter = router({
  /**
   * Get user metrics
   */
  getUserMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

    // Total users
    const [totalResult] = await db.select({ count: count() }).from(users);
    const total = totalResult?.count || 0;

    // New users in last 30 days
    const [new30DaysResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgoStr));
    const new30Days = new30DaysResult?.count || 0;

    // Active users (logged in within last 30 days)
    const [activeResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastSignedIn, thirtyDaysAgoStr));
    const active = activeResult?.count || 0;

    // Verified users (KYC approved)
    const [verifiedResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.kycStatus, 'verified'));
    const verified = verifiedResult?.count || 0;

    // Pending KYC
    const [pendingKYCResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.kycStatus, 'pending'));
    const pendingKYC = pendingKYCResult?.count || 0;

    return {
      total,
      new30Days,
      active,
      verified,
      pendingKYC,
      lastUpdated: new Date().toISOString(),
    };
  }),

  /**
   * Get deal metrics
   */
  getDealMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

    // Total deals
    const [totalResult] = await db.select({ count: count() }).from(deals);
    const total = totalResult?.count || 0;

    // New deals in last 30 days
    const [new30DaysResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(gte(deals.createdAt, thirtyDaysAgoStr));
    const new30Days = new30DaysResult?.count || 0;

    // Active deals (not in initial, closed, or cancelled stages)
    const activeStages = ['nda_signed', 'due_diligence', 'negotiation', 'escrow', 'closing'] as const;
    const [activeResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(inArray(deals.stage, activeStages));
    const active = activeResult?.count || 0;

    // Closed deals
    const [closedResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(eq(deals.stage, 'closed'));
    const closed = closedResult?.count || 0;

    // Calculate total value and platform revenue from closed deals
    // Join with listings to get asking price
    const closedDeals = await db
      .select({
        dealId: deals.id,
        askingPrice: listings.askingPrice,
      })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.id))
      .where(eq(deals.stage, 'closed'));

    const totalValue = closedDeals.reduce((sum, d) => sum + (d.askingPrice || 0), 0);
    const platformRevenue = Math.round(totalValue * 0.03); // 3% platform fee

    // Deals by stage for breakdown
    const stageBreakdown = await db
      .select({
        stage: deals.stage,
        count: count(),
      })
      .from(deals)
      .groupBy(deals.stage);

    return {
      total,
      new30Days,
      active,
      closed,
      totalValue,
      platformRevenue,
      stageBreakdown: stageBreakdown.reduce((acc, s) => {
        acc[s.stage] = s.count;
        return acc;
      }, {} as Record<string, number>),
      lastUpdated: new Date().toISOString(),
    };
  }),

  /**
   * Get listing metrics
   */
  getListingMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

    // Total listings
    const [totalResult] = await db.select({ count: count() }).from(listings);
    const total = totalResult?.count || 0;

    // New listings in last 30 days
    const [new30DaysResult] = await db
      .select({ count: count() })
      .from(listings)
      .where(gte(listings.createdAt, thirtyDaysAgoStr));
    const new30Days = new30DaysResult?.count || 0;

    // Active listings (published and not sold/withdrawn)
    const [activeResult] = await db
      .select({ count: count() })
      .from(listings)
      .where(and(
        eq(listings.isPublished, 1),
        inArray(listings.status, ['active', 'under_negotiation'])
      ));
    const active = activeResult?.count || 0;

    // Draft listings
    const [draftResult] = await db
      .select({ count: count() })
      .from(listings)
      .where(eq(listings.status, 'draft'));
    const draft = draftResult?.count || 0;

    // Sold listings
    const [soldResult] = await db
      .select({ count: count() })
      .from(listings)
      .where(eq(listings.status, 'sold'));
    const sold = soldResult?.count || 0;

    // Status breakdown
    const statusBreakdown = await db
      .select({
        status: listings.status,
        count: count(),
      })
      .from(listings)
      .groupBy(listings.status);

    // Total listing value (sum of asking prices)
    const allListings = await db
      .select({ askingPrice: listings.askingPrice })
      .from(listings)
      .where(and(
        eq(listings.isPublished, 1),
        inArray(listings.status, ['active', 'under_negotiation'])
      ));
    const totalValue = allListings.reduce((sum, l) => sum + (l.askingPrice || 0), 0);

    return {
      total,
      new30Days,
      active,
      draft,
      sold,
      totalValue,
      statusBreakdown: statusBreakdown.reduce((acc, s) => {
        acc[s.status] = s.count;
        return acc;
      }, {} as Record<string, number>),
      lastUpdated: new Date().toISOString(),
    };
  }),

  /**
   * Get recent activity summary (last 30 days)
   */
  getRecentActivity: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

    // New users (30 days)
    const [newUsers30d] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgoStr));

    // New users (7 days)
    const [newUsers7d] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgoStr));

    // New deals (30 days)
    const [newDeals30d] = await db
      .select({ count: count() })
      .from(deals)
      .where(gte(deals.createdAt, thirtyDaysAgoStr));

    // New deals (7 days)
    const [newDeals7d] = await db
      .select({ count: count() })
      .from(deals)
      .where(gte(deals.createdAt, sevenDaysAgoStr));

    // New listings (30 days)
    const [newListings30d] = await db
      .select({ count: count() })
      .from(listings)
      .where(gte(listings.createdAt, thirtyDaysAgoStr));

    // New listings (7 days)
    const [newListings7d] = await db
      .select({ count: count() })
      .from(listings)
      .where(gte(listings.createdAt, sevenDaysAgoStr));

    // Access requests (30 days)
    const [accessRequests30d] = await db
      .select({ count: count() })
      .from(accessRequests)
      .where(gte(accessRequests.createdAt, thirtyDaysAgoStr));

    // Messages sent (30 days)
    const [messages30d] = await db
      .select({ count: count() })
      .from(messages)
      .where(gte(messages.createdAt, thirtyDaysAgoStr));

    // Documents uploaded (30 days)
    const [documents30d] = await db
      .select({ count: count() })
      .from(documents)
      .where(gte(documents.createdAt, thirtyDaysAgoStr));

    return {
      newUsers: {
        last7Days: newUsers7d?.count || 0,
        last30Days: newUsers30d?.count || 0,
      },
      newDeals: {
        last7Days: newDeals7d?.count || 0,
        last30Days: newDeals30d?.count || 0,
      },
      newListings: {
        last7Days: newListings7d?.count || 0,
        last30Days: newListings30d?.count || 0,
      },
      accessRequests: accessRequests30d?.count || 0,
      messagesSent: messages30d?.count || 0,
      documentsUploaded: documents30d?.count || 0,
      lastUpdated: new Date().toISOString(),
    };
  }),

  /**
   * Get all metrics in one call (for dashboard)
   */
  getDashboardMetrics: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

    // Run all queries in parallel for performance
    const [
      totalUsers,
      newUsers30d,
      activeUsers,
      verifiedUsers,
      pendingKYC,
      totalDeals,
      newDeals30d,
      activeDeals,
      closedDeals,
      totalListings,
      newListings30d,
      activeListings,
      accessRequestsCount,
      messagesCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgoStr)),
      db.select({ count: count() }).from(users).where(gte(users.lastSignedIn, thirtyDaysAgoStr)),
      db.select({ count: count() }).from(users).where(eq(users.kycStatus, 'verified')),
      db.select({ count: count() }).from(users).where(eq(users.kycStatus, 'pending')),
      db.select({ count: count() }).from(deals),
      db.select({ count: count() }).from(deals).where(gte(deals.createdAt, thirtyDaysAgoStr)),
      db.select({ count: count() }).from(deals).where(inArray(deals.stage, ['nda_signed', 'due_diligence', 'negotiation', 'escrow', 'closing'])),
      db.select({ count: count() }).from(deals).where(eq(deals.stage, 'closed')),
      db.select({ count: count() }).from(listings),
      db.select({ count: count() }).from(listings).where(gte(listings.createdAt, thirtyDaysAgoStr)),
      db.select({ count: count() }).from(listings).where(and(eq(listings.isPublished, 1), inArray(listings.status, ['active', 'under_negotiation']))),
      db.select({ count: count() }).from(accessRequests).where(gte(accessRequests.createdAt, thirtyDaysAgoStr)),
      db.select({ count: count() }).from(messages).where(gte(messages.createdAt, thirtyDaysAgoStr)),
    ]);

    return {
      users: {
        total: totalUsers[0]?.count || 0,
        new30Days: newUsers30d[0]?.count || 0,
        active: activeUsers[0]?.count || 0,
        verified: verifiedUsers[0]?.count || 0,
        pendingKYC: pendingKYC[0]?.count || 0,
      },
      deals: {
        total: totalDeals[0]?.count || 0,
        new30Days: newDeals30d[0]?.count || 0,
        active: activeDeals[0]?.count || 0,
        closed: closedDeals[0]?.count || 0,
      },
      listings: {
        total: totalListings[0]?.count || 0,
        new30Days: newListings30d[0]?.count || 0,
        active: activeListings[0]?.count || 0,
      },
      activity: {
        accessRequests: accessRequestsCount[0]?.count || 0,
        messages: messagesCount[0]?.count || 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }),
});
