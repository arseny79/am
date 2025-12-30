import { getDb } from "../db";
import { ndaTemplates, ndaSignings, ndaSigningAuditLog, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";

/**
 * Auto-create NDA for a newly created deal
 * Uses the default NDA template and populates variables with deal/user data
 */
export async function autoCreateNDAForDeal(params: {
  dealId: number;
  buyerId: number;
  sellerId: number;
  listingName: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[autoCreateNDA] Database not available, skipping NDA creation");
    return null;
  }

  try {
    // Get default NDA template
    const defaultTemplate = await db
      .select()
      .from(ndaTemplates)
      .where(and(eq(ndaTemplates.isDefault, 1), eq(ndaTemplates.isActive, 1)))
      .limit(1);

    if (!defaultTemplate.length) {
      console.warn("[autoCreateNDA] No default NDA template found, skipping NDA creation");
      return null;
    }

    const template = defaultTemplate[0];

    // Get buyer and seller info
    const buyer = await db
      .select()
      .from(users)
      .where(eq(users.id, params.buyerId))
      .limit(1);

    const seller = await db
      .select()
      .from(users)
      .where(eq(users.id, params.sellerId))
      .limit(1);

    if (!buyer.length || !seller.length) {
      console.warn("[autoCreateNDA] Buyer or seller not found");
      return null;
    }

    // Prepare variable values
    const currentDate = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // 7 days to sign

    const variableValues = {
      buyerName: buyer[0].name || "Buyer",
      buyerCompanyName: buyer[0].companyName || "N/A",
      buyerEmail: buyer[0].email || "N/A",
      sellerName: seller[0].name || "Seller",
      sellerCompanyName: seller[0].companyName || "N/A",
      sellerEmail: seller[0].email || "N/A",
      listingName: params.listingName,
      currentDate: format(currentDate, "MMMM d, yyyy"),
      expirationDate: format(expirationDate, "MMMM d, yyyy"),
      confidentialityPeriod: "2 years",
    };

    // Render template content with variables
    let renderedContent = template.content;
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      renderedContent = renderedContent.replace(regex, value);
    });

    // Create NDA signing instance
    const [ndaSigning] = await db.insert(ndaSignings).values({
      dealId: params.dealId,
      templateId: template.id,
      renderedContent,
      variableValues: JSON.stringify(variableValues),
      status: "draft",
      expiresAt: expirationDate,
    });

    // Log creation
    await db.insert(ndaSigningAuditLog).values({
      ndaSigningId: ndaSigning.insertId,
      action: "created",
      userId: null, // System action
    });

    console.log(`[autoCreateNDA] Created NDA signing ${ndaSigning.insertId} for deal ${params.dealId}`);

    return ndaSigning.insertId;
  } catch (error) {
    console.error("[autoCreateNDA] Failed to create NDA:", error);
    return null;
  }
}
