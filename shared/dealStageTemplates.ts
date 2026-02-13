/**
 * Deal Stage Templates
 * 
 * Simplified action items (2-3 per stage) that guide both parties
 * through the M&A process. Each stage has clear, focused requirements.
 */

export interface ActionItemTemplate {
  title: string;
  description: string;
  assignedTo: 'buyer' | 'seller' | 'both';
  priority: 'low' | 'medium' | 'high';
  dueInDays?: number; // Days from stage entry
}

export interface DealStageTemplate {
  stage: string;
  actionItems: ActionItemTemplate[];
}

export const DEAL_STAGE_TEMPLATES: DealStageTemplate[] = [
  {
    stage: 'initial_contact',
    actionItems: [
      {
        title: 'Schedule introductory call',
        description: 'Set up a brief call to discuss the opportunity and answer initial questions',
        assignedTo: 'both',
        priority: 'high',
        dueInDays: 3
      },
      {
        title: 'Share high-level business overview',
        description: 'Provide a summary of the business model, services, and growth trajectory',
        assignedTo: 'seller',
        priority: 'medium',
        dueInDays: 5
      }
    ]
  },
  {
    stage: 'nda_signed',
    actionItems: [
      {
        title: 'Sign mutual NDA',
        description: 'Both parties must sign the non-disclosure agreement before sharing confidential information',
        assignedTo: 'both',
        priority: 'high',
        dueInDays: 2
      },
      {
        title: 'Share detailed financials',
        description: 'Provide P&L statements, balance sheets, and cash flow for the past 3 years',
        assignedTo: 'seller',
        priority: 'high',
        dueInDays: 7
      }
    ]
  },
  {
    stage: 'due_diligence',
    actionItems: [
      {
        title: 'Review financial statements',
        description: 'Analyze P&L, balance sheet, cash flow, and client contracts for accuracy',
        assignedTo: 'buyer',
        priority: 'high',
        dueInDays: 14
      },
      {
        title: 'Provide all requested documentation',
        description: 'Share SOPs, vendor agreements, employee contracts, and technical infrastructure details',
        assignedTo: 'seller',
        priority: 'high',
        dueInDays: 10
      },
      {
        title: 'Complete technical and operational review',
        description: 'Assess technology stack, security posture, and client retention metrics',
        assignedTo: 'buyer',
        priority: 'high',
        dueInDays: 21
      }
    ]
  },
  {
    stage: 'negotiation',
    actionItems: [
      {
        title: 'Submit Letter of Intent (LOI)',
        description: 'Buyer submits formal offer with proposed price, terms, and conditions',
        assignedTo: 'buyer',
        priority: 'high',
        dueInDays: 7
      },
      {
        title: 'Finalize purchase price and terms',
        description: 'Agree on final price, payment structure, and transition timeline',
        assignedTo: 'both',
        priority: 'high',
        dueInDays: 14
      }
    ]
  },
  {
    stage: 'escrow',
    actionItems: [
      {
        title: 'Initiate escrow transaction',
        description: 'Start secure escrow process and deposit funds',
        assignedTo: 'both',
        priority: 'high',
        dueInDays: 5
      },
      {
        title: 'Verify escrow funding',
        description: 'Confirm funds are securely held before proceeding with asset transfer',
        assignedTo: 'seller',
        priority: 'high',
        dueInDays: 3
      }
    ]
  },
  {
    stage: 'closing',
    actionItems: [
      {
        title: 'Sign purchase agreement',
        description: 'Execute final asset purchase agreement with all terms',
        assignedTo: 'both',
        priority: 'high',
        dueInDays: 7
      },
      {
        title: 'Transfer assets and contracts',
        description: 'Transfer client contracts, domains, digital assets, and vendor relationships to buyer',
        assignedTo: 'seller',
        priority: 'high',
        dueInDays: 14
      },
      {
        title: 'Complete knowledge transfer',
        description: 'Provide training on systems, processes, and key client relationships',
        assignedTo: 'seller',
        priority: 'high',
        dueInDays: 30
      }
    ]
  },
  {
    stage: 'closed',
    actionItems: [
      {
        title: 'Release escrow funds',
        description: 'Confirm all conditions met and authorize fund release to seller',
        assignedTo: 'both',
        priority: 'high',
        dueInDays: 1
      },
      {
        title: 'Complete post-closing transition',
        description: 'Seller provides agreed-upon transition support period',
        assignedTo: 'seller',
        priority: 'medium',
        dueInDays: 90
      }
    ]
  }
];

/**
 * Get action item templates for a specific deal stage
 */
export function getTemplateForStage(stage: string): ActionItemTemplate[] {
  const template = DEAL_STAGE_TEMPLATES.find(t => t.stage === stage);
  return template?.actionItems || [];
}

/**
 * Calculate due date based on dueInDays
 */
export function calculateDueDate(dueInDays?: number): Date | null {
  if (!dueInDays) return null;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);
  return dueDate;
}
