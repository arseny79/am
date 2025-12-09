import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // First check if deal exists
  const [existingDeal] = await connection.execute("SELECT * FROM deals WHERE id = 210001");
  
  if (existingDeal.length === 0) {
    console.log("❌ Deal 210001 does not exist");
    process.exit(1);
  }
  
  console.log("Current deal 210001:");
  console.log("  Buyer:", existingDeal[0].buyerId);
  console.log("  Seller:", existingDeal[0].sellerId);
  
  // Update deal to make user ID 1 the seller
  await connection.execute("UPDATE deals SET sellerId = 1 WHERE id = 210001");
  console.log("\n✅ Updated deal 210001 - User 1 is now the seller");
  
  // Update the listing owner as well
  await connection.execute("UPDATE listings SET sellerId = 1 WHERE id = ?", [existingDeal[0].listingId]);
  console.log("✅ Updated listing", existingDeal[0].listingId, "- User 1 is now the owner");
  
  // Verify
  const [updatedDeal] = await connection.execute("SELECT * FROM deals WHERE id = 210001");
  console.log("\n✅ Verified - Deal 210001 now has:");
  console.log("  Buyer:", updatedDeal[0].buyerId);
  console.log("  Seller:", updatedDeal[0].sellerId, "(Admin user)");
  
} catch (error) {
  console.error("Error:", error);
} finally {
  await connection.end();
}
