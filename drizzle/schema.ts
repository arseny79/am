import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with marketplace-specific fields for buyers and sellers.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Made nullable for email/password users
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(), // Made unique for email/password login
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Email/password authentication fields
  passwordHash: varchar("passwordHash", { length: 255 }), // bcrypt hash
  emailVerified: boolean("emailVerified").default(false),
  emailVerificationToken: varchar("emailVerificationToken", { length: 64 }),
  emailVerificationTokenExpiry: timestamp("emailVerificationTokenExpiry"),
  passwordResetToken: varchar("passwordResetToken", { length: 64 }),
  passwordResetTokenExpiry: timestamp("passwordResetTokenExpiry"),
  
  // Marketplace-specific fields
  companyName: varchar("companyName", { length: 255 }),
  companyWebsite: varchar("companyWebsite", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),
  
  // Legal acceptance tracking
  tosAcceptedAt: timestamp("tosAcceptedAt"),
  privacyPolicyAcceptedAt: timestamp("privacyPolicyAcceptedAt"),
  
  // Simple KYC Verification (FREE - manual review)
  kycVerified: boolean("kycVerified").default(false).notNull(),
  kycSubmittedAt: timestamp("kycSubmittedAt"),
  kycReviewedAt: timestamp("kycReviewedAt"),
  kycRejectionReason: text("kycRejectionReason"),
  
  // Legacy verification fields (kept for backward compatibility)
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "payment_pending", "identity_pending", "funds_pending", "review_pending", "verified", "rejected"]).default("unverified").notNull(),
  verificationTier: mysqlEnum("verificationTier", ["none", "basic", "verified", "premium"]).default("none").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verificationExpiresAt: timestamp("verificationExpiresAt"),
  stripeIdentitySessionId: varchar("stripeIdentitySessionId", { length: 255 }),
  plaidAccessToken: varchar("plaidAccessToken", { length: 255 }),
  fundsVerifiedAmount: int("fundsVerifiedAmount"),
  
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
  logoUrl: text("logoUrl"), // Company logo/avatar URL from S3
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
  
  // Pricing Tier
  listingTier: mysqlEnum("listingTier", ["standard", "featured", "premium"]).default("standard").notNull(),
  
  // Payment Tracking
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded"]).default("pending").notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }), // Stripe checkout session ID
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }), // Stripe payment intent ID
  paidAt: timestamp("paidAt"), // When listing fee was paid
  
  // Valuation
  askingPrice: int("askingPrice"), // in dollars
  estimatedValuation: int("estimatedValuation"), // calculated valuation in dollars
  valuationMultiple: int("valuationMultiple"), // stored as integer (e.g., 45 for 4.5x), divide by 10 for display
  
  // Valuation Reality Check - detailed inputs and outputs
  valuationInputs: json("valuationInputs").$type<{
    total_revenue_ttm: number;
    ebitda_ttm: number;
    owner_salary_add_back: number;
    one_time_expenses_add_back: number;
    recurring_revenue_ttm: number;
    project_based_revenue_ttm: number;
    yoy_growth_rate: number;
    client_count: number;
    top_1_client_revenue: number;
    top_5_clients_revenue: number;
    clients_under_contract_pct: number;
    avg_contract_length_months: number;
    contracts_with_transferability_pct: number;
  }>(),
  valuationOutputs: json("valuationOutputs").$type<{
    adjusted_ebitda: number;
    base_multiple: number;
    final_adjusted_multiple: number;
    calculated_fair_value: number;
    churn_adjusted_valuation: number;
    adjustments: {
      recurring_revenue_premium: number;
      contract_quality_premium: number;
      client_concentration_discount: number;
      growth_rate_premium: number;
    };
  }>(),
  sellerDesiredPrice: int("sellerDesiredPrice"), // For reality check comparison
  valuationCompletedAt: timestamp("valuationCompletedAt"),
  
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
  
  // Pricing Tier & Featured Placement
  tier: mysqlEnum("tier", ["free", "featured", "premium_featured"]).default("free").notNull(),
  thumbnailUrl: text("thumbnailUrl"), // Custom thumbnail for Premium Featured listings
  featuredUntil: timestamp("featuredUntil"), // Expiration date for featured/premium placement
  
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
 * Secure messaging between buyers and sellers (deal-scoped)
 * Messages can only be sent within the context of an active deal
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(), // Messages are scoped to deals, not listings
  senderId: int("senderId").notNull(), // User who sent the message
  
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
  stage: mysqlEnum("stage", ["initial_contact", "nda_signed", "due_diligence", "negotiation", "escrow", "closing", "closed", "cancelled"]).default("initial_contact").notNull(),
  
  // Quick action flags for flexible workflow
  acceptedAskingPrice: boolean("acceptedAskingPrice").default(false),
  skipNegotiation: boolean("skipNegotiation").default(false),
  stageSkipReason: text("stageSkipReason"),
  
  // Counter-offer tracking
  counterOfferRequested: boolean("counterOfferRequested").default(false),
  counterOfferAmount: int("counterOfferAmount"),
  counterOfferReason: text("counterOfferReason"),
  
  // LOI tracking
  loiAccepted: boolean("loiAccepted").default(false),
  loiAcceptedAt: timestamp("loiAcceptedAt"),
  
  // Escrow.com integration
  escrowTransactionId: varchar("escrowTransactionId", { length: 100 }),
  escrowStatus: mysqlEnum("escrowStatus", ["not_started", "created", "agreed", "funded", "shipped", "received", "accepted", "completed", "cancelled"]).default("not_started"),
  escrowCreatedAt: timestamp("escrowCreatedAt"),
  escrowFundedAt: timestamp("escrowFundedAt"),
  escrowCompletedAt: timestamp("escrowCompletedAt"),
  escrowPaymentUrl: text("escrowPaymentUrl"), // URL for buyer to fund escrow
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
  notes: text("notes"),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

