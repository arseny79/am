# Phase 133: Email Verification, KYC Admin Dashboard, and Expiry Reminders

This document provides comprehensive documentation for three critical features implemented in Phase 133.

## Overview

Three interconnected features have been implemented to improve marketplace security and user experience:

1. **Email Verification Flow** - Users must verify their email before accessing critical features
2. **Admin KYC Review Dashboard** - Admins can review, approve, and reject KYC submissions with document preview
3. **Verification Expiry Reminders** - Automated emails sent 30 days before verification expires

## Feature 1: Email Verification Flow

### Purpose

Email verification ensures that users have control over the email address associated with their account and receive important notifications. It is a prerequisite for:
- Submitting KYC verification documents
- Creating MSP listings
- Requesting access to confidential listings
- Receiving deal notifications

### Database Schema

The `users` table already includes the necessary fields:
- `emailVerified` (boolean, default false) - Whether email is verified
- `emailVerificationToken` (varchar 64) - Unique token for verification link
- `emailVerificationTokenExpiry` (timestamp) - When token expires (24 hours)

### Backend Implementation

**File:** `server/routers/emailVerificationRouter.ts`

#### Procedures

1. **sendVerificationEmail** (protected)
   - Generates a 32-byte random token
   - Sets token expiry to 24 hours
   - Sends welcome email with verification link
   - Returns success message

2. **verifyEmail** (public)
   - Accepts token from URL parameter
   - Validates token exists and hasn't expired
   - Marks email as verified
   - Clears token and expiry

3. **resendVerificationEmail** (protected)
   - Generates new verification token
   - Sends new verification email
   - Useful if user didn't receive first email

4. **getVerificationStatus** (protected)
   - Returns current verification status for user
   - Shows email address

### Frontend Implementation

**File:** `client/src/components/EmailVerificationStatus.tsx`

A reusable component that displays:
- Current email verification status
- Email address
- "Resend Verification Email" button
- Alert messages explaining why verification is needed

**File:** `client/src/pages/VerifyEmail.tsx`

Page component that:
- Extracts token from URL query parameters
- Calls verification mutation
- Shows loading, success, or error states
- Provides links to profile or home

### Integration Points

**KYC Submission Gate** (in `server/routers/kycRouter.ts`):
```typescript
if (!ctx.user.emailVerified) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Please verify your email address before submitting KYC documents",
  });
}
```

**Listing Creation Gate** (in `server/routers.ts`):
- Uses `verifiedProcedure` which already checks verification status

### Email Templates

Two email templates are sent:

1. **Welcome Email** (on first verification request)
   - Explains why verification is needed
   - Lists features that require verification
   - Contains verification link button
   - Expires in 24 hours

2. **Resend Email** (on resend request)
   - Similar to welcome but indicates resend
   - Same 24-hour expiry

## Feature 2: Admin KYC Review Dashboard

### Purpose

Admins need a centralized interface to:
- View pending KYC submissions
- Review submitted documents (ID, address proof)
- Approve or reject submissions
- Provide rejection reasons to users

### Database Schema

Uses existing fields in `users` table:
- `kycVerified` (boolean) - Whether KYC is approved
- `kycSubmittedAt` (timestamp) - When documents were submitted
- `kycReviewedAt` (timestamp) - When admin reviewed
- `kycRejectionReason` (text) - Reason if rejected

Uses `kycDocuments` table:
- `userId` - Which user submitted
- `documentType` - "government_id" or "proof_of_address"
- `fileName` - Original filename
- `fileUrl` - S3 URL to document
- `fileSize` - File size in bytes
- `mimeType` - MIME type (image/jpeg, application/pdf, etc.)
- `createdAt` - When uploaded

### Backend Implementation

**File:** `server/routers/adminKYCReviewRouter.ts`

#### Procedures

1. **getPendingSubmissions** (admin only)
   - Returns all submissions awaiting review
   - Shows user name, email, company, submission date
   - Ordered by most recent first
   - Returns: Array of pending submissions

2. **getSubmissionDetails** (admin only)
   - Input: userId
   - Returns user details and all uploaded documents
   - Includes document URLs for download
   - Shows previous rejection reason if any

3. **approveSubmission** (admin only)
   - Input: userId
   - Sets `kycVerified = true`
   - Sets `kycReviewedAt = now`
   - Clears rejection reason
   - Sends approval email to user
   - Returns: success message

4. **rejectSubmission** (admin only)
   - Input: userId, rejectionReason
   - Sets `kycVerified = false`
   - Sets `kycReviewedAt = now`
   - Stores rejection reason
   - Sends rejection email with reason
   - Returns: success message

