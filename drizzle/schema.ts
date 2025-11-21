import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with marketplace-specific fields for buyers and sellers.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Marketplace-specific fields
  companyName: varchar("companyName", { length: 255 }),
  companyWebsite: varchar("companyWebsite", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * MSP business listings created by sellers
 */
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  
  // Basic Information
  businessName: varchar("businessName", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  yearFounded: int("yearFounded"),
  employeeCount: int("employeeCount"),
  
  // Financial Metrics
  monthlyRecurringRevenue: int("monthlyRecurringRevenue").notNull(), // in dollars
  annualRevenue: int("annualRevenue").notNull(), // in dollars
  ebitda: int("ebitda").notNull(), // in dollars
  ebitdaMargin: int("ebitdaMargin"), // percentage as integer (e.g., 25 for 25%)
  
  // Client Information
  clientCount: int("clientCount").notNull(),
  averageClientValue: int("averageClientValue"), // monthly, in dollars
  clientRetentionRate: int("clientRetentionRate"), // percentage as integer
  
  // Service Mix (stored as comma-separated values)
  serviceMix: text("serviceMix"), // e.g., "Managed IT:60,Cybersecurity:25,Cloud:15"
  
  // Technology Stack
  primaryRMM: varchar("primaryRMM", { length: 100 }), // Remote Monitoring & Management tool
  primaryPSA: varchar("primaryPSA", { length: 100 }), // Professional Services Automation tool
  otherTools: text("otherTools"),
  
  // Valuation
  askingPrice: int("askingPrice"), // in dollars
  estimatedValuation: int("estimatedValuation"), // calculated valuation in dollars
  valuationMultiple: int("valuationMultiple"), // stored as integer (e.g., 45 for 4.5x), divide by 10 for display
  
  // Description & Details
  description: text("description").notNull(),
  keyStrengths: text("keyStrengths"),
  growthOpportunities: text("growthOpportunities"),
  
  // Confidential Information (only visible after NDA)
  clientList: text("clientList"),
  financialDetails: text("financialDetails"),
  
  // Status & Visibility
  status: mysqlEnum("status", ["draft", "active", "under_negotiation", "sold", "withdrawn"]).default("draft").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

/**
 * NDA (Non-Disclosure Agreement) tracking
 * Tracks which buyers have signed NDAs for which listings
 */
export const ndas = mysqlTable("ndas", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  buyerId: int("buyerId").notNull(),
  
  // NDA Details
  signedAt: timestamp("signedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  
  // Status
  status: mysqlEnum("status", ["active", "expired", "revoked"]).default("active").notNull(),
  expiresAt: timestamp("expiresAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NDA = typeof ndas.$inferSelect;
export type InsertNDA = typeof ndas.$inferInsert;

/**
 * Secure messaging between buyers and sellers
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  
  content: text("content").notNull(),
  
  // Message metadata
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Saved searches and alerts for buyers
 */
export const savedSearches = mysqlTable("savedSearches", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId").notNull(),
  
  name: varchar("name", { length: 255 }).notNull(),
  
  // Search criteria (stored as JSON-like text)
  minRevenue: int("minRevenue"),
  maxRevenue: int("maxRevenue"),
  minEbitda: int("minEbitda"),
  maxEbitda: int("maxEbitda"),
  locations: text("locations"), // comma-separated
  
  // Alert settings
  emailAlerts: boolean("emailAlerts").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;

/**
 * Listing views/analytics
 */
export const listingViews = mysqlTable("listingViews", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  viewerId: int("viewerId"), // null for anonymous views
  
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
});

export type ListingView = typeof listingViews.$inferSelect;
export type InsertListingView = typeof listingViews.$inferInsert;