/**
 * Deal Milestones - independent milestone tracking for flexible workflow
 * Milestones can be completed in any order, independent of deal stages
 */
export const dealMilestones = mysqlTable("dealMilestones", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  milestoneType: mysqlEnum("milestoneType", [
    "nda_signed",
    "financials_reviewed",
    "offer_submitted",
    "loi_signed",
    "final_agreement_signed",
    "escrow_funded",
    "assets_transferred"
  ]).notNull(),
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"), // userId who completed the milestone
  expectedCompletionDate: timestamp("expectedCompletionDate"), // When this milestone should be completed
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DealMilestone = typeof dealMilestones.$inferSelect;
export type InsertDealMilestone = typeof dealMilestones.$inferInsert;

/**
 * Offer history table for tracking negotiation thread
 * Stores all offers, counter-offers, and responses
 */
export const offerHistory = mysqlTable("offerHistory", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  offeredBy: int("offeredBy").notNull(), // userId who made the offer
  offerType: mysqlEnum("offerType", [
    "initial_asking_price",
    "buyer_counter_offer",
    "seller_counter_offer",
    "final_accepted_offer"
  ]).notNull(),
  amount: int("amount").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "superseded", "expired"]).default("pending").notNull(),
  respondedBy: int("respondedBy"), // userId who responded
  respondedAt: timestamp("respondedAt"),
  responseNotes: text("responseNotes"),
  expiresAt: timestamp("expiresAt"), // Offer expiration deadline (default 72 hours)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OfferHistory = typeof offerHistory.$inferSelect;
export type InsertOfferHistory = typeof offerHistory.$inferInsert;

/**
 * Listing Documents - documents attached to listings with access control
 * Sellers upload documents here with 3 access levels
 */
