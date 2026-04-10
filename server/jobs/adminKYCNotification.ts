import { getDb } from '../db';
import { users, notifications } from '../../drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { sendEmail } from '../lib/emailService';
import { nowTimestamp } from '../lib/dbHelpers';

const APP_URL = process.env.VITE_APP_URL || 'https://acquisitions.market';

/**
 * Admin KYC Notification Email Template
 */
function getAdminKYCNotificationEmail(params: {
  adminName: string;
  userName: string;
  userEmail: string;
  submittedAt: string;
  reviewLink: string;
}) {
  const subject = 'New KYC Submission Awaiting Review';
  
  const text = `Hi ${params.adminName || 'Admin'},

A new KYC submission is awaiting your review:

User: ${params.userName} (${params.userEmail})
Submitted: ${params.submittedAt}

Please review the documents within 24-48 hours to maintain our service level.

Review KYC Submission: ${params.reviewLink}

Best regards,
acquisitions.market`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0f172a;">Hi ${params.adminName || 'Admin'},</h2>
      <p style="font-size: 16px; color: #334155;">A new KYC submission is awaiting your review:</p>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="margin-bottom: 8px;"><strong>User:</strong> ${params.userName} (${params.userEmail})</li>
          <li style="margin-bottom: 8px;"><strong>Submitted:</strong> ${params.submittedAt}</li>
        </ul>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">Please review the documents within 24-48 hours to maintain our service level.</p>
      
      <p style="margin: 30px 0;">
        <a href="${params.reviewLink}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Review KYC Submission
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="font-size: 12px; color: #94a3b8;">Best regards,<br>acquisitions.market</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Send notification to all admins about a new KYC submission
 */
export async function notifyAdminsOfKYCSubmission(params: {
  userId: number;
  userName: string;
  userEmail: string;
}): Promise<{ emailsSent: number; notificationsCreated: number }> {
  const db = await getDb();
  if (!db) {
    console.error('[Admin KYC Notification] Database not available');
    return { emailsSent: 0, notificationsCreated: 0 };
  }

  console.log(`[Admin KYC Notification] Notifying admins about KYC submission from ${params.userEmail}`);

  try {
    // Find all admins
    const admins = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.role, 'admin'));

    console.log(`[Admin KYC Notification] Found ${admins.length} admins to notify`);

    const submittedAt = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const reviewLink = `${APP_URL}/admin?tab=user-management-hub`;

    let emailsSent = 0;
    let notificationsCreated = 0;

    // Send email to each admin
    for (const admin of admins) {
      if (!admin.email) continue;

      try {
        const emailContent = getAdminKYCNotificationEmail({
          adminName: admin.name || 'Admin',
          userName: params.userName,
          userEmail: params.userEmail,
          submittedAt,
          reviewLink,
        });

        const success = await sendEmail({
          to: admin.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });

        if (success) {
          emailsSent++;
          console.log(`[Admin KYC Notification] ✓ Email sent to ${admin.email}`);
        }
      } catch (error) {
        console.error(`[Admin KYC Notification] Failed to email ${admin.email}:`, error);
      }
    }

    // Create in-app notification for admins
    try {
      await db.insert(notifications).values({
        userId: 0, // System notification (will be shown to all admins)
        type: 'kyc_submission',
        title: 'New KYC Submission',
        message: `${params.userName || params.userEmail} submitted KYC documents for review. Review at /admin?tab=user-management-hub`,
        isRead: 0,
      });
      notificationsCreated++;
      console.log('[Admin KYC Notification] ✓ In-app notification created');
    } catch (error) {
      console.error('[Admin KYC Notification] Failed to create in-app notification:', error);
    }

    console.log(`[Admin KYC Notification] Complete. Emails: ${emailsSent}, Notifications: ${notificationsCreated}`);
    return { emailsSent, notificationsCreated };
  } catch (error) {
    console.error('[Admin KYC Notification] Failed:', error);
    return { emailsSent: 0, notificationsCreated: 0 };
  }
}
