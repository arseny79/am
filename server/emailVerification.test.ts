import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';

// Mock SendGrid
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

describe('Email Verification Flow', () => {
  it('should have emailVerification router defined', async () => {
    // Import the router to check it exists
    const { emailVerificationRouter } = await import('./routers/emailVerificationRouter');
    expect(emailVerificationRouter).toBeDefined();
  });

  it('should have sendVerificationEmail procedure', async () => {
    const { emailVerificationRouter } = await import('./routers/emailVerificationRouter');
    // Check that the procedure exists
    expect(emailVerificationRouter._def.procedures).toHaveProperty('sendVerificationEmail');
  });

  it('should have verifyEmail procedure', async () => {
    const { emailVerificationRouter } = await import('./routers/emailVerificationRouter');
    // Check that the procedure exists
    expect(emailVerificationRouter._def.procedures).toHaveProperty('verifyEmail');
  });

  it('should generate verification URL with query parameter format', async () => {
    // The verification URL should be in the format: /verify-email?token=xxx
    // This is what the VerifyEmail.tsx page expects
    const routerContent = fs.readFileSync('./server/routers/emailVerificationRouter.ts', 'utf-8');
    
    // Check that the URL uses query parameter format (not path parameter)
    expect(routerContent).toMatch(/verify-email\?token=\$\{token\}/);
  });

  it('KYCStatusBadge should call API instead of navigating', async () => {
    // Check that KYCStatusBadge calls the API instead of navigating to /settings?tab=email
    const badgeContent = fs.readFileSync('./client/src/components/KYCStatusBadge.tsx', 'utf-8');
    
    // Should have the trpc mutation for sending verification email
    expect(badgeContent).toMatch(/trpc\.emailVerification\.sendVerificationEmail\.useMutation/);
    
    // Should NOT navigate to /settings?tab=email
    expect(badgeContent).not.toMatch(/\/settings\?tab=email/);
  });
});
