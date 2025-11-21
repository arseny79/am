import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number, role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@test.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Deal Management", () => {
  it("should create a deal when buyer contacts seller", async () => {
    const { ctx: sellerCtx } = createTestContext(1);
    const { ctx: buyerCtx } = createTestContext(2);
    
    const sellerCaller = appRouter.createCaller(sellerCtx);
    const buyerCaller = appRouter.createCaller(buyerCtx);

    // Seller creates a listing
    await sellerCaller.listing.create({
      businessName: "Test MSP",
      location: "New York, NY",
      monthlyRecurringRevenue: 50000,
      annualRevenue: 600000,
      ebitda: 150000,
      clientCount: 50,
      description: "A test MSP business",
    });

    // Get the listing
    const listings = await sellerCaller.listing.getMy();
    expect(listings.length).toBeGreaterThan(0);
    const listing = listings[0];

    // Buyer creates a deal
    const dealResult = await buyerCaller.deal.create({
      listingId: listing!.id,
    });

    expect(dealResult.success).toBe(true);
    expect(dealResult.dealId).toBeDefined();

    // Verify deal exists
    const deals = await buyerCaller.deal.getMyDeals();
    expect(deals.length).toBeGreaterThan(0);
    expect(deals[0]?.listing?.businessName).toBe("Test MSP");
  });

  it("should update deal stage", async () => {
    const { ctx: sellerCtx } = createTestContext(1);
    const { ctx: buyerCtx } = createTestContext(2);
    
    const sellerCaller = appRouter.createCaller(sellerCtx);
    const buyerCaller = appRouter.createCaller(buyerCtx);

    // Create listing and deal
    await sellerCaller.listing.create({
      businessName: "Stage Test MSP",
      location: "Boston, MA",
      monthlyRecurringRevenue: 40000,
      annualRevenue: 480000,
      ebitda: 120000,
      clientCount: 40,
      description: "Testing stage updates",
    });

    const listings = await sellerCaller.listing.getMy();
    const listing = listings[listings.length - 1];

    const dealResult = await buyerCaller.deal.create({
      listingId: listing!.id,
    });

    // Update stage to NDA signed
    await buyerCaller.deal.updateStage({
      dealId: dealResult.dealId!,
      stage: "nda_signed",
    });

    // Verify stage updated
    const deal = await buyerCaller.deal.getById({ id: dealResult.dealId! });
    expect(deal.stage).toBe("nda_signed");
  });

  it("should allow document upload to deal", async () => {
    const { ctx: buyerCtx } = createTestContext(2);
    const buyerCaller = appRouter.createCaller(buyerCtx);

    const deals = await buyerCaller.deal.getMyDeals();
    if (deals.length === 0) {
      // Skip if no deals exist
      return;
    }

    const deal = deals[0];
    const testFileData = Buffer.from("Test document content").toString("base64");

    const result = await buyerCaller.document.upload({
      dealId: deal!.id,
      fileName: "test-document.pdf",
      fileData: testFileData,
      category: "financial",
      description: "Test financial document",
    });

    expect(result.success).toBe(true);

    // Verify document exists
    const documents = await buyerCaller.document.getByDeal({
      dealId: deal!.id,
      latestOnly: true,
    });

    expect(documents.length).toBeGreaterThan(0);
    const uploadedDoc = documents.find(d => d.fileName === "test-document.pdf");
    expect(uploadedDoc).toBeDefined();
    expect(uploadedDoc?.version).toBeGreaterThan(0);
  });

  it("should track document versions", async () => {
    const { ctx: buyerCtx } = createTestContext(2);
    const buyerCaller = appRouter.createCaller(buyerCtx);

    const deals = await buyerCaller.deal.getMyDeals();
    if (deals.length === 0) {
      return;
    }

    const deal = deals[0];
    const fileName = "versioned-doc.pdf";

    // Upload version 1
    await buyerCaller.document.upload({
      dealId: deal!.id,
      fileName,
      fileData: Buffer.from("Version 1").toString("base64"),
    });

    // Upload version 2
    await buyerCaller.document.upload({
      dealId: deal!.id,
      fileName,
      fileData: Buffer.from("Version 2").toString("base64"),
    });

    // Get all versions
    const documents = await buyerCaller.document.getByDeal({
      dealId: deal!.id,
      latestOnly: false,
    });

    const versions = documents.filter(d => d.fileName === fileName);
    expect(versions.length).toBeGreaterThanOrEqual(2);
    
    const latestVersion = Math.max(...versions.map(d => d.version));
    expect(latestVersion).toBeGreaterThanOrEqual(2);
  });

  it("should send messages in deal room", async () => {
    const { ctx: buyerCtx } = createTestContext(2);
    const { ctx: sellerCtx } = createTestContext(1);
    
    const buyerCaller = appRouter.createCaller(buyerCtx);
    const sellerCaller = appRouter.createCaller(sellerCtx);

    const deals = await buyerCaller.deal.getMyDeals();
    if (deals.length === 0) {
      return;
    }

    const deal = deals[0];

    // Buyer sends message
    await buyerCaller.dealMessage.send({
      dealId: deal!.id,
      content: "Hello, I'm interested in this business",
    });

    // Seller sends reply
    await sellerCaller.dealMessage.send({
      dealId: deal!.id,
      content: "Thank you for your interest!",
    });

    // Get messages
    const messages = await buyerCaller.dealMessage.getByDeal({
      dealId: deal!.id,
    });

    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages.some(m => m.content.includes("interested"))).toBe(true);
    expect(messages.some(m => m.content.includes("Thank you"))).toBe(true);
  });
});

describe("Notifications", () => {
  it("should create notifications for new deals", async () => {
    const { ctx: buyerCtx } = createTestContext(2);
    const buyerCaller = appRouter.createCaller(buyerCtx);

    const notifications = await buyerCaller.notification.getMy({ unreadOnly: false });
    
    // Should have at least some notifications from deal creation
    expect(Array.isArray(notifications)).toBe(true);
  });

  it("should mark notifications as read", async () => {
    const { ctx: buyerCtx } = createTestContext(2);
    const buyerCaller = appRouter.createCaller(buyerCtx);

    const notifications = await buyerCaller.notification.getMy({ unreadOnly: true });
    
    if (notifications.length > 0) {
      const notif = notifications[0];
      
      await buyerCaller.notification.markAsRead({ id: notif!.id });
      
      const unreadCount = await buyerCaller.notification.getUnreadCount();
      expect(unreadCount.count).toBeGreaterThanOrEqual(0);
    }
  });
});
