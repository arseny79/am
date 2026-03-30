/**
 * Preparation Checklist - Default items for iGaming business sales packet preparation
 * These items are automatically created when a seller starts preparing a listing
 */

export type ChecklistCategory = 'financial' | 'clients' | 'technical' | 'operational' | 'legal';

export interface ChecklistItemDefinition {
  category: ChecklistCategory;
  itemName: string;
  description: string;
  required: boolean;
  recommended: boolean;
  templateFileName?: string;
  hasTemplate: boolean;
}

/**
 * Default checklist items for iGaming business sales packet preparation
 * 
 * Scoring weights:
 * - Required items: 60% of readiness score
 * - Recommended items: 30% of readiness score
 * - Nice-to-have items: 10% of readiness score
 */
export const DEFAULT_CHECKLIST_ITEMS: ChecklistItemDefinition[] = [
  // FINANCIAL (Required: 60% weight)
  {
    category: 'financial',
    itemName: '3-Year Profit & Loss Statements',
    description: 'Income statements for the past 3 years showing revenue, expenses, and profitability trends.',
    required: true,
    recommended: false,
    templateFileName: 'financial-statement-template.xlsx',
    hasTemplate: true,
  },
  {
    category: 'financial',
    itemName: 'Balance Sheet (Most Recent)',
    description: 'Current balance sheet showing assets, liabilities, and owner equity.',
    required: true,
    recommended: false,
    templateFileName: 'financial-statement-template.xlsx',
    hasTemplate: true,
  },
  {
    category: 'financial',
    itemName: 'Adjusted EBITDA Calculation',
    description: 'EBITDA calculation with add-backs for owner salary, benefits, and one-time expenses.',
    required: true,
    recommended: false,
    templateFileName: 'financial-statement-template.xlsx',
    hasTemplate: true,
  },
  {
    category: 'financial',
    itemName: 'Tax Returns (3 Years)',
    description: 'Business tax returns for the past 3 years to verify reported income.',
    required: true,
    recommended: false,
    hasTemplate: false,
  },
  
  // CLIENTS (Required: 60% weight)
  {
    category: 'clients',
    itemName: 'Complete Client List with MRR',
    description: 'List of all active clients with monthly recurring revenue for each.',
    required: true,
    recommended: false,
    templateFileName: 'client-list-template.xlsx',
    hasTemplate: true,
  },
  {
    category: 'clients',
    itemName: 'Client Contract Terms Summary',
    description: 'Summary of contract types (annual, month-to-month), renewal dates, and terms.',
    required: true,
    recommended: false,
    templateFileName: 'client-list-template.xlsx',
    hasTemplate: true,
  },
  {
    category: 'clients',
    itemName: 'Client Retention Metrics',
    description: 'Historical client retention rate, churn rate, and average client lifetime.',
    required: false,
    recommended: true,
    hasTemplate: false,
  },
  
  // TECHNICAL (Required: 60% weight)
  {
    category: 'technical',
    itemName: 'Complete Tech Stack Inventory',
    description: 'List of all software tools, platforms, and licenses used (gaming platform, back-office, payments, KYC, etc.).',
    required: true,
    recommended: false,
    templateFileName: 'tech-stack-inventory-template.xlsx',
    hasTemplate: true,
  },
  {
    category: 'technical',
    itemName: 'Vendor Contract Details',
    description: 'Details of all vendor relationships, contracts, pricing, and transferability.',
    required: true,
    recommended: false,
    templateFileName: 'vendor-contract-summary-template.xlsx',
    hasTemplate: true,
  },
  {
    category: 'technical',
    itemName: 'Network & Infrastructure Documentation',
    description: 'Documentation of your own network infrastructure, servers, and systems.',
    required: false,
    recommended: true,
    hasTemplate: false,
  },
  
  // OPERATIONAL (Recommended: 30% weight)
  {
    category: 'operational',
    itemName: 'Organizational Chart',
    description: 'Organization structure showing roles, responsibilities, and reporting relationships.',
    required: false,
    recommended: true,
    hasTemplate: false,
  },
  {
    category: 'operational',
    itemName: 'Employee Information Summary',
    description: 'Summary of employees, roles, tenure, and compensation (can be anonymized initially).',
    required: false,
    recommended: true,
    templateFileName: 'employee-information-template.xlsx',
    hasTemplate: true,
  },
  {
    category: 'operational',
    itemName: 'Standard Operating Procedures (SOPs)',
    description: 'Documentation of key processes, workflows, and standard procedures.',
    required: false,
    recommended: true,
    hasTemplate: false,
  },
  {
    category: 'operational',
    itemName: 'Asset List',
    description: 'List of owned equipment, vehicles, and other physical assets included in the sale.',
    required: false,
    recommended: true,
    templateFileName: 'asset-list-template.xlsx',
    hasTemplate: true,
  },
  
  // LEGAL (Recommended: 30% weight)
  {
    category: 'legal',
    itemName: 'Business Formation Documents',
    description: 'Articles of incorporation, operating agreement, or partnership agreement.',
    required: false,
    recommended: true,
    hasTemplate: false,
  },
  {
    category: 'legal',
    itemName: 'Master Service Agreement (MSA) Template',
    description: 'Standard client contract template used for new engagements.',
    required: false,
    recommended: true,
    hasTemplate: false,
  },
  {
    category: 'legal',
    itemName: 'Insurance Policies',
    description: 'Current insurance policies (general liability, E&O, cyber liability, etc.).',
    required: false,
    recommended: true,
    hasTemplate: false,
  },
  {
    category: 'legal',
    itemName: 'Intellectual Property Documentation',
    description: 'Documentation of any trademarks, copyrights, or proprietary tools/scripts.',
    required: false,
    recommended: false, // Nice-to-have: 10% weight
    hasTemplate: false,
  },
  {
    category: 'legal',
    itemName: 'Litigation History',
    description: 'Disclosure of any past or current legal disputes, lawsuits, or claims.',
    required: false,
    recommended: false, // Nice-to-have: 10% weight
    hasTemplate: false,
  },
];

