import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

const architectInputSchema = z.object({
  role: z.enum(["buyer", "seller"]),
  businessType: z.string().min(1).max(200),
  annualRevenue: z.number().positive(),
  employeeCount: z.number().int().positive(),
  yearsInBusiness: z.number().int().positive(),
  location: z.string().min(1).max(200),
  primaryGoal: z.string().min(1).max(500),
  timeline: z.enum(["3_months", "6_months", "12_months", "18_months", "flexible"]),
  budget: z.string().optional(),
  additionalContext: z.string().max(1000).optional(),
});

export const architectRouter = router({
  generate: protectedProcedure
    .input(architectInputSchema)
    .mutation(async ({ input }) => {
      const timelineLabel: Record<typeof input.timeline, string> = {
        "3_months": "3 months",
        "6_months": "6 months",
        "12_months": "12 months",
        "18_months": "18 months",
        "flexible": "flexible / no fixed deadline",
      };

      const systemPrompt = `You are an expert M&A advisor specializing in MSP (Managed Service Provider) acquisitions and sales.
You help clients architect comprehensive deal plans tailored to their specific situation.
Your output should be practical, actionable, and specific to the MSP industry.
Format your response in clean markdown with clear sections and bullet points.`;

      const userPrompt = `Please create a comprehensive MSP M&A deal architecture plan for the following situation:

**Role:** ${input.role === "buyer" ? "Buyer (looking to acquire an MSP)" : "Seller (looking to sell their MSP)"}
**Business Type:** ${input.businessType}
**Annual Revenue:** $${input.annualRevenue.toLocaleString()}
**Employee Count:** ${input.employeeCount}
**Years in Business:** ${input.yearsInBusiness}
**Location:** ${input.location}
**Primary Goal:** ${input.primaryGoal}
**Target Timeline:** ${timelineLabel[input.timeline]}
${input.budget ? `**Budget / Price Expectation:** ${input.budget}` : ""}
${input.additionalContext ? `**Additional Context:** ${input.additionalContext}` : ""}

Please provide a structured deal architecture plan with the following sections:

## 1. Situation Assessment
Analyze the current position and readiness for this transaction.

## 2. Deal Structure Recommendation
Recommend the optimal deal structure (asset sale vs. stock sale, earnout provisions, seller financing, etc.) with rationale.

## 3. Valuation Framework
Provide a valuation range and the key multiples/metrics relevant to this situation.

## 4. Transaction Roadmap
A step-by-step timeline broken into phases with specific milestones.

## 5. Key Preparation Steps
The most critical things to do right now to maximize deal success.

## 6. Risk Factors & Mitigation
Top 3–5 risks for this transaction and how to address them.

## 7. Professional Team Requirements
Which advisors, lawyers, and specialists are needed and when to engage them.

## 8. Next Immediate Actions
3–5 concrete next steps to take within the next 30 days.`;

      let result;
      try {
        result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          maxTokens: 4096,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate deal architecture. Please try again.",
        });
      }

      const content = result.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected response from AI. Please try again.",
        });
      }

      return { plan: content };
    }),
});
