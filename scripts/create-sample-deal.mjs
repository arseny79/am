import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { users, listings, deals, messages, ndas, documents } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function createSampleDeal() {
  console.log("🚀 Creating comprehensive sample deal...\n");

  // 1. Create sample seller
  console.log("1️⃣ Creating sample seller...");
  const [seller] = await db.insert(users).values({
    openId: "sample-seller-001",
    name: "John Smith",
    email: "john.smith@cloudmsp.com",
    loginMethod: "manus",
    role: "user",
  }).onDuplicateKeyUpdate({ set: { name: "John Smith" } });

  const sellerId = seller?.insertId || (await db.select().from(users).where(eq(users.openId, "sample-seller-001")).limit(1))[0]?.id;
  console.log(`✅ Seller created: ${sellerId}\n`);

  // 2. Create sample buyer
  console.log("2️⃣ Creating sample buyer...");
  const [buyer] = await db.insert(users).values({
    openId: "sample-buyer-001",
    name: "Sarah Johnson",
    email: "sarah.johnson@techventures.com",
    loginMethod: "manus",
    role: "user",
  }).onDuplicateKeyUpdate({ set: { name: "Sarah Johnson" } });

  const buyerId = buyer?.insertId || (await db.select().from(users).where(eq(users.openId, "sample-buyer-001")).limit(1))[0]?.id;
  console.log(`✅ Buyer created: ${buyerId}\n`);

  // 3. Create sample listing
  console.log("3️⃣ Creating sample MSP listing...");
  const [listing] = await db.insert(listings).values({
    sellerId: sellerId,
    businessName: "CloudTech MSP Solutions",
    title: "Profitable Cloud MSP - $2M ARR",
    description: `Established managed service provider specializing in cloud infrastructure and cybersecurity. 

**Business Highlights:**
- 8 years in operation
- Strong client retention (95%+ annually)
- Recurring revenue model with predictable cash flow
- Experienced technical team of 12 professionals
- Modern tech stack (Azure, AWS, Microsoft 365)
- SOC 2 Type II certified

**Growth Opportunities:**
- Expand into new geographic markets
- Add complementary services (backup, DR)
- Cross-sell to existing client base
- Strategic partnerships with vendors`,
    industry: "Technology",
    location: "Austin, TX",
    askingPrice: 600000000, // $6M in cents
    monthlyRecurringRevenue: 16666667, // ~$167K MRR in cents
    annualRevenue: 200000000, // $2M ARR in cents
    ebitda: 60000000, // $600K in cents
    employeeCount: 12,
    yearFounded: 2016,
    clientCount: 85,
    techStack: "Azure, AWS, Microsoft 365, ConnectWise, Datto",
    recurringRevenue: 190000000, // $1.9M in cents
    clientRetentionRate: 95,
    growthRate: 25,
    status: "active",
    featured: true,
  });

  const listingId = listing?.insertId;
  console.log(`✅ Listing created: ${listingId}\n`);

  // 4. Create NDA agreement
  console.log("4️⃣ Creating NDA agreement...");
  const [nda] = await db.insert(ndas).values({
    listingId: listingId,
    buyerId: buyerId,
    buyerName: "Sarah Johnson",
    buyerEmail: "sarah.johnson@techventures.com",
    buyerCompany: "TechVentures Capital",
    signedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  });

  const ndaId = nda?.insertId;
  console.log(`✅ NDA signed: ${ndaId}\n`);

  // 5. Create deal
  console.log("5️⃣ Creating deal...");
  const [deal] = await db.insert(deals).values({
    listingId: listingId,
    buyerId: buyerId,
    sellerId: sellerId,
    stage: "due_diligence",
    proposedPrice: 580000000, // $5.8M offer in cents
    notes: "Buyer has strong interest and financial backing. Currently in due diligence phase.",
  });

  const dealId = deal?.insertId;
  console.log(`✅ Deal created: ${dealId}\n`);

  // 6. Add messages to deal
  console.log("6️⃣ Adding messages to deal room...");
  
  const messagesData = [
    {
      dealId: dealId,
      senderId: buyerId,
      content: "Hi John, thanks for accepting my access request. I'm very interested in learning more about your MSP business. Could we schedule a call this week to discuss the operations?",
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      dealId: dealId,
      senderId: sellerId,
      content: "Hi Sarah, absolutely! I'm available Tuesday or Thursday afternoon. What time works best for you?",
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    },
    {
      dealId: dealId,
      senderId: buyerId,
      content: "Thursday at 2pm would be perfect. I'll send a calendar invite. In the meantime, could you share your client breakdown by industry and contract terms?",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      dealId: dealId,
      senderId: sellerId,
      content: "Great! I've uploaded the client analysis document to the deal room. You'll see we have strong diversification across healthcare (35%), finance (25%), and professional services (40%).",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    },
    {
      dealId: dealId,
      senderId: buyerId,
      content: "Thanks for the detailed breakdown. The client retention metrics are impressive. I'm preparing an LOI for $5.8M. Would you be open to discussing this valuation?",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      dealId: dealId,
      senderId: sellerId,
      content: "I appreciate the offer. The valuation is close to our expectations. Let's discuss the terms - particularly the earnout structure and transition timeline. Can we schedule a follow-up call?",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const msg of messagesData) {
    await db.insert(messages).values(msg);
  }

  console.log(`✅ ${messagesData.length} messages added\n`);

  // 7. Add documents to deal
  console.log("7️⃣ Adding documents to deal vault...");
  
  const documentsData = [
    {
      dealId: dealId,
      uploadedBy: sellerId,
      fileName: "Financial_Statements_2023.pdf",
      fileUrl: "https://example.com/docs/financials-2023.pdf",
      fileType: "application/pdf",
      fileSize: 2457600,
      description: "Complete financial statements for 2023 including P&L, balance sheet, and cash flow",
    },
    {
      dealId: dealId,
      uploadedBy: sellerId,
      fileName: "Client_Analysis_Report.pdf",
      fileUrl: "https://example.com/docs/client-analysis.pdf",
      fileType: "application/pdf",
      fileSize: 1843200,
      description: "Detailed client breakdown by industry, contract value, and retention metrics",
    },
    {
      dealId: dealId,
      uploadedBy: sellerId,
      fileName: "Tech_Stack_Documentation.pdf",
      fileUrl: "https://example.com/docs/tech-stack.pdf",
      fileType: "application/pdf",
      fileSize: 1024000,
      description: "Complete documentation of infrastructure, tools, and vendor relationships",
    },
    {
      dealId: dealId,
      uploadedBy: buyerId,
      fileName: "Due_Diligence_Checklist.xlsx",
      fileUrl: "https://example.com/docs/dd-checklist.xlsx",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 512000,
      description: "Buyer's due diligence checklist with completed items and outstanding questions",
    },
  ];

  for (const doc of documentsData) {
    await db.insert(documents).values(doc);
  }

  console.log(`✅ ${documentsData.length} documents added\n`);

  // Summary
  console.log("🎉 Sample deal created successfully!\n");
  console.log("📊 Summary:");
  console.log(`   Seller: John Smith (ID: ${sellerId})`);
  console.log(`   Buyer: Sarah Johnson (ID: ${buyerId})`);
  console.log(`   Listing: Profitable Cloud MSP - $2M ARR (ID: ${listingId})`);
  console.log(`   Deal: Due Diligence Stage (ID: ${dealId})`);
  console.log(`   NDA: Signed 7 days ago (ID: ${ndaId})`);
  console.log(`   Messages: ${messagesData.length} exchanged`);
  console.log(`   Documents: ${documentsData.length} uploaded`);
  console.log("\n✅ You can now test the complete deal workflow!");
  console.log(`   Deal Room URL: /deal/${dealId}`);
}

createSampleDeal()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error creating sample deal:", error);
    process.exit(1);
  });