/**
 * Calculate readiness score based on completed checklist items
 * 
 * Scoring:
 * - Required items: 60% weight
 * - Recommended items: 30% weight
 * - Nice-to-have items: 10% weight
 * 
 * @param items - Array of checklist items with completion status
 * @returns Readiness score from 0-100
 */
export function calculateReadinessScore(items: Array<{ required: number | boolean; recommended: number | boolean; completed: number | boolean }>): number {
  const requiredItems = items.filter(i => i.required === 1 || i.required === true);
  const recommendedItems = items.filter(i => (i.required === 0 || i.required === false) && (i.recommended === 1 || i.recommended === true));
  const niceToHaveItems = items.filter(i => (i.required === 0 || i.required === false) && (i.recommended === 0 || i.recommended === false));
  
  const completedRequired = requiredItems.filter(i => i.completed === 1 || i.completed === true).length;
  const completedRecommended = recommendedItems.filter(i => i.completed === 1 || i.completed === true).length;
  const completedNiceToHave = niceToHaveItems.filter(i => i.completed === 1 || i.completed === true).length;
  
  const requiredScore = requiredItems.length > 0 ? (completedRequired / requiredItems.length) * 60 : 60;
  const recommendedScore = recommendedItems.length > 0 ? (completedRecommended / recommendedItems.length) * 30 : 30;
  const niceToHaveScore = niceToHaveItems.length > 0 ? (completedNiceToHave / niceToHaveItems.length) * 10 : 10;
  
  return Math.round(requiredScore + recommendedScore + niceToHaveScore);
}

/**
 * Get readiness level description based on score
 */
export function getReadinessLevel(score: number): {
  level: 'not_started' | 'getting_started' | 'in_progress' | 'almost_ready' | 'ready';
  label: string;
  color: string;
  description: string;
} {
  if (score === 0) {
    return {
      level: 'not_started',
      label: 'Not Started',
      color: 'gray',
      description: 'You haven\'t started preparing your sales packet yet. Let\'s get started!',
    };
  } else if (score < 30) {
    return {
      level: 'getting_started',
      label: 'Getting Started',
      color: 'red',
      description: 'You\'ve made a start, but there\'s still a lot of work to do. Focus on required items first.',
    };
  } else if (score < 60) {
    return {
      level: 'in_progress',
      label: 'In Progress',
      color: 'orange',
      description: 'You\'re making good progress! Complete the remaining required items to improve your readiness.',
    };
  } else if (score < 85) {
    return {
      level: 'almost_ready',
      label: 'Almost Ready',
      color: 'yellow',
      description: 'You\'re almost there! Add recommended items to make your listing more attractive to buyers.',
    };
  } else {
    return {
      level: 'ready',
      label: 'Ready to List',
      color: 'green',
      description: 'Excellent! Your sales packet is comprehensive and professional. You\'re ready to publish your listing.',
    };
  }
}

/**
 * Get category display information
 */
export function getCategoryInfo(category: ChecklistCategory): {
  label: string;
  icon: string;
  description: string;
} {
  const categoryMap = {
    financial: {
      label: 'Financial Information',
      icon: '💰',
      description: 'Financial statements, tax returns, and profitability metrics',
    },
    clients: {
      label: 'Client Portfolio',
      icon: '👥',
      description: 'Client list, contracts, and retention metrics',
    },
    technical: {
      label: 'Technical Infrastructure',
      icon: '🔧',
      description: 'Tech stack, vendor relationships, and infrastructure documentation',
    },
    operational: {
      label: 'Operations & Team',
      icon: '⚙️',
      description: 'Organizational structure, employees, and standard procedures',
    },
    legal: {
      label: 'Legal & Compliance',
      icon: '⚖️',
      description: 'Business formation, contracts, insurance, and intellectual property',
    },
  };
  
  return categoryMap[category];
}