5. **getAllSubmissions** (admin only)
   - Input: status ("all", "pending", "approved", "rejected"), limit, offset
   - Returns paginated list of all submissions
   - Useful for viewing history

### Frontend Implementation

**File:** `client/src/components/AdminKYCReviewDashboard.tsx`

A comprehensive dashboard component that:

1. **Pending Submissions List**
   - Shows all pending submissions
   - Displays user name, email, company, submission date
   - "View Documents" button to open details

2. **Document Viewer Dialog**
   - Shows user information in read-only format
   - Lists all submitted documents
   - Download button for each document
   - Shows previous rejection reason if any

3. **Approve/Reject Buttons**
   - Approve button immediately approves
   - Reject button opens confirmation dialog

4. **Rejection Dialog**
   - Text area for rejection reason
   - Minimum 10 characters required
   - Reason is sent to user in email

### Email Templates

1. **Approval Email**
   - Congratulates user on approval
   - Lists features now available
   - Notes 12-month validity period
   - Link to marketplace

2. **Rejection Email**
   - Explains documents need more information
   - Shows rejection reason in highlighted box
   - Instructions to resubmit
   - Link back to profile

### Integration with Admin Dashboard

The component should be added to the admin dashboard as a new tab. Admins can access it to review pending KYC submissions.

## Feature 3: Verification Expiry Reminders

### Purpose

Verification is valid for 12 months. Users need reminders before expiration so they can renew in time.

### Database Schema

Uses existing fields in `users` table:
- `verificationStatus` - Must be "verified"
- `verificationExpiresAt` - When verification expires

### Backend Implementation

**File:** `server/routers/verificationExpiryRouter.ts`

#### Procedures

1. **getExpiringVerifications** (admin only)
   - Input: daysUntilExpiry (default 30)
   - Returns users whose verification expires in ~30 days
   - Used to identify who needs reminders

2. **sendExpiryReminder** (admin only)
   - Input: userId
   - Sends reminder email to specific user
   - Calculates days until expiry
   - Shows expiration date

3. **sendAllExpiryReminders** (public with secret)
   - Input: cronSecret, daysUntilExpiry
   - Validates cron secret against `CRON_SECRET` env var
   - Finds all users with expiring verification
   - Sends reminder to each
   - Returns: count of successful and failed sends
   - **This is called by a cron job**

### Email Template

Expiry reminder email includes:
- Number of days until expiration
- Exact expiration date
- Warning about what happens when verification expires
- Link to renewal page
- Call to action to renew now

### Setting Up Cron Job

To automatically send reminders 30 days before expiration:

#### Option 1: External Cron Service (Recommended)

Use a service like EasyCron or cron-job.org:

1. Set up HTTP POST to:
   ```
   https://your-domain.com/api/trpc/verificationExpiry.sendAllExpiryReminders
   ```

2. Send JSON body:
   ```json
   {
     "input": {
       "cronSecret": "your-cron-secret-value",
       "daysUntilExpiry": 30
     }
   }
   ```

3. Schedule to run daily (e.g., 2 AM UTC)

#### Option 2: Server-Side Cron (if using Node.js)

Install `node-cron`:
```bash
pnpm add node-cron
```

Create `server/jobs/expiryReminder.ts`:
```typescript
import cron from 'node-cron';
import { appRouter } from '../routers';

export function startExpiryReminderJob() {
  // Run daily at 2 AM UTC
  cron.schedule('0 2 * * *', async () => {
    try {
      const caller = appRouter.createCaller({
        user: null,
        req: {},
        res: {},
      } as any);

      const result = await caller.verificationExpiry.sendAllExpiryReminders({
        cronSecret: process.env.CRON_SECRET || 'default-secret',
        daysUntilExpiry: 30,
      });

      console.log('Expiry reminders sent:', result);
    } catch (error) {
      console.error('Failed to send expiry reminders:', error);
    }
  });
}
```

Then call in server startup:
```typescript
import { startExpiryReminderJob } from './jobs/expiryReminder';

// In server startup
startExpiryReminderJob();
```

#### Option 3: AWS Lambda / Scheduled Function

Create a Lambda function that calls the endpoint daily.

### Configuration

Set the following environment variables:

```env
# Required for cron jobs
CRON_SECRET=your-secure-random-string

# Email configuration (already set up)
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@marketplace.com
```

## Testing

### Test Email Verification

1. Create new account
2. Check inbox for verification email
3. Click verification link
4. Verify email status changes to verified
5. Try to submit KYC - should work
6. Try to create listing - should work

### Test KYC Review

1. Submit KYC documents as user
2. Log in as admin
3. Go to admin dashboard
4. Find pending submission
5. View documents
6. Approve or reject
7. Check user email for notification

### Test Expiry Reminders

