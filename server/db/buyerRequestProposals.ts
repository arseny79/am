import { eq, and } from "drizzle-orm";
import { buyerRequestProposals, type InsertBuyerRequestProposal } from "../../drizzle/schema";
import { getDb } from "../db";
import { nowTimestamp } from "../lib/dbHelpers";

export async function createProposal(proposal: InsertBuyerRequestProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(buyerRequestProposals).values(proposal);
  return result.insertId;
}

export async function getProposalsByRequest(requestId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(buyerRequestProposals)
    .where(eq(buyerRequestProposals.requestId, requestId));
}

export async function getProposalsBySeller(sellerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(buyerRequestProposals)
    .where(eq(buyerRequestProposals.sellerId, sellerId));
}

export async function getProposalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const [proposal] = await db
    .select()
    .from(buyerRequestProposals)
    .where(eq(buyerRequestProposals.id, id))
    .limit(1);

  return proposal;
}

export async function updateProposalStatus(
  id: number,
  status: "pending" | "accepted" | "declined",
  dealId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(buyerRequestProposals)
    .set({
      status,
      dealId: dealId || undefined,
      respondedAt: nowTimestamp(),
    })
    .where(eq(buyerRequestProposals.id, id));
}

export async function checkExistingProposal(requestId: number, sellerId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const [existing] = await db
    .select()
    .from(buyerRequestProposals)
    .where(
      and(
        eq(buyerRequestProposals.requestId, requestId),
        eq(buyerRequestProposals.sellerId, sellerId)
      )
    )
    .limit(1);

  return existing;
}
