/**
 * MSP Service Categories and Industry Verticals
 * Human-readable labels for database enum values
 */

export const SERVICE_CATEGORIES = {
  managed_security: 'Managed Security (MSSP)',
  cloud_services: 'Cloud Services',
  infrastructure_management: 'Infrastructure Management',
  help_desk_support: 'Help Desk & Support',
  backup_disaster_recovery: 'Backup & Disaster Recovery',
  application_management: 'Application Management',
  consulting_strategy: 'IT Consulting & Strategy',
  telecommunications: 'Telecommunications',
} as const;

export const INDUSTRY_VERTICALS = {
  healthcare: 'Healthcare',
  financial_services: 'Financial Services',
  legal: 'Legal',
  education: 'Education',
  manufacturing: 'Manufacturing',
  professional_services: 'Professional Services',
  retail_ecommerce: 'Retail & E-commerce',
  nonprofit: 'Non-profit',
  government: 'Government / Public Sector',
  general_smb: 'General SMB',
} as const;

export type ServiceCategory = keyof typeof SERVICE_CATEGORIES;
export type IndustryVertical = keyof typeof INDUSTRY_VERTICALS;
