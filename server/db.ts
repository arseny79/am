import { eq, and, desc, or, gte, lte, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, listings, InsertListing, ndas, InsertNDA, messages, InsertMessage, savedSearches, InsertSavedSearch, listingViews, InsertListingView, deals, InsertDeal, Deal, documents, InsertDocument, notifications, InsertNotification, buyerRequests, InsertBuyerRequest, accessRequests, InsertAccessRequest } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= User Management =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "companyName", "companyWebsite", "phoneNumber", "location", "bio"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ============= Listing Management =============

export async function createListing(data: InsertListing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(listings).values(data);
  return result;
}

export async function getListingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getListingsBySellerId(sellerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(listings).where(eq(listings.sellerId, sellerId)).orderBy(desc(listings.createdAt));
}

export async function updateListing(id: number, data: Partial<InsertListing>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(listings).set(data).where(eq(listings.id, id));
}

export async function deleteListing(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(listings).where(eq(listings.id, id));
}

export async function getPublishedListings(filters?: {
  minRevenue?: number;
  maxRevenue?: number;
  minEbitda?: number;
  maxEbitda?: number;
  location?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(listings).where(
    and(
      eq(listings.isPublished, true),
      eq(listings.status, "active")
    )
  );
  
  const conditions = [
    eq(listings.isPublished, true),
    eq(listings.status, "active")
  ];
  
  if (filters?.minRevenue) {
    conditions.push(gte(listings.annualRevenue, filters.minRevenue));
  }
  if (filters?.maxRevenue) {
    conditions.push(lte(listings.annualRevenue, filters.maxRevenue));
  }
  if (filters?.minEbitda) {
    conditions.push(gte(listings.ebitda, filters.minEbitda));
  }
  if (filters?.maxEbitda) {
    conditions.push(lte(listings.ebitda, filters.maxEbitda));
  }
  if (filters?.location) {
    conditions.push(sql`${listings.location} LIKE ${`%${filters.location}%`}`);
  }
  
  return await db.select().from(listings).where(and(...conditions)).orderBy(desc(listings.createdAt));
}

// ============= NDA Management =============

export async function createNDA(data: InsertNDA) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(ndas).values(data);
  return result;
}

export async function hasSignedNDA(buyerId: number, listingId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(ndas).where(
    and(
      eq(ndas.buyerId, buyerId),
      eq(ndas.listingId, listingId),
      eq(ndas.status, "active")
    )
  ).limit(1);
  
  return result.length > 0;
}

export async function getNDAsByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(ndas).where(eq(ndas.buyerId, buyerId)).orderBy(desc(ndas.signedAt));
}

// ============= Messaging =============

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(data);
  return result;
}

export async function getMessagesByListing(listingId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(messages).where(
    and(
      eq(messages.listingId, listingId),
      or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      )
    )
  ).orderBy(messages.createdAt);
}

export async function markMessageAsRead(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(messages).set({ 
    isRead: true, 
    readAt: new Date() 
  }).where(eq(messages.id, messageId));
}

export async function getUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      )
    );
  
  return result[0]?.count || 0;
}

// ============= Saved Searches =============

export async function createSavedSearch(data: InsertSavedSearch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(savedSearches).values(data);
  return result;
}

export async function getSavedSearchesByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(savedSearches).where(eq(savedSearches.buyerId, buyerId)).orderBy(desc(savedSearches.createdAt));
}

export async function deleteSavedSearch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(savedSearches).where(eq(savedSearches.id, id));
}

// ============= Analytics =============

export async function recordListingView(data: InsertListingView) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(listingViews).values(data);
}

export async function getListingViewCount(listingId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(listingViews)
    .where(eq(listingViews.listingId, listingId));
  
  return result[0]?.count || 0;
}

// ============================================
// DEAL MANAGEMENT
// ============================================

export async function createDeal(deal: Omit<InsertDeal, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(deals).values(deal);
  return result;
}

export async function getDealById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return result[0] || null;
}

export async function getDealsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(deals)
    .where(or(eq(deals.buyerId, userId), eq(deals.sellerId, userId)))
    .orderBy(desc(deals.updatedAt));
  
  return result;
}

