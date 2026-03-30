import { sendEmail } from "./emailService";

const FRONTEND_URL = process.env.VITE_APP_URL || 'https://acq.market';
const APP_NAME = process.env.VITE_APP_TITLE || 'AM iGaming Marketplace';

export interface BrokerInfo {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
}

/**
 * Broker Onboarding Email Templates
 * 
 * Email sequence:
 * - Welcome: Sent immediately upon approval
 * - Day 1: Getting Started Guide
 * - Day 3: Best Practices
 * - Day 7: Success Stories & Advanced Features
 */

export const BrokerOnboardingEmails = {
  /**
   * Welcome email - sent immediately upon broker approval
   */
  welcome: (broker: BrokerInfo) => ({
    subject: `Welcome to ${APP_NAME} - Your Broker Account is Approved!`,
    text: `
Hi ${broker.contactName},

Congratulations! Your broker application for ${broker.companyName} has been approved.

You now have access to our broker portal where you can:
- List businesses on behalf of your clients
- Earn 50% of platform fees on successful deals
- Track your earnings and commissions
- Manage your client contracts

Get started by logging into your broker dashboard: ${FRONTEND_URL}/broker/dashboard

If you have any questions, our support team is here to help.

Welcome aboard!

Best regards,
The ${APP_NAME} Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${APP_NAME}!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Broker Account is Approved</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi ${broker.contactName},</p>
    
    <p>Congratulations! Your broker application for <strong>${broker.companyName}</strong> has been approved.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb;">
      <h3 style="margin-top: 0; color: #1e40af;">What You Can Do Now:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">List businesses on behalf of your clients</li>
        <li style="margin-bottom: 8px;">Earn <strong>50% of platform fees</strong> on successful deals</li>
        <li style="margin-bottom: 8px;">Track your earnings and commissions in real-time</li>
        <li style="margin-bottom: 8px;">Manage your client contracts securely</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${FRONTEND_URL}/broker/dashboard" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Go to Broker Dashboard
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">
      If you have any questions, our support team is here to help. Just reply to this email.
    </p>
    
    <p style="margin-top: 30px;">Welcome aboard!</p>
    <p style="margin: 0;"><strong>The ${APP_NAME} Team</strong></p>
  </div>
</body>
</html>
    `.trim(),
  }),

  /**
   * Day 1 - Getting Started Guide
   */
  gettingStarted: (broker: BrokerInfo) => ({
    subject: `Getting Started: Your First Listing on ${APP_NAME}`,
    text: `
Hi ${broker.contactName},

Now that you're set up as a broker on ${APP_NAME}, here's how to create your first listing:

STEP 1: GATHER CLIENT INFORMATION
Before creating a listing, make sure you have:
- Signed broker agreement with your client
- Business financials (MRR, EBITDA, revenue)
- Client count and retention metrics
- Service mix and tech stack details

STEP 2: CREATE YOUR LISTING
1. Go to your Broker Dashboard
2. Click "Create New Listing"
3. Fill in the business details
4. Upload your signed broker contract
5. Submit for verification

STEP 3: CONTRACT VERIFICATION
Our team will verify your contract within 24-48 hours. Once approved, your listing will go live in the marketplace.

TIPS FOR SUCCESS:
- Accurate financials build buyer trust
- Detailed descriptions attract more inquiries
- Professional photos increase engagement
- Respond quickly to buyer messages

Ready to create your first listing?
${FRONTEND_URL}/broker/dashboard

Best regards,
The ${APP_NAME} Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Getting Started Guide</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Create Your First Listing</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi ${broker.contactName},</p>
    
    <p>Now that you're set up as a broker on ${APP_NAME}, here's how to create your first listing:</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
        <div style="background: #059669; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
        <div>
          <h4 style="margin: 0 0 5px 0; color: #047857;">Gather Client Information</h4>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Signed broker agreement, financials, client metrics, and tech stack details</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
        <div style="background: #059669; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
        <div>
          <h4 style="margin: 0 0 5px 0; color: #047857;">Create Your Listing</h4>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Fill in business details and upload your signed broker contract</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: flex-start;">
        <div style="background: #059669; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">3</div>
        <div>
          <h4 style="margin: 0 0 5px 0; color: #047857;">Contract Verification</h4>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Our team verifies within 24-48 hours, then your listing goes live</p>
        </div>
      </div>
    </div>
    
    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h4 style="margin: 0 0 10px 0; color: #92400e;">💡 Tips for Success</h4>
      <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
        <li>Accurate financials build buyer trust</li>
        <li>Detailed descriptions attract more inquiries</li>
        <li>Respond quickly to buyer messages</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${FRONTEND_URL}/broker/dashboard" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Create Your First Listing
      </a>
    </div>
    
    <p style="margin-top: 30px;">Best regards,</p>
    <p style="margin: 0;"><strong>The ${APP_NAME} Team</strong></p>
  </div>
</body>
</html>
    `.trim(),
  }),

  /**
   * Day 3 - Best Practices
   */
  bestPractices: (broker: BrokerInfo) => ({
    subject: `Broker Best Practices: Maximize Your Success on ${APP_NAME}`,
    text: `
Hi ${broker.contactName},

Here are proven strategies from our top-performing brokers:

PRICING STRATEGY
- Use our valuation calculator for accurate pricing
- Consider market comparables in your region
- Be transparent about pricing methodology with clients

LISTING OPTIMIZATION
- Write compelling business descriptions
- Highlight unique selling points
- Include growth opportunities
- Use professional photos when possible

BUYER COMMUNICATION
- Respond to inquiries within 24 hours
- Qualify buyers before sharing sensitive info
- Use the NDA system for confidential details
- Keep all communication on-platform

DEAL MANAGEMENT
- Track all deals in your dashboard
- Use action items to stay organized
- Follow up regularly with interested buyers
- Document everything for smooth closings

COMMISSION TRACKING
- Monitor your earnings in real-time
- Request payouts when you reach $100
- Keep records for tax purposes

Questions? We're here to help!

Best regards,
The ${APP_NAME} Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Broker Best Practices</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Strategies from Top Performers</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi ${broker.contactName},</p>
    
    <p>Here are proven strategies from our top-performing brokers:</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #6d28d9; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px;">💰 Pricing Strategy</h3>
      <ul style="margin: 0; padding-left: 20px; color: #64748b;">
        <li>Use our valuation calculator for accurate pricing</li>
        <li>Consider market comparables in your region</li>
        <li>Be transparent about pricing methodology</li>
      </ul>
    </div>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #6d28d9; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px;">📝 Listing Optimization</h3>
      <ul style="margin: 0; padding-left: 20px; color: #64748b;">
        <li>Write compelling business descriptions</li>
        <li>Highlight unique selling points</li>
        <li>Include growth opportunities</li>
        <li>Use professional photos when possible</li>
      </ul>
    </div>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #6d28d9; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px;">💬 Buyer Communication</h3>
      <ul style="margin: 0; padding-left: 20px; color: #64748b;">
        <li>Respond to inquiries within 24 hours</li>
        <li>Qualify buyers before sharing sensitive info</li>
        <li>Use the NDA system for confidential details</li>
        <li>Keep all communication on-platform</li>
      </ul>
    </div>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #6d28d9; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px;">📊 Deal Management</h3>
      <ul style="margin: 0; padding-left: 20px; color: #64748b;">
        <li>Track all deals in your dashboard</li>
        <li>Use action items to stay organized</li>
        <li>Follow up regularly with interested buyers</li>
        <li>Document everything for smooth closings</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${FRONTEND_URL}/broker/dashboard" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        View Your Dashboard
      </a>
    </div>
    
    <p style="margin-top: 30px;">Questions? We're here to help!</p>
    <p style="margin: 0;"><strong>The ${APP_NAME} Team</strong></p>
  </div>
</body>
</html>
    `.trim(),
  }),

  /**
   * Day 7 - Success Stories & Advanced Features
   */
  successStories: (broker: BrokerInfo) => ({
    subject: `Advanced Features & Success Stories - ${APP_NAME}`,
    text: `
Hi ${broker.contactName},

You've been with us for a week! Here are some advanced features and success stories to help you grow:

SUCCESS STORY: TOP BROKER ACHIEVEMENT
One of our brokers closed 3 deals in their first month, earning over $15,000 in commissions. Their secret? Quick response times and thorough listing descriptions.

ADVANCED FEATURES

1. BULK LISTING MANAGEMENT
If you have multiple clients, use our bulk tools to manage listings efficiently.

2. ANALYTICS DASHBOARD
Track views, inquiries, and conversion rates for each listing.

3. AUTOMATED NOTIFICATIONS
Set up alerts for new buyer inquiries and deal updates.

4. DOCUMENT VAULT
Store and share due diligence documents securely.

5. DEAL PIPELINE
Track all your deals from initial contact to closing.

EARNING POTENTIAL
- Average broker commission: $5,000-$25,000 per deal
- Top brokers earn $50,000+ annually
- 50% of all platform fees go to you

Ready to take your brokerage to the next level?

Best regards,
The ${APP_NAME} Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Advanced Features & Success Stories</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Take Your Brokerage to the Next Level</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi ${broker.contactName},</p>
    
    <p>You've been with us for a week! Here are some advanced features and success stories to help you grow:</p>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin-top: 0; color: #92400e;">🏆 Success Story</h3>
      <p style="margin: 0; color: #78350f;">
        One of our brokers closed <strong>3 deals in their first month</strong>, earning over <strong>$15,000 in commissions</strong>. 
        Their secret? Quick response times and thorough listing descriptions.
      </p>
    </div>
    
    <h3 style="color: #b91c1c; margin-top: 30px;">Advanced Features</h3>
    
    <div style="display: grid; gap: 15px;">
      <div style="background: white; border-radius: 8px; padding: 15px; display: flex; align-items: flex-start;">
        <span style="font-size: 24px; margin-right: 15px;">📊</span>
        <div>
          <h4 style="margin: 0 0 5px 0;">Analytics Dashboard</h4>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Track views, inquiries, and conversion rates for each listing</p>
        </div>
      </div>
      
      <div style="background: white; border-radius: 8px; padding: 15px; display: flex; align-items: flex-start;">
        <span style="font-size: 24px; margin-right: 15px;">🔔</span>
        <div>
          <h4 style="margin: 0 0 5px 0;">Automated Notifications</h4>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Set up alerts for new buyer inquiries and deal updates</p>
        </div>
      </div>
      
      <div style="background: white; border-radius: 8px; padding: 15px; display: flex; align-items: flex-start;">
        <span style="font-size: 24px; margin-right: 15px;">📁</span>
        <div>
          <h4 style="margin: 0 0 5px 0;">Document Vault</h4>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Store and share due diligence documents securely</p>
        </div>
      </div>
      
      <div style="background: white; border-radius: 8px; padding: 15px; display: flex; align-items: flex-start;">
        <span style="font-size: 24px; margin-right: 15px;">🎯</span>
        <div>
          <h4 style="margin: 0 0 5px 0;">Deal Pipeline</h4>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Track all your deals from initial contact to closing</p>
        </div>
      </div>
    </div>
    
    <div style="background: #dcfce7; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
      <h3 style="margin-top: 0; color: #166534;">💰 Earning Potential</h3>
      <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
        <div>
          <p style="font-size: 24px; font-weight: bold; color: #166534; margin: 0;">$5K-$25K</p>
          <p style="margin: 0; color: #15803d; font-size: 12px;">Per Deal</p>
        </div>
        <div>
          <p style="font-size: 24px; font-weight: bold; color: #166534; margin: 0;">$50K+</p>
          <p style="margin: 0; color: #15803d; font-size: 12px;">Top Brokers Annually</p>
        </div>
        <div>
          <p style="font-size: 24px; font-weight: bold; color: #166534; margin: 0;">50%</p>
          <p style="margin: 0; color: #15803d; font-size: 12px;">Commission Rate</p>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${FRONTEND_URL}/broker/dashboard" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Explore Advanced Features
      </a>
    </div>
    
    <p style="margin-top: 30px;">Ready to take your brokerage to the next level?</p>
    <p style="margin: 0;"><strong>The ${APP_NAME} Team</strong></p>
  </div>
</body>
</html>
    `.trim(),
  }),
};

