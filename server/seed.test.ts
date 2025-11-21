import { describe, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "manus",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Seed Example Listings", () => {
  it("should create three example MSP listings", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const listings = [
      {
        businessName: "CloudTech MSP Solutions",
        location: "Austin, TX",
        yearFounded: 2018,
        employeeCount: 12,
        monthlyRecurringRevenue: 85000,
        annualRevenue: 1020000,
        ebitda: 306000,
        ebitdaMargin: 30,
        clientCount: 65,
        averageClientValue: 1308,
        clientRetentionRate: 94,
        serviceMix: "Cloud Infrastructure (40%), Cybersecurity (30%), Help Desk (20%), Backup & DR (10%)",
        primaryRMM: "ConnectWise Automate",
        primaryPSA: "ConnectWise Manage",
        otherTools: "Datto RMM, IT Glue, Webroot, Veeam",
        askingPrice: 1350000,
        estimatedValuation: 1224000,
        valuationMultiple: 4.0,
        description: "Established MSP serving mid-market clients in the Austin metro area. Strong focus on cloud migration and cybersecurity services.",
        keyStrengths: "High client retention, diversified service offerings, strong recurring revenue base",
        growthOpportunities: "Expand into San Antonio market, add compliance services (HIPAA/SOC 2)",
        clientList: "65 active clients across healthcare (25%), professional services (30%), manufacturing (20%)",
        financialDetails: "2023 Revenue: $1.02M, EBITDA: $306K (30% margin). YoY growth: 15%.",
        status: "active" as const,
        isPublished: true,
      },
      {
        businessName: "SecureNet IT Services",
        location: "Denver, CO",
        yearFounded: 2015,
        employeeCount: 8,
        monthlyRecurringRevenue: 52000,
        annualRevenue: 624000,
        ebitda: 156000,
        ebitdaMargin: 25,
        clientCount: 42,
        averageClientValue: 1238,
        clientRetentionRate: 91,
        serviceMix: "Managed Security (45%), Network Management (25%), Help Desk (20%), VoIP (10%)",
        primaryRMM: "Datto RMM",
        primaryPSA: "Autotask",
        otherTools: "SentinelOne, Huntress, IT Glue, Acronis",
        askingPrice: 700000,
        estimatedValuation: 624000,
        valuationMultiple: 4.0,
        description: "Security-focused MSP with deep expertise in threat detection and compliance.",
        keyStrengths: "Security specialization, high-margin services, low client concentration risk",
        growthOpportunities: "Add compliance consulting (CMMC, PCI-DSS), expand to Wyoming market",
        clientList: "42 clients primarily in financial services (30%), legal (25%), construction (20%)",
        financialDetails: "2023 Revenue: $624K, EBITDA: $156K (25% margin). YoY growth: 8%.",
        status: "active" as const,
        isPublished: true,
      },
      {
        businessName: "Apex Managed Services",
        location: "Charlotte, NC",
        yearFounded: 2016,
        employeeCount: 18,
        monthlyRecurringRevenue: 125000,
        annualRevenue: 1500000,
        ebitda: 450000,
        ebitdaMargin: 30,
        clientCount: 95,
        averageClientValue: 1316,
        clientRetentionRate: 96,
        serviceMix: "Managed IT (35%), Cloud Services (30%), Cybersecurity (20%), VoIP (10%), Consulting (5%)",
        primaryRMM: "NinjaOne",
        primaryPSA: "HaloPSA",
        otherTools: "Microsoft 365, Azure, Sophos, Veeam, Hudu",
        askingPrice: 2000000,
        estimatedValuation: 1800000,
        valuationMultiple: 4.0,
        description: "Premier MSP in the Charlotte region with strong Microsoft partnership and Azure expertise.",
        keyStrengths: "Microsoft Gold Partner status, high EBITDA margin, excellent client retention",
        growthOpportunities: "M365 security add-ons, Azure migration services, expand to Raleigh-Durham market",
        clientList: "95 clients across diverse industries. Healthcare (20%), Professional Services (25%), Manufacturing (20%)",
        financialDetails: "2023 Revenue: $1.50M, EBITDA: $450K (30% margin). YoY growth: 17%.",
        status: "active" as const,
        isPublished: true,
      },
    ];

    for (const listing of listings) {
      await caller.listing.create(listing);
      console.log(`✓ Created: ${listing.businessName}`);
    }

    const allListings = await caller.listing.search({});
    console.log(`\n✅ Total listings in database: ${allListings.length}`);
  });
});
