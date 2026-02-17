import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * LivechatScript component
 * Dynamically injects livechat scripts based on admin settings
 * Respects enable/disable toggles for public vs admin pages
 */
export function LivechatScript() {
  const [location] = useLocation();
  const { data: settings } = trpc.admin.getSiteSettings.useQuery();

  useEffect(() => {
    // Don't inject if no script is configured
    if (!settings?.livechatScript) {
      return;
    }

    // Determine if current route is an admin route
    const isAdminRoute = location.startsWith("/admin");

    // Check if script should be injected based on current route
    const shouldInject = isAdminRoute
      ? settings.livechatEnabledAdmin === 1
      : settings.livechatEnabledPublic === 1;

    if (!shouldInject) {
      return;
    }

    // Create a unique ID for the script to avoid duplicates
    const scriptId = "livechat-script-injected";

    // Remove existing script if present
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Create a container div to parse the HTML string
    const container = document.createElement("div");
    container.innerHTML = settings.livechatScript.trim();

    // Extract the script element
    const scriptElement = container.querySelector("script");
    if (!scriptElement) {
      console.warn("[Livechat] No script tag found in livechat configuration");
      return;
    }

    // Create a new script element
    const newScript = document.createElement("script");
    newScript.id = scriptId;

    // Copy attributes from the original script
    Array.from(scriptElement.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });

    // Copy inline script content if present
    if (scriptElement.textContent) {
      newScript.textContent = scriptElement.textContent;
    }

    // Inject before closing body tag
    document.body.appendChild(newScript);

    console.log("[Livechat] Script injected successfully");

    // Cleanup function to remove script when component unmounts or settings change
    return () => {
      const injectedScript = document.getElementById(scriptId);
      if (injectedScript) {
        injectedScript.remove();
        console.log("[Livechat] Script removed");
      }
    };
  }, [settings, location]);

  return null; // This component doesn't render anything
}
