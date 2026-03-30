/**
 * Script to generate professional Excel templates for iGaming business sales packet preparation
 * Run with: pnpm tsx server/templates/generateTemplates.ts
 */

import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to style instruction sheets
function styleInstructionSheet(worksheet: ExcelJS.Worksheet) {
  // Header row styling
  worksheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' } // Blue
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;
}

// Helper function to style data sheets
function styleDataSheet(worksheet: ExcelJS.Worksheet, headerRow: number = 1) {
  const row = worksheet.getRow(headerRow);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' } // Green
  };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.height = 25;
}

async function generateFinancialStatementTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // Instructions Sheet
  const instructions = workbook.addWorksheet('Instructions');
  instructions.getColumn(1).width = 80;
  
  instructions.addRow(['iGaming Financial Statement Template - Instructions']);
  styleInstructionSheet(instructions);
  
  instructions.addRow([]);
  instructions.addRow(['What to Include:']);
  instructions.getCell('A3').font = { bold: true, size: 12 };
  instructions.addRow(['• 3 years of Profit & Loss (Income) Statements']);
  instructions.addRow(['• Balance Sheet (most recent)']);
  instructions.addRow(['• Cash Flow Statement (most recent)']);
  instructions.addRow(['• Adjusted EBITDA calculation']);
  instructions.addRow([]);
  instructions.addRow(['Why This Matters:']);
  instructions.getCell('A9').font = { bold: true, size: 12 };
  instructions.addRow(['Buyers need to understand your financial performance, profitability trends, and cash generation.']);
  instructions.addRow(['Accurate financial data is the foundation of valuation and due diligence.']);
  instructions.addRow([]);
  instructions.addRow(['Common Mistakes to Avoid:']);
  instructions.getCell('A13').font = { bold: true, size: 12 };
  instructions.addRow(['✗ Missing or incomplete years']);
  instructions.addRow(['✗ Inconsistent accounting methods']);
  instructions.addRow(['✗ Not adjusting for owner salary/benefits']);
  instructions.addRow(['✗ Mixing personal and business expenses']);
  
  // Income Statement Sheet
  const income = workbook.addWorksheet('Income Statement (P&L)');
  income.addRow(['', 'Year 1', 'Year 2', 'Year 3 (Most Recent)']);
  styleDataSheet(income);
  
  income.getColumn(1).width = 35;
  income.getColumn(2).width = 18;
  income.getColumn(3).width = 18;
  income.getColumn(4).width = 25;
  
  // Revenue section
  income.addRow(['REVENUE', '', '', '']);
  income.getCell('A2').font = { bold: true };
  income.addRow(['Recurring Revenue (MRR × 12)', '', '', '']);
  income.addRow(['Project/One-time Revenue', '', '', '']);
  income.addRow(['Hardware Sales', '', '', '']);
  income.addRow(['Other Revenue', '', '', '']);
  income.addRow(['Total Revenue', '=SUM(B3:B6)', '=SUM(C3:C6)', '=SUM(D3:D6)']);
  income.getCell('A7').font = { bold: true };
  
  income.addRow([]);
  
  // Cost of Goods Sold
  income.addRow(['COST OF GOODS SOLD', '', '', '']);
  income.getCell('A9').font = { bold: true };
  income.addRow(['Software Licenses & Tools', '', '', '']);
  income.addRow(['Hardware Costs', '', '', '']);
  income.addRow(['Subcontractors', '', '', '']);
  income.addRow(['Direct Labor', '', '', '']);
  income.addRow(['Total COGS', '=SUM(B10:B13)', '=SUM(C10:C13)', '=SUM(D10:D13)']);
  income.getCell('A14').font = { bold: true };
  
  income.addRow([]);
  income.addRow(['GROSS PROFIT', '=B7-B14', '=C7-C14', '=D7-D14']);
  income.getCell('A16').font = { bold: true, color: { argb: 'FF059669' } };
  
  income.addRow([]);
  
  // Operating Expenses
  income.addRow(['OPERATING EXPENSES', '', '', '']);
  income.getCell('A18').font = { bold: true };
  income.addRow(['Salaries & Wages', '', '', '']);
  income.addRow(['Benefits & Payroll Taxes', '', '', '']);
  income.addRow(['Rent & Utilities', '', '', '']);
  income.addRow(['Marketing & Sales', '', '', '']);
  income.addRow(['Insurance', '', '', '']);
  income.addRow(['Professional Fees (Legal, Accounting)', '', '', '']);
  income.addRow(['Office Supplies & Equipment', '', '', '']);
  income.addRow(['Travel & Entertainment', '', '', '']);
  income.addRow(['Other Operating Expenses', '', '', '']);
  income.addRow(['Total Operating Expenses', '=SUM(B19:B27)', '=SUM(C19:C27)', '=SUM(D19:D27)']);
  income.getCell('A28').font = { bold: true };
  
  income.addRow([]);
  income.addRow(['EBITDA (Before Adjustments)', '=B16-B28', '=C16-C28', '=D16-D28']);
  income.getCell('A30').font = { bold: true, color: { argb: 'FF2563EB' } };
  
  income.addRow([]);
  income.addRow(['ADJUSTMENTS (Add-backs)', '', '', '']);
  income.getCell('A32').font = { bold: true };
  income.addRow(['Owner Salary (above market rate)', '', '', '']);
  income.addRow(['Owner Benefits & Perks', '', '', '']);
  income.addRow(['One-time Expenses', '', '', '']);
  income.addRow(['Personal Expenses', '', '', '']);
  income.addRow(['Total Adjustments', '=SUM(B33:B36)', '=SUM(C33:C36)', '=SUM(D33:D36)']);
  income.getCell('A37').font = { bold: true };
  
  income.addRow([]);
  income.addRow(['ADJUSTED EBITDA', '=B30+B37', '=C30+C37', '=D30+D37']);
  income.getCell('A39').font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
  income.getRow(39).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' } // Light yellow highlight
  };
  
  // Format all number cells as currency
  for (let row = 3; row <= 39; row++) {
    for (let col = 2; col <= 4; col++) {
      const cell = income.getCell(row, col);
      cell.numFmt = '$#,##0;[Red]-$#,##0';
    }
  }
  
  // Balance Sheet
  const balance = workbook.addWorksheet('Balance Sheet');
  balance.addRow(['', 'Amount']);
  styleDataSheet(balance);
  
  balance.getColumn(1).width = 35;
  balance.getColumn(2).width = 20;
  
  balance.addRow(['ASSETS', '']);
  balance.getCell('A2').font = { bold: true };
  balance.addRow(['Current Assets:', '']);
  balance.addRow(['  Cash & Cash Equivalents', '']);
  balance.addRow(['  Accounts Receivable', '']);
  balance.addRow(['  Prepaid Expenses', '']);
  balance.addRow(['  Total Current Assets', '=SUM(B4:B6)']);
  balance.getCell('A7').font = { bold: true };
  
  balance.addRow([]);
  balance.addRow(['Fixed Assets:', '']);
  balance.addRow(['  Equipment & Hardware', '']);
  balance.addRow(['  Software & Licenses', '']);
  balance.addRow(['  Less: Accumulated Depreciation', '']);
  balance.addRow(['  Total Fixed Assets', '=SUM(B10:B12)']);
  balance.getCell('A13').font = { bold: true };
  
  balance.addRow([]);
  balance.addRow(['TOTAL ASSETS', '=B7+B13']);
  balance.getCell('A15').font = { bold: true, color: { argb: 'FF059669' } };
  
  balance.addRow([]);
  balance.addRow(['LIABILITIES', '']);
  balance.getCell('A17').font = { bold: true };
  balance.addRow(['Current Liabilities:', '']);
  balance.addRow(['  Accounts Payable', '']);
  balance.addRow(['  Accrued Expenses', '']);
  balance.addRow(['  Deferred Revenue', '']);
  balance.addRow(['  Current Portion of Long-term Debt', '']);
  balance.addRow(['  Total Current Liabilities', '=SUM(B19:B22)']);
  balance.getCell('A23').font = { bold: true };
  
  balance.addRow([]);
  balance.addRow(['Long-term Liabilities:', '']);
  balance.addRow(['  Long-term Debt', '']);
  balance.addRow(['  Total Long-term Liabilities', '=B26']);
  balance.getCell('A27').font = { bold: true };
  
  balance.addRow([]);
  balance.addRow(['TOTAL LIABILITIES', '=B23+B27']);
  balance.getCell('A29').font = { bold: true, color: { argb: 'FFDC2626' } };
  
  balance.addRow([]);
  balance.addRow(['OWNER EQUITY', '=B15-B29']);
  balance.getCell('A31').font = { bold: true, color: { argb: 'FF2563EB' } };
  
  // Format as currency
  for (let row = 4; row <= 31; row++) {
    balance.getCell(row, 2).numFmt = '$#,##0;[Red]-$#,##0';
  }
  
  await workbook.xlsx.writeFile(path.join(__dirname, 'financial-statement-template.xlsx'));
  console.log('✓ Generated: financial-statement-template.xlsx');
}