1. As admin, manually call:
   ```
   POST /api/trpc/verificationExpiry.sendAllExpiryReminders
   {
     "input": {
       "cronSecret": "your-cron-secret",
       "daysUntilExpiry": 0  // Send to all expiring today
     }
   }
   ```

2. Check user emails for reminders

## API Reference

### Email Verification Endpoints

```typescript
// Send verification email
trpc.emailVerification.sendVerificationEmail.useMutation()

// Verify email with token
trpc.emailVerification.verifyEmail.useMutation({
  input: { token: "..." }
})

// Resend verification email
trpc.emailVerification.resendVerificationEmail.useMutation()

// Get verification status
trpc.emailVerification.getVerificationStatus.useQuery()
```

### Admin KYC Review Endpoints

```typescript
// Get pending submissions
trpc.adminKYCReview.getPendingSubmissions.useQuery()

// Get submission details
trpc.adminKYCReview.getSubmissionDetails.useQuery({
  userId: 123
})

// Approve submission
trpc.adminKYCReview.approveSubmission.useMutation({
  input: { userId: 123 }
})

// Reject submission
trpc.adminKYCReview.rejectSubmission.useMutation({
  input: { userId: 123, rejectionReason: "..." }
})

// Get all submissions (paginated)
trpc.adminKYCReview.getAllSubmissions.useQuery({
  status: "pending",
  limit: 50,
  offset: 0
})
```

### Verification Expiry Endpoints

```typescript
// Get expiring verifications (admin)
trpc.verificationExpiry.getExpiringVerifications.useQuery({
  daysUntilExpiry: 30
})

// Send reminder to specific user (admin)
trpc.verificationExpiry.sendExpiryReminder.useMutation({
  input: { userId: 123 }
})

// Send all reminders (public with secret)
trpc.verificationExpiry.sendAllExpiryReminders.useMutation({
  input: {
    cronSecret: "...",
    daysUntilExpiry: 30
  }
})
```

## Security Considerations

1. **Email Verification Tokens**
   - 32-byte random tokens (256 bits of entropy)
   - Expire after 24 hours
   - One-time use (cleared after verification)

2. **Admin Access**
   - All admin procedures require `adminProcedure`
   - Only users with `role === 'admin'` can access
   - Document URLs are S3 presigned URLs

3. **Cron Secret**
   - Required to call automated reminder endpoint
   - Should be a strong random string
   - Set via environment variable
   - Never exposed in client code

4. **Email Addresses**
   - Verified before sending emails
   - Errors handled gracefully if no email
   - All emails use SendGrid for reliability

## Troubleshooting

### Verification Email Not Received

1. Check user email address is correct
2. Check spam/junk folder
3. Verify SendGrid is configured correctly
4. Check SendGrid logs for delivery failures

### Admin Can't See KYC Submissions

1. Verify user has admin role
2. Check KYC documents were actually uploaded
3. Check database has kycSubmittedAt set
4. Check kycReviewedAt is NULL for pending

### Expiry Reminders Not Sending

1. Verify CRON_SECRET environment variable is set
2. Check cron job is actually running
3. Verify users have verificationStatus = "verified"
4. Check verificationExpiresAt is set and within 30 days
5. Check SendGrid logs for delivery failures

## Future Enhancements

1. **Bulk KYC Review** - Approve/reject multiple submissions at once
2. **KYC Templates** - Customizable document requirements per region
3. **Document OCR** - Automatic extraction of information from documents
4. **Verification Renewal Flow** - Streamlined process to renew verification
5. **Expiry Notifications** - In-app notifications in addition to email
6. **Audit Trail** - Log all KYC approvals/rejections with admin notes

## Files Modified/Created

### Created Files
- `server/routers/emailVerificationRouter.ts` - Email verification procedures
- `server/routers/adminKYCReviewRouter.ts` - Admin KYC review procedures
- `server/routers/verificationExpiryRouter.ts` - Expiry reminder procedures
- `client/src/components/EmailVerificationStatus.tsx` - Verification status component
- `client/src/components/AdminKYCReviewDashboard.tsx` - Admin review dashboard

### Modified Files
- `server/db.ts` - Added email verification helper functions
- `server/routers.ts` - Registered new routers
- `server/routers/kycRouter.ts` - Added email verification gate
- `client/src/pages/VerifyEmail.tsx` - Updated to use new router

### Database Schema (No Changes Required)
- All necessary fields already exist in users table
- kycDocuments table already exists

## Conclusion

These three features work together to create a secure and user-friendly verification system:

1. Email verification ensures users control their email
2. Admin KYC review provides manual verification option
3. Expiry reminders keep users informed about renewal

The system is designed to be flexible, secure, and easy to integrate into the existing marketplace infrastructure.
