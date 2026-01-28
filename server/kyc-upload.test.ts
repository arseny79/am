import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock storage - must be at top level with no variable references
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ 
    key: "test-key", 
    url: "https://example.com/test-document.pdf" 
  }),
}));

// Mock email service
vi.mock("./lib/emailService", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  EmailTemplates: {
    kycApproved: vi.fn().mockReturnValue({
      subject: "KYC Approved",
      text: "Your KYC is approved",
      html: "<p>Your KYC is approved</p>",
    }),
    kycRejected: vi.fn().mockReturnValue({
      subject: "KYC Rejected",
      text: "Your KYC is rejected",
      html: "<p>Your KYC is rejected</p>",
    }),
  },
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(undefined),
}));

// Mock admin notification
vi.mock("./jobs/adminKYCNotification", () => ({
  notifyAdminsOfKYCSubmission: vi.fn().mockResolvedValue(undefined),
}));

// Mock database - factory function to avoid hoisting issues
vi.mock("./db", () => ({
  getDb: vi.fn().mockImplementation(async () => ({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  })),
}));

describe("KYC Document Upload", () => {
  const createTestContext = (overrides = {}): { ctx: TrpcContext } => {
    const user = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
      kycVerified: false,
      kycSubmittedAt: null,
      kycReviewedAt: null,
      kycRejectionReason: null,
      role: "user" as const,
      ...overrides,
    };

    return {
      ctx: {
        user,
        session: { user },
      } as unknown as TrpcContext,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require email verification before KYC submission", async () => {
    const { ctx } = createTestContext({ emailVerified: false });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.kyc.submitDocuments({
        documents: [
          {
            documentType: "government_id",
            fileName: "id.pdf",
            fileUrl: "https://example.com/id.pdf",
            fileSize: 100000,
            mimeType: "application/pdf",
          },
          {
            documentType: "proof_of_address",
            fileName: "address.pdf",
            fileUrl: "https://example.com/address.pdf",
            fileSize: 100000,
            mimeType: "application/pdf",
          },
        ],
      })
    ).rejects.toThrow("Please verify your email address before submitting KYC documents");
  });

  it("should require both government ID and proof of address", async () => {
    const { ctx } = createTestContext({ emailVerified: true });
    const caller = appRouter.createCaller(ctx);

    // Missing proof of address
    await expect(
      caller.kyc.submitDocuments({
        documents: [
          {
            documentType: "government_id",
            fileName: "id.pdf",
            fileUrl: "https://example.com/id.pdf",
            fileSize: 100000,
            mimeType: "application/pdf",
          },
        ],
      })
    ).rejects.toThrow("Please upload both Government ID and Proof of Address");
  });

  it("should successfully submit KYC documents when all requirements are met", async () => {
    const { ctx } = createTestContext({ emailVerified: true });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.kyc.submitDocuments({
      documents: [
        {
          documentType: "government_id",
          fileName: "id.pdf",
          fileUrl: "https://example.com/id.pdf",
          fileSize: 100000,
          mimeType: "application/pdf",
        },
        {
          documentType: "proof_of_address",
          fileName: "address.pdf",
          fileUrl: "https://example.com/address.pdf",
          fileSize: 100000,
          mimeType: "application/pdf",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("KYC documents submitted for review");
  });

  it("should return KYC status for authenticated user", async () => {
    const { ctx } = createTestContext({
      kycVerified: false,
      kycSubmittedAt: new Date("2025-01-01"),
    });
    const caller = appRouter.createCaller(ctx);

    const status = await caller.kyc.getMyStatus();

    expect(status.kycVerified).toBe(false);
    expect(status.kycSubmittedAt).toBeDefined();
  });
});