async function generateClientListTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // Instructions
  const instructions = workbook.addWorksheet('Instructions');
  instructions.getColumn(1).width = 80;
  
  instructions.addRow(['iGaming Client List Template - Instructions']);
  styleInstructionSheet(instructions);
  
  instructions.addRow([]);
  instructions.addRow(['What to Include:']);
  instructions.getCell('A3').font = { bold: true, size: 12 };
  instructions.addRow(['• Complete list of all active clients']);
  instructions.addRow(['• Monthly Recurring Revenue (MRR) per client']);
  instructions.addRow(['• Contract terms and renewal dates']);
  instructions.addRow(['• Industry vertical for each client']);
  instructions.addRow(['• Client tenure (how long they\'ve been a client)']);
  instructions.addRow([]);
  instructions.addRow(['Why This Matters:']);
  instructions.getCell('A10').font = { bold: true, size: 12 };
  instructions.addRow(['Buyers assess client concentration risk, contract quality, and revenue stability.']);
  instructions.addRow(['Client diversity and long-term contracts increase valuation.']);
  instructions.addRow([]);
  instructions.addRow(['Privacy Note:']);
  instructions.getCell('A14').font = { bold: true, size: 12 };
  instructions.addRow(['You can use "Client A", "Client B" instead of real names during initial discussions.']);
  instructions.addRow(['Full client names will be required during due diligence after NDA is signed.']);
  
  // Client List
  const clients = workbook.addWorksheet('Client List');
  clients.addRow([
    'Client Name',
    'Industry',
    'Monthly Recurring Revenue (MRR)',
    'Contract Type',
    'Contract Start Date',
    'Contract End Date',
    'Auto-Renewal?',
    'Client Since',
    'Number of Users/Endpoints',
    'Services Provided',
    'Notes'
  ]);
  styleDataSheet(clients);
  
  clients.getColumn(1).width = 25;
  clients.getColumn(2).width = 20;
  clients.getColumn(3).width = 28;
  clients.getColumn(4).width = 18;
  clients.getColumn(5).width = 20;
  clients.getColumn(6).width = 20;
  clients.getColumn(7).width = 15;
  clients.getColumn(8).width = 15;
  clients.getColumn(9).width = 25;
  clients.getColumn(10).width = 30;
  clients.getColumn(11).width = 30;
  
  // Add example rows
  clients.addRow([
    'Example Corp',
    'Healthcare',
    5000,
    'Annual',
    '2022-01-15',
    '2025-01-15',
    'Yes',
    '2022-01-15',
    50,
    'Managed IT, Cybersecurity, Cloud',
    'Long-term client, very satisfied'
  ]);
  
  clients.addRow([
    'Sample LLC',
    'Legal',
    3500,
    'Month-to-Month',
    '2023-06-01',
    '',
    'N/A',
    '2023-06-01',
    25,
    'Help Desk, Backup',
    'Looking to upgrade to annual contract'
  ]);
  
  // Format MRR column as currency
  for (let row = 2; row <= 100; row++) {
    clients.getCell(row, 3).numFmt = '$#,##0';
  }
  
  // Summary Sheet
  const summary = workbook.addWorksheet('Summary');
  summary.addRow(['Client Portfolio Summary']);
  styleDataSheet(summary);
  
  summary.getColumn(1).width = 35;
  summary.getColumn(2).width = 20;
  
  summary.addRow([]);
  summary.addRow(['Total Number of Clients', '=COUNTA(\'Client List\'!A2:A1000)-COUNTBLANK(\'Client List\'!A2:A1000)']);
  summary.addRow(['Total Monthly Recurring Revenue', '=SUM(\'Client List\'!C2:C1000)']);
  summary.addRow(['Average MRR per Client', '=B4/B3']);
  summary.addRow([]);
  summary.addRow(['Top 3 Clients (% of Total MRR)', '']);
  summary.addRow(['Calculate manually or use formulas', '']);
  
  summary.getCell('B4').numFmt = '$#,##0';
  summary.getCell('B5').numFmt = '$#,##0';
  
  await workbook.xlsx.writeFile(path.join(__dirname, 'client-list-template.xlsx'));
  console.log('✓ Generated: client-list-template.xlsx');
}