/**
 * Send a specific onboarding email to a broker
 */
export async function sendBrokerOnboardingEmail(
  broker: BrokerInfo,
  emailType: 'welcome' | 'gettingStarted' | 'bestPractices' | 'successStories'
): Promise<boolean> {
  const emailTemplate = BrokerOnboardingEmails[emailType](broker);
  
  return await sendEmail({
    to: broker.contactEmail,
    subject: emailTemplate.subject,
    text: emailTemplate.text,
    html: emailTemplate.html,
  });
}

/**
 * Send the complete onboarding sequence
 * This should be called when a broker is approved
 * The follow-up emails should be scheduled using a job scheduler
 */
export async function sendWelcomeEmail(broker: BrokerInfo): Promise<boolean> {
  return await sendBrokerOnboardingEmail(broker, 'welcome');
}

export async function sendGettingStartedEmail(broker: BrokerInfo): Promise<boolean> {
  return await sendBrokerOnboardingEmail(broker, 'gettingStarted');
}

export async function sendBestPracticesEmail(broker: BrokerInfo): Promise<boolean> {
  return await sendBrokerOnboardingEmail(broker, 'bestPractices');
}

export async function sendSuccessStoriesEmail(broker: BrokerInfo): Promise<boolean> {
  return await sendBrokerOnboardingEmail(broker, 'successStories');
}
