import sgMail from "@sendgrid/mail";
import { notifyOwner } from "./_core/notification";

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@acquisitions.market";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "Acquisitions.market";
const FRONTEND_URL = process.env.VITE_FRONTEND_URL || "https://acquisitions.market";

async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error("[Email] SENDGRID_API_KEY not set — verification email NOT sent to", params.to);
    return false;
  }
  sgMail.setApiKey(apiKey);
  try {
    await sgMail.send({
      to: params.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: params.subject,
      html: params.html,
    });
    console.log(`[Email] Sent "${params.subject}" to ${params.to}`);
    return true;
  } catch (error: any) {
    console.error("[Email] SendGrid error:", error?.response?.body || error);
    return false;
  }
}

export async function sendEmailVerification(params: {
  email: string;
  name: string;
  verificationToken: string;
}): Promise<boolean> {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${params.verificationToken}`;
  return sendEmail({
    to: params.email,
    subject: "Verify your email address – Acquisitions.market",
    html: `
      <h1>Welcome to Acquisitions.market, ${params.name}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}" style="background-color:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Verify Email Address</a></p>
      <p>Or copy and paste this link: ${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    `,
  });
}

export async function sendPasswordReset(params: {
  email: string;
  name: string;
  resetToken: string;
}) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${params.resetToken}`;
  await sendEmail({
    to: params.email,
    subject: "Reset your password – Acquisitions.market",
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${params.name},</p>
      <p>Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="background-color:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a></p>
      <p>Or copy and paste this link: ${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

export async function sendCredentialVerifiedEmail(params: {
  email: string;
  name: string;
  credentialTitle: string;
  credentialType: string;
}) {
  const profileUrl = `${FRONTEND_URL}/professionals`;
  await sendEmail({
    to: params.email,
    subject: "Credential Verified – Acquisitions.market",
    html: `
      <h1>Credential Verified!</h1>
      <p>Hi ${params.name},</p>
      <p>Your credential <strong>${params.credentialTitle}</strong> (${params.credentialType}) has been verified and will now show a verified badge on your profile.</p>
      <p><a href="${profileUrl}" style="background-color:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">View Your Profile</a></p>
    `,
  });
}

export async function sendCredentialRejectedEmail(params: {
  email: string;
  name: string;
  credentialTitle: string;
  credentialType: string;
  rejectionReason: string;
}) {
  const editProfileUrl = `${FRONTEND_URL}/edit-professional-profile`;
  await sendEmail({
    to: params.email,
    subject: "Credential Verification Update – Acquisitions.market",
    html: `
      <h1>Credential Verification Update</h1>
      <p>Hi ${params.name},</p>
      <p>We were unable to verify your credential <strong>${params.credentialTitle}</strong>.</p>
      <p><strong>Reason:</strong> ${params.rejectionReason}</p>
      <p><a href="${editProfileUrl}" style="background-color:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Edit Profile</a></p>
    `,
  });
}

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
