import { mysqlTable, int, varchar, text, mysqlEnum, timestamp, decimal, tinyint, index } from "drizzle-orm/mysql-core";

/**
 * Broker System Schema
 * 
 * Brokers are different from affiliates:
 * - Affiliates: Refer users, earn commission on referrals
 * - Brokers: List businesses they don't own (with contracts), earn 50% of platform fees
 * 
 * Key features:
 * - Broker application and approval workflow
 * - Contract upload requirement for each listing
 * - 50/50 fee split tracking
 * - Separate from the affiliate system
 */

// Broker profiles - approved brokers who can list businesses on behalf of clients
export const brokers = mysqlTable("brokers", {
  id: int().autoincrement().primaryKey(),
  userId: int().notNull(), // Link to users table
  
  // Business information
  companyName: varchar({ length: 255 }).notNull(),
  companyWebsite: varchar({ length: 500 }),
  licenseNumber: varchar({ length: 100 }), // Broker license if applicable
  licenseState: varchar({ length: 100 }), // State/country of license
  
  // Contact information
  contactName: varchar({ length: 255 }).notNull(),
  contactEmail: varchar({ length: 320 }).notNull(),
  contactPhone: varchar({ length: 50 }),
  
  // Experience and credentials
  yearsExperience: int(),
  totalDealsCompleted: int().default(0),
  totalDealVolume: int().default(0), // Total $ value of deals closed
  specializations: text(), // JSON array of specializations (MSP, IT services, etc.)
  
  // Status and approval
  status: mysqlEnum(['pending', 'approved', 'suspended', 'rejected']).default('pending').notNull(),
  approvedAt: timestamp({ mode: 'string' }),
  approvedBy: int(),
  rejectionReason: text(),
  suspensionReason: text(),
  
  // Commission tracking
  commissionRate: decimal({ precision: 5, scale: 2 }).default('50.00').notNull(), // Default 50%
  totalEarnings: int().default(0).notNull(),
  pendingEarnings: int().default(0).notNull(),
  paidEarnings: int().default(0).notNull(),
  
  // Payout information
  payoutMethod: mysqlEnum(['bank_transfer', 'paypal', 'check']).default('bank_transfer'),
  paypalEmail: varchar({ length: 320 }),
  bankAccountName: varchar({ length: 255 }),
  bankAccountNumber: varchar({ length: 50 }),
  bankRoutingNumber: varchar({ length: 50 }),
  bankName: varchar({ length: 255 }),
  
  // Profile
  bio: text(),
  profilePhotoUrl: varchar({ length: 500 }),
  
  // Timestamps
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("brokers_userId_idx").on(table.userId),
  index("brokers_status_idx").on(table.status),
]);

// Broker applications - track the application process
export const brokerApplications = mysqlTable("brokerApplications", {
  id: int().autoincrement().primaryKey(),
  userId: int().notNull(),
  
  // Application details
  companyName: varchar({ length: 255 }).notNull(),
  companyWebsite: varchar({ length: 500 }),
  licenseNumber: varchar({ length: 100 }),
  licenseState: varchar({ length: 100 }),
  
  contactName: varchar({ length: 255 }).notNull(),
  contactEmail: varchar({ length: 320 }).notNull(),
  contactPhone: varchar({ length: 50 }),
  
  yearsExperience: int(),
  previousDealsCount: int(),
  previousDealVolume: int(),
  specializations: text(),
  
  // Why they want to be a broker
  applicationMessage: text().notNull(),
  
  // Supporting documents
  resumeUrl: varchar({ length: 500 }),
  licenseDocumentUrl: varchar({ length: 500 }),
  referenceLetterUrl: varchar({ length: 500 }),
  
  // Status
  status: mysqlEnum(['pending', 'under_review', 'approved', 'rejected']).default('pending').notNull(),
  reviewedAt: timestamp({ mode: 'string' }),
  reviewedBy: int(),
  reviewNotes: text(),
  rejectionReason: text(),
  
  // If approved, link to broker profile
  brokerId: int(),
  
  // Timestamps
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("brokerApplications_userId_idx").on(table.userId),
  index("brokerApplications_status_idx").on(table.status),
]);

