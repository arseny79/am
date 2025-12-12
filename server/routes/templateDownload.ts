/**
 * Template Download Route - Serve Excel templates for sales packet preparation
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Available templates
const TEMPLATES: Record<string, { filename: string; displayName: string }> = {
  'financial-statement': {
    filename: 'financial-statement-template.xlsx',
    displayName: 'Financial Statement Template.xlsx',
  },
  'client-list': {
    filename: 'client-list-template.xlsx',
    displayName: 'Client List Template.xlsx',
  },
  'tech-stack': {
    filename: 'tech-stack-inventory-template.xlsx',
    displayName: 'Tech Stack Inventory Template.xlsx',
  },
  'employee-info': {
    filename: 'employee-information-template.xlsx',
    displayName: 'Employee Information Template.xlsx',
  },
  'vendor-contracts': {
    filename: 'vendor-contract-summary-template.xlsx',
    displayName: 'Vendor Contract Summary Template.xlsx',
  },
  'asset-list': {
    filename: 'asset-list-template.xlsx',
    displayName: 'Asset List Template.xlsx',
  },
};

/**
 * GET /api/templates/:templateId
 * Download a template file
 */
router.get('/:templateId', (req, res) => {
  const { templateId } = req.params;
  
  const template = TEMPLATES[templateId];
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  const templatePath = path.join(__dirname, '../templates', template.filename);
  
  // Check if file exists
  if (!fs.existsSync(templatePath)) {
    console.error(`Template file not found: ${templatePath}`);
    return res.status(404).json({ error: 'Template file not found' });
  }
  
  // Set headers for download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${template.displayName}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(templatePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error) => {
    console.error('Error streaming template file:', error);
    res.status(500).json({ error: 'Error downloading template' });
  });
});

/**
 * GET /api/templates
 * List all available templates
 */
router.get('/', (req, res) => {
  const templateList = Object.entries(TEMPLATES).map(([id, template]) => ({
    id,
    filename: template.filename,
    displayName: template.displayName,
    downloadUrl: `/api/templates/${id}`,
  }));
  
  res.json({ templates: templateList });
});

export default router;
