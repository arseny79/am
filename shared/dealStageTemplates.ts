/**
 * Deal Stage Templates
 * 
 * Pre-configured action items that are automatically created when a deal
 * reaches a specific stage. This helps guide both parties through the M&A process.
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
      },
      {
        title: 'Share client list and contracts',
        description: 'Provide anonymized client list with contract values and renewal dates',
        assignedTo: 'seller',
        priority: 'medium',
        dueInDays: 7
      }
    ]
  },
  {
    stage: 'due_diligence',
    actionItems: [
      {
        title: 'Review financial statements',
        description: 'Analyze P&L, balance sheet, and cash flow statements for accuracy',
        assignedTo: 'buyer',
        priority: 'high',
        dueInDays: 14
      },
      {
        title: 'Conduct technical infrastructure review',
        description: 'Assess technology stack, security posture, and operational processes',
        assignedTo: 'buyer',
        priority: 'high',
        dueInDays: 14
      },
      {
        title: 'Verify client contracts and retention',
        description: 'Review client agreements, churn rates, and revenue stability',
        assignedTo: 'buyer',
        priority: 'high',
        dueInDays: 14
      },
      {
        title: 'Provide access to documentation',
        description: 'Share SOPs, runbooks, vendor agreements, and employee contracts',
        assignedTo: 'seller',
        priority: 'medium',
        dueInDays: 10
      },
      {
        title: 'Schedule site visit or virtual tour',
        description: 'Arrange for buyer to meet team and see operations firsthand',
        assignedTo: 'both',
        priority: 'medium',
        dueInDays: 21
      }
    ]
  },
  {
    stage: 'negotiation',
    actionItems: [
      {
        title: 'Submit letter of intent (LOI)',
        description: 'Buyer submits formal offer with proposed terms and conditions',
        assignedTo: 'buyer',
        priority: 'high',
        dueInDays: 7
      },
      {
        title: 'Review and counter LOI',
        description: 'Seller reviews offer and proposes any changes to terms',
        assignedTo: 'seller',
        priority: 'high',
        dueInDays: 5
      },
      {
        title: 'Finalize purchase price and terms',
        description: 'Agree on final price, payment structure, and transition timeline',
        assignedTo: 'both',
        priority: 'high',
        dueInDays: 14
      },
      {
        title: 'Engage legal counsel',
        description: 'Both parties should have attorneys review the agreement',
        assignedTo: 'both',
        priority: 'medium',
        dueInDays: 7
      }
    ]
  },
  {
    stage: 'escrow',
    actionItems: [
      {
        title: 'Initiate Escrow.com transaction',
        description: 'Start secure escrow process to hold funds during closing',
        assignedTo: 'both',
        priority: 'high',
        dueInDays: 3
      },
      {
        title: 'Fund escrow account',
        description: 'Buyer deposits purchase price into Escrow.com account',
        assignedTo: 'buyer',
        priority: 'high',
        dueInDays: 5
      },
      {
        title: 'Verify escrow funding',
        description: 'Confirm funds are securely held before proceeding with asset transfer',
        assignedTo: 'seller',
        priority: 'high',
        dueInDays: 1
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
        title: 'Transfer client contracts',
        description: 'Notify clients and transfer service agreements to new owner',
        assignedTo: 'seller',
        priority: 'high',
        dueInDays: 14
      },
      {
        title: 'Transfer domain and digital assets',
        description: 'Transfer website, email, social media, and other digital properties',
        assignedTo: 'seller',
        priority: 'high',
        dueInDays: 10
      },
      {
        title: 'Transition employees',
        description: 'Introduce new owner and facilitate employee onboarding',
        assignedTo: 'both',
        priority: 'medium',
        dueInDays: 14
      },
      {
        title: 'Transfer vendor relationships',
        description: 'Introduce buyer to key vendors and update account ownership',
        assignedTo: 'seller',
        priority: 'medium',
        dueInDays: 14
      },
      {
        title: 'Complete knowledge transfer',
        description: 'Provide training on systems, processes, and client relationships',
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
      },
      {
        title: 'Update business registrations',
        description: 'File necessary paperwork with state and federal agencies',
        assignedTo: 'buyer',
        priority: 'medium',
        dueInDays: 30
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
