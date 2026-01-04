import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  BrokerOnboardingEmails, 
  sendBrokerOnboardingEmail,
  sendWelcomeEmail,
  sendGettingStartedEmail,
  sendBestPracticesEmail,
  sendSuccessStoriesEmail
} from "./brokerOnboardingService";

// Mock the email service
vi.mock("./emailService", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

import { sendEmail } from "./emailService";

const mockBroker = {
  id: 1,
  companyName: "Test Brokerage LLC",
  contactName: "John Doe",
  contactEmail: "john@testbrokerage.com",
};

describe("BrokerOnboardingEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Email Templates", () => {
    it("generates welcome email with correct structure", () => {
      const email = BrokerOnboardingEmails.welcome(mockBroker);
      
      expect(email.subject).toContain("Welcome");
      expect(email.subject).toContain("Approved");
      expect(email.text).toContain(mockBroker.contactName);
      expect(email.text).toContain(mockBroker.companyName);
      expect(email.text).toContain("50%");
      expect(email.html).toContain(mockBroker.contactName);
      expect(email.html).toContain(mockBroker.companyName);
      expect(email.html).toContain("broker/dashboard");
    });

    it("generates getting started email with correct structure", () => {
      const email = BrokerOnboardingEmails.gettingStarted(mockBroker);
      
      expect(email.subject).toContain("Getting Started");
      expect(email.text).toContain(mockBroker.contactName);
      expect(email.text).toContain("STEP 1");
      expect(email.text).toContain("STEP 2");
      expect(email.text).toContain("STEP 3");
      expect(email.html).toContain("Gather Client Information");
      expect(email.html).toContain("Create Your Listing");
      expect(email.html).toContain("Contract Verification");
    });

    it("generates best practices email with correct structure", () => {
      const email = BrokerOnboardingEmails.bestPractices(mockBroker);
      
      expect(email.subject).toContain("Best Practices");
      expect(email.text).toContain(mockBroker.contactName);
      expect(email.text).toContain("PRICING STRATEGY");
      expect(email.text).toContain("LISTING OPTIMIZATION");
      expect(email.text).toContain("BUYER COMMUNICATION");
      expect(email.html).toContain("Pricing Strategy");
      expect(email.html).toContain("Listing Optimization");
    });

    it("generates success stories email with correct structure", () => {
      const email = BrokerOnboardingEmails.successStories(mockBroker);
      
      expect(email.subject).toContain("Advanced Features");
      expect(email.subject).toContain("Success Stories");
      expect(email.text).toContain(mockBroker.contactName);
      expect(email.text).toContain("SUCCESS STORY");
      expect(email.text).toContain("ADVANCED FEATURES");
      expect(email.html).toContain("Success Story");
      expect(email.html).toContain("Earning Potential");
      expect(email.html).toContain("$50K+");
    });
  });

  describe("sendBrokerOnboardingEmail", () => {
    it("sends welcome email successfully", async () => {
      const result = await sendBrokerOnboardingEmail(mockBroker, "welcome");
      
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockBroker.contactEmail,
          subject: expect.stringContaining("Welcome"),
        })
      );
      expect(result).toBe(true);
    });

    it("sends getting started email successfully", async () => {
      const result = await sendBrokerOnboardingEmail(mockBroker, "gettingStarted");
      
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockBroker.contactEmail,
          subject: expect.stringContaining("Getting Started"),
        })
      );
      expect(result).toBe(true);
    });

    it("sends best practices email successfully", async () => {
      const result = await sendBrokerOnboardingEmail(mockBroker, "bestPractices");
      
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockBroker.contactEmail,
          subject: expect.stringContaining("Best Practices"),
        })
      );
      expect(result).toBe(true);
    });

    it("sends success stories email successfully", async () => {
      const result = await sendBrokerOnboardingEmail(mockBroker, "successStories");
      
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockBroker.contactEmail,
          subject: expect.stringContaining("Success Stories"),
        })
      );
      expect(result).toBe(true);
    });
  });

  describe("Individual email functions", () => {
    it("sendWelcomeEmail calls sendBrokerOnboardingEmail with welcome type", async () => {
      const result = await sendWelcomeEmail(mockBroker);
      
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockBroker.contactEmail,
          subject: expect.stringContaining("Welcome"),
        })
      );
      expect(result).toBe(true);
    });

    it("sendGettingStartedEmail calls sendBrokerOnboardingEmail with gettingStarted type", async () => {
      const result = await sendGettingStartedEmail(mockBroker);
      
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockBroker.contactEmail,
          subject: expect.stringContaining("Getting Started"),
        })
      );
      expect(result).toBe(true);
    });

    it("sendBestPracticesEmail calls sendBrokerOnboardingEmail with bestPractices type", async () => {
      const result = await sendBestPracticesEmail(mockBroker);
      
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockBroker.contactEmail,
          subject: expect.stringContaining("Best Practices"),
        })
      );
      expect(result).toBe(true);
    });

    it("sendSuccessStoriesEmail calls sendBrokerOnboardingEmail with successStories type", async () => {
      const result = await sendSuccessStoriesEmail(mockBroker);
      
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockBroker.contactEmail,
          subject: expect.stringContaining("Success Stories"),
        })
      );
      expect(result).toBe(true);
    });
  });

  describe("Email content validation", () => {
    it("all emails contain broker dashboard link", () => {
      const emailTypes = ['welcome', 'gettingStarted', 'bestPractices', 'successStories'] as const;
      
      emailTypes.forEach((type) => {
        const email = BrokerOnboardingEmails[type](mockBroker);
        expect(email.html).toContain("broker/dashboard");
      });
    });

    it("all emails contain broker contact name", () => {
      const emailTypes = ['welcome', 'gettingStarted', 'bestPractices', 'successStories'] as const;
      
      emailTypes.forEach((type) => {
        const email = BrokerOnboardingEmails[type](mockBroker);
        expect(email.text).toContain(mockBroker.contactName);
        expect(email.html).toContain(mockBroker.contactName);
      });
    });

    it("welcome email mentions company name", () => {
      const email = BrokerOnboardingEmails.welcome(mockBroker);
      expect(email.text).toContain(mockBroker.companyName);
      expect(email.html).toContain(mockBroker.companyName);
    });
  });

  describe("Error handling", () => {
    it("returns false when sendEmail fails", async () => {
      vi.mocked(sendEmail).mockResolvedValueOnce(false);
      
      const result = await sendBrokerOnboardingEmail(mockBroker, "welcome");
      
      expect(result).toBe(false);
    });
  });
});
