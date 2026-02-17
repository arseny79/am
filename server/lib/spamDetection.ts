/**
 * Spam Detection Service
 * Calculates spam scores for buyer requests based on multiple factors
 */

// Disposable email domains (common ones)
const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "throwaway.email",
  "temp-mail.org",
  "getnada.com",
  "maildrop.cc",
  "trashmail.com",
  "yopmail.com",
  "fakeinbox.com",
  "sharklasers.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.de",
  "grr.la",
  "guerrillamail.org",
  "guerrillamail.net",
];

// Spam keywords and patterns
const SPAM_KEYWORDS = [
  "buy now",
  "click here",
  "limited time",
  "act now",
  "urgent",
  "guaranteed",
  "free money",
  "make money fast",
  "work from home",
  "no risk",
  "100% free",
  "call now",
  "order now",
  "special promotion",
  "winner",
  "congratulations",
  "claim your",
  "cash bonus",
  "credit card",
  "viagra",
  "cialis",
  "pharmacy",
  "pills",
  "weight loss",
  "forex",
  "bitcoin",
  "cryptocurrency",
  "investment opportunity",
  "get rich",
  "earn extra cash",
];

export interface SpamScore {
  score: number; // 0-100
  factors: {
    keywords: number;
    disposableEmail: boolean;
    profileCompleteness: number;
    excessivePunctuation: boolean;
    suspiciousPatterns: string[];
  };
}

/**
 * Calculate spam score for a buyer request
 */
export function calculateSpamScore(data: {
  title: string;
  description: string;
  email: string;
  userName?: string | null;
  userCompanyName?: string | null;
  userPhoneNumber?: string | null;
  userLocation?: string | null;
}): SpamScore {
  let score = 0;
  const factors: SpamScore["factors"] = {
    keywords: 0,
    disposableEmail: false,
    profileCompleteness: 0,
    excessivePunctuation: false,
    suspiciousPatterns: [],
  };

  // 1. Check for spam keywords (max 40 points)
  const combinedText = `${data.title} ${data.description}`.toLowerCase();
  const keywordMatches = SPAM_KEYWORDS.filter((keyword) =>
    combinedText.includes(keyword.toLowerCase())
  );
  
  if (keywordMatches.length > 0) {
    factors.keywords = Math.min(keywordMatches.length * 10, 40);
    score += factors.keywords;
    factors.suspiciousPatterns.push(`Spam keywords: ${keywordMatches.join(", ")}`);
  }

  // 2. Check for disposable email (30 points)
  const emailDomain = data.email.split("@")[1]?.toLowerCase();
  if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    factors.disposableEmail = true;
    score += 30;
    factors.suspiciousPatterns.push(`Disposable email domain: ${emailDomain}`);
  }

  // 3. Check profile completeness (inverse score - incomplete = spam-like)
  let profileFields = 0;
  let completedFields = 0;
  
  if (data.userName !== undefined) {
    profileFields++;
    if (data.userName && data.userName.trim().length > 0) completedFields++;
  }
  if (data.userCompanyName !== undefined) {
    profileFields++;
    if (data.userCompanyName && data.userCompanyName.trim().length > 0) completedFields++;
  }
  if (data.userPhoneNumber !== undefined) {
    profileFields++;
    if (data.userPhoneNumber && data.userPhoneNumber.trim().length > 0) completedFields++;
  }
  if (data.userLocation !== undefined) {
    profileFields++;
    if (data.userLocation && data.userLocation.trim().length > 0) completedFields++;
  }

  if (profileFields > 0) {
    const completeness = (completedFields / profileFields) * 100;
    factors.profileCompleteness = Math.round(completeness);
    
    // Incomplete profile adds to spam score (max 20 points)
    const incompletenessScore = Math.round((100 - completeness) * 0.2);
    score += incompletenessScore;
    
    if (completeness < 50) {
      factors.suspiciousPatterns.push(`Incomplete profile: ${Math.round(completeness)}% complete`);
    }
  }

  // 4. Check for excessive punctuation (10 points)
  const punctuationCount = (combinedText.match(/[!?]{2,}/g) || []).length;
  if (punctuationCount >= 3) {
    factors.excessivePunctuation = true;
    score += 10;
    factors.suspiciousPatterns.push(`Excessive punctuation: ${punctuationCount} instances`);
  }

  // 5. Check for all caps (bonus spam indicator)
  const wordsInCaps = combinedText.split(/\s+/).filter((word) => {
    return word.length > 3 && word === word.toUpperCase() && /^[A-Z]+$/.test(word);
  });
  
  if (wordsInCaps.length >= 5) {
    score += 10;
    factors.suspiciousPatterns.push(`Excessive caps: ${wordsInCaps.length} words in all caps`);
  }

  // 6. Check for very short or very long descriptions (suspicious)
  if (data.description.length < 100) {
    score += 5;
    factors.suspiciousPatterns.push(`Very short description: ${data.description.length} characters`);
  } else if (data.description.length > 5000) {
    score += 5;
    factors.suspiciousPatterns.push(`Unusually long description: ${data.description.length} characters`);
  }

  // Cap the score at 100
  score = Math.min(score, 100);

  return {
    score: Math.round(score),
    factors,
  };
}

/**
 * Get spam level category based on score
 */
export function getSpamLevel(score: number): "low" | "medium" | "high" {
  if (score <= 30) return "low";
  if (score <= 70) return "medium";
  return "high";
}

/**
 * Get color for spam level
 */
export function getSpamLevelColor(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "green";
    case "medium":
      return "yellow";
    case "high":
      return "red";
  }
}

/**
 * Get emoji indicator for spam level
 */
export function getSpamLevelEmoji(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "🟢";
    case "medium":
      return "🟡";
    case "high":
      return "🔴";
  }
}

/**
 * Check if request should be auto-flagged
 */
export function shouldAutoFlag(score: number): boolean {
  return score >= 70;
}
