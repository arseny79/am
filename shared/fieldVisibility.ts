/**
 * Field-level visibility for listings.
 *
 * Each gatable field on a listing can be "public" (visible before the gate)
 * or "gated" (hidden until the user passes the listing's confidentiality gate).
 *
 * Rules:
 * - public listing   → everything visible, fieldVisibility is ignored
 * - nda listing      → "public" fields show to everyone; "gated" fields
 *                      only show after NDA is signed
 * - private listing  → "public" fields show to everyone; "gated" fields
 *                      only show after seller approves access request
 */

export type FieldVisibilityKey =
  | "annualRevenue"
  | "monthlyRecurringRevenue"
  | "ebitda"
  | "ebitdaMargin"
  | "askingPrice"
  | "clientCount"
  | "clientRetentionRate"
  | "averageClientValue"
  | "employeeCount"
  | "yearFounded"
  | "location"
  | "keyStrengths"
  | "growthOpportunities"
  | "financialDetails"
  | "clientList";

export type FieldVisibility = Record<FieldVisibilityKey, "public" | "gated">;

/** Sensible defaults when a seller hasn't set per-field visibility */
export const DEFAULT_FIELD_VISIBILITY: FieldVisibility = {
  annualRevenue: "gated",
  monthlyRecurringRevenue: "gated",
  ebitda: "gated",
  ebitdaMargin: "gated",
  askingPrice: "public",    // often shown to attract serious buyers
  clientCount: "gated",
  clientRetentionRate: "gated",
  averageClientValue: "gated",
  employeeCount: "gated",
  yearFounded: "public",
  location: "public",       // geography needed for buyer screening
  keyStrengths: "gated",
  growthOpportunities: "gated",
  financialDetails: "gated",
  clientList: "gated",
};

/** Human-readable labels for the form toggles */
export const FIELD_VISIBILITY_LABELS: Record<FieldVisibilityKey, string> = {
  annualRevenue: "Annual Revenue",
  monthlyRecurringRevenue: "Monthly Recurring Revenue (MRR)",
  ebitda: "EBITDA",
  ebitdaMargin: "EBITDA Margin",
  askingPrice: "Asking Price",
  clientCount: "Number of Clients",
  clientRetentionRate: "Client Retention Rate",
  averageClientValue: "Average Client Value",
  employeeCount: "Team Size (# Employees)",
  yearFounded: "Year Founded",
  location: "Location",
  keyStrengths: "Key Strengths",
  growthOpportunities: "Growth Opportunities",
  financialDetails: "Financial Details",
  clientList: "Client List",
};

/**
 * Merge stored visibility settings with defaults.
 * Missing keys fall back to DEFAULT_FIELD_VISIBILITY.
 */
export function resolveFieldVisibility(stored: unknown): FieldVisibility {
  const base = { ...DEFAULT_FIELD_VISIBILITY };
  if (stored && typeof stored === "object") {
    for (const key of Object.keys(base) as FieldVisibilityKey[]) {
      const val = (stored as Record<string, unknown>)[key];
      if (val === "public" || val === "gated") {
        base[key] = val;
      }
    }
  }
  return base;
}

/**
 * Returns true if a field should be visible to the current viewer.
 *
 * @param field           The field to check
 * @param confidentiality The listing's confidentiality level
 * @param storedVis       The listing's fieldVisibility JSON (may be null)
 * @param hasGateAccess   Whether the user has passed the NDA/access gate
 */
export function isFieldVisible(
  field: FieldVisibilityKey,
  confidentiality: "public" | "nda" | "private",
  storedVis: unknown,
  hasGateAccess: boolean
): boolean {
  if (confidentiality === "public") return true;
  if (hasGateAccess) return true;
  const vis = resolveFieldVisibility(storedVis);
  return vis[field] === "public";
}
