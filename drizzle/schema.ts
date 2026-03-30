import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, varchar, text, mysqlEnum, timestamp, index, decimal, json, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const accessRequests = mysqlTable("accessRequests", {
	id: int().autoincrement().notNull(),
	listingId: int().notNull(),
	buyerId: int().notNull(),
	companyName: varchar({ length: 255 }),
	contactEmail: varchar({ length: 320 }).notNull(),
	contactPhone: varchar({ length: 50 }),
	message: text().notNull(),
	status: mysqlEnum(['pending','approved','declined','more_info_requested']).default('pending').notNull(),
	sellerResponse: text(),
	respondedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const actionItems = mysqlTable("actionItems", {
	id: int().autoincrement().notNull(),
	dealId: int().notNull(),
	title: varchar({ length: 500 }).notNull(),
	description: text(),
	assignedTo: mysqlEnum(['buyer','seller','both']).notNull(),
	status: mysqlEnum(['pending','in_progress','completed','blocked']).default('pending').notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	dueDate: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	completedBy: int(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const adminAuditLogs = mysqlTable("adminAuditLogs", {
	id: int().autoincrement().notNull(),
	adminId: int().notNull(),
	adminName: varchar({ length: 255 }),
	adminEmail: varchar({ length: 320 }),
	action: varchar({ length: 100 }).notNull(),
	resource: varchar({ length: 100 }).notNull(),
	resourceId: int(),
	details: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	status: mysqlEnum(['success','failure']).default('success').notNull(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("adminAuditLogs_adminId").on(table.adminId),
	index("adminAuditLogs_action").on(table.action),
	index("adminAuditLogs_resource").on(table.resource),
	index("adminAuditLogs_createdAt").on(table.createdAt),
]);

export const auditLogs = mysqlTable("audit_logs", {
	id: int().autoincrement().notNull(),
	userId: int("user_id"),
	action: varchar({ length: 50 }).notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: varchar("entity_id", { length: 255 }).notNull(),
	oldValue: text("old_value"),
	newValue: text("new_value"),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_audit_user_id").on(table.userId),
	index("idx_audit_entity").on(table.entityType, table.entityId),
	index("idx_audit_action").on(table.action),
	index("idx_audit_created_at").on(table.createdAt),
]);

export const affiliateCommissions = mysqlTable("affiliateCommissions", {
	id: int().autoincrement().notNull(),
	affiliateId: int().notNull(),
	referralId: int().notNull(),
	dealId: int().notNull(),
	dealAmount: int().notNull(),
	platformFee: int().notNull(),
	commissionPercent: decimal({ precision: 5, scale: 2 }).notNull(),
	commissionAmount: int().notNull(),
	status: mysqlEnum(['pending','approved','paid','cancelled']).default('pending').notNull(),
	approvedAt: timestamp({ mode: 'string' }),
	approvedBy: int(),
	paidAt: timestamp({ mode: 'string' }),
	paymentReference: varchar({ length: 255 }),
	adminNotes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const affiliateTiers = mysqlTable("affiliateTiers", {
	id: int().autoincrement().notNull(),
	level: int().notNull(),
	name: varchar({ length: 100 }).notNull(),
	commissionPercent: decimal({ precision: 5, scale: 2 }).notNull(),
	minReferrals: int().default(0).notNull(),
	minEarnings: int().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("level").on(table.level),
]);

export const affiliates = mysqlTable("affiliates", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	referralCode: varchar({ length: 20 }).notNull(),
	tierId: int().notNull(),
	status: mysqlEnum(['pending','active','suspended','rejected']).default('pending').notNull(),
	totalReferrals: int().default(0).notNull(),
	successfulReferrals: int().default(0).notNull(),
	totalEarnings: int().default(0).notNull(),
	pendingEarnings: int().default(0).notNull(),
	paidEarnings: int().default(0).notNull(),
	paypalEmail: varchar({ length: 320 }),
	bankDetails: text(),
	adminNotes: text(),
	rejectionReason: text(),
	appliedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	approvedAt: timestamp({ mode: 'string' }),
	lastPayoutAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId").on(table.userId),
	index("referralCode").on(table.referralCode),
]);

export const brokerApplications = mysqlTable("brokerApplications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
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
	applicationMessage: text().notNull(),
	resumeUrl: varchar({ length: 500 }),
	licenseDocumentUrl: varchar({ length: 500 }),
	referenceLetterUrl: varchar({ length: 500 }),
	status: mysqlEnum(['pending','under_review','approved','rejected']).default('pending').notNull(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewedBy: int(),
	reviewNotes: text(),
	rejectionReason: text(),
	brokerId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("brokerApplications_userId_idx").on(table.userId),
	index("brokerApplications_status_idx").on(table.status),
]);

export const brokerCommissions = mysqlTable("brokerCommissions", {
	id: int().autoincrement().notNull(),
	brokerId: int().notNull(),
	listingId: int().notNull(),
	dealId: int().notNull(),
	dealAmount: int().notNull(),
	platformFee: int().notNull(),
	brokerShare: int().notNull(),
	platformShare: int().notNull(),
	status: mysqlEnum(['pending','approved','paid','cancelled']).default('pending').notNull(),
	approvedAt: timestamp({ mode: 'string' }),
	approvedBy: int(),
	paidAt: timestamp({ mode: 'string' }),
	paymentReference: varchar({ length: 255 }),
	paymentMethod: varchar({ length: 50 }),
	adminNotes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("brokerCommissions_brokerId_idx").on(table.brokerId),
	index("brokerCommissions_dealId_idx").on(table.dealId),
	index("brokerCommissions_status_idx").on(table.status),
]);

export const brokerContracts = mysqlTable("brokerContracts", {
	id: int().autoincrement().notNull(),
	brokerId: int().notNull(),
	listingId: int().notNull(),
	clientName: varchar({ length: 255 }).notNull(),
	clientEmail: varchar({ length: 320 }).notNull(),
	clientPhone: varchar({ length: 50 }),
	clientCompanyName: varchar({ length: 255 }).notNull(),
	contractType: mysqlEnum(['exclusive','non_exclusive']).default('exclusive').notNull(),
	contractStartDate: timestamp({ mode: 'string' }).notNull(),
	contractEndDate: timestamp({ mode: 'string' }).notNull(),
	clientCommissionRate: decimal({ precision: 5, scale: 2 }),
	contractDocumentUrl: varchar({ length: 500 }).notNull(),
	contractFileName: varchar({ length: 255 }).notNull(),
	contractFileSize: int(),
	isVerified: tinyint().default(0).notNull(),
	verifiedAt: timestamp({ mode: 'string' }),
	verifiedBy: int(),
	verificationNotes: text(),
	status: mysqlEnum(['active','expired','terminated','pending_verification']).default('pending_verification').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("brokerContracts_brokerId_idx").on(table.brokerId),
	index("brokerContracts_listingId_idx").on(table.listingId),
]);

export const brokerListings = mysqlTable("brokerListings", {
	id: int().autoincrement().notNull(),
	brokerId: int().notNull(),
	listingId: int().notNull(),
	contractId: int().notNull(),
	status: mysqlEnum(['active','sold','withdrawn','expired']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("brokerListings_brokerId_idx").on(table.brokerId),
	index("brokerListings_listingId_idx").on(table.listingId),
]);

export const brokerPayouts = mysqlTable("brokerPayouts", {
	id: int().autoincrement().notNull(),
	brokerId: int().notNull(),
	amount: int().notNull(),
	payoutMethod: mysqlEnum(['bank_transfer','paypal','check']).notNull(),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	paymentReference: varchar({ length: 255 }),
	paymentDate: timestamp({ mode: 'string' }),
	failureReason: text(),
	processedBy: int(),
	processedAt: timestamp({ mode: 'string' }),
	adminNotes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("brokerPayouts_brokerId_idx").on(table.brokerId),
	index("brokerPayouts_status_idx").on(table.status),
]);

export const brokers = mysqlTable("brokers", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	companyWebsite: varchar({ length: 500 }),
	licenseNumber: varchar({ length: 100 }),
	licenseState: varchar({ length: 100 }),
	contactName: varchar({ length: 255 }).notNull(),
	contactEmail: varchar({ length: 320 }).notNull(),
	contactPhone: varchar({ length: 50 }),
	yearsExperience: int(),
	totalDealsCompleted: int().default(0),
	totalDealVolume: int().default(0),
	specializations: text(),
	status: mysqlEnum(['pending','approved','suspended','rejected']).default('pending').notNull(),
	approvedAt: timestamp({ mode: 'string' }),
	approvedBy: int(),
	rejectionReason: text(),
	suspensionReason: text(),
	commissionRate: decimal({ precision: 5, scale: 2 }).default('50.00').notNull(),
	totalEarnings: int().default(0).notNull(),
	pendingEarnings: int().default(0).notNull(),
	paidEarnings: int().default(0).notNull(),
	payoutMethod: mysqlEnum(['bank_transfer','paypal','check']).default('bank_transfer'),
	paypalEmail: varchar({ length: 320 }),
	bankAccountName: varchar({ length: 255 }),
	bankAccountNumber: varchar({ length: 50 }),
	bankRoutingNumber: varchar({ length: 50 }),
	bankName: varchar({ length: 255 }),
	bio: text(),
	profilePhotoUrl: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("brokers_userId_idx").on(table.userId),
	index("brokers_status_idx").on(table.status),
]);

export const buyerQualifications = mysqlTable("buyerQualifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	verificationLevel: mysqlEnum(['basic','verified','premium']).default('basic').notNull(),
	proofOfFundsUrl: varchar({ length: 500 }),
	proofOfFundsAmount: int(),
	proofOfFundsType: mysqlEnum(['bank_statement','credit_line','investor_letter','other']),
	verifiedAt: timestamp({ mode: 'string' }),
	verifiedBy: int(),
	verificationNotes: text(),
	status: mysqlEnum(['pending','approved','rejected','expired']).default('pending').notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId").on(table.userId),
]);

export const buyerRequestProposals = mysqlTable("buyerRequestProposals", {
	id: int().autoincrement().notNull(),
	requestId: int().notNull(),
	sellerId: int().notNull(),
	listingId: int().notNull(),
	proposalMessage: text(),
	dealId: int(),
	status: mysqlEnum(['pending','accepted','declined']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	respondedAt: timestamp({ mode: 'string' }),
});

export const buyerRequests = mysqlTable("buyerRequests", {
	id: int().autoincrement().notNull(),
	buyerId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	targetRevenue: int(),
	minRevenue: int(),
	maxRevenue: int(),
	targetEbitda: int(),
	minEbitda: int(),
	maxEbitda: int(),
	preferredLocations: text(),
	requiredServiceMix: text(),
	budget: int(),
	timeline: varchar({ length: 100 }),
	additionalRequirements: text(),
	status: mysqlEnum(['pending','published','unpublished','fulfilled','expired','withdrawn']).default('pending').notNull(),
	isPublic: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	publishedAt: timestamp({ mode: 'string' }),
	expiresAt: timestamp({ mode: 'string' }),
	isAnonymous: tinyint().default(0).notNull(),
});

export const buyerVerifications = mysqlTable("buyerVerifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	stripePaymentIntentId: varchar({ length: 255 }),
	amountPaid: int(),
	paidAt: timestamp({ mode: 'string' }),
	identitySessionId: varchar({ length: 255 }),
	identityStatus: mysqlEnum(['not_started','pending','verified','failed']).default('not_started').notNull(),
	identityVerifiedAt: timestamp({ mode: 'string' }),
	identityDocumentType: varchar({ length: 50 }),
	identityDocumentNumber: varchar({ length: 100 }),
	identityFullName: varchar({ length: 255 }),
	identityDateOfBirth: varchar({ length: 20 }),
	identityAddress: text(),
	plaidLinkToken: varchar({ length: 255 }),
	plaidAccessToken: varchar({ length: 255 }),
	plaidItemId: varchar({ length: 255 }),
	bankStatus: mysqlEnum(['not_started','pending','verified','failed']).default('not_started').notNull(),
	bankVerifiedAt: timestamp({ mode: 'string' }),
	bankName: varchar({ length: 255 }),
	bankAccountMask: varchar({ length: 10 }),
	verifiedBalance: int(),
	reviewStatus: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewedBy: int(),
	reviewNotes: text(),
	rejectionReason: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const dealActivities = mysqlTable("dealActivities", {
	id: int().autoincrement().notNull(),
	dealId: int().notNull(),
	userId: int(),
	activityType: mysqlEnum(['deal_created','stage_changed','document_uploaded','message_sent','nda_signed','action_item_created','action_item_completed','milestone_completed','escrow_initiated','payment_received','deal_closed','deal_cancelled','note_added','offer_submitted','negotiation_update','proposal_submitted','proposal_accepted','proposal_declined']).notNull(),
	description: text().notNull(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const dealMilestones = mysqlTable("dealMilestones", {
	id: int().autoincrement().notNull(),
	dealId: int().notNull(),
	milestoneType: mysqlEnum(['nda_signed','financials_reviewed','offer_submitted','loi_signed','final_agreement_signed','escrow_funded','assets_transferred']).notNull(),
	completedAt: timestamp({ mode: 'string' }),
	completedBy: int(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	expectedCompletionDate: timestamp({ mode: 'string' }),
});

export const dealProfessionals = mysqlTable("dealProfessionals", {
	id: int().autoincrement().notNull(),
	dealId: int().notNull(),
	professionalId: int().notNull(),
	invitedBy: int().notNull(),
	invitedByRole: mysqlEnum(['buyer','seller']).notNull(),
	status: mysqlEnum(['invited','accepted','declined','removed']).default('invited').notNull(),
	accessLevel: mysqlEnum(['view_only','participant','full_access']).default('view_only').notNull(),
	invitationNote: text(),
	responseNote: text(),
	invitedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	respondedAt: timestamp({ mode: 'string' }),
	removedAt: timestamp({ mode: 'string' }),
});

export const deals = mysqlTable("deals", {
	id: int().autoincrement().notNull(),
	listingId: int().notNull(),
	buyerId: int().notNull(),
	sellerId: int().notNull(),
	stage: mysqlEnum(['initial_contact','nda_signed','due_diligence','negotiation','escrow','closing','closed','cancelled']).default('initial_contact').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	closedAt: timestamp({ mode: 'string' }),
	notes: text(),
	acceptedAskingPrice: tinyint().default(0),
	skipNegotiation: tinyint().default(0),
	stageSkipReason: text(),
	counterOfferRequested: tinyint().default(0),
	counterOfferAmount: int(),
	counterOfferReason: text(),
	loiAccepted: tinyint().default(0),
	loiAcceptedAt: timestamp({ mode: 'string' }),
	escrowTransactionId: varchar({ length: 100 }),
	escrowStatus: mysqlEnum(['not_started','created','agreed','funded','shipped','received','accepted','completed','cancelled']).default('not_started'),
	escrowCreatedAt: timestamp({ mode: 'string' }),
	escrowFundedAt: timestamp({ mode: 'string' }),
	escrowCompletedAt: timestamp({ mode: 'string' }),
	escrowPaymentUrl: text(),
	buyerRequestId: int(),
	ndaExpiresAt: timestamp({ mode: 'string' }),
	ndaRevokedAt: timestamp({ mode: 'string' }),
	ndaRevokedBy: int(),
	ndaRevocationReason: text(),
	buyerNdaConfirmed: tinyint().default(0),
	sellerNdaConfirmed: tinyint().default(0),
	buyerNdaSignedAt: timestamp({ mode: 'string' }),
	sellerNdaSignedAt: timestamp({ mode: 'string' }),
	// DocuSign integration
	docusignEnvelopeId: varchar("docusign_envelope_id", { length: 255 }),
	docusignStatus: varchar("docusign_status", { length: 50 }),
	docusignBuyerStatus: varchar("docusign_buyer_status", { length: 50 }),
	docusignSellerStatus: varchar("docusign_seller_status", { length: 50 }),
	docusignSentAt: timestamp("docusign_sent_at", { mode: 'string' }),
	docusignCompletedAt: timestamp("docusign_completed_at", { mode: 'string' }),
	deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export const documents = mysqlTable("documents", {
	id: int().autoincrement().notNull(),
	dealId: int().notNull(),
	uploadedBy: int().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: text().notNull(),
	fileSize: int(),
	mimeType: varchar({ length: 100 }),
	version: int().default(1).notNull(),
	isLatest: int().default(1).notNull(),
	category: varchar({ length: 100 }),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	sourceListingDocumentId: int(),
	signatureStatus: mysqlEnum(['none','pending','signed','declined','voided']).default('none').notNull(),
	docusignEnvelopeId: varchar({ length: 255 }),
	signers: text(),
	signedAt: timestamp({ mode: 'string' }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export const dueDiligenceItems = mysqlTable("dueDiligenceItems", {
	id: int().autoincrement().notNull(),
	dealId: int().notNull(),
	category: mysqlEnum(['financial','legal','technical','operational','clients','employees','contracts']).notNull(),
	itemName: varchar({ length: 255 }).notNull(),
	description: text(),
	required: tinyint().default(0).notNull(),
	priority: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	status: mysqlEnum(['pending','requested','in_progress','completed','waived']).default('pending').notNull(),
	requestedBy: int(),
	assignedTo: int(),
	completedAt: timestamp({ mode: 'string' }),
	completedBy: int(),
	documentIds: text(),
	dueDate: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const dueDiligenceQuestions = mysqlTable("dueDiligenceQuestions", {
	id: int().autoincrement().notNull(),
	itemId: int().notNull(),
	question: text().notNull(),
	answer: text(),
	askedBy: int().notNull(),
	answeredBy: int(),
	status: mysqlEnum(['open','answered','resolved']).default('open').notNull(),
	askedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	answeredAt: timestamp({ mode: 'string' }),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kycDocuments = mysqlTable("kycDocuments", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	submissionId: int(),
	documentType: mysqlEnum(['government_id','business_license','proof_of_ownership','proof_of_address','financial_statement','other']).notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: text().notNull(),
	fileSize: int(),
	mimeType: varchar({ length: 100 }),
	reviewStatus: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewedBy: int(),
	reviewNotes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kycSubmissions = mysqlTable("kycSubmissions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	submissionType: mysqlEnum(['initial','business_verification','resubmission']).default('initial').notNull(),
	status: mysqlEnum(['pending','under_review','approved','rejected','more_info_requested']).default('pending').notNull(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewedBy: int(),
	reviewerNotes: text(),
	rejectionReason: text(),
	flagged: tinyint().default(0).notNull(),
	flagReason: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_userId").on(table.userId),
	index("idx_status").on(table.status),
	index("idx_flagged").on(table.flagged),
	index("idx_createdAt").on(table.createdAt),
]);

export const listingDocuments = mysqlTable("listingDocuments", {
	id: int().autoincrement().notNull(),
	listingId: int().notNull(),
	uploadedBy: int().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: text().notNull(),
	fileSize: int(),
	mimeType: varchar({ length: 100 }),
	accessLevel: mysqlEnum(['public','nda_gated','request_only']).default('nda_gated').notNull(),
	category: varchar({ length: 100 }),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const listingPreparationItems = mysqlTable("listingPreparationItems", {
	id: int().autoincrement().notNull(),
	listingId: int().notNull(),
	category: mysqlEnum(['financial','clients','technical','operational','legal']).notNull(),
	itemName: varchar({ length: 255 }).notNull(),
	description: text(),
	required: tinyint().default(0).notNull(),
	recommended: tinyint().default(0).notNull(),
	completed: tinyint().default(0).notNull(),
	completedAt: timestamp({ mode: 'string' }),
	documentId: int(),
	templateFileName: varchar({ length: 255 }),
	hasTemplate: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	documentUrl: text(),
	documentFileName: varchar({ length: 255 }),
});

export const listingViews = mysqlTable("listingViews", {
	id: int().autoincrement().notNull(),
	listingId: int().notNull(),
	viewerId: int(),
	viewedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	ipAddress: varchar({ length: 45 }),
});

export const listings = mysqlTable("listings", {
	id: int().autoincrement().notNull(),
	sellerId: int().notNull(),
	brokerId: int(),
	businessName: varchar({ length: 255 }).notNull(),
	location: varchar({ length: 255 }).notNull(),
	yearFounded: int(),
	employeeCount: int(),
	monthlyRecurringRevenue: int().notNull(),
	annualRevenue: int().notNull(),
	ebitda: int().notNull(),
	ebitdaMargin: int(),
	clientCount: int().notNull(),
	averageClientValue: int(),
	clientRetentionRate: int(),
	serviceMix: text(),
	primaryRmm: varchar({ length: 100 }),
	primaryPsa: varchar({ length: 100 }),
	otherTools: text(),
	askingPrice: int(),
	estimatedValuation: int(),
	valuationMultiple: int(),
	description: text().notNull(),
	keyStrengths: text(),
	growthOpportunities: text(),
	clientList: text(),
	financialDetails: text(),
	status: mysqlEnum(['draft','active','under_negotiation','sold','withdrawn']).default('draft').notNull(),
	isPublished: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	confidentialityLevel: mysqlEnum(['public','nda','private']).default('public').notNull(),
	isAnonymous: tinyint().default(0).notNull(),
	ndaTemplateUrl: text(),
	primaryServiceCategory: mysqlEnum(['managed_security','cloud_services','infrastructure_management','help_desk_support','backup_disaster_recovery','application_management','consulting_strategy','telecommunications']),
	industryVertical: mysqlEnum(['healthcare','financial_services','legal','education','manufacturing','professional_services','retail_ecommerce','nonprofit','government','general_smb']),
	listingTier: mysqlEnum(['standard','featured','premium']).default('standard').notNull(),
	paymentStatus: mysqlEnum(['pending','paid','refunded']).default('pending').notNull(),
	stripeSessionId: varchar({ length: 255 }),
	stripePaymentIntentId: varchar({ length: 255 }),
	paidAt: timestamp({ mode: 'string' }),
	valuationInputs: json(),
	valuationOutputs: json(),
	sellerDesiredPrice: int(),
	valuationCompletedAt: timestamp({ mode: 'string' }),
	logoUrl: text(),
	tier: mysqlEnum(['free','featured','premium_featured']).default('free').notNull(),
	thumbnailUrl: text(),
	featuredUntil: timestamp({ mode: 'string' }),
	deletedAt: timestamp('deleted_at', { mode: 'string' }),
	fieldVisibility: json('field_visibility'),
	categoryId: int('category_id'),
});

export const listingCategories = mysqlTable("listingCategories", {
	id: int().autoincrement().notNull(),
	group: varchar({ length: 100 }).notNull(),
	label: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	sortOrder: int().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
	id: int().autoincrement().notNull(),
	senderId: int().notNull(),
	content: text().notNull(),
	isRead: tinyint().default(0).notNull(),
	readAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	dealId: int().notNull(),
	deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export const ndaSigningAuditLog = mysqlTable("ndaSigningAuditLog", {
	id: int().autoincrement().notNull(),
	ndaSigningId: int().notNull(),
	action: varchar({ length: 100 }).notNull(),
	userId: int(),
	details: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

export const ndaSignings = mysqlTable("ndaSignings", {
	id: int().autoincrement().notNull(),
	dealId: int().notNull(),
	templateId: int().notNull(),
	buyerId: int().notNull(),
	sellerId: int().notNull(),
	signedByBuyer: tinyint().default(0).notNull(),
	signedBySeller: tinyint().default(0).notNull(),
	buyerSignedAt: timestamp({ mode: 'string' }),
	sellerSignedAt: timestamp({ mode: 'string' }),
	buyerIpAddress: varchar({ length: 45 }),
	sellerIpAddress: varchar({ length: 45 }),
	renderedContent: text().notNull(),
	status: mysqlEnum(['pending','partially_signed','fully_signed','expired','revoked']).default('pending').notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	buyerSignature: text(),
	sellerSignature: text(),
	buyerSignatureType: varchar({ length: 50 }),
	sellerSignatureType: varchar({ length: 50 }),
	variableValues: text(),
	customNdaUrl: varchar({ length: 500 }),
	customNdaFileName: varchar({ length: 255 }),
});

export const ndaTemplates = mysqlTable("ndaTemplates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	isDefault: tinyint().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	content: text().notNull(),
	fileUrl: varchar({ length: 500 }),
	fileName: varchar({ length: 255 }),
	fileMimeType: varchar({ length: 100 }),
	createdBy: int().notNull(),
	updatedBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const ndaVariableDefinitions = mysqlTable("ndaVariableDefinitions", {
	id: int().autoincrement().notNull(),
	templateId: int().notNull(),
	variableName: varchar({ length: 100 }).notNull(),
	displayName: varchar({ length: 255 }).notNull(),
	type: mysqlEnum(['text','date','email','number','company']).notNull(),
	required: tinyint().default(0).notNull(),
	defaultValue: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const ndas = mysqlTable("ndas", {
	id: int().autoincrement().notNull(),
	listingId: int().notNull(),
	buyerId: int().notNull(),
	signedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	ipAddress: varchar({ length: 45 }),
	status: mysqlEnum(['active','expired','revoked']).default('active').notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	ndaType: mysqlEnum(['clickwrap','pdf_upload']).default('clickwrap').notNull(),
	uploadedPdfUrl: text(),
});

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	relatedEntityType: varchar({ length: 50 }),
	relatedEntityId: int(),
	isRead: int().default(0).notNull(),
	emailSent: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const offerHistory = mysqlTable("offerHistory", {
	id: int().autoincrement().notNull(),
	dealId: int().notNull(),
	offeredBy: int().notNull(),
	offerType: mysqlEnum(['initial_asking_price','buyer_counter_offer','seller_counter_offer','final_accepted_offer']).notNull(),
	amount: int().notNull(),
	reason: text(),
	status: mysqlEnum(['pending','accepted','rejected','superseded','expired']).default('pending').notNull(),
	respondedBy: int(),
	respondedAt: timestamp({ mode: 'string' }),
	responseNotes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	expiresAt: timestamp({ mode: 'string' }),
});

export const platformDocuments = mysqlTable("platformDocuments", {
	id: int().autoincrement().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	version: int().default(1).notNull(),
	isPublished: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	updatedBy: int(),
},
(table) => [
	index("platformDocuments_slug_unique").on(table.slug),
]);

export const pricePlans = mysqlTable("pricePlans", {
	id: int().autoincrement().notNull(),
	tier: mysqlEnum(['free','featured','premium_featured']).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	price: int().notNull(),
	billingPeriod: mysqlEnum(['one_time','weekly','monthly','annual']).default('weekly').notNull(),
	features: json().notNull(),
	stripeProductId: varchar({ length: 255 }),
	stripePriceId: varchar({ length: 255 }),
	displayOrder: int().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	isFeatured: tinyint().default(0).notNull(),
	allowsThumbnail: tinyint().default(0).notNull(),
	carouselPlacement: tinyint().default(0).notNull(),
	prioritySupport: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	successFeePercentage: int().default(300).notNull(),
},
(table) => [
	index("pricePlans_tier_unique").on(table.tier),
]);

export const professionalCredentials = mysqlTable("professionalCredentials", {
	id: int().autoincrement().notNull(),
	professionalId: int().notNull(),
	credentialType: mysqlEnum(['license','certification','degree','insurance','other']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	issuingOrganization: varchar({ length: 255 }),
	issueDate: timestamp({ mode: 'string' }),
	expiryDate: timestamp({ mode: 'string' }),
	credentialNumber: varchar({ length: 100 }),
	fileUrl: varchar({ length: 500 }).notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileSize: int(),
	mimeType: varchar({ length: 100 }),
	verificationStatus: mysqlEnum(['pending','verified','rejected']).default('pending').notNull(),
	verifiedAt: timestamp({ mode: 'string' }),
	verifiedBy: int(),
	rejectionReason: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const professionalReviews = mysqlTable("professionalReviews", {
	id: int().autoincrement().notNull(),
	professionalId: int().notNull(),
	reviewerId: int().notNull(),
	dealId: int(),
	rating: int().notNull(),
	review: text(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const professionals = mysqlTable("professionals", {
	id: int().autoincrement().notNull(),
	userId: int(),
	name: varchar({ length: 255 }).notNull(),
	companyName: varchar({ length: 255 }),
	email: varchar({ length: 320 }).notNull(),
	phone: varchar({ length: 50 }),
	website: varchar({ length: 500 }),
	type: mysqlEnum(['broker','lawyer','accountant','due_diligence','valuation','consultant','other']).notNull(),
	profilePhotoUrl: varchar({ length: 500 }),
	specialties: json(),
	bio: text(),
	yearsExperience: int(),
	dealsCompleted: int(),
	location: varchar({ length: 255 }),
	serviceAreas: json(),
	feeStructure: text(),
	tier: mysqlEnum(['basic','professional','premium']).default('basic').notNull(),
	tierExpiresAt: timestamp({ mode: 'string' }),
	stripeSubscriptionId: varchar({ length: 255 }),
	verified: tinyint().default(0).notNull(),
	verifiedAt: timestamp({ mode: 'string' }),
	status: mysqlEnum(['pending','active','suspended','rejected']).default('pending').notNull(),
	profileViews: int().default(0).notNull(),
	dealInvitations: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const referrals = mysqlTable("referrals", {
	id: int().autoincrement().notNull(),
	affiliateId: int().notNull(),
	referredUserId: int().notNull(),
	referralCode: varchar({ length: 20 }).notNull(),
	status: mysqlEnum(['registered','qualified','converted','expired']).default('registered').notNull(),
	qualifiedAt: timestamp({ mode: 'string' }),
	convertedAt: timestamp({ mode: 'string' }),
	convertedDealId: int(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("referredUserId").on(table.referredUserId),
]);

export const savedListings = mysqlTable("savedListings", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	listingId: int().notNull(),
	savedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const savedSearches = mysqlTable("savedSearches", {
	id: int().autoincrement().notNull(),
	buyerId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	minRevenue: int(),
	maxRevenue: int(),
	minEbitda: int(),
	maxEbitda: int(),
	locations: text(),
	emailAlerts: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const subscriptions = mysqlTable("subscriptions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	stripeCustomerId: varchar({ length: 255 }).notNull(),
	stripeSubscriptionId: varchar({ length: 255 }).notNull(),
	productId: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	currentPeriodEnd: timestamp({ mode: 'string' }).notNull(),
	cancelAtPeriodEnd: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_subscriptions_user_id").on(table.userId),
	index("idx_subscriptions_stripe_subscription_id").on(table.stripeSubscriptionId),
	index("idx_subscriptions_status").on(table.status),
	index("idx_subscriptions_user_status").on(table.userId, table.status),
]);

export const siteSettings = mysqlTable("siteSettings", {
	id: int().autoincrement().notNull(),
	googleAnalyticsId: varchar({ length: 50 }),
	statcounterId: varchar({ length: 50 }),
	statcounterSecurity: varchar({ length: 50 }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	updatedBy: int(),
	seoTitle: varchar({ length: 200 }),
	seoDescription: text(),
	ogTitle: varchar({ length: 200 }),
	ogDescription: text(),
	ogImage: varchar({ length: 500 }),
	logoUrl: text(),
	heroHeadline: text(),
	heroSubheadline: text(),
	heroDescription: text(),
	heroPrimaryButtonText: varchar({ length: 100 }),
	heroPrimaryButtonUrl: varchar({ length: 500 }),
	heroSecondaryButtonText: varchar({ length: 100 }),
	heroSecondaryButtonUrl: varchar({ length: 500 }),
	statGmv: varchar({ length: 50 }),
	statActiveListings: varchar({ length: 50 }),
	statEscrowProtected: varchar({ length: 100 }),
	valuationDataSources: text(),
	valuationDisclaimer: text(),
	valuationToolHeading: text(),
	valuationToolSubheading: text(),
	marketplaceHeading: text(),
	marketplaceSubheading: text(),
	buyAssetHeading: text(),
	buyAssetSubheading: text(),
	livechatScript: text(),
	livechatEnabledPublic: tinyint().default(1),
	livechatEnabledAdmin: tinyint().default(0),
	statGmvLabel: varchar({ length: 100 }),
	statActiveListingsLabel: varchar({ length: 100 }),
	statEscrowProtectedLabel: varchar({ length: 100 }),
	// DocuSign integration settings
	docusignIntegrationKey: varchar("docusign_integration_key", { length: 255 }),
	docusignUserId: varchar("docusign_user_id", { length: 255 }),
	docusignAccountId: varchar("docusign_account_id", { length: 255 }),
	docusignEnvironment: varchar("docusign_environment", { length: 50 }).default("sandbox"),
	docusignRsaPrivateKey: text("docusign_rsa_private_key"),
});

export const userNotes = mysqlTable("userNotes", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	authorId: int().notNull(),
	authorName: varchar({ length: 255 }),
	content: text().notNull(),
	category: mysqlEnum(['general','kyc','affiliate','support','compliance','fraud']).default('general').notNull(),
	isPinned: tinyint().default(0).notNull(),
	editedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_userId").on(table.userId),
	index("idx_authorId").on(table.authorId),
	index("idx_category").on(table.category),
	index("idx_isPinned").on(table.isPinned),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','suspended']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	companyName: varchar({ length: 255 }),
	companyWebsite: varchar({ length: 255 }),
	phoneNumber: varchar({ length: 50 }),
	location: varchar({ length: 255 }),
	bio: text(),
	profilePhotoUrl: varchar({ length: 500 }),
	tosAcceptedAt: timestamp({ mode: 'string' }),
	privacyPolicyAcceptedAt: timestamp({ mode: 'string' }),
	stripeIdentitySessionId: varchar({ length: 255 }),
	passwordHash: varchar({ length: 255 }),
	emailVerified: tinyint().default(0),
	emailVerificationToken: varchar({ length: 64 }),
	emailVerificationTokenExpiry: timestamp({ mode: 'string' }),
	passwordResetToken: varchar({ length: 64 }),
	passwordResetTokenExpiry: timestamp({ mode: 'string' }),
	kycStatus: mysqlEnum(['unverified','pending','verified','rejected']).default('unverified').notNull(),
	kycMethod: mysqlEnum(['none','manual','stripe_identity']).default('none'),
	kycSubmittedAt: timestamp({ mode: 'string' }),
	kycReviewedAt: timestamp({ mode: 'string' }),
	kycReviewedBy: int(),
	kycRejectionReason: text(),
	stripeIdentityVerificationId: varchar({ length: 255 }),
	kycVerified: tinyint().default(0).notNull(),
	verificationStatus: mysqlEnum(['unverified','payment_pending','identity_pending','funds_pending','review_pending','verified','rejected']).default('unverified').notNull(),
	verificationTier: mysqlEnum(['none','basic','verified','premium']).default('none').notNull(),
	verifiedAt: timestamp({ mode: 'string' }),
	verificationExpiresAt: timestamp({ mode: 'string' }),
	plaidAccessToken: varchar({ length: 255 }),
	fundsVerifiedAmount: int(),
	stripeIdentityVerified: tinyint().default(0).notNull(),
	stripeIdentityVerifiedAt: timestamp({ mode: 'string' }),
	stripeIdentityPaymentIntentId: varchar({ length: 255 }),
	stripeIdentityAmountPaid: int(),
	lastReminderSentAt: timestamp({ mode: 'string' }),
	deletedAt: timestamp('deleted_at', { mode: 'string' }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
	index("users_email_unique").on(table.email),
]);

// Type exports for insert operations
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type InsertUser = InferInsertModel<typeof users>;
export type User = InferSelectModel<typeof users>;
export type InsertListing = InferInsertModel<typeof listings>;
export type Listing = InferSelectModel<typeof listings>;
export type InsertNDA = InferInsertModel<typeof ndas>;
export type NDA = InferSelectModel<typeof ndas>;
export type InsertMessage = InferInsertModel<typeof messages>;
export type Message = InferSelectModel<typeof messages>;
export type InsertSavedSearch = InferInsertModel<typeof savedSearches>;
export type SavedSearch = InferSelectModel<typeof savedSearches>;
export type InsertListingView = InferInsertModel<typeof listingViews>;
export type ListingView = InferSelectModel<typeof listingViews>;
export type InsertDeal = InferInsertModel<typeof deals>;
export type Deal = InferSelectModel<typeof deals>;
export type InsertDocument = InferInsertModel<typeof documents>;
export type Document = InferSelectModel<typeof documents>;
export type InsertNotification = InferInsertModel<typeof notifications>;
export type Notification = InferSelectModel<typeof notifications>;
export type InsertBuyerRequest = InferInsertModel<typeof buyerRequests>;
export type BuyerRequest = InferSelectModel<typeof buyerRequests>;
export type InsertAccessRequest = InferInsertModel<typeof accessRequests>;
export type AccessRequest = InferSelectModel<typeof accessRequests>;
export type InsertActionItem = InferInsertModel<typeof actionItems>;
export type ActionItem = InferSelectModel<typeof actionItems>;
export type InsertDealActivity = InferInsertModel<typeof dealActivities>;
export type DealActivity = InferSelectModel<typeof dealActivities>;
export type InsertKycDocument = InferInsertModel<typeof kycDocuments>;
export type KycDocument = InferSelectModel<typeof kycDocuments>;
export type InsertKycSubmission = InferInsertModel<typeof kycSubmissions>;
export type KycSubmission = InferSelectModel<typeof kycSubmissions>;
export type InsertNdaSigning = InferInsertModel<typeof ndaSignings>;
export type NdaSigning = InferSelectModel<typeof ndaSignings>;
export type InsertNdaTemplate = InferInsertModel<typeof ndaTemplates>;
export type NdaTemplate = InferSelectModel<typeof ndaTemplates>;
export type InsertBuyerVerification = InferInsertModel<typeof buyerVerifications>;
export type BuyerVerification = InferSelectModel<typeof buyerVerifications>;
export type InsertBuyerQualification = InferInsertModel<typeof buyerQualifications>;
export type BuyerQualification = InferSelectModel<typeof buyerQualifications>;
export type InsertOfferHistory = InferInsertModel<typeof offerHistory>;
export type OfferHistory = InferSelectModel<typeof offerHistory>;
export type InsertDueDiligenceItem = InferInsertModel<typeof dueDiligenceItems>;
export type DueDiligenceItem = InferSelectModel<typeof dueDiligenceItems>;
export type InsertDueDiligenceQuestion = InferInsertModel<typeof dueDiligenceQuestions>;
export type DueDiligenceQuestion = InferSelectModel<typeof dueDiligenceQuestions>;
export type InsertProfessional = InferInsertModel<typeof professionals>;
export type Professional = InferSelectModel<typeof professionals>;
export type InsertProfessionalCredential = InferInsertModel<typeof professionalCredentials>;
export type ProfessionalCredential = InferSelectModel<typeof professionalCredentials>;
export type InsertProfessionalReview = InferInsertModel<typeof professionalReviews>;
export type ProfessionalReview = InferSelectModel<typeof professionalReviews>;
export type InsertDealProfessional = InferInsertModel<typeof dealProfessionals>;
export type DealProfessional = InferSelectModel<typeof dealProfessionals>;
export type InsertDealMilestone = InferInsertModel<typeof dealMilestones>;
export type DealMilestone = InferSelectModel<typeof dealMilestones>;
export type InsertListingDocument = InferInsertModel<typeof listingDocuments>;
export type ListingDocument = InferSelectModel<typeof listingDocuments>;
export type InsertListingPreparationItem = InferInsertModel<typeof listingPreparationItems>;
export type ListingPreparationItem = InferSelectModel<typeof listingPreparationItems>;
export type InsertPlatformDocument = InferInsertModel<typeof platformDocuments>;
export type PlatformDocument = InferSelectModel<typeof platformDocuments>;
export type InsertSavedListing = InferInsertModel<typeof savedListings>;
export type SavedListing = InferSelectModel<typeof savedListings>;
export type InsertSiteSettings = InferInsertModel<typeof siteSettings>;
export type SiteSettings = InferSelectModel<typeof siteSettings>;
export type InsertUserNote = InferInsertModel<typeof userNotes>;
export type UserNote = InferSelectModel<typeof userNotes>;
export type InsertAdminAuditLog = InferInsertModel<typeof adminAuditLogs>;
export type AdminAuditLog = InferSelectModel<typeof adminAuditLogs>;
export type InsertAffiliate = InferInsertModel<typeof affiliates>;
export type Affiliate = InferSelectModel<typeof affiliates>;
export type InsertAffiliateCommission = InferInsertModel<typeof affiliateCommissions>;
export type AffiliateCommission = InferSelectModel<typeof affiliateCommissions>;
export type InsertAffiliateTier = InferInsertModel<typeof affiliateTiers>;
export type AffiliateTier = InferSelectModel<typeof affiliateTiers>;
export type InsertReferral = InferInsertModel<typeof referrals>;
export type Referral = InferSelectModel<typeof referrals>;
export type InsertPricePlan = InferInsertModel<typeof pricePlans>;
export type PricePlan = InferSelectModel<typeof pricePlans>;
export type InsertBuyerRequestProposal = InferInsertModel<typeof buyerRequestProposals>;
export type BuyerRequestProposal = InferSelectModel<typeof buyerRequestProposals>;
export type InsertNdaVariableDefinition = InferInsertModel<typeof ndaVariableDefinitions>;
export type NdaVariableDefinition = InferSelectModel<typeof ndaVariableDefinitions>;
export type InsertNdaSigningAuditLog = InferInsertModel<typeof ndaSigningAuditLog>;
export type NdaSigningAuditLog = InferSelectModel<typeof ndaSigningAuditLog>;
export type InsertSubscription = InferInsertModel<typeof subscriptions>;
export type Subscription = InferSelectModel<typeof subscriptions>;
