import { eq, and, gte, lte, desc, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  listings, 
  InsertListing, 
  Listing,
  ndas,
  InsertNDA,
  messages,
  InsertMessage,
  savedSearches,
  InsertSavedSearch,
  listingViews,
  InsertListingView
} from "../drizzle/schema";
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
