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
  
  // Service Categories
  primaryServiceCategory: mysqlEnum("primaryServiceCategory", [
    "managed_security",
    "cloud_services",
    "infrastructure_management",
    "help_desk_support",
    "backup_disaster_recovery",
    "application_management",
    "consulting_strategy",
    "telecommunications"
  ]),
  industryVertical: mysqlEnum("industryVertical", [
    "healthcare",
    "financial_services",
    "legal",
    "education",
    "manufacturing",
    "professional_services",
    "retail_ecommerce",
    "nonprofit",
    "government",
    "general_smb"
  ]),
  
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
  confidentialityLevel: mysqlEnum("confidentialityLevel", ["public", "nda", "private"]).default("public").notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  ndaTemplateUrl: text("ndaTemplateUrl"),
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
  
  // NDA Type and Document
  ndaType: mysqlEnum("ndaType", ["clickwrap", "pdf_upload"]).default("clickwrap").notNull(),
  uploadedPdfUrl: text("uploadedPdfUrl"),
  
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
 * Deals table - tracks buyer-seller transactions
 */
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  stage: mysqlEnum("stage", ["initial_contact", "nda_signed", "due_diligence", "negotiation", "closing", "closed", "cancelled"]).default("initial_contact").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
  notes: text("notes"),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

/**
 * Documents table - version-controlled document storage for deals
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  version: int("version").default(1).notNull(),
  isLatest: int("isLatest").default(1).notNull(), // 1 = true, 0 = false
  category: varchar("category", { length: 100 }), // e.g., "financial", "legal", "technical"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Notifications table - email and in-app notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // e.g., "nda_signed", "new_message", "deal_stage_changed"
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // "listing", "deal", "message"
  relatedEntityId: int("relatedEntityId"),
  isRead: int("isRead").default(0).notNull(),
  emailSent: int("emailSent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Buyer Requests - Reverse marketplace where buyers post acquisition criteria
 */
export const buyerRequests = mysqlTable("buyerRequests", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  targetRevenue: int("targetRevenue"),
  minRevenue: int("minRevenue"),
  maxRevenue: int("maxRevenue"),
  targetEbitda: int("targetEbitda"),
  minEbitda: int("minEbitda"),
  maxEbitda: int("maxEbitda"),
  preferredLocations: text("preferredLocations"),
  requiredServiceMix: text("requiredServiceMix"),
  budget: int("budget"),
  timeline: varchar("timeline", { length: 100 }),
  additionalRequirements: text("additionalRequirements"),
  status: mysqlEnum("status", ["active", "fulfilled", "expired", "withdrawn"]).default("active").notNull(),
  isPublic: int("isPublic").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type BuyerRequest = typeof buyerRequests.$inferSelect;
export type InsertBuyerRequest = typeof buyerRequests.$inferInsert;

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

/**
 * Access requests for private listings
 */
export const accessRequests = mysqlTable("accessRequests", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  buyerId: int("buyerId").notNull(),
  
  // Request Details
  companyName: varchar("companyName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }),
  message: text("message").notNull(),
  
  // Status & Response
  status: mysqlEnum("status", ["pending", "approved", "declined", "more_info_requested"]).default("pending").notNull(),
  sellerResponse: text("sellerResponse"),
  respondedAt: timestamp("respondedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;