async function generateTechStackTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // Instructions
  const instructions = workbook.addWorksheet('Instructions');
  instructions.getColumn(1).width = 80;
  
  instructions.addRow(['iGaming Tech Stack Inventory Template - Instructions']);
  styleInstructionSheet(instructions);
  
  instructions.addRow([]);
  instructions.addRow(['What to Include:']);
  instructions.getCell('A3').font = { bold: true, size: 12 };
  instructions.addRow(['• All software tools and platforms you use']);
  instructions.addRow(['• RMM, PSA, security tools, backup solutions']);
  instructions.addRow(['• License costs and renewal dates']);
  instructions.addRow(['• Vendor relationships and contract terms']);
  instructions.addRow([]);
  instructions.addRow(['Why This Matters:']);
  instructions.getCell('A9').font = { bold: true, size: 12 };
  instructions.addRow(['Buyers need to understand your technology infrastructure, costs, and vendor relationships.']);
  instructions.addRow(['Modern, well-integrated tech stacks are more valuable.']);
  
  // Tech Stack
  const techStack = workbook.addWorksheet('Tech Stack');
  techStack.addRow([
    'Category',
    'Tool/Platform Name',
    'Vendor',
    'Purpose',
    'Monthly Cost',
    'Annual Cost',
    'License Type',
    'Contract End Date',
    'Number of Licenses',
    'Notes'
  ]);
  styleDataSheet(techStack);
  
  techStack.getColumn(1).width = 20;
  techStack.getColumn(2).width = 25;
  techStack.getColumn(3).width = 20;
  techStack.getColumn(4).width = 30;
  techStack.getColumn(5).width = 15;
  techStack.getColumn(6).width = 15;
  techStack.getColumn(7).width = 20;
  techStack.getColumn(8).width = 18;
  techStack.getColumn(9).width = 18;
  techStack.getColumn(10).width = 30;
  
  // Add example categories
  const examples = [
    ['RMM', 'NinjaOne', 'NinjaRMM', 'Remote monitoring and management', 3, 36, 'Per-endpoint', '2025-12-31', 500, 'Favorable pricing tier'],
    ['Security', 'Huntress', 'Huntress Labs', 'Endpoint detection and response', 2, 24, 'Per-endpoint', '2025-06-30', 500, 'Excellent vendor relationship'],
    ['PSA', 'ConnectWise Manage', 'ConnectWise', 'Professional services automation', 500, 6000, 'Flat-rate', '2025-03-15', 'Unlimited', 'Includes support'],
    ['Backup', 'Veeam', 'Veeam Software', 'Backup and disaster recovery', 1000, 12000, 'Per-server', '2025-09-30', 50, ''],
    ['Documentation', 'IT Glue', 'Kaseya', 'Documentation platform', 300, 3600, 'Flat-rate', '2025-11-01', 'Unlimited', ''],
  ];
  
  examples.forEach(row => techStack.addRow(row));
  
  // Format currency columns
  for (let row = 2; row <= 100; row++) {
    techStack.getCell(row, 5).numFmt = '$#,##0';
    techStack.getCell(row, 6).numFmt = '$#,##0';
  }
  
  await workbook.xlsx.writeFile(path.join(__dirname, 'tech-stack-inventory-template.xlsx'));
  console.log('✓ Generated: tech-stack-inventory-template.xlsx');
}

