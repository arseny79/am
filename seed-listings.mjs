import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// First, create a test user (seller)
const sellerId = 1; // Assuming owner is user ID 1

const exampleListings = [
  {
    sellerId,
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
    valuationMultiple: 40,
    description: "Established MSP serving mid-market clients in the Austin metro area. Strong focus on cloud migration and cybersecurity services. Recurring revenue model with 94% client retention. All major clients under multi-year contracts.",
    keyStrengths: "High client retention, diversified service offerings, strong recurring revenue base, experienced technical team, modern tool stack",
    growthOpportunities: "Expand into San Antonio market, add compliance services (HIPAA/SOC 2), increase security stack attach rate, develop vertical expertise in healthcare",
    clientList: "65 active clients across healthcare (25%), professional services (30%), manufacturing (20%), and retail (25%). Top 10 clients represent 45% of MRR. Average contract length: 3.2 years.",
    financialDetails: "2023 Revenue: $1.02M, EBITDA: $306K (30% margin). 2022 Revenue: $890K, EBITDA: $245K. YoY growth: 15%. Gross margin: 68%. Owner compensation: $180K.",
    status: "active",
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    sellerId,
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
    valuationMultiple: 40,
    description: "Security-focused MSP with deep expertise in threat detection and compliance. Serving small to mid-sized businesses in Colorado. Strong reputation in the local market with excellent client references.",
    keyStrengths: "Security specialization, high-margin services, low client concentration risk, strong vendor relationships, scalable processes",
    growthOpportunities: "Add compliance consulting (CMMC, PCI-DSS), expand to Wyoming market, develop SOC services, increase MRR per client through security stack expansion",
    clientList: "42 clients primarily in financial services (30%), legal (25%), and construction (20%). No client exceeds 8% of total revenue. Average client tenure: 4.1 years.",
    financialDetails: "2023 Revenue: $624K, EBITDA: $156K (25% margin). 2022 Revenue: $580K, EBITDA: $145K. YoY growth: 8%. Gross margin: 65%. Owner compensation: $120K.",
    status: "active",
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    sellerId,
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
    valuationMultiple: 40,
    description: "Premier MSP in the Charlotte region with a strong Microsoft partnership and Azure expertise. Serves a diverse client base with exceptional service delivery metrics. Winner of multiple industry awards for customer satisfaction.",
    keyStrengths: "Microsoft Gold Partner status, high EBITDA margin, excellent client retention, strong leadership team, documented processes and procedures",
    growthOpportunities: "M365 security add-ons, Azure migration services, expand to Raleigh-Durham market, add vertical focus in healthcare or financial services, develop co-managed IT offering",
    clientList: "95 clients across diverse industries. Healthcare (20%), Professional Services (25%), Manufacturing (20%), Financial Services (15%), Other (20%). Largest client: 6% of revenue.",
    financialDetails: "2023 Revenue: $1.50M, EBITDA: $450K (30% margin). 2022 Revenue: $1.28M, EBITDA: $358K. YoY growth: 17%. Gross margin: 70%. Owner compensation: $200K. Strong balance sheet with no debt.",
    status: "active",
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

console.log("Seeding example listings...");

for (const listing of exampleListings) {
  try {
    await db.execute(
      `INSERT INTO listings (
        sellerId, businessName, location, yearFounded, employeeCount,
        monthlyRecurringRevenue, annualRevenue, ebitda, ebitdaMargin,
        clientCount, averageClientValue, clientRetentionRate, serviceMix,
        primaryRMM, primaryPSA, otherTools, askingPrice, estimatedValuation,
        valuationMultiple, description, keyStrengths, growthOpportunities,
        clientList, financialDetails, status, isPublished, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listing.sellerId,
        listing.businessName,
        listing.location,
        listing.yearFounded,
        listing.employeeCount,
        listing.monthlyRecurringRevenue,
        listing.annualRevenue,
        listing.ebitda,
        listing.ebitdaMargin,
        listing.clientCount,
        listing.averageClientValue,
        listing.clientRetentionRate,
        listing.serviceMix,
        listing.primaryRMM,
        listing.primaryPSA,
        listing.otherTools,
        listing.askingPrice,
        listing.estimatedValuation,
        listing.valuationMultiple,
        listing.description,
        listing.keyStrengths,
        listing.growthOpportunities,
        listing.clientList,
        listing.financialDetails,
        listing.status,
        listing.isPublished ? 1 : 0,
        listing.createdAt,
        listing.updatedAt,
      ]
    );
    console.log(`✓ Created listing: ${listing.businessName}`);
  } catch (error) {
    console.error(`✗ Failed to create ${listing.businessName}:`, error.message);
  }
}

await connection.end();
console.log("\n✅ Seeding complete!");
