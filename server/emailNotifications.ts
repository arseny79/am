import { notifyOwner } from "./_core/notification";

/**
 * Email notification helper for marketplace events
 * Uses the built-in Manus notification system
 */

export async function sendNewDealNotification(params: {
  sellerName: string;
  buyerName: string;
  listingName: string;
}) {
  await notifyOwner({
    title: "New Deal Created",
    content: `${params.buyerName} is interested in "${params.listingName}" (Seller: ${params.sellerName})`,
  });
}

export async function sendNDASignedNotification(params: {
  buyerName: string;
  listingName: string;
  sellerName: string;
}) {
  await notifyOwner({
    title: "NDA Signed",
    content: `${params.buyerName} signed an NDA for "${params.listingName}" (Seller: ${params.sellerName})`,
  });
}

export async function sendDealStageChangeNotification(params: {
  listingName: string;
  newStage: string;
  buyerName: string;
  sellerName: string;
}) {
  await notifyOwner({
    title: "Deal Stage Updated",
    content: `Deal for "${params.listingName}" moved to ${params.newStage} (Buyer: ${params.buyerName}, Seller: ${params.sellerName})`,
  });
}

export async function sendDocumentUploadedNotification(params: {
  uploaderName: string;
  fileName: string;
  listingName: string;
}) {
  await notifyOwner({
    title: "Document Uploaded",
    content: `${params.uploaderName} uploaded "${params.fileName}" for "${params.listingName}"`,
  });
}

export async function sendNewMessageNotification(params: {
  senderName: string;
  recipientName: string;
  listingName: string;
}) {
  await notifyOwner({
    title: "New Message",
    content: `${params.senderName} sent a message to ${params.recipientName} about "${params.listingName}"`,
  });
}

export async function sendNewListingNotification(params: {
  sellerName: string;
  listingName: string;
  annualRevenue: number;
  ebitda: number;
}) {
  await notifyOwner({
    title: "New Listing Published",
    content: `${params.sellerName} published "${params.listingName}" - Revenue: $${params.annualRevenue.toLocaleString()}, EBITDA: $${params.ebitda.toLocaleString()}`,
  });
}

export async function sendNegotiationUpdateEmail(
  recipientEmail: string,
  recipientName: string,
  businessName: string,
  offerAmount: number,
  reason: string,
  dealId: number
) {
  await notifyOwner({
    title: "Negotiation Update",
    content: `Counter-offer of $${offerAmount.toLocaleString()} received for "${businessName}". Reason: ${reason}. Deal ID: ${dealId}`,
  });
}

export async function sendEmailVerification(params: {
  email: string;
  name: string;
  verificationToken: string;
}) {
  const verificationUrl = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${params.verificationToken}`;
  
  // TODO: Replace with actual email service when SendGrid is configured
  // For now, log to console for development
  console.log(`[Email Verification] To: ${params.email}`);
  console.log(`[Email Verification] Verification URL: ${verificationUrl}`);
  
  // When SendGrid is configured, use this:
  /*
  await sendEmail({
    to: params.email,
    subject: "Verify your email address",
    html: `
      <h1>Welcome to MSP M&A Marketplace, ${params.name}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify Email Address</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    `,
  });
  */
}

export async function sendPasswordReset(params: {
  email: string;
  name: string;
  resetToken: string;
}) {
  const resetUrl = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${params.resetToken}`;
  
  // TODO: Replace with actual email service when SendGrid is configured
  // For now, log to console for development
  console.log(`[Password Reset] To: ${params.email}`);
  console.log(`[Password Reset] Reset URL: ${resetUrl}`);
  
  // When SendGrid is configured, use this:
  /*
  await sendEmail({
    to: params.email,
    subject: "Reset your password",
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${params.name},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
  */
}

export async function sendCredentialVerifiedEmail(params: {
  email: string;
  name: string;
  credentialTitle: string;
  credentialType: string;
}) {
  const profileUrl = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/professionals`;
  
  // TODO: Replace with actual email service when SendGrid is configured
  // For now, log to console for development
  console.log(`[Credential Verified] To: ${params.email}`);
  console.log(`[Credential Verified] Credential: ${params.credentialTitle}`);
  
  // When SendGrid is configured, use this:
  /*
  await sendEmail({
    to: params.email,
    subject: "Credential Verified - MSP M&A Marketplace",
    html: `
      <h1>Credential Verified!</h1>
      <p>Hi ${params.name},</p>
      <p>Great news! Your credential has been verified by our admin team:</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Credential:</strong> ${params.credentialTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Type:</strong> ${params.credentialType}</p>
      </div>
      <p>Your verified credential will now be displayed on your professional profile with a verified badge.</p>
      <p><a href="${profileUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Profile</a></p>
      <p>Thank you for being a trusted professional on our platform!</p>
    `,
  });
  */
}

export async function sendCredentialRejectedEmail(params: {
  email: string;
  name: string;
  credentialTitle: string;
  credentialType: string;
  rejectionReason: string;
}) {
  const editProfileUrl = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/edit-professional-profile`;
  
  // TODO: Replace with actual email service when SendGrid is configured
  // For now, log to console for development
  console.log(`[Credential Rejected] To: ${params.email}`);
  console.log(`[Credential Rejected] Credential: ${params.credentialTitle}`);
  console.log(`[Credential Rejected] Reason: ${params.rejectionReason}`);
  
  // When SendGrid is configured, use this:
  /*
  await sendEmail({
    to: params.email,
    subject: "Credential Verification Update - MSP M&A Marketplace",
    html: `
      <h1>Credential Verification Update</h1>
      <p>Hi ${params.name},</p>
      <p>Thank you for submitting your credential for verification. After review, we were unable to verify the following credential:</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Credential:</strong> ${params.credentialTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Type:</strong> ${params.credentialType}</p>
      </div>
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Reason:</strong></p>
        <p style="margin: 8px 0 0 0;">${params.rejectionReason}</p>
      </div>
      <p>If you believe this was an error or would like to resubmit with additional documentation, please visit your profile and upload the credential again.</p>
      <p><a href="${editProfileUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Edit Profile</a></p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
    `,
  });
  */
}
