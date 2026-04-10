import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { sendEmail } from "../lib/emailService";

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

  contactForm: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(10, "Message must be at least 10 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const sent = await sendEmail({
        to: process.env.SENDGRID_FROM_EMAIL || "support@acquisition.market",
        subject: `[Contact Form] ${input.subject}`,
        text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${input.name} &lt;${input.email}&gt;</p>
            <p><strong>Subject:</strong> ${input.subject}</p>
            <hr/>
            <p>${input.message.replace(/\n/g, "<br/>")}</p>
          </div>
        `,
      });
      return { success: sent } as const;
    }),

  testEmail: adminProcedure
    .input(
      z.object({
        email: z.string().email("valid email is required"),
      })
    )
    .mutation(async ({ input }) => {
      const sent = await sendEmail({
        to: input.email,
        subject: "Test Email from acquisition.market",
        text: "This is a test email to verify SendGrid integration is working correctly.",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">✓ SendGrid Integration Test</h2>
            <p>Congratulations! Your SendGrid integration is working correctly.</p>
            <p>This test email was sent from your acquisition.market application.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">Best regards,<br>acquisition.market</p>
          </div>
        `,
      });
      return {
        success: sent,
      } as const;
    }),
});
