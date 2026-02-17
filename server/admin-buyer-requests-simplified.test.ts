import { describe, it, expect, beforeEach, vi } from "vitest";
import { adminBuyerRequestsRouter } from "./routers/adminBuyerRequestsRouter";
import type { TrpcContext } from "./_core/trpc";
import * as db from "./db";

// Mock database
const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  leftJoin: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  offset: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
  getBuyerRequestById: vi.fn(),
  updateBuyerRequest: vi.fn(),
  buyerRequests: {
    id: "id",
    buyerId: "buyerId",
    title: "title",
    description: "description",
    status: "status",
    publishedAt: "publishedAt",
    expiresAt: "expiresAt",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    isPublic: "isPublic",
    isAnonymous: "isAnonymous",
  },
  users: {
    id: "id",
    name: "name",
    email: "email",
    phone: "phone",
  },
}));

describe("Admin Buyer Requests Router (Simplified)", () => {
  let mockContext: TrpcContext;
  let caller: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup db function mocks
    vi.mocked(db.getBuyerRequestById).mockResolvedValue(null as any);
    vi.mocked(db.updateBuyerRequest).mockResolvedValue(undefined as any);

    mockContext = {
      user: {
        id: 1,
        openId: "admin-open-id",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        kycVerified: true,
        verificationStatus: "verified",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      req: {} as any,
      res: {} as any,
    };

    caller = adminBuyerRequestsRouter.createCaller(mockContext);

    // Setup default mock chain
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.leftJoin.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockReturnThis();
    mockDb.offset.mockReturnThis();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.delete.mockReturnThis();
  });

  describe("getAll", () => {
    it("should return paginated buyer requests", async () => {
      const mockRequests = [
        {
          id: 1,
          buyerId: 2,
          title: "Looking for MSP in Texas",
          description: "Seeking established MSP with strong client base",
          status: "pending",
          publishedAt: null,
          expiresAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublic: 1,
          isAnonymous: 0,
          buyerName: "John Buyer",
          buyerEmail: "buyer@example.com",
        },
      ];

      mockDb.where.mockResolvedValueOnce(mockRequests); // For count
      mockDb.offset.mockResolvedValueOnce(mockRequests); // For data

      const result = await caller.getAll({
        page: 1,
        pageSize: 20,
        status: "all",
        search: "",
      });

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].title).toBe("Looking for MSP in Texas");
      expect(result.page).toBe(1);
    });
  });

  describe("publish", () => {
    it("should publish a pending request with expiration date", async () => {
      const mockRequest = {
        id: 1,
        status: "pending",
      };

      vi.mocked(db.getBuyerRequestById).mockResolvedValueOnce(mockRequest as any);
      vi.mocked(db.updateBuyerRequest).mockResolvedValueOnce(undefined as any);

      const result = await caller.publish({ id: 1, expirationDays: 30 });

      expect(result.success).toBe(true);
      expect(db.updateBuyerRequest).toHaveBeenCalled();
    });
  });

  describe("unpublish", () => {
    it("should unpublish a published request", async () => {
      const mockRequest = {
        id: 1,
        status: "published",
      };

      vi.mocked(db.getBuyerRequestById).mockResolvedValueOnce(mockRequest as any);
      vi.mocked(db.updateBuyerRequest).mockResolvedValueOnce(undefined as any);

      const result = await caller.unpublish({ id: 1 });

      expect(result.success).toBe(true);
      expect(db.updateBuyerRequest).toHaveBeenCalled();
    });

    it("should throw error if request is not published", async () => {
      const mockRequest = {
        id: 1,
        status: "pending",
      };

      vi.mocked(db.getBuyerRequestById).mockResolvedValueOnce(mockRequest as any);

      await expect(caller.unpublish({ id: 1 })).rejects.toThrow(
        "Request must be published to unpublish"
      );
    });
  });

  describe("updateExpiration", () => {
    it("should update expiration date for published request", async () => {
      const mockRequest = {
        id: 1,
        status: "published",
        publishedAt: new Date().toISOString(),
      };

      vi.mocked(db.getBuyerRequestById).mockResolvedValueOnce(mockRequest as any);
      vi.mocked(db.updateBuyerRequest).mockResolvedValueOnce(undefined as any);

      const result = await caller.updateExpiration({ id: 1, expirationDays: 60 });

      expect(result.success).toBe(true);
      expect(db.updateBuyerRequest).toHaveBeenCalled();
    });

    it("should throw error if request is not published", async () => {
      const mockRequest = {
        id: 1,
        status: "pending",
      };

      vi.mocked(db.getBuyerRequestById).mockResolvedValueOnce(mockRequest as any);

      await expect(caller.updateExpiration({ id: 1, expirationDays: 60 })).rejects.toThrow(
        "Request must be published to update expiration"
      );
    });
  });
});
