/**
 * Get the correct base URL for email links and redirects.
 * Uses VITE_APP_URL in production, falls back to localhost for development.
 */
export function getBaseUrl(): string {
  // First check for VITE_APP_URL (set in production)
  if (process.env.VITE_APP_URL) {
    return process.env.VITE_APP_URL;
  }
  
  // Check for explicit APP_URL
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  
  // Fallback for development
  return 'http://localhost:3000';
}

/**
 * Get URL for a deal room
 */
export function getDealUrl(dealId: number | string): string {
  return `${getBaseUrl()}/deal/${dealId}`;
}

/**
 * Get URL for a listing
 */
export function getListingUrl(listingId: number | string): string {
  return `${getBaseUrl()}/listing/${listingId}`;
}

/**
 * Get URL for the dashboard
 */
export function getDashboardUrl(): string {
  return `${getBaseUrl()}/dashboard`;
}

/**
 * Get URL for browse/marketplace page
 */
export function getBrowseUrl(): string {
  return `${getBaseUrl()}/browse`;
}

/**
 * Get URL for verification page
 */
export function getVerificationUrl(): string {
  return `${getBaseUrl()}/verify-account`;
}

/**
 * Get URL for create listing page
 */
export function getCreateListingUrl(): string {
  return `${getBaseUrl()}/create-listing`;
}

/**
 * Get URL for proposals page
 */
export function getProposalsUrl(): string {
  return `${getBaseUrl()}/my-proposals`;
}
