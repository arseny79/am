import { describe, it, expect } from "vitest";

describe("KYCStatusBadge Component Logic", () => {
  // Helper function to determine effective status (mirrors component logic)
  const getEffectiveStatus = (user: {
    kycStatus?: string | null;
    kycVerified?: boolean | number | null;
    stripeIdentityVerified?: boolean | number | null;
    emailVerified?: boolean | number | null;
  }) => {
    const isKYCVerified = user.kycVerified || user.stripeIdentityVerified;
    
    if (isKYCVerified) {
      return 'verified';
    }
    
    if (user.kycStatus === 'pending') {
      return 'pending';
    }
    
    if (user.kycStatus === 'rejected') {
      return 'rejected';
    }
    
    if (!user.emailVerified) {
      return 'email_unverified';
    }
    
    return 'unverified';
  };

  describe("Status Detection", () => {
    it("should return 'verified' when kycVerified is true", () => {
      const user = { kycVerified: true, stripeIdentityVerified: false, emailVerified: true, kycStatus: 'verified' };
      expect(getEffectiveStatus(user)).toBe('verified');
    });

    it("should return 'verified' when stripeIdentityVerified is true", () => {
      const user = { kycVerified: false, stripeIdentityVerified: true, emailVerified: true, kycStatus: 'unverified' };
      expect(getEffectiveStatus(user)).toBe('verified');
    });

    it("should return 'pending' when kycStatus is pending", () => {
      const user = { kycVerified: false, stripeIdentityVerified: false, emailVerified: true, kycStatus: 'pending' };
      expect(getEffectiveStatus(user)).toBe('pending');
    });

    it("should return 'rejected' when kycStatus is rejected", () => {
      const user = { kycVerified: false, stripeIdentityVerified: false, emailVerified: true, kycStatus: 'rejected' };
      expect(getEffectiveStatus(user)).toBe('rejected');
    });

    it("should return 'email_unverified' when email is not verified", () => {
      const user = { kycVerified: false, stripeIdentityVerified: false, emailVerified: false, kycStatus: 'unverified' };
      expect(getEffectiveStatus(user)).toBe('email_unverified');
    });

    it("should return 'unverified' when email is verified but KYC is not", () => {
      const user = { kycVerified: false, stripeIdentityVerified: false, emailVerified: true, kycStatus: 'unverified' };
      expect(getEffectiveStatus(user)).toBe('unverified');
    });
  });

  describe("Badge Configuration", () => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'verified':
          return { text: 'Verified', clickable: false };
        case 'pending':
          return { text: 'Under Review', clickable: false };
        case 'rejected':
          return { text: 'Resubmit Docs', clickable: true, href: '/verify-account' };
        case 'email_unverified':
          return { text: 'Verify Email', clickable: true, href: '/settings?tab=email' };
        case 'unverified':
        default:
          return { text: 'Verify Account', clickable: true, href: '/verify-account' };
      }
    };

    it("should show 'Verified' text for verified status", () => {
      expect(getStatusConfig('verified').text).toBe('Verified');
    });

    it("should not be clickable for verified status", () => {
      expect(getStatusConfig('verified').clickable).toBe(false);
    });

    it("should not be clickable for pending status", () => {
      expect(getStatusConfig('pending').clickable).toBe(false);
    });

    it("should be clickable for rejected status", () => {
      expect(getStatusConfig('rejected').clickable).toBe(true);
    });

    it("should navigate to /verify-account for rejected status", () => {
      expect(getStatusConfig('rejected').href).toBe('/verify-account');
    });

    it("should be clickable for unverified status", () => {
      expect(getStatusConfig('unverified').clickable).toBe(true);
    });

    it("should navigate to /verify-account for unverified status", () => {
      expect(getStatusConfig('unverified').href).toBe('/verify-account');
    });

    it("should navigate to /settings?tab=email for email_unverified status", () => {
      expect(getStatusConfig('email_unverified').href).toBe('/settings?tab=email');
    });
  });
});