async function generateEmployeeInfoTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // Instructions
  const instructions = workbook.addWorksheet('Instructions');
  instructions.getColumn(1).width = 80;
  
  instructions.addRow(['iGaming Employee Information Template - Instructions']);
  styleInstructionSheet(instructions);
  
  instructions.addRow([]);
  instructions.addRow(['What to Include:']);
  instructions.getCell('A3').font = { bold: true, size: 12 };
  instructions.addRow(['• Organizational chart']);
  instructions.addRow(['• Employee roles and responsibilities']);
  instructions.addRow(['• Compensation information (can be anonymized)']);
  instructions.addRow(['• Tenure and key skills']);
  instructions.addRow([]);
  instructions.addRow(['Why This Matters:']);
  instructions.getCell('A9').font = { bold: true, size: 12 };
  instructions.addRow(['Buyers assess team strength, key person dependencies, and labor costs.']);
  instructions.addRow(['Well-documented roles and low turnover increase value.']);
  instructions.addRow([]);
  instructions.addRow(['Privacy Note:']);
  instructions.getCell('A13').font = { bold: true, size: 12 };
  instructions.addRow(['You can use "Employee A", "Employee B" instead of real names initially.']);
  instructions.addRow(['Full details will be required during due diligence.']);
  
  // Employee List
  const employees = workbook.addWorksheet('Employee List');
  employees.addRow([
    'Employee ID',
    'Role/Title',
    'Department',
    'Employment Type',
    'Tenure (Years)',
    'Annual Salary',
    'Benefits Cost',
    'Total Compensation',
    'Key Skills',
    'Critical to Operations?',
    'Notes'
  ]);
  styleDataSheet(employees);
  
  employees.getColumn(1).width = 15;
  employees.getColumn(2).width = 25;
  employees.getColumn(3).width = 20;
  employees.getColumn(4).width = 18;
  employees.getColumn(5).width = 15;
  employees.getColumn(6).width = 18;
  employees.getColumn(7).width = 15;
  employees.getColumn(8).width = 20;
  employees.getColumn(9).width = 35;
  employees.getColumn(10).width = 22;
  employees.getColumn(11).width = 30;
  
  // Add examples
  employees.addRow([
    'EMP-001',
    'Senior Systems Engineer',
    'Technical',
    'Full-time',
    5,
    85000,
    15000,
    '=F2+G2',
    'VMware, Azure, Networking',
    'Yes',
    'Lead engineer, client-facing'
  ]);
  
  employees.addRow([
    'EMP-002',
    'Help Desk Technician',
    'Support',
    'Full-time',
    2,
    45000,
    10000,
    '=F3+G3',
    'Windows, Office 365, Ticketing',
    'No',
    'First-line support'
  ]);
  
  // Format currency columns
  for (let row = 2; row <= 100; row++) {
    employees.getCell(row, 6).numFmt = '$#,##0';
    employees.getCell(row, 7).numFmt = '$#,##0';
    employees.getCell(row, 8).numFmt = '$#,##0';
  }
  
  await workbook.xlsx.writeFile(path.join(__dirname, 'employee-information-template.xlsx'));
  console.log('✓ Generated: employee-information-template.xlsx');
}

