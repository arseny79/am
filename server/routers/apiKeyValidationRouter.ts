import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import { ENV } from "../_core/env";

/**
 * API Key Validation Router
 * Provides real-time validation for third-party service API keys
 */
export const apiKeyValidationRouter = router({
  /**
   * Validate Stripe API key by attempting to retrieve account info
   */
  validateStripe: adminProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const stripe = new Stripe(input.apiKey, {
          apiVersion: "2025-11-17.clover",
        });
        
        // Test the key by retrieving account information
        const account = await stripe.accounts.retrieve();
        
        return {
          valid: true,
          message: `Connected to Stripe account: ${account.business_profile?.name || account.id}`,
          accountId: account.id,
        };
      } catch (error: any) {
        return {
          valid: false,
          message: error.message || "Invalid Stripe API key",
        };
      }
    }),

  /**
   * Validate SendGrid API key by attempting to get API key info
   */
  validateSendGrid: adminProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch("https://api.sendgrid.com/v3/scopes", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${input.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          return {
            valid: true,
            message: `SendGrid API key is valid (${data.scopes?.length || 0} permissions)`,
          };
        } else {
          const error = await response.json();
          return {
            valid: false,
            message: error.errors?.[0]?.message || "Invalid SendGrid API key",
          };
        }
      } catch (error: any) {
        return {
          valid: false,
          message: error.message || "Failed to validate SendGrid API key",
        };
      }
    }),

  /**
   * Validate Google Analytics Measurement ID format
   * Note: Can't validate without making actual tracking calls
   */
  validateGoogleAnalytics: adminProcedure
    .input(z.object({ measurementId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // GA4 measurement IDs follow the pattern G-XXXXXXXXXX
      const ga4Pattern = /^G-[A-Z0-9]{10}$/;
      // Universal Analytics IDs follow the pattern UA-XXXXXXXX-X
      const uaPattern = /^UA-\d{4,10}-\d{1,4}$/;

      if (ga4Pattern.test(input.measurementId)) {
        return {
          valid: true,
          message: "Valid Google Analytics 4 (GA4) Measurement ID format",
          type: "GA4",
        };
      } else if (uaPattern.test(input.measurementId)) {
        return {
          valid: true,
          message: "Valid Universal Analytics ID format (consider upgrading to GA4)",
          type: "UA",
        };
      } else {
        return {
          valid: false,
          message: "Invalid format. Expected G-XXXXXXXXXX (GA4) or UA-XXXXXXXX-X (UA)",
        };
      }
    }),

  /**
   * Validate StatCounter credentials by checking if project exists
   */
  validateStatCounter: adminProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        securityCode: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // StatCounter doesn't have a public API to validate credentials
        // We can only validate the format and check if the script loads
        const projectIdNum = parseInt(input.projectId);
        
        if (isNaN(projectIdNum) || projectIdNum <= 0) {
          return {
            valid: false,
            message: "Project ID must be a positive number",
          };
        }

        if (input.securityCode.length < 8) {
          return {
            valid: false,
            message: "Security code appears too short (expected 8+ characters)",
          };
        }

        // Try to fetch the StatCounter script to verify project exists
        const scriptUrl = `https://c.statcounter.com/${input.projectId}/0/${input.securityCode}/1/`;
        const response = await fetch(scriptUrl, { method: "HEAD" });

        if (response.ok || response.status === 302) {
          return {
            valid: true,
            message: `StatCounter project ${input.projectId} appears to be valid`,
          };
        } else {
          return {
            valid: false,
            message: "Could not verify StatCounter project. Please check your credentials.",
          };
        }
      } catch (error: any) {
        return {
          valid: false,
          message: error.message || "Failed to validate StatCounter credentials",
        };
      }
    }),
});