export async function getDealByListingAndBuyer(listingId: number, buyerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(deals)
    .where(and(eq(deals.listingId, listingId), eq(deals.buyerId, buyerId)))
    .limit(1);
  
  return result[0] || null;
}

export async function updateDealStage(dealId: number, stage: Deal["stage"]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(deals)
    .set({ stage, updatedAt: new Date() })
    .where(eq(deals.id, dealId));
}

export async function updateDeal(dealId: number, updates: Partial<Omit<Deal, "id" | "createdAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(deals)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(deals.id, dealId));
}

// ============================================
// DOCUMENT MANAGEMENT
// ============================================

export async function uploadDocument(doc: { dealId: number; uploadedBy: number; fileName: string; fileUrl: string; fileSize?: number; mimeType?: string; version?: number; isLatest?: number; category?: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Mark previous versions as not latest
  if (doc.isLatest) {
    await db.update(documents)
      .set({ isLatest: 0 })
      .where(and(
        eq(documents.dealId, doc.dealId),
        eq(documents.fileName, doc.fileName)
      ));
  }
  
  const result = await db.insert(documents).values(doc);
  return result;
}

export async function getDocumentsByDeal(dealId: number, latestOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(documents.dealId, dealId)];
  if (latestOnly) {
    conditions.push(eq(documents.isLatest, 1));
  }
  
  const result = await db.select().from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));
  return result;
}

export async function getDocumentVersions(dealId: number, fileName: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(documents)
    .where(and(eq(documents.dealId, dealId), eq(documents.fileName, fileName)))
    .orderBy(desc(documents.version));
  
  return result;
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function createNotification(notification: Omit<InsertNotification, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getNotificationsByUser(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, 0));
  }
  
  const result = await db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return result;
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications)
    .set({ isRead: 1 })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications)
    .set({ isRead: 1 })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
}


// ============================================================================
// Buyer Requests
// ============================================================================

export async function createBuyerRequest(data: InsertBuyerRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(buyerRequests).values(data);
  const insertId = Number(result[0].insertId);
  const created = await getBuyerRequestById(insertId);
  return created!;
}

export async function getBuyerRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(buyerRequests).where(eq(buyerRequests.id, id)).limit(1);
  return result[0];
}

export async function getBuyerRequestsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(buyerRequests).where(eq(buyerRequests.buyerId, userId)).orderBy(desc(buyerRequests.createdAt));
}

export async function getAllBuyerRequests(activeOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return db.select().from(buyerRequests)
      .where(and(eq(buyerRequests.status, "active"), eq(buyerRequests.isPublic, 1)))
      .orderBy(desc(buyerRequests.createdAt));
  }
  
  return db.select().from(buyerRequests).orderBy(desc(buyerRequests.createdAt));
}

export async function updateBuyerRequest(id: number, data: Partial<InsertBuyerRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(buyerRequests).set(data).where(eq(buyerRequests.id, id));
}

export async function deleteBuyerRequest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(buyerRequests).where(eq(buyerRequests.id, id));
}

// ============================================================================
// Access Requests
// ============================================================================

export async function createAccessRequest(data: InsertAccessRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(accessRequests).values(data);
  const insertId = Number(result[0].insertId);
  const created = await getAccessRequestById(insertId);
  return created!;
}

export async function getAccessRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(accessRequests).where(eq(accessRequests.id, id)).limit(1);
  return result[0];
}

export async function getAccessRequestsByListing(listingId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(accessRequests).where(eq(accessRequests.listingId, listingId)).orderBy(desc(accessRequests.createdAt));
}

export async function getAccessRequestsByBuyer(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(accessRequests).where(eq(accessRequests.buyerId, buyerId)).orderBy(desc(accessRequests.createdAt));
}

export async function updateAccessRequest(id: number, data: Partial<InsertAccessRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(accessRequests).set(data).where(eq(accessRequests.id, id));
}

export async function hasApprovedAccessRequest(listingId: number, buyerId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(accessRequests)
    .where(and(
      eq(accessRequests.listingId, listingId),
      eq(accessRequests.buyerId, buyerId),
      eq(accessRequests.status, "approved")
    ))
    .limit(1);
  
  return result.length > 0;
}
