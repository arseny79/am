import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { sendEmail } from "../lib/emailService";
import { ENV } from "./env";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  testEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("valid email is required"),
      })
    )
    .mutation(async ({ input }) => {
      const sent = await sendEmail({
        to: input.email,
        subject: "Test Email from MSP M&A Marketplace",
        text: "This is a test email to verify SendGrid integration is working correctly.",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">✓ SendGrid Integration Test</h2>
            <p>Congratulations! Your SendGrid integration is working correctly.</p>
            <p>This test email was sent from your MSP M&A Marketplace application.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">Best regards,<br>MSP M&A Marketplace</p>
          </div>
        `,
      });
      return {
        success: sent,
      } as const;
    }),
});
