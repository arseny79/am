/**
 * Due Diligence Checklist Template
 * Default 50-item checklist for iGaming M&A due diligence
 */

export interface DueDiligenceTemplateItem {
  category: 'financial' | 'legal' | 'technical' | 'operational' | 'clients' | 'employees' | 'contracts';
  itemName: string;
  description: string;
  required: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export const DUE_DILIGENCE_TEMPLATE: DueDiligenceTemplateItem[] = [
  // Financial (12 items)
  {
    category: 'financial',
    itemName: '3-Year Profit & Loss Statements',
    description: 'Audited or reviewed P&L statements for the past 3 years',
    required: true,
    priority: 'critical',
  },
  {
    category: 'financial',
    itemName: 'Balance Sheet (Current)',
    description: 'Most recent balance sheet showing assets, liabilities, and equity',
    required: true,
    priority: 'critical',
  },
  {
    category: 'financial',
    itemName: 'Cash Flow Statements',
    description: 'Cash flow statements for the past 3 years',
    required: true,
    priority: 'high',
  },
  {
    category: 'financial',
    itemName: 'Tax Returns (3 Years)',
    description: 'Business tax returns for the past 3 years',
    required: true,
    priority: 'high',
  },
  {
    category: 'financial',
    itemName: 'Accounts Receivable Aging',
    description: 'Current AR aging report showing outstanding invoices',
    required: true,
    priority: 'high',
  },
  {
    category: 'financial',
    itemName: 'Accounts Payable Aging',
    description: 'Current AP aging report showing outstanding bills',
    required: true,
    priority: 'medium',
  },
  {
    category: 'financial',
    itemName: 'Bank Statements (6 Months)',
    description: 'Business bank statements for the past 6 months',
    required: true,
    priority: 'medium',
  },
  {
    category: 'financial',
    itemName: 'Outstanding Debt Schedule',
    description: 'List of all loans, lines of credit, and other debt obligations',
    required: true,
    priority: 'high',
  },
  {
    category: 'financial',
    itemName: 'Revenue by Service Line',
    description: 'Breakdown of revenue by product/service line (sports betting, casino, affiliate, etc.)',
    required: true,
    priority: 'medium',
  },
  {
    category: 'financial',
    itemName: 'Gross Margin Analysis',
    description: 'Gross margin by service line and overall',
    required: false,
    priority: 'medium',
  },
  {
    category: 'financial',
    itemName: 'EBITDA Calculation',
    description: 'Detailed EBITDA calculation with adjustments',
    required: true,
    priority: 'high',
  },
  {
    category: 'financial',
    itemName: 'Capital Expenditure History',
    description: 'CapEx spending for the past 3 years',
    required: false,
    priority: 'low',
  },
  
  // Clients (10 items)
  {
    category: 'clients',
    itemName: 'Complete Client List',
    description: 'List of all active clients with contact information',
    required: true,
    priority: 'critical',
  },
  {
    category: 'clients',
    itemName: 'Top 10 Clients Revenue',
    description: 'Revenue breakdown for top 10 clients',
    required: true,
    priority: 'critical',
  },
  {
    category: 'clients',
    itemName: 'Client Contracts',
    description: 'Copies of all active client service agreements',
    required: true,
    priority: 'high',
  },
  {
    category: 'clients',
    itemName: 'Client Retention Rate',
    description: 'Historical client retention metrics (past 3 years)',
    required: true,
    priority: 'high',
  },
  {
    category: 'clients',
    itemName: 'Client Churn Analysis',
    description: 'List of clients lost in past 2 years with reasons',
    required: true,
    priority: 'medium',
  },
  {
    category: 'clients',
    itemName: 'Average Contract Value',
    description: 'ACV and MRR per client statistics',
    required: true,
    priority: 'medium',
  },
  {
    category: 'clients',
    itemName: 'Client Industry Breakdown',
    description: 'Distribution of clients by industry vertical',
    required: false,
    priority: 'low',
  },
  {
    category: 'clients',
    itemName: 'Client Geographic Distribution',
    description: 'Map of client locations and service coverage areas',
    required: false,
    priority: 'low',
  },
  {
    category: 'clients',
    itemName: 'Pending Client Renewals',
    description: 'List of contracts up for renewal in next 6 months',
    required: true,
    priority: 'high',
  },
  {
    category: 'clients',
    itemName: 'Client Satisfaction Scores',
    description: 'NPS or CSAT scores if available',
    required: false,
    priority: 'low',
  },
  
  // Technical (8 items)
  {
    category: 'technical',
    itemName: 'Technology Stack Inventory',
    description: 'Complete list of all software, tools, and platforms used',
    required: true,
    priority: 'high',
  },
  {
    category: 'technical',
    itemName: 'Gaming Platform & Back-Office Details',
    description: 'Details on gaming platform, back-office CRM, and key technology licenses',
    required: true,
    priority: 'critical',
  },
  {
    category: 'technical',
    itemName: 'Software Licenses',
    description: 'List of all software licenses with costs and renewal dates',
    required: true,
    priority: 'high',
  },
  {
    category: 'technical',
    itemName: 'Hardware Inventory',
    description: 'List of owned hardware (servers, networking equipment, etc.)',
    required: true,
    priority: 'medium',
  },
  {
    category: 'technical',
    itemName: 'Security Tools & Policies',
    description: 'Cybersecurity tools, policies, and incident response procedures',
    required: true,
    priority: 'high',
  },
  {
    category: 'technical',
    itemName: 'Backup & Disaster Recovery',
    description: 'BDR solutions, policies, and testing records',
    required: true,
    priority: 'high',
  },
  {
    category: 'technical',
    itemName: 'Network Infrastructure',
    description: 'Documentation of network architecture and infrastructure',
    required: false,
    priority: 'medium',
  },
  {
    category: 'technical',
    itemName: 'IT Documentation',
    description: 'SOPs, runbooks, and technical documentation',
    required: false,
    priority: 'medium',
  },
  
  // Legal (8 items)
  {
    category: 'legal',
    itemName: 'Business Formation Documents',
    description: 'Articles of incorporation, operating agreement, bylaws',
    required: true,
    priority: 'high',
  },
  {
    category: 'legal',
    itemName: 'Business Licenses & Permits',
    description: 'All current business licenses and permits',
    required: true,
    priority: 'high',
  },
  {
    category: 'legal',
    itemName: 'Insurance Policies',
    description: 'E&O, general liability, cyber insurance, and other policies',
    required: true,
    priority: 'high',
  },
  {
    category: 'legal',
    itemName: 'Litigation History',
    description: 'Any past or pending lawsuits, claims, or disputes',
    required: true,
    priority: 'critical',
  },
  {
    category: 'legal',
    itemName: 'Intellectual Property',
    description: 'Trademarks, copyrights, patents, domain names',
    required: true,
    priority: 'medium',
  },
  {
    category: 'legal',
    itemName: 'Compliance Certifications',
    description: 'SOC 2, ISO, HIPAA, or other compliance certifications',
    required: false,
    priority: 'medium',
  },
  {
    category: 'legal',
    itemName: 'Data Privacy Policies',
    description: 'GDPR, CCPA, and other data privacy compliance documentation',
    required: true,
    priority: 'medium',
  },
  {
    category: 'legal',
    itemName: 'Regulatory Compliance',
    description: 'Evidence of compliance with industry regulations',
    required: false,
    priority: 'low',
  },
  
  // Employees (6 items)
  {
    category: 'employees',
    itemName: 'Employee Roster',
    description: 'List of all employees with roles, salaries, and hire dates',
    required: true,
    priority: 'critical',
  },
  {
    category: 'employees',
    itemName: 'Organizational Chart',
    description: 'Current org chart showing reporting structure',
    required: true,
    priority: 'high',
  },
  {
    category: 'employees',
    itemName: 'Employment Agreements',
    description: 'Copies of all employment contracts and offer letters',
    required: true,
    priority: 'high',
  },
  {
    category: 'employees',
    itemName: 'Non-Compete/NDA Agreements',
    description: 'Signed non-compete and confidentiality agreements',
    required: true,
    priority: 'high',
  },
  {
    category: 'employees',
    itemName: 'Benefits & Compensation',
    description: 'Details on health insurance, 401k, PTO, and other benefits',
    required: true,
    priority: 'medium',
  },
  {
    category: 'employees',
    itemName: 'Employee Turnover History',
    description: 'Turnover rates and reasons for departures (past 2 years)',
    required: false,
    priority: 'medium',
  },
  
  // Operational (4 items)
  {
    category: 'operational',
    itemName: 'Service Delivery Processes',
    description: 'Documentation of how services are delivered to clients',
    required: true,
    priority: 'high',
  },
  {
    category: 'operational',
    itemName: 'KPIs & Metrics',
    description: 'Key performance indicators tracked and historical data',
    required: false,
    priority: 'medium',
  },
  {
    category: 'operational',
    itemName: 'Quality Assurance Procedures',
    description: 'QA processes and customer satisfaction tracking',
    required: false,
    priority: 'low',
  },
  {
    category: 'operational',
    itemName: 'Business Continuity Plan',
    description: 'BCP and disaster recovery plans for the business',
    required: false,
    priority: 'medium',
  },
  
  // Contracts (2 items)
  {
    category: 'contracts',
    itemName: 'Vendor Agreements',
    description: 'All active vendor and supplier contracts',
    required: true,
    priority: 'high',
  },
  {
    category: 'contracts',
    itemName: 'Partnership Agreements',
    description: 'Strategic partnerships, referral agreements, etc.',
    required: false,
    priority: 'low',
  },
];

/**
 * Get category summary
 */
export function getCategorySummary() {
  const summary: Record<string, { total: number; required: number }> = {};
  
  DUE_DILIGENCE_TEMPLATE.forEach(item => {
    if (!summary[item.category]) {
      summary[item.category] = { total: 0, required: 0 };
    }
    summary[item.category].total++;
    if (item.required) {
      summary[item.category].required++;
    }
  });
  
  return summary;
}