async function generateVendorContractTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // Instructions
  const instructions = workbook.addWorksheet('Instructions');
  instructions.getColumn(1).width = 80;
  
  instructions.addRow(['iGaming Vendor Contract Summary Template - Instructions']);
  styleInstructionSheet(instructions);
  
  instructions.addRow([]);
  instructions.addRow(['What to Include:']);
  instructions.getCell('A3').font = { bold: true, size: 12 };
  instructions.addRow(['• All vendor relationships and contracts']);
  instructions.addRow(['• Contract terms, renewal dates, and cancellation clauses']);
  instructions.addRow(['• Pricing and volume discounts']);
  instructions.addRow(['• Transfer/assignment terms']);
  instructions.addRow([]);
  instructions.addRow(['Why This Matters:']);
  instructions.getCell('A9').font = { bold: true, size: 12 };
  instructions.addRow(['Buyers need to understand vendor commitments, costs, and transferability.']);
  instructions.addRow(['Favorable vendor terms and relationships add value.']);
  
  // Vendor Contracts
  const vendors = workbook.addWorksheet('Vendor Contracts');
  vendors.addRow([
    'Vendor Name',
    'Product/Service',
    'Contract Type',
    'Monthly Cost',
    'Annual Cost',
    'Contract Start',
    'Contract End',
    'Auto-Renewal?',
    'Cancellation Notice',
    'Transferable?',
    'Volume Discounts',
    'Notes'
  ]);
  styleDataSheet(vendors);
  
  vendors.getColumn(1).width = 25;
  vendors.getColumn(2).width = 25;
  vendors.getColumn(3).width = 18;
  vendors.getColumn(4).width = 15;
  vendors.getColumn(5).width = 15;
  vendors.getColumn(6).width = 15;
  vendors.getColumn(7).width = 15;
  vendors.getColumn(8).width = 15;
  vendors.getColumn(9).width = 20;
  vendors.getColumn(10).width = 15;
  vendors.getColumn(11).width = 25;
  vendors.getColumn(12).width = 30;
  
  // Add examples
  vendors.addRow([
    'Microsoft',
    'CSP (Cloud Solution Provider)',
    'Ongoing',
    15000,
    180000,
    '2020-01-01',
    'N/A',
    'N/A',
    'N/A',
    'Yes',
    'Tier 3 pricing',
    'Excellent margins'
  ]);
  
  vendors.addRow([
    'Datto',
    'BCDR (Backup & Disaster Recovery)',
    'Annual',
    2000,
    24000,
    '2024-01-01',
    '2025-01-01',
    'Yes',
    '30 days',
    'Yes',
    'Volume pricing at 50+ devices',
    'Partner status'
  ]);
  
  // Format currency
  for (let row = 2; row <= 100; row++) {
    vendors.getCell(row, 4).numFmt = '$#,##0';
    vendors.getCell(row, 5).numFmt = '$#,##0';
  }
  
  await workbook.xlsx.writeFile(path.join(__dirname, 'vendor-contract-summary-template.xlsx'));
  console.log('✓ Generated: vendor-contract-summary-template.xlsx');
}

