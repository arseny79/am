import { trpc } from "@/lib/trpc";
import { APP_LOGO } from "@/const";

/**
 * Hook to get the site logo URL from settings
 * Falls back to APP_LOGO constant if no custom logo is uploaded
 */
export function useSiteLogo() {
  const { data: settings } = trpc.admin.getSiteSettings.useQuery(undefined, {
    // Cache for 5 minutes to avoid excessive requests
    staleTime: 5 * 60 * 1000,
  });

  return settings?.logoUrl || APP_LOGO;
}
