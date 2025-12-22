import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('[Email] SENDGRID_API_KEY not set - emails will not be sent');
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@mspmarketplace.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'MSP M&A Marketplace';
const FRONTEND_URL = process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://mspmarketplace.com';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn(`[Email] Skipping email send to ${options.to} - SENDGRID_API_KEY not configured`);
    console.warn(`[Email] Subject: ${options.subject}`);
    return false;
  }

  try {
    console.log(`[Email] Attempting to send from ${FROM_EMAIL} to ${options.to}`);
    await sgMail.send({
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>'),
    });

    console.log(`[Email] ✓ Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error: any) {
    console.error('[Email] ✗ Failed to send:');
    console.error('[Email] Error message:', error.message);
    console.error('[Email] Error code:', error.code);
    console.error('[Email] Response body:', JSON.stringify(error.response?.body, null, 2));
    return false;
  }
}

/**
 * Email template helpers
 */
export const EmailTemplates = {
  /**
   * Proposal received notification (sent to buyer)
   */
  proposalReceived: (params: {
    recipientName: string;
    requestTitle: string;
    sellerName: string;
    listingName: string;
    proposalUrl: string;
  }) => ({
    subject: `New proposal for "${params.requestTitle}"`,
    text: `Hi ${params.recipientName},\n\n${params.sellerName} has submitted a proposal for your buyer request "${params.requestTitle}".\n\nListing: ${params.listingName}\n\nReview proposal: ${params.proposalUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Proposal Received</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.sellerName}</strong> has submitted a proposal for your buyer request "<strong>${params.requestTitle}</strong>".</p>
        <p><strong>Listing:</strong> ${params.listingName}</p>
        <p style="margin: 30px 0;">
          <a href="${params.proposalUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Proposal</a>
        </p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),

  /**
   * Proposal accepted notification (sent to seller)
   */
  proposalAccepted: (params: {
    recipientName: string;
    requestTitle: string;
    buyerName: string;
    dealUrl: string;
  }) => ({
    subject: `Your proposal was accepted!`,
    text: `Hi ${params.recipientName},\n\nGreat news! ${params.buyerName} has accepted your proposal for "${params.requestTitle}".\n\nA deal has been created. You can now communicate directly with the buyer.\n\nView deal: ${params.dealUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">🎉 Proposal Accepted!</h2>
        <p>Hi ${params.recipientName},</p>
        <p>Great news! <strong>${params.buyerName}</strong> has accepted your proposal for "<strong>${params.requestTitle}</strong>".</p>
        <p>A deal has been created. You can now communicate directly with the buyer.</p>
        <p style="margin: 30px 0;">
          <a href="${params.dealUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Deal</a>
        </p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),

  /**
   * Proposal declined notification (sent to seller)
   */
  proposalDeclined: (params: {
    recipientName: string;
    requestTitle: string;
    buyerName: string;
  }) => ({
    subject: `Update on your proposal for "${params.requestTitle}"`,
    text: `Hi ${params.recipientName},\n\n${params.buyerName} has declined your proposal for "${params.requestTitle}".\n\nDon't be discouraged! Keep browsing for other opportunities that match your business.\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Proposal Update</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.buyerName}</strong> has declined your proposal for "<strong>${params.requestTitle}</strong>".</p>
        <p>Don't be discouraged! Keep browsing for other opportunities that match your business.</p>
        <p style="margin: 30px 0;">
          <a href="${FRONTEND_URL}/buy-asset" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Browse Buyer Requests</a>
        </p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),

  /**
   * New message notification
   */
  newMessage: (params: {
    recipientName: string;
    senderName: string;
    dealTitle: string;
    messagePreview: string;
    dealUrl: string;
  }) => ({
    subject: `New message from ${params.senderName}`,
    text: `Hi ${params.recipientName},\n\n${params.senderName} sent you a message about "${params.dealTitle}":\n\n"${params.messagePreview}"\n\nView conversation: ${params.dealUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Message</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.senderName}</strong> sent you a message about "<strong>${params.dealTitle}</strong>":</p>
        <blockquote style="border-left: 3px solid #2563eb; padding-left: 15px; color: #666; margin: 20px 0;">${params.messagePreview}</blockquote>
        <p style="margin: 30px 0;">
          <a href="${params.dealUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Conversation</a>
        </p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),

  /**
   * NDA access request notification (sent to seller)
   */
  ndaAccessRequest: (params: {
    recipientName: string;
    buyerName: string;
    listingTitle: string;
    accessRequestsUrl: string;
  }) => ({
    subject: `NDA access request for "${params.listingTitle}"`,
    text: `Hi ${params.recipientName},\n\n${params.buyerName} has requested access to confidential details for your listing "${params.listingTitle}".\n\nPlease review and approve the NDA request.\n\nReview request: ${params.accessRequestsUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">NDA Access Request</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.buyerName}</strong> has requested access to confidential details for your listing "<strong>${params.listingTitle}</strong>".</p>
        <p>Please review and approve the NDA request.</p>
        <p style="margin: 30px 0;">
          <a href="${params.accessRequestsUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Request</a>
        </p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),

  /**
   * NDA approved notification (sent to buyer)
   */
  ndaApproved: (params: {
    recipientName: string;
    listingTitle: string;
    listingUrl: string;
  }) => ({
    subject: `NDA approved for "${params.listingTitle}"`,
    text: `Hi ${params.recipientName},\n\nYour NDA request for "${params.listingTitle}" has been approved.\n\nYou can now view confidential details and initiate a deal.\n\nView listing: ${params.listingUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">✓ NDA Approved</h2>
        <p>Hi ${params.recipientName},</p>
        <p>Your NDA request for "<strong>${params.listingTitle}</strong>" has been approved.</p>
        <p>You can now view confidential details and initiate a deal.</p>
        <p style="margin: 30px 0;">
          <a href="${params.listingUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Listing</a>
        </p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),

  /**
   * Listing published confirmation (sent to seller)
   */
  listingPublished: (params: {
    recipientName: string;
    listingTitle: string;
    listingUrl: string;
  }) => ({
    subject: `Your listing "${params.listingTitle}" is now live!`,
    text: `Hi ${params.recipientName},\n\nGreat news! Your listing "${params.listingTitle}" has been published and is now visible to buyers.\n\nView listing: ${params.listingUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">🎉 Listing Published!</h2>
        <p>Hi ${params.recipientName},</p>
        <p>Great news! Your listing "<strong>${params.listingTitle}</strong>" has been published and is now visible to buyers.</p>
        <p style="margin: 30px 0;">
          <a href="${params.listingUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Listing</a>
        </p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),

  /**
   * Deal stage changed notification
   */
  dealStageChanged: (params: {
    recipientName: string;
    dealTitle: string;
    newStage: string;
    dealUrl: string;
  }) => ({
    subject: `Deal update: ${params.dealTitle}`,
    text: `Hi ${params.recipientName},\n\nThe deal "${params.dealTitle}" has progressed to: ${params.newStage}.\n\nView deal: ${params.dealUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Deal Progress Update</h2>
        <p>Hi ${params.recipientName},</p>
        <p>The deal "<strong>${params.dealTitle}</strong>" has progressed to: <strong>${params.newStage}</strong>.</p>
        <p style="margin: 30px 0;">
          <a href="${params.dealUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Deal</a>
        </p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),

  /**
   * KYC approved notification (sent to user)
   */
  kycApproved: (params: {
    recipientName: string;
    dashboardUrl: string;
  }) => ({
    subject: 'Your KYC verification has been approved!',
    text: `Hi ${params.recipientName},\n\nGreat news! Your KYC verification has been approved.\n\nYou now have full access to all marketplace features, including:\n- Creating and managing listings\n- Initiating deals\n- Accessing confidential business information\n\nGet started: ${params.dashboardUrl}\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">✓ KYC Verification Approved</h2>
        <p>Hi ${params.recipientName},</p>
        <p>Great news! Your KYC verification has been approved.</p>
        <p>You now have full access to all marketplace features, including:</p>
        <ul style="color: #333; line-height: 1.8;">
          <li>Creating and managing listings</li>
          <li>Initiating deals</li>
          <li>Accessing confidential business information</li>
        </ul>
        <p style="margin: 30px 0;">
          <a href="${params.dashboardUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
        </p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),

  /**
   * KYC rejected notification (sent to user)
   */
  kycRejected: (params: {
    recipientName: string;
    reason: string;
    resubmitUrl: string;
  }) => ({
    subject: 'Action required: KYC verification needs attention',
    text: `Hi ${params.recipientName},\n\nWe've reviewed your KYC submission and need additional information or clarification.\n\nReason: ${params.reason}\n\nPlease review the feedback and resubmit your documents.\n\nResubmit KYC: ${params.resubmitUrl}\n\nIf you have questions, please contact our support team.\n\nBest regards,\nMSP M&A Marketplace`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">KYC Verification Needs Attention</h2>
        <p>Hi ${params.recipientName},</p>
        <p>We've reviewed your KYC submission and need additional information or clarification.</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${params.reason}</p>
        </div>
        <p>Please review the feedback and resubmit your documents.</p>
        <p style="margin: 30px 0;">
          <a href="${params.resubmitUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Resubmit KYC</a>
        </p>
        <p style="color: #666; font-size: 14px;">If you have questions, please contact our support team.</p>
        <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
      </div>
    `,
  }),
};