async function generateAssetListTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // Instructions
  const instructions = workbook.addWorksheet('Instructions');
  instructions.getColumn(1).width = 80;
  
  instructions.addRow(['iGaming Asset List Template - Instructions']);
  styleInstructionSheet(instructions);
  
  instructions.addRow([]);
  instructions.addRow(['What to Include:']);
  instructions.getCell('A3').font = { bold: true, size: 12 };
  instructions.addRow(['• Owned equipment and hardware']);
  instructions.addRow(['• Vehicles (if applicable)']);
  instructions.addRow(['• Office furniture and fixtures']);
  instructions.addRow(['• Intellectual property (custom tools, scripts)']);
  instructions.addRow([]);
  instructions.addRow(['Why This Matters:']);
  instructions.getCell('A9').font = { bold: true, size: 12 };
  instructions.addRow(['Buyers need to understand what physical/digital assets are included in the sale.']);
  instructions.addRow(['Depreciated assets may have minimal value but should still be documented.']);
  
  // Asset List
  const assets = workbook.addWorksheet('Asset List');
  assets.addRow([
    'Asset Type',
    'Description',
    'Purchase Date',
    'Original Cost',
    'Current Book Value',
    'Estimated Market Value',
    'Condition',
    'Location',
    'Notes'
  ]);
  styleDataSheet(assets);
  
  assets.getColumn(1).width = 20;
  assets.getColumn(2).width = 35;
  assets.getColumn(3).width = 15;
  assets.getColumn(4).width = 18;
  assets.getColumn(5).width = 20;
  assets.getColumn(6).width = 22;
  assets.getColumn(7).width = 15;
  assets.getColumn(8).width = 20;
  assets.getColumn(9).width = 30;
  
  // Add examples
  assets.addRow([
    'Server',
    'Dell PowerEdge R740 - Lab/Demo Server',
    '2021-03-15',
    8000,
    4000,
    3000,
    'Good',
    'Office',
    'Used for testing and demos'
  ]);
  
  assets.addRow([
    'Vehicle',
    '2020 Ford Transit Van',
    '2020-06-01',
    35000,
    20000,
    22000,
    'Excellent',
    'Office',
    'Company vehicle for on-site visits'
  ]);
  
  assets.addRow([
    'IP',
    'Custom PowerShell automation scripts',
    '2019-2023',
    0,
    0,
    'TBD',
    'N/A',
    'Digital',
    'Proprietary automation tools'
  ]);
  
  // Format currency
  for (let row = 2; row <= 100; row++) {
    assets.getCell(row, 4).numFmt = '$#,##0';
    assets.getCell(row, 5).numFmt = '$#,##0';
    assets.getCell(row, 6).numFmt = '$#,##0';
  }
  
  await workbook.xlsx.writeFile(path.join(__dirname, 'asset-list-template.xlsx'));
  console.log('✓ Generated: asset-list-template.xlsx');
}

async function generateAllTemplates() {
  console.log('Generating iGaming Business Sales Packet Templates...\n');
  
  try {
    await generateFinancialStatementTemplate();
    await generateClientListTemplate();
    await generateTechStackTemplate();
    await generateEmployeeInfoTemplate();
    await generateVendorContractTemplate();
    await generateAssetListTemplate();
    
    console.log('\n✅ All templates generated successfully!');
    console.log('📁 Location: /home/ubuntu/msp-marketplace/server/templates/');
  } catch (error) {
    console.error('❌ Error generating templates:', error);
    process.exit(1);
  }
}

generateAllTemplates();
