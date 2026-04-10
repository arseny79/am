import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq, and, lt, or, isNull, sql } from 'drizzle-orm';
import { sendEmail } from '../lib/emailService';

const APP_URL = process.env.VITE_APP_URL || 'https://acquisitions.market';

/**
 * KYC Reminder Email Template
 */
function getKYCReminderEmail(userName: string, verificationLink: string) {
  const subject = 'Complete Your acquisitions.market Verification';
  
  const text = `Hi ${userName || 'there'},

You're almost there! Complete your verification to access exclusive listings.

What you need to do:
- Verify your email (if not done)
- Upload your government-issued ID
- Upload proof of address

Verification typically takes 24-48 hours once documents are submitted.

Complete verification: ${verificationLink}

If you didn't create an account on acquisitions.market, you can safely ignore this email.

Best regards,
acquisitions.market`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0f172a;">Hi ${userName || 'there'},</h2>
      <p style="font-size: 16px; color: #334155;">You're almost there! Complete your verification to access exclusive listings.</p>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="font-weight: bold; color: #0f172a; margin-bottom: 10px;">What you need to do:</p>
        <ul style="color: #475569; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Verify your email (if not done)</li>
          <li style="margin-bottom: 8px;">Upload your government-issued ID</li>
          <li style="margin-bottom: 8px;">Upload proof of address</li>
        </ul>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">Verification typically takes 24-48 hours once documents are submitted.</p>
      
      <p style="margin: 30px 0;">
        <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Complete Verification
        </a>
      </p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
        If you didn't create an account on acquisitions.market, you can safely ignore this email.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="font-size: 12px; color: #94a3b8;">Best regards,<br>acquisitions.market</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Send KYC reminder emails to users who haven't completed verification
 * 
 * Criteria:
 * 1. kycStatus is 'unverified' (not verified yet)
 * 2. Account created more than 24 hours ago (grace period)
 * 3. lastReminderSentAt is null OR more than 7 days ago (rate limit)
 */
export async function sendKYCReminders(): Promise<{ sent: number; errors: number }> {
  const db = await getDb();
  if (!db) {
    console.error('[KYC Reminder] Database not available');
    return { sent: 0, errors: 0 };
  }

  console.log('[KYC Reminder] Starting KYC reminder job...');

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Find users who need reminders
    const usersNeedingReminder = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        lastReminderSentAt: users.lastReminderSentAt,
      })
      .from(users)
      .where(
        and(
          eq(users.kycStatus, 'unverified'),
          lt(users.createdAt, twentyFourHoursAgo.toISOString()),
          or(
            isNull(users.lastReminderSentAt),
            lt(users.lastReminderSentAt, sevenDaysAgo.toISOString())
          )
        )
      )
      .limit(100); // Process in batches to avoid overwhelming email service

    console.log(`[KYC Reminder] Found ${usersNeedingReminder.length} users needing reminders`);

    let sent = 0;
    let errors = 0;

    for (const user of usersNeedingReminder) {
      if (!user.email) {
        console.log(`[KYC Reminder] Skipping user ${user.id} - no email`);
        continue;
      }

      try {
        const verificationLink = `${APP_URL}/verify-account`;
        const emailContent = getKYCReminderEmail(user.name || '', verificationLink);

        const success = await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });

        if (success) {
          // Update lastReminderSentAt
          await db
            .update(users)
            .set({ lastReminderSentAt: now.toISOString() })
            .where(eq(users.id, user.id));
          
          sent++;
          console.log(`[KYC Reminder] ✓ Sent reminder to ${user.email}`);
        } else {
          errors++;
          console.log(`[KYC Reminder] ✗ Failed to send to ${user.email}`);
        }
      } catch (error) {
        errors++;
        console.error(`[KYC Reminder] Error sending to ${user.email}:`, error);
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[KYC Reminder] Job complete. Sent: ${sent}, Errors: ${errors}`);
    return { sent, errors };
  } catch (error) {
    console.error('[KYC Reminder] Job failed:', error);
    return { sent: 0, errors: 1 };
  }
}

/**
 * Run the KYC reminder job manually (for testing or one-off runs)
 */
export async function runKYCReminderJob() {
  console.log('[KYC Reminder] Manual job trigger');
  return await sendKYCReminders();
}
