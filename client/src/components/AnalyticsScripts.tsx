import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * AnalyticsScripts component
 * Fetches analytics configuration from the database and injects tracking scripts
 * Supports Google Analytics (GA4 and Universal Analytics) and StatCounter
 */
export default function AnalyticsScripts() {
  const { data: siteSettings } = trpc.admin.getSiteSettings.useQuery(undefined, {
    // Only fetch if not already loaded (reduces unnecessary calls)
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!siteSettings) return;

    // Inject Google Analytics
    if (siteSettings.googleAnalyticsId) {
      const gaId = siteSettings.googleAnalyticsId;
      
      // Check if already injected
      if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
        return;
      }

      // Create script tag for gtag.js
      const gtagScript = document.createElement("script");
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(gtagScript);

      // Create inline script for configuration
      const gtagConfigScript = document.createElement("script");
      gtagConfigScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(gtagConfigScript);

      console.log(`[Analytics] Google Analytics (${gaId}) loaded`);
    }

    // Inject StatCounter
    if (siteSettings.statcounterId && siteSettings.statcounterSecurity) {
      const scId = siteSettings.statcounterId;
      const scSecurity = siteSettings.statcounterSecurity;

      // Check if already injected
      if (document.querySelector(`script[src*="statcounter.com/counter/counter.js"]`)) {
        return;
      }

      // Create StatCounter configuration
      const scConfigScript = document.createElement("script");
      scConfigScript.innerHTML = `
        var sc_project=${scId};
        var sc_invisible=1;
        var sc_security="${scSecurity}";
      `;
      document.head.appendChild(scConfigScript);

      // Create StatCounter script tag
      const scScript = document.createElement("script");
      scScript.async = true;
      scScript.src = "https://www.statcounter.com/counter/counter.js";
      document.head.appendChild(scScript);

      // Create noscript fallback
      const noscript = document.createElement("noscript");
      noscript.innerHTML = `
        <div class="statcounter">
          <a title="Web Analytics" href="https://statcounter.com/" target="_blank">
            <img class="statcounter" src="https://c.statcounter.com/${scId}/0/${scSecurity}/1/" alt="Web Analytics" referrerPolicy="no-referrer-when-downgrade" />
          </a>
        </div>
      `;
      document.body.appendChild(noscript);

      console.log(`[Analytics] StatCounter (Project ${scId}) loaded`);
    }
  }, [siteSettings]);

  return null; // This component doesn't render anything
}
