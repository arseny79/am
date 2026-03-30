import { notifyOwner } from "../_core/notification";
import { PRICING_TIERS } from "@shared/pricing";
import type { ListingTier } from "@shared/pricing";

interface ReceiptData {
  customerEmail: string;
  customerName: string;
  businessName: string;
  tier: ListingTier;
  amountPaid: number;
  stripeSessionId: string;
  paidAt: Date;
}

/**
 * Send email receipt to customer after successful payment
 */
export async function sendPaymentReceipt(data: ReceiptData): Promise<boolean> {
  const tierInfo = PRICING_TIERS[data.tier];
  
  const receiptContent = `
Payment Receipt - AM iGaming Marketplace

Thank you for your payment!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT DETAILS

Customer: ${data.customerName}
Email: ${data.customerEmail}
Date: ${data.paidAt.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LISTING INFORMATION

Business: ${data.businessName}
Listing Tier: ${tierInfo.name}
Upfront Cost: €${tierInfo.upfrontCost.toFixed(2)}${tierInfo.billingPeriod ? `/${tierInfo.billingPeriod}` : ""}
Success Fee: ${tierInfo.successFeePercent}% (due at closing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRANSACTION

Amount Paid: $${data.amountPaid.toFixed(2)}
Payment Method: Card
Transaction ID: ${data.stripeSessionId}
Status: Paid

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS

✓ Your listing is now live on the marketplace
✓ Qualified buyers can now view and contact you
✓ You'll receive notifications when buyers express interest

View your listing: https://mspmarketplace.com/my-listings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions? Contact us at support@mspmarketplace.com

This is an automated receipt. Please save for your records.
  `.trim();

  try {
    // Send receipt email to customer
    // Note: In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[Email] Sending receipt to ${data.customerEmail}`);
    console.log(receiptContent);

    // Also notify platform owner of successful payment
    await notifyOwner({
      title: `💰 Payment Received: $${data.amountPaid.toFixed(2)}`,
      content: `${data.customerName} paid for ${tierInfo.name} listing: "${data.businessName}"`,
    });

    return true;
  } catch (error) {
    console.error("[Email] Failed to send receipt:", error);
    return false;
  }
}

/**
 * Send payment failure notification to customer
 */
export async function sendPaymentFailureEmail(
  customerEmail: string,
  customerName: string,
  reason: string
): Promise<boolean> {
  const content = `
Payment Failed - AM iGaming Marketplace

Hello ${customerName},

We were unable to process your payment for the listing fee.

Reason: ${reason}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT TO DO NEXT

1. Check your payment method details
2. Ensure sufficient funds are available
3. Try again or use a different card

Retry Payment: https://mspmarketplace.com/create-listing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Contact us at support@mspmarketplace.com
  `.trim();

  try {
    console.log(`[Email] Sending payment failure notice to ${customerEmail}`);
    console.log(content);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send payment failure email:", error);
    return false;
  }
}

/**
 * Send refund confirmation email to customer
 */
export async function sendRefundConfirmationEmail(
  customerEmail: string,
  customerName: string,
  businessName: string,
  refundAmount: number,
  reason: string
): Promise<boolean> {
  const content = `
Refund Processed - AM iGaming Marketplace

Hello ${customerName},

Your refund has been processed successfully.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REFUND DETAILS

Business: ${businessName}
Refund Amount: $${refundAmount.toFixed(2)}
Reason: ${reason}
Processing Time: 5-10 business days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The refund will appear on your original payment method within 5-10 business days.

Questions? Contact us at support@mspmarketplace.com
  `.trim();

  try {
    console.log(`[Email] Sending refund confirmation to ${customerEmail}`);
    console.log(content);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send refund confirmation:", error);
    return false;
  }
}
