import { describe, expect, it } from "vitest";
import {
  calculateSpamScore,
  getSpamLevel,
  getSpamLevelEmoji,
  shouldAutoFlag,
} from "./lib/spamDetection";

describe("Spam Detection", () => {
  describe("calculateSpamScore", () => {
    it("detects spam keywords", () => {
      const result = calculateSpamScore({
        title: "BUY NOW - Limited Time Offer!",
        description: "Click here to get rich quick! This is a guaranteed investment opportunity with no risk. Act now!",
        email: "user@example.com",
      });

      expect(result.score).toBeGreaterThan(0);
      expect(result.factors.keywords).toBeGreaterThan(0);
      expect(result.factors.suspiciousPatterns.length).toBeGreaterThan(0);
    });

    it("detects disposable email domains", () => {
      const result = calculateSpamScore({
        title: "Looking for MSP business",
        description: "I am interested in acquiring an MSP business with strong technical capabilities and good client retention rates.",
        email: "test@tempmail.com",
      });

      expect(result.factors.disposableEmail).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.factors.suspiciousPatterns).toContain("Disposable email domain: tempmail.com");
    });

    it("penalizes incomplete profiles", () => {
      const completeProfile = calculateSpamScore({
        title: "Seeking MSP in California",
        description: "Looking for an established MSP with strong cloud services and cybersecurity offerings in the California market.",
        email: "buyer@company.com",
        userName: "John Doe",
        userCompanyName: "Acme Corp",
        userPhoneNumber: "+1234567890",
        userLocation: "San Francisco, CA",
      });

      const incompleteProfile = calculateSpamScore({
        title: "Seeking MSP in California",
        description: "Looking for an established MSP with strong cloud services and cybersecurity offerings in the California market.",
        email: "buyer@company.com",
        userName: null,
        userCompanyName: null,
        userPhoneNumber: null,
        userLocation: null,
      });

      expect(incompleteProfile.score).toBeGreaterThan(completeProfile.score);
      expect(incompleteProfile.factors.profileCompleteness).toBeLessThan(50);
    });

    it("detects excessive punctuation", () => {
      const result = calculateSpamScore({
        title: "URGENT!!! BUY NOW!!!",
        description: "This is amazing!!! Don't miss out!!! Limited time only!!! Act fast!!! Guaranteed results!!!",
        email: "user@example.com",
      });

      expect(result.factors.excessivePunctuation).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it("detects all caps words", () => {
      const result = calculateSpamScore({
        title: "AMAZING OPPORTUNITY FOR BUYERS",
        description: "THIS IS THE BEST DEAL YOU WILL EVER FIND IN THE MSP MARKET TODAY",
        email: "user@example.com",
      });

      expect(result.score).toBeGreaterThan(0);
    });

    it("penalizes very short descriptions", () => {
      const result = calculateSpamScore({
        title: "Looking for MSP",
        description: "Want to buy MSP business. Good price. Contact me.",
        email: "user@example.com",
      });

      expect(result.score).toBeGreaterThan(0);
      expect(result.factors.suspiciousPatterns.some((p) => p.includes("Very short description"))).toBe(true);
    });

    it("returns low score for legitimate request", () => {
      const result = calculateSpamScore({
        title: "Seeking MSP in Texas with $1M+ revenue",
        description: "I am a private equity investor looking to acquire an established MSP business in the Texas market. Ideally seeking a company with annual revenue between $1-5M, strong EBITDA margins, and a diverse client base. Must have expertise in cloud services and cybersecurity. I have capital ready and can close within 90 days.",
        email: "investor@legitimatepe.com",
        userName: "Jane Smith",
        userCompanyName: "Smith Capital Partners",
        userPhoneNumber: "+1-555-123-4567",
        userLocation: "Dallas, TX",
      });

      expect(result.score).toBeLessThanOrEqual(30);
      expect(result.factors.disposableEmail).toBe(false);
      expect(result.factors.keywords).toBe(0);
      expect(result.factors.profileCompleteness).toBe(100);
    });

    it("caps score at 100", () => {
      const result = calculateSpamScore({
        title: "BUY NOW!!! CLICK HERE!!! LIMITED TIME!!!",
        description: "URGENT!!! GUARANTEED!!! FREE MONEY!!! MAKE MONEY FAST!!! WORK FROM HOME!!! NO RISK!!! 100% FREE!!! CALL NOW!!! ORDER NOW!!! SPECIAL PROMOTION!!! WINNER!!! CONGRATULATIONS!!! CLAIM YOUR CASH BONUS!!! VIAGRA!!! CIALIS!!! PHARMACY!!! PILLS!!! WEIGHT LOSS!!! FOREX!!! BITCOIN!!! CRYPTOCURRENCY!!! INVESTMENT OPPORTUNITY!!! GET RICH!!! EARN EXTRA CASH!!!",
        email: "spam@tempmail.com",
      });

      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe("getSpamLevel", () => {
    it("returns low for score 0-30", () => {
      expect(getSpamLevel(0)).toBe("low");
      expect(getSpamLevel(15)).toBe("low");
      expect(getSpamLevel(30)).toBe("low");
    });

    it("returns medium for score 31-70", () => {
      expect(getSpamLevel(31)).toBe("medium");
      expect(getSpamLevel(50)).toBe("medium");
      expect(getSpamLevel(70)).toBe("medium");
    });

    it("returns high for score 71-100", () => {
      expect(getSpamLevel(71)).toBe("high");
      expect(getSpamLevel(85)).toBe("high");
      expect(getSpamLevel(100)).toBe("high");
    });
  });

  describe("getSpamLevelEmoji", () => {
    it("returns correct emojis", () => {
      expect(getSpamLevelEmoji("low")).toBe("🟢");
      expect(getSpamLevelEmoji("medium")).toBe("🟡");
      expect(getSpamLevelEmoji("high")).toBe("🔴");
    });
  });

  describe("shouldAutoFlag", () => {
    it("auto-flags scores >= 70", () => {
      expect(shouldAutoFlag(70)).toBe(true);
      expect(shouldAutoFlag(85)).toBe(true);
      expect(shouldAutoFlag(100)).toBe(true);
    });

    it("does not auto-flag scores < 70", () => {
      expect(shouldAutoFlag(0)).toBe(false);
      expect(shouldAutoFlag(30)).toBe(false);
      expect(shouldAutoFlag(69)).toBe(false);
    });
  });
});
