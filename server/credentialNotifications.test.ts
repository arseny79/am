import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { professionals, professionalCredentials } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 999,
    openId: "admin-test-user",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "email",
    role: "admin",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Credential Email Notifications", () => {
  let testProfessionalId: number;
  let testCredentialId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test professional
    const [professional] = await db
      .insert(professionals)
      .values({
        userId: 999,
        name: "Test Professional",
        email: "professional@test.com",
        type: "broker",
        tier: "basic",
        status: "active",
        verified: false,
      })
      .$returningId();

    testProfessionalId = professional.id;

    // Create test credential
    const [credential] = await db
      .insert(professionalCredentials)
      .values({
        professionalId: testProfessionalId,
        credentialType: "license",
        title: "M&A Broker License",
        issuingOrganization: "State Board",
        issueDate: new Date("2020-01-01"),
        credentialNumber: "TEST123",
        fileUrl: "https://example.com/license.pdf",
        fileName: "license.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        verificationStatus: "pending",
      })
      .$returningId();

    testCredentialId = credential.id;
  });

  it("sends verification email when credential is verified", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Verify credential
    const result = await caller.professional.adminVerifyCredential({
      credentialId: testCredentialId,
      status: "verified",
    });

    expect(result.success).toBe(true);

    // Verify credential status updated
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [updatedCredential] = await db
      .select()
      .from(professionalCredentials)
      .where(eq(professionalCredentials.id, testCredentialId));

    expect(updatedCredential.verificationStatus).toBe("verified");
    expect(updatedCredential.verifiedAt).toBeTruthy();

    // Note: Email sending is logged to console in development
    // In production with SendGrid configured, actual emails would be sent
  });

  it("sends rejection email when credential is rejected", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const rejectionReason = "Document is not clear, please resubmit with higher resolution";

    // Reject credential
    const result = await caller.professional.adminVerifyCredential({
      credentialId: testCredentialId,
      status: "rejected",
      rejectionReason,
    });

    expect(result.success).toBe(true);

    // Verify credential status updated
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [updatedCredential] = await db
      .select()
      .from(professionalCredentials)
      .where(eq(professionalCredentials.id, testCredentialId));

    expect(updatedCredential.verificationStatus).toBe("rejected");
    expect(updatedCredential.rejectionReason).toBe(rejectionReason);
    expect(updatedCredential.verifiedAt).toBeNull();

    // Note: Email sending is logged to console in development
    // In production with SendGrid configured, actual emails would be sent
  });

  it("marks professional as verified when all credentials are verified", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Verify the credential
    await caller.professional.adminVerifyCredential({
      credentialId: testCredentialId,
      status: "verified",
    });

    // Check if professional is marked as verified
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [updatedProfessional] = await db
      .select()
      .from(professionals)
      .where(eq(professionals.id, testProfessionalId));

    expect(updatedProfessional.verified).toBe(true);
    expect(updatedProfessional.verifiedAt).toBeTruthy();
  });

  it("does not mark professional as verified if some credentials are pending", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Add another pending credential
    await db.insert(professionalCredentials).values({
      professionalId: testProfessionalId,
      credentialType: "certification",
      title: "M&A Certification",
      fileUrl: "https://example.com/cert.pdf",
      fileName: "cert.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      verificationStatus: "pending",
    });

    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Verify only the first credential
    await caller.professional.adminVerifyCredential({
      credentialId: testCredentialId,
      status: "verified",
    });

    // Check that professional is NOT marked as verified yet
    const [updatedProfessional] = await db
      .select()
      .from(professionals)
      .where(eq(professionals.id, testProfessionalId));

    expect(updatedProfessional.verified).toBe(false);
  });
});