export const listingDocuments = mysqlTable("listingDocuments", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  
  // File information
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  
  // Access control
  accessLevel: mysqlEnum("accessLevel", ["public", "nda_gated", "request_only"]).default("nda_gated").notNull(),
  
  // Categorization
  category: varchar("category", { length: 100 }), // e.g., "financial", "legal", "technical", "operational"
  description: text("description"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ListingDocument = typeof listingDocuments.$inferSelect;
export type InsertListingDocument = typeof listingDocuments.$inferInsert;

/**
 * Documents table - version-controlled document storage for deals
 * Includes documents inherited from listings + deal-specific uploads
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  
  // File information
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  
  // Version control
  version: int("version").default(1).notNull(),
  isLatest: int("isLatest").default(1).notNull(), // 1 = true, 0 = false
  
  // Categorization
  category: varchar("category", { length: 100 }), // e.g., "financial", "legal", "technical"
  description: text("description"),
  
  // Source tracking (inherited from listing or uploaded in deal)
  sourceListingDocumentId: int("sourceListingDocumentId"), // null if uploaded directly to deal
  
  // DocuSign integration fields
  signatureStatus: mysqlEnum("signatureStatus", ["none", "pending", "signed", "declined", "voided"]).default("none").notNull(),
  docusignEnvelopeId: varchar("docusignEnvelopeId", { length: 255 }), // DocuSign envelope ID
  signers: text("signers"), // JSON array of signer info: [{email, name, status, signedAt}]
  signedAt: timestamp("signedAt"), // When all parties signed
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
 * Buyer Request Proposals - Sellers propose their listings to match buyer requests
 * Sellers MUST have a listing to submit a proposal
 */
export const buyerRequestProposals = mysqlTable("buyerRequestProposals", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  sellerId: int("sellerId").notNull(),
  listingId: int("listingId").notNull(), // REQUIRED - seller must have listing
  proposalMessage: text("proposalMessage"),
  dealId: int("dealId"), // Auto-created when proposal submitted
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
});

export type BuyerRequestProposal = typeof buyerRequestProposals.$inferSelect;
export type InsertBuyerRequestProposal = typeof buyerRequestProposals.$inferInsert;

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

/**
 * Action items for deal progress tracking
 * Tasks that need to be completed to move the deal forward
 */
export const actionItems = mysqlTable("actionItems", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  
  // Task Details
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  assignedTo: mysqlEnum("assignedTo", ["buyer", "seller", "both"]).notNull(),
  
  // Status & Priority
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "blocked"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  
  // Dates
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"), // userId who completed it
  
  // Metadata
  createdBy: int("createdBy").notNull(), // userId who created it
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = typeof actionItems.$inferInsert;


/**
 * Deal Activity Timeline - tracks all events and actions in a deal
 */
export const dealActivities = mysqlTable("dealActivities", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  userId: int("userId"), // null for system-generated events
  activityType: mysqlEnum("activityType", [
    "deal_created",
    "stage_changed",
    "document_uploaded",
    "message_sent",
    "nda_signed",
    "action_item_created",
    "action_item_completed",
    "milestone_completed",
    "escrow_initiated",
    "payment_received",
    "deal_closed",
    "deal_cancelled",
    "note_added",
    "offer_submitted",
    "negotiation_update",
    "proposal_submitted",
    "proposal_accepted",
    "proposal_declined",
  ]).notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DealActivity = typeof dealActivities.$inferSelect;
export type InsertDealActivity = typeof dealActivities.$inferInsert;


/**
 * Saved Listings - tracks which users have bookmarked/favorited which listings
 * Junction table for many-to-many relationship between users and listings
 */
export const savedListings = mysqlTable("savedListings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  listingId: int("listingId").notNull(),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type SavedListing = typeof savedListings.$inferSelect;
export type InsertSavedListing = typeof savedListings.$inferInsert;


/**
 * Site Settings - global configuration for the marketplace
 * Single-row table for storing site-wide settings
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  // Branding
  logoUrl: text("logoUrl"), // Site logo URL from S3
  // Analytics
  googleAnalyticsId: varchar("googleAnalyticsId", { length: 50 }), // e.g., "G-XXXXXXXXXX" or "UA-XXXXXXXXX-X"
  statcounterId: varchar("statcounterId", { length: 50 }), // StatCounter Project ID
  statcounterSecurity: varchar("statcounterSecurity", { length: 50 }), // StatCounter Security Code
  // SEO Metadata
  seoTitle: varchar("seoTitle", { length: 200 }), // Homepage title tag
  seoDescription: text("seoDescription"), // Homepage meta description
  ogTitle: varchar("ogTitle", { length: 200 }), // Open Graph title
  ogDescription: text("ogDescription"), // Open Graph description
  ogImage: varchar("ogImage", { length: 500 }), // Open Graph image URL
  // Metadata
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"), // userId who last updated
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;


/**
 * Platform Documents - legal and policy documents
 * Stores Terms of Service, Privacy Policy, Cookie Policy, etc.
 */
export const platformDocuments = mysqlTable("platformDocuments", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier (e.g., "terms-of-service", "privacy-policy")
  title: varchar("title", { length: 200 }).notNull(), // Display title (e.g., "Terms of Service")
  content: text("content").notNull(), // Markdown content
  version: int("version").default(1).notNull(), // Version number for tracking changes
  isPublished: boolean("isPublished").default(false).notNull(), // Whether document is live
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"), // userId who last updated
});

export type PlatformDocument = typeof platformDocuments.$inferSelect;
export type InsertPlatformDocument = typeof platformDocuments.$inferInsert;


/**
 * Buyer Verifications - tracks verification attempts and documents
 * Premium feature: $199 one-time fee for verified buyer badge
 */
export const buyerVerifications = mysqlTable("buyerVerifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Payment tracking
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amountPaid: int("amountPaid"), // in cents ($199 = 19900)
  paidAt: timestamp("paidAt"),
  
  // Identity verification (Stripe Identity)
  identitySessionId: varchar("identitySessionId", { length: 255 }),
  identityStatus: mysqlEnum("identityStatus", ["not_started", "pending", "verified", "failed"]).default("not_started").notNull(),
  identityVerifiedAt: timestamp("identityVerifiedAt"),
  identityDocumentType: varchar("identityDocumentType", { length: 50 }), // passport, drivers_license, id_card
  identityDocumentNumber: varchar("identityDocumentNumber", { length: 100 }), // last 4 digits only
  identityFullName: varchar("identityFullName", { length: 255 }),
  identityDateOfBirth: varchar("identityDateOfBirth", { length: 20 }),
  identityAddress: text("identityAddress"),
  
  // Bank verification (Plaid)
  plaidLinkToken: varchar("plaidLinkToken", { length: 255 }),
  plaidAccessToken: varchar("plaidAccessToken", { length: 255 }),
  plaidItemId: varchar("plaidItemId", { length: 255 }),
  bankStatus: mysqlEnum("bankStatus", ["not_started", "pending", "verified", "failed"]).default("not_started").notNull(),
  bankVerifiedAt: timestamp("bankVerifiedAt"),
  bankName: varchar("bankName", { length: 255 }),
  bankAccountMask: varchar("bankAccountMask", { length: 10 }), // last 4 digits
  verifiedBalance: int("verifiedBalance"), // in cents
  
  // Admin review
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"), // admin userId
  reviewNotes: text("reviewNotes"),
  rejectionReason: text("rejectionReason"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BuyerVerification = typeof buyerVerifications.$inferSelect;
export type InsertBuyerVerification = typeof buyerVerifications.$inferInsert;

/**
 * Price Plans - Admin-configurable pricing tiers for listings
 * Allows dynamic pricing management without code changes
 */
export const pricePlans = mysqlTable("pricePlans", {
  id: int("id").autoincrement().primaryKey(),
  
  // Plan identification
  tier: mysqlEnum("tier", ["free", "featured", "premium_featured"]).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Free Listing", "Featured", "Premium Featured"
  description: text("description"), // Short description of the plan
  
  // Pricing
  price: int("price").notNull(), // in cents (0 for free, 9900 for $99, 24900 for $249)
  billingPeriod: mysqlEnum("billingPeriod", ["one_time", "weekly", "monthly", "annual"]).default("weekly").notNull(),
  successFeePercentage: int("successFeePercentage").notNull().default(300), // in basis points (300 = 3.00%, 250 = 2.50%)
  
  // Features (stored as JSON array of feature descriptions)
  features: json("features").$type<string[]>().notNull(), // e.g., ["Basic listing", "Search visibility", "3% success fee"]
  
  // Stripe integration
  stripeProductId: varchar("stripeProductId", { length: 255 }), // Stripe product ID
  stripePriceId: varchar("stripePriceId", { length: 255 }), // Stripe price ID
  
  // Display settings
  displayOrder: int("displayOrder").notNull().default(0), // Order in pricing page (lower = first)
  isActive: boolean("isActive").default(true).notNull(), // Can be toggled on/off
  isFeatured: boolean("isFeatured").default(false).notNull(), // Highlight as "Most Popular"
  
  // Feature flags
  allowsThumbnail: boolean("allowsThumbnail").default(false).notNull(), // Premium tier only
  carouselPlacement: boolean("carouselPlacement").default(false).notNull(), // Featured & Premium
  prioritySupport: boolean("prioritySupport").default(false).notNull(), // Premium only
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricePlan = typeof pricePlans.$inferSelect;
export type InsertPricePlan = typeof pricePlans.$inferInsert;


/**
 * KYC Documents - Simple document storage for manual KYC review
 * Users upload ID + Address proof, admin reviews and approves
 */
export const kycDocuments = mysqlTable("kycDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Document details
  documentType: mysqlEnum("documentType", ["government_id", "proof_of_address"]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  
  // Review status
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"), // admin user ID
  reviewNotes: text("reviewNotes"),
  
  // Metadata
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type KYCDocument = typeof kycDocuments.$inferSelect;
export type InsertKYCDocument = typeof kycDocuments.$inferInsert;


/**
 * Listing Preparation Items - Sales packet checklist for sellers
 * Tracks completion of required documents and data for listing preparation
 */
export const listingPreparationItems = mysqlTable("listingPreparationItems", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  
  // Item details
  category: mysqlEnum("category", [
    "financial",
    "clients",
    "technical",
    "operational",
    "legal"
  ]).notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  description: text("description"), // What this item is and why it's needed
  
  // Classification
  required: boolean("required").default(false).notNull(), // Required for listing (60% weight)
  recommended: boolean("recommended").default(false).notNull(), // Recommended (30% weight)
  // If neither required nor recommended, it's nice-to-have (10% weight)
  
  // Completion tracking
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  
  // Associated document
  documentId: int("documentId"), // Link to uploaded document in documents table
  
  // Template reference
  templateFileName: varchar("templateFileName", { length: 255 }), // e.g., "financial-statement-template.xlsx"
  hasTemplate: boolean("hasTemplate").default(false).notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ListingPreparationItem = typeof listingPreparationItems.$inferSelect;
export type InsertListingPreparationItem = typeof listingPreparationItems.$inferInsert;


/**
 * Buyer Qualifications - Proof of funds verification for buyers
 * Tracks buyer verification level and financial capacity
 */
export const buyerQualifications = mysqlTable("buyerQualifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One qualification per user
  
  // Verification level
  verificationLevel: mysqlEnum("verificationLevel", [
    "basic",      // No verification - limited access
    "verified",   // Proof of funds verified - full access
    "premium"     // Enhanced verification - priority access
  ]).default("basic").notNull(),
  
  // Proof of funds
  proofOfFundsUrl: varchar("proofOfFundsUrl", { length: 500 }), // S3 URL to bank statement/letter
  proofOfFundsAmount: int("proofOfFundsAmount"), // Verified amount in dollars
  proofOfFundsType: mysqlEnum("proofOfFundsType", [
    "bank_statement",
    "credit_line",
    "investor_letter",
    "other"
  ]),
  
  // Verification tracking
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"), // Admin user ID who verified
  verificationNotes: text("verificationNotes"), // Admin notes about verification
  
  // Status
  status: mysqlEnum("status", [
    "pending",      // Submitted, awaiting review
    "approved",     // Verified and approved
    "rejected",     // Rejected (insufficient funds, fake docs, etc.)
    "expired"       // Verification expired (need to reverify)
  ]).default("pending").notNull(),
  
  // Expiration
  expiresAt: timestamp("expiresAt"), // Verification expires after 90 days
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BuyerQualification = typeof buyerQualifications.$inferSelect;
export type InsertBuyerQualification = typeof buyerQualifications.$inferInsert;


/**
 * Due Diligence Items - Checklist items for deal due diligence
 * Tracks completion of required documents and information requests
 */
export const dueDiligenceItems = mysqlTable("dueDiligenceItems", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  
  // Item details
  category: mysqlEnum("category", [
    "financial",
    "legal",
    "technical",
    "operational",
    "clients",
    "employees",
    "contracts"
  ]).notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  description: text("description"), // What's needed and why
  
  // Classification
  required: boolean("required").default(false).notNull(), // Must complete before closing
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  
  // Status tracking
  status: mysqlEnum("status", [
    "pending",      // Not started
    "requested",    // Buyer requested this item
    "in_progress",  // Seller working on it
    "completed",    // Item provided/answered
    "waived"        // Buyer waived this requirement
  ]).default("pending").notNull(),
  
  // Assignment
  requestedBy: int("requestedBy"), // User ID who requested this
  assignedTo: int("assignedTo"), // User ID responsible for completing
  
  // Completion tracking
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"),
  
  // Associated documents
  documentIds: text("documentIds"), // JSON array of document IDs
  
  // Due date
  dueDate: timestamp("dueDate"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DueDiligenceItem = typeof dueDiligenceItems.$inferSelect;
export type InsertDueDiligenceItem = typeof dueDiligenceItems.$inferInsert;


/**
 * Due Diligence Questions - Q&A threads for due diligence items
 * Allows buyers to ask questions and sellers to respond
 */
export const dueDiligenceQuestions = mysqlTable("dueDiligenceQuestions", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(), // Links to dueDiligenceItems
  
  // Question/Answer
  question: text("question").notNull(),
  answer: text("answer"),
  
  // Participants
  askedBy: int("askedBy").notNull(), // User ID who asked
  answeredBy: int("answeredBy"), // User ID who answered
  
  // Status
  status: mysqlEnum("status", [
    "open",       // Question asked, awaiting answer
    "answered",   // Answer provided
    "resolved"    // Buyer satisfied with answer
  ]).default("open").notNull(),
  
  // Timestamps
  askedAt: timestamp("askedAt").defaultNow().notNull(),
  answeredAt: timestamp("answeredAt"),
  resolvedAt: timestamp("resolvedAt"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DueDiligenceQuestion = typeof dueDiligenceQuestions.$inferSelect;
export type InsertDueDiligenceQuestion = typeof dueDiligenceQuestions.$inferInsert;


/**
 * Affiliate Tiers - Configurable commission levels
 * Admin can create multiple tiers with different commission rates
 */
export const affiliateTiers = mysqlTable("affiliateTiers", {
  id: int("id").autoincrement().primaryKey(),
  
  // Tier configuration
  level: int("level").notNull().unique(), // 1, 2, 3 etc.
  name: varchar("name", { length: 100 }).notNull(), // "Bronze", "Silver", "Gold"
  commissionPercent: decimal("commissionPercent", { precision: 5, scale: 2 }).notNull(), // e.g., 25.00 for 25%
  
  // Requirements to reach this tier
  minReferrals: int("minReferrals").default(0).notNull(), // Minimum successful referrals needed
  minEarnings: int("minEarnings").default(0).notNull(), // Minimum total earnings in cents
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AffiliateTier = typeof affiliateTiers.$inferSelect;
export type InsertAffiliateTier = typeof affiliateTiers.$inferInsert;


/**
 * Affiliates - Users who have signed up for the affiliate program
 */
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One affiliate account per user
  
  // Affiliate details
  referralCode: varchar("referralCode", { length: 20 }).notNull().unique(), // Unique code for tracking
  tierId: int("tierId").notNull(), // Current tier level
  
  // Status
  status: mysqlEnum("status", [
    "pending",    // Applied, awaiting approval
    "active",     // Approved and active
    "suspended",  // Temporarily suspended
    "rejected"    // Application rejected
  ]).default("pending").notNull(),
  
  // Stats (denormalized for quick access)
  totalReferrals: int("totalReferrals").default(0).notNull(),
  successfulReferrals: int("successfulReferrals").default(0).notNull(), // Referrals that converted to deals
  totalEarnings: int("totalEarnings").default(0).notNull(), // In cents
  pendingEarnings: int("pendingEarnings").default(0).notNull(), // Unpaid earnings in cents
  paidEarnings: int("paidEarnings").default(0).notNull(), // Total paid out in cents
  
  // Payment info
  paypalEmail: varchar("paypalEmail", { length: 320 }),
  bankDetails: text("bankDetails"), // Encrypted or JSON
  
  // Admin notes
  adminNotes: text("adminNotes"),
  rejectionReason: text("rejectionReason"),
  
  // Timestamps
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  lastPayoutAt: timestamp("lastPayoutAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;


/**
 * Referrals - Tracks users who signed up via affiliate links
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(), // The affiliate who referred
  referredUserId: int("referredUserId").notNull().unique(), // The user who was referred (one referral per user)
  
  // Tracking
  referralCode: varchar("referralCode", { length: 20 }).notNull(), // Code used at signup
  
  // Status
  status: mysqlEnum("status", [
    "registered",   // User signed up
    "qualified",    // User completed KYC or created listing
    "converted",    // User completed a deal (commission earned)
    "expired"       // Referral window expired without conversion
  ]).default("registered").notNull(),
  
  // Conversion tracking
  qualifiedAt: timestamp("qualifiedAt"),
  convertedAt: timestamp("convertedAt"),
  convertedDealId: int("convertedDealId"), // The deal that triggered conversion
  
  // Attribution window (e.g., 90 days)
  expiresAt: timestamp("expiresAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;


/**
 * Affiliate Commissions - Tracks earned commissions from deals
 */
export const affiliateCommissions = mysqlTable("affiliateCommissions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  referralId: int("referralId").notNull(),
  dealId: int("dealId").notNull(),
  
  // Commission details
  dealAmount: int("dealAmount").notNull(), // Total deal value in cents
  platformFee: int("platformFee").notNull(), // Platform's success fee in cents (3% of deal)
  commissionPercent: decimal("commissionPercent", { precision: 5, scale: 2 }).notNull(), // Commission rate at time of deal
  commissionAmount: int("commissionAmount").notNull(), // Actual commission earned in cents
  
  // Status
  status: mysqlEnum("status", [
    "pending",    // Deal closed, commission calculated
    "approved",   // Admin approved for payout
    "paid",       // Commission paid to affiliate
    "cancelled"   // Deal fell through, commission cancelled
  ]).default("pending").notNull(),
  
  // Payment tracking
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"), // Admin who approved
  paidAt: timestamp("paidAt"),
  paymentReference: varchar("paymentReference", { length: 255 }), // PayPal transaction ID, etc.
  
  // Notes
  adminNotes: text("adminNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type InsertAffiliateCommission = typeof affiliateCommissions.$inferInsert;



/**
 * Professionals Directory - M&A professionals (brokers, lawyers, accountants, etc.)
 * Users can browse and invite professionals to their deals
 */
export const professionals = mysqlTable("professionals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Link to user account if they have one (nullable for unclaimed profiles)
  
  // Profile information
  name: varchar("name", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  
  // Professional details
  type: mysqlEnum("type", [
    "broker",           // M&A Broker
    "lawyer",           // M&A Attorney
    "accountant",       // CPA / Financial Advisor
    "due_diligence",    // Due Diligence Specialist
    "valuation",        // Business Valuation Expert
    "consultant",       // M&A Consultant
    "other"
  ]).notNull(),
  
  specialties: json("specialties").$type<string[]>(), // e.g., ["MSP", "IT Services", "SaaS"]
  bio: text("bio"),
  yearsExperience: int("yearsExperience"),
  dealsCompleted: int("dealsCompleted"), // Number of MSP deals closed
  
  // Location
  location: varchar("location", { length: 255 }),
  serviceAreas: json("serviceAreas").$type<string[]>(), // e.g., ["Northeast US", "California", "Nationwide"]
  
  // Pricing/Fees
  feeStructure: text("feeStructure"), // Description of how they charge
  
  // Tier & Status
  tier: mysqlEnum("tier", ["basic", "professional", "premium"]).default("basic").notNull(),
  tierExpiresAt: timestamp("tierExpiresAt"), // When paid tier expires
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  
  // Verification
  verified: boolean("verified").default(false).notNull(), // Admin-verified professional
  verifiedAt: timestamp("verifiedAt"),
  
  // Status
  status: mysqlEnum("status", ["pending", "active", "suspended", "inactive"]).default("pending").notNull(),
  
  // Stats (updated periodically)
  profileViews: int("profileViews").default(0).notNull(),
  dealInvitations: int("dealInvitations").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = typeof professionals.$inferInsert;


/**
 * Deal Professionals - Junction table for professionals invited to deals
 */
export const dealProfessionals = mysqlTable("dealProfessionals", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  professionalId: int("professionalId").notNull(),
  
  // Who invited them
  invitedBy: int("invitedBy").notNull(), // userId who sent invitation
  invitedByRole: mysqlEnum("invitedByRole", ["buyer", "seller"]).notNull(),
  
  // Status
  status: mysqlEnum("status", [
    "invited",    // Invitation sent
    "accepted",   // Professional accepted
    "declined",   // Professional declined
    "removed"     // Removed from deal
  ]).default("invited").notNull(),
  
  // Access level
  accessLevel: mysqlEnum("accessLevel", [
    "view_only",     // Can view deal info and documents
    "participant",   // Can view and comment
    "full_access"    // Can view, comment, and upload documents
  ]).default("view_only").notNull(),
  
  // Notes
  invitationNote: text("invitationNote"), // Message from inviter
  responseNote: text("responseNote"), // Response from professional
  
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  removedAt: timestamp("removedAt"),
});

export type DealProfessional = typeof dealProfessionals.$inferSelect;
export type InsertDealProfessional = typeof dealProfessionals.$inferInsert;


/**
 * Professional Reviews - Reviews from deal participants (future feature)
 * Keeping schema minimal for now - just tracking basic info
 */
export const professionalReviews = mysqlTable("professionalReviews", {
  id: int("id").autoincrement().primaryKey(),
  professionalId: int("professionalId").notNull(),
  reviewerId: int("reviewerId").notNull(), // User who left review
  dealId: int("dealId"), // Optional - link to specific deal
  
  rating: int("rating").notNull(), // 1-5 stars
  review: text("review"),
  
  // Moderation
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfessionalReview = typeof professionalReviews.$inferSelect;
export type InsertProfessionalReview = typeof professionalReviews.$inferInsert;