// Broker contracts - required for each listing a broker creates
export const brokerContracts = mysqlTable("brokerContracts", {
  id: int().autoincrement().primaryKey(),
  brokerId: int().notNull(),
  listingId: int().notNull(),
  
  // Client (seller) information
  clientName: varchar({ length: 255 }).notNull(),
  clientEmail: varchar({ length: 320 }).notNull(),
  clientPhone: varchar({ length: 50 }),
  clientCompanyName: varchar({ length: 255 }).notNull(),
  
  // Contract details
  contractType: mysqlEnum(['exclusive', 'non_exclusive']).default('exclusive').notNull(),
  contractStartDate: timestamp({ mode: 'string' }).notNull(),
  contractEndDate: timestamp({ mode: 'string' }).notNull(),
  
  // Commission agreement with client
  clientCommissionRate: decimal({ precision: 5, scale: 2 }), // What broker charges client
  
  // Contract document
  contractDocumentUrl: varchar({ length: 500 }).notNull(),
  contractFileName: varchar({ length: 255 }).notNull(),
  contractFileSize: int(),
  
  // Verification
  isVerified: tinyint().default(0).notNull(),
  verifiedAt: timestamp({ mode: 'string' }),
  verifiedBy: int(),
  verificationNotes: text(),
  
  // Status
  status: mysqlEnum(['active', 'expired', 'terminated', 'pending_verification']).default('pending_verification').notNull(),
  
  // Timestamps
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("brokerContracts_brokerId_idx").on(table.brokerId),
  index("brokerContracts_listingId_idx").on(table.listingId),
]);

// Broker listings - track which listings are managed by brokers
export const brokerListings = mysqlTable("brokerListings", {
  id: int().autoincrement().primaryKey(),
  brokerId: int().notNull(),
  listingId: int().notNull(),
  contractId: int().notNull(), // Must have a valid contract
  
  // Status
  status: mysqlEnum(['active', 'sold', 'withdrawn', 'expired']).default('active').notNull(),
  
  // Timestamps
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("brokerListings_brokerId_idx").on(table.brokerId),
  index("brokerListings_listingId_idx").on(table.listingId),
]);

// Broker commissions - track 50/50 fee split
export const brokerCommissions = mysqlTable("brokerCommissions", {
  id: int().autoincrement().primaryKey(),
  brokerId: int().notNull(),
  listingId: int().notNull(),
  dealId: int().notNull(),
  
  // Deal information
  dealAmount: int().notNull(), // Total deal value
  platformFee: int().notNull(), // Total platform fee (e.g., 3% of deal)
  
  // Commission split (50/50)
  brokerShare: int().notNull(), // Broker's 50%
  platformShare: int().notNull(), // Platform's 50%
  
  // Status
  status: mysqlEnum(['pending', 'approved', 'paid', 'cancelled']).default('pending').notNull(),
  
  // Approval
  approvedAt: timestamp({ mode: 'string' }),
  approvedBy: int(),
  
  // Payment
  paidAt: timestamp({ mode: 'string' }),
  paymentReference: varchar({ length: 255 }),
  paymentMethod: varchar({ length: 50 }),
  
  // Notes
  adminNotes: text(),
  
  // Timestamps
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("brokerCommissions_brokerId_idx").on(table.brokerId),
  index("brokerCommissions_dealId_idx").on(table.dealId),
  index("brokerCommissions_status_idx").on(table.status),
]);

// Broker payouts - track payout history
export const brokerPayouts = mysqlTable("brokerPayouts", {
  id: int().autoincrement().primaryKey(),
  brokerId: int().notNull(),
  
  // Payout details
  amount: int().notNull(),
  payoutMethod: mysqlEnum(['bank_transfer', 'paypal', 'check']).notNull(),
  
  // Status
  status: mysqlEnum(['pending', 'processing', 'completed', 'failed']).default('pending').notNull(),
  
  // Payment details
  paymentReference: varchar({ length: 255 }),
  paymentDate: timestamp({ mode: 'string' }),
  
  // For failed payouts
  failureReason: text(),
  
  // Admin
  processedBy: int(),
  processedAt: timestamp({ mode: 'string' }),
  adminNotes: text(),
  
  // Timestamps
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("brokerPayouts_brokerId_idx").on(table.brokerId),
  index("brokerPayouts_status_idx").on(table.status),
]);

// Type exports
export type Broker = typeof brokers.$inferSelect;
export type InsertBroker = typeof brokers.$inferInsert;

export type BrokerApplication = typeof brokerApplications.$inferSelect;
export type InsertBrokerApplication = typeof brokerApplications.$inferInsert;

export type BrokerContract = typeof brokerContracts.$inferSelect;
export type InsertBrokerContract = typeof brokerContracts.$inferInsert;

export type BrokerListing = typeof brokerListings.$inferSelect;
export type InsertBrokerListing = typeof brokerListings.$inferInsert;

export type BrokerCommission = typeof brokerCommissions.$inferSelect;
export type InsertBrokerCommission = typeof brokerCommissions.$inferInsert;

export type BrokerPayout = typeof brokerPayouts.$inferSelect;
export type InsertBrokerPayout = typeof brokerPayouts.$inferInsert;
