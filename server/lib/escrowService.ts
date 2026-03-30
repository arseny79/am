/**
 * Escrow.com API Integration
 * Handles secure payment escrow for iGaming acquisitions
 */

interface EscrowParty {
  role: "buyer" | "seller";
  customer: string; // email address
}

interface EscrowItem {
  title: string;
  description: string;
  type: "domain_name" | "general_merchandise" | "broker_vehicle" | "milestone" | "motor_vehicle" | "website";
  inspection_period: number; // days
  quantity: number;
  schedule: Array<{
    amount: number;
    payer_customer: string; // buyer email
    beneficiary_customer: string; // seller email
    status_on_complete?: "return" | "keep";
  }>;
}

interface CreateEscrowTransactionParams {
  buyerEmail: string;
  buyerName: string;
  sellerEmail: string;
  sellerName: string;
  amount: number;
  businessName: string;
  description: string;
}

interface EscrowTransaction {
  id: number;
  parties: EscrowParty[];
  currency: string;
  description: string;
  items: EscrowItem[];
  status: string;
  url?: string; // Payment URL
}

const ESCROW_API_BASE = process.env.ESCROW_SANDBOX_MODE === "true" 
  ? "https://api.sandbox.escrow.com/2017-09-01"
  : "https://api.escrow.com/2017-09-01";

const ESCROW_API_EMAIL = process.env.ESCROW_API_EMAIL;
const ESCROW_API_PASSWORD = process.env.ESCROW_API_PASSWORD;

/**
 * Create an escrow transaction for an iGaming acquisition
 */
export async function createEscrowTransaction(
  params: CreateEscrowTransactionParams
): Promise<EscrowTransaction | null> {
  if (!ESCROW_API_EMAIL || !ESCROW_API_PASSWORD) {
    console.warn("[Escrow] API credentials not configured - skipping escrow creation");
    return null;
  }

  const { buyerEmail, buyerName, sellerEmail, sellerName, amount, businessName, description } = params;

  // Calculate platform success fee (3%)
  const successFeePercent = 3;
  const successFee = amount * (successFeePercent / 100);
  const sellerPayout = amount - successFee;

  const requestBody = {
    parties: [
      {
        role: "buyer",
        customer: buyerEmail,
      },
      {
        role: "seller",
        customer: sellerEmail,
      },
    ],
    currency: "usd",
    description: description || `Acquisition of ${businessName}`,
    items: [
      {
        title: businessName,
        description: `iGaming Business Acquisition - ${businessName}`,
        type: "general_merchandise" as const,
        inspection_period: 30, // 30 days for due diligence
        quantity: 1,
        schedule: [
          {
            amount: sellerPayout,
            payer_customer: buyerEmail,
            beneficiary_customer: sellerEmail,
          },
          {
            amount: successFee,
            payer_customer: buyerEmail,
            beneficiary_customer: ESCROW_API_EMAIL, // Platform gets success fee
          },
        ],
      },
    ],
  };

  try {
    const auth = Buffer.from(`${ESCROW_API_EMAIL}:${ESCROW_API_PASSWORD}`).toString("base64");
    
    const response = await fetch(`${ESCROW_API_BASE}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Escrow] Failed to create transaction:", response.status, errorText);
      return null;
    }

    const transaction: EscrowTransaction = await response.json();
    console.log("[Escrow] Transaction created successfully:", transaction.id);
    
    return transaction;
  } catch (error) {
    console.error("[Escrow] Error creating transaction:", error);
    return null;
  }
}

/**
 * Get escrow transaction details
 */
export async function getEscrowTransaction(transactionId: string): Promise<EscrowTransaction | null> {
  if (!ESCROW_API_EMAIL || !ESCROW_API_PASSWORD) {
    console.warn("[Escrow] API credentials not configured");
    return null;
  }

  try {
    const auth = Buffer.from(`${ESCROW_API_EMAIL}:${ESCROW_API_PASSWORD}`).toString("base64");
    
    const response = await fetch(`${ESCROW_API_BASE}/transaction/${transactionId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      console.error("[Escrow] Failed to get transaction:", response.status);
      return null;
    }

    const transaction: EscrowTransaction = await response.json();
    return transaction;
  } catch (error) {
    console.error("[Escrow] Error getting transaction:", error);
    return null;
  }
}

/**
 * List all escrow transactions for the partner account
 */
export async function listEscrowTransactions(): Promise<EscrowTransaction[]> {
  if (!ESCROW_API_EMAIL || !ESCROW_API_PASSWORD) {
    console.warn("[Escrow] API credentials not configured");
    return [];
  }

  try {
    const auth = Buffer.from(`${ESCROW_API_EMAIL}:${ESCROW_API_PASSWORD}`).toString("base64");
    
    const response = await fetch(`${ESCROW_API_BASE}/transaction`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      console.error("[Escrow] Failed to list transactions:", response.status);
      return [];
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    console.error("[Escrow] Error listing transactions:", error);
    return [];
  }
}

/**
 * Cancel an escrow transaction
 */
export async function cancelEscrowTransaction(transactionId: string): Promise<boolean> {
  if (!ESCROW_API_EMAIL || !ESCROW_API_PASSWORD) {
    console.warn("[Escrow] API credentials not configured");
    return false;
  }

  try {
    const auth = Buffer.from(`${ESCROW_API_EMAIL}:${ESCROW_API_PASSWORD}`).toString("base64");
    
    const response = await fetch(`${ESCROW_API_BASE}/transaction/${transactionId}/cancel`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        action: "cancel",
      }),
    });

    if (!response.ok) {
      console.error("[Escrow] Failed to cancel transaction:", response.status);
      return false;
    }

    console.log("[Escrow] Transaction cancelled successfully:", transactionId);
    return true;
  } catch (error) {
    console.error("[Escrow] Error cancelling transaction:", error);
    return false;
  }
}
