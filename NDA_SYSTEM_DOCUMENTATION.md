# NDA Template System Documentation

## Overview

The NDA Template System allows administrators to:
1. **Upload and manage NDA templates** with variable placeholders
2. **Define variables** that will be dynamically substituted when NDAs are created
3. **Render NDAs** with actual values from deals
4. **Track NDA signings** with audit logs
5. **Store signed NDAs** in the document vault for both parties

## Architecture

### Database Schema

#### `ndaTemplates` Table
Stores NDA template definitions with content and metadata.

```sql
CREATE TABLE `ndaTemplates` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,              -- Template name (e.g., "Standard MSP NDA")
  `description` text,                        -- When to use this template
  `isDefault` boolean DEFAULT false,         -- Whether this is the default template
  `isActive` boolean DEFAULT true,           -- Can be deactivated without deleting
  `content` text NOT NULL,                   -- HTML content with {{variable}} placeholders
  `fileUrl` varchar(500),                    -- S3 URL to original uploaded file
  `fileName` varchar(255),                   -- Original filename
  `fileMimeType` varchar(100),               -- MIME type (e.g., "application/pdf")
  `createdBy` int NOT NULL,                  -- Admin user ID who created
  `updatedBy` int,                           -- Admin user ID who last updated
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `ndaVariableDefinitions` Table
Defines which variables are available in each template and their properties.

```sql
CREATE TABLE `ndaVariableDefinitions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `templateId` int NOT NULL,                 -- Reference to ndaTemplates
  `variableName` varchar(100) NOT NULL,     -- e.g., "buyerName" (used in {{buyerName}})
  `displayName` varchar(255) NOT NULL,      -- e.g., "Buyer Full Name" (for UI)
  `description` text,                        -- Help text for admins
  `type` enum('text', 'date', 'email', 'number', 'company') DEFAULT 'text',
  `required` boolean DEFAULT false,          -- Whether this variable must be provided
  `defaultValue` varchar(500),               -- Default value if not provided
  `validationPattern` varchar(500),          -- Regex pattern for validation
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP
);
```

#### `ndaSignings` Table
Records NDA signatures and tracks signing status for each deal.

```sql
CREATE TABLE `ndaSignings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `dealId` int NOT NULL,                     -- Which deal this NDA is for
  `templateId` int NOT NULL,                 -- Which template was used
  `renderedContent` text NOT NULL,           -- Final HTML with all variables replaced
  `variableValues` text NOT NULL,            -- JSON object with all variable values
  
  -- Buyer signature
  `buyerSignedAt` timestamp,                 -- When buyer signed
  `buyerSignature` varchar(500),             -- Base64 encoded signature image
  `buyerSignatureType` enum('drawn', 'typed', 'initials'),
  
  -- Seller signature
  `sellerSignedAt` timestamp,                -- When seller signed
  `sellerSignature` varchar(500),            -- Base64 encoded signature image
  `sellerSignatureType` enum('drawn', 'typed', 'initials'),
  
  -- Status tracking
  `status` enum('draft', 'buyer_signed', 'seller_signed', 'fully_signed', 'expired', 'voided') DEFAULT 'draft',
  `expiresAt` timestamp,                     -- When signing window closes
  `documentVaultId` int,                     -- Reference to document in vault
  
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `ndaSigningAuditLog` Table
Tracks all actions taken on NDAs for compliance and audit purposes.

```sql
CREATE TABLE `ndaSigningAuditLog` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `ndaSigningId` int NOT NULL,
  `action` enum('created', 'sent', 'buyer_viewed', 'seller_viewed', 'buyer_signed', 
                'seller_signed', 'completed', 'expired', 'voided'),
  `userId` int,                              -- User who performed action
  `ipAddress` varchar(45),                   -- IP address for audit
  `userAgent` text,                          -- Browser user agent
  `details` text,                            -- Additional details as JSON
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP
);
```

## Available NDA Variables

The system provides 13 predefined variables that can be used in templates:

### Party Information
- **`{{buyerName}}`** - Full name of the buyer (required)
- **`{{buyerCompanyName}}`** - Name of buyer's company (required)
- **`{{buyerEmail}}`** - Buyer's email address (required)
- **`{{sellerName}}`** - Full name of the seller (required)
- **`{{sellerCompanyName}}`** - Name of seller's company (required)
- **`{{sellerEmail}}`** - Seller's email address (required)

### Deal Information
- **`{{listingName}}`** - Name of the MSP business being sold (required)
- **`{{listingRevenue}}`** - Annual revenue of the MSP (optional)
- **`{{listingEBITDA}}`** - EBITDA of the MSP (optional)
- **`{{dealId}}`** - Unique identifier for this deal (required)

### Dates & Periods
- **`{{currentDate}}`** - Today's date, auto-formatted (required)
- **`{{expirationDate}}`** - NDA expiration date (optional)
- **`{{confidentialityPeriod}}`** - Duration of confidentiality obligations, e.g., "2 years" (optional)

## Backend API (tRPC Router)

### `ndaTemplate` Router

#### `getAvailableVariables()`
Returns list of all available NDA variables with their metadata.

```typescript
// Query
const variables = await trpc.ndaTemplate.getAvailableVariables.useQuery();

// Response
[
  {
    variableName: "buyerName",
    displayName: "Buyer Full Name",
    type: "text",
    description: "Full name of the buyer",
    required: true
  },
  // ... more variables
]
```

#### `uploadTemplate(input)`
Uploads a new NDA template (admin only).

```typescript
// Mutation
const uploadMutation = trpc.ndaTemplate.uploadTemplate.useMutation();

uploadMutation.mutate({
  name: "Standard MSP NDA",
  description: "Used for all MSP M&A deals",
  content: "<html>...</html>",  // HTML with {{variable}} placeholders
  fileUrl: "https://s3.../nda-template.pdf",  // Optional S3 URL
  fileName: "nda-template.pdf",
  fileMimeType: "application/pdf",
  isDefault: true,
  variables: [
    {
      variableName: "buyerName",
      displayName: "Buyer Full Name",
      type: "text",
      required: true
    }
    // ... more variables
  ]
});

// Response
{
  success: true,
  templateId: 1,
  message: "NDA template uploaded successfully"
}
```

#### `listTemplates(input)`
Lists all active NDA templates.

```typescript
// Query
const templates = await trpc.ndaTemplate.listTemplates.useQuery({
  includeInactive: false  // Optional, default false
});

// Response
[
  {
    id: 1,
    name: "Standard MSP NDA",
    description: "Used for all MSP M&A deals",
    isDefault: true,
    isActive: true,
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z"
  },
  // ... more templates
]
```

#### `getTemplate(input)`
Gets template details including all variables.

```typescript
// Query
const template = await trpc.ndaTemplate.getTemplate.useQuery({
  templateId: 1
});

// Response
{
  id: 1,
  name: "Standard MSP NDA",
  description: "...",
  content: "<html>...</html>",
  isDefault: true,
  isActive: true,
  variables: [
    {
      id: 1,
      templateId: 1,
      variableName: "buyerName",
      displayName: "Buyer Full Name",
      type: "text",
      required: true,
      defaultValue: null
    },
    // ... more variables
  ]
}
```

#### `updateTemplate(input)`
Updates template details (admin only).

```typescript
// Mutation
const updateMutation = trpc.ndaTemplate.updateTemplate.useMutation();

updateMutation.mutate({
  templateId: 1,
  name: "Updated Template Name",
  description: "Updated description",
  content: "<html>...</html>",
  isDefault: false,
  isActive: true
});
```

#### `deleteTemplate(input)`
Deletes a template and its variables (admin only).

```typescript
// Mutation
const deleteMutation = trpc.ndaTemplate.deleteTemplate.useMutation();

deleteMutation.mutate({
  templateId: 1
});
```

#### `renderTemplate(input)`
Renders template with actual variable values, substituting all placeholders.

```typescript
// Query
const rendered = await trpc.ndaTemplate.renderTemplate.useQuery({
  templateId: 1,
  variables: {
    buyerName: "John Smith",
    buyerCompanyName: "Acme Corp",
    buyerEmail: "john@acme.com",
    sellerName: "Jane Doe",
    sellerCompanyName: "Tech Solutions",
    sellerEmail: "jane@techsolutions.com",
    listingName: "CloudTech MSP",
    listingRevenue: 2500000,
    listingEBITDA: 750000,
    dealId: "DEAL-2025-001",
    currentDate: new Date(),
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    confidentialityPeriod: "2 years"
  }
});

// Response
{
  content: "<html>Final rendered HTML with all variables replaced</html>",
  unreplacedVariables: [],  // Any {{variable}} that couldn't be replaced
  hasUnreplacedVariables: false
}
```

## Frontend Components

### `AdminNDATemplateManager`
Main admin component for managing NDA templates.

**Location:** `client/src/components/AdminNDATemplateManager.tsx`

**Features:**
- List all templates with status indicators
- Upload new templates with HTML editor
- Insert variable placeholders with one-click buttons
- Preview templates before saving
- Edit existing templates
- Delete templates
- Set default template

**Usage:**
```typescript
import { AdminNDATemplateManager } from "@/components/AdminNDATemplateManager";

export function AdminDashboard() {
  return (
    <div>
      <AdminNDATemplateManager />
    </div>
  );
}
```

## Implementation Steps

### 1. Database Migration
Push the schema changes to your database:
```bash
cd /home/ubuntu/msp-marketplace
pnpm db:push
```

### 2. Integrate Admin Component
Add the NDA Template Manager to your admin dashboard:

```typescript
// In AdminDashboard.tsx or similar
import { AdminNDATemplateManager } from "@/components/AdminNDATemplateManager";

export function AdminDashboard() {
  return (
    <div>
      {/* ... existing content ... */}
      <AdminNDATemplateManager />
    </div>
  );
}
```

### 3. Create NDA Signing Procedures (Next Steps)
You'll need to implement:
- `createNDASigning()` - Create NDA for a deal
- `signNDA()` - Record buyer/seller signature
- `getNDAStatus()` - Get current signing status
- `getSignedNDA()` - Retrieve fully signed NDA

### 4. Build NDA Signing UI (Next Steps)
Create components for:
- NDA preview modal with clickwrap agreement
- Signature capture (drawn, typed, or initials)
- Signing confirmation and receipt
- Document vault integration

## Variable Substitution Engine

The system automatically handles variable substitution with proper formatting:

- **Text variables** - Inserted as-is
- **Date variables** - Formatted as "Month Day, Year" (e.g., "January 15, 2025")
- **Number variables** - Formatted with thousands separators (e.g., "2,500,000")
- **Email variables** - Inserted as-is
- **Company variables** - Inserted as-is

### Example Template
```html
<h1>Non-Disclosure Agreement</h1>

<p>This NDA is entered into as of {{currentDate}} between:</p>

<p><strong>Buyer:</strong> {{buyerName}} of {{buyerCompanyName}} ({{buyerEmail}})</p>
<p><strong>Seller:</strong> {{sellerName}} of {{sellerCompanyName}} ({{sellerEmail}})</p>

<h2>Regarding the Sale of {{listingName}}</h2>

<p>Annual Revenue: ${{listingRevenue}}</p>
<p>EBITDA: ${{listingEBITDA}}</p>
<p>Deal ID: {{dealId}}</p>

<p>The parties agree to maintain confidentiality for {{confidentialityPeriod}} from the date of this agreement.</p>

<p>This NDA expires on {{expirationDate}}.</p>
```

### Rendered Output
```html
<h1>Non-Disclosure Agreement</h1>

<p>This NDA is entered into as of January 15, 2025 between:</p>

<p><strong>Buyer:</strong> John Smith of Acme Corp (john@acme.com)</p>
<p><strong>Seller:</strong> Jane Doe of Tech Solutions (jane@techsolutions.com)</p>

<h2>Regarding the Sale of CloudTech MSP</h2>

<p>Annual Revenue: $2,500,000</p>
<p>EBITDA: $750,000</p>
<p>Deal ID: DEAL-2025-001</p>

<p>The parties agree to maintain confidentiality for 2 years from the date of this agreement.</p>

<p>This NDA expires on February 14, 2025.</p>
```

## Security Considerations

1. **Admin-Only Access** - Template management is restricted to admins via `adminProcedure`
2. **Audit Logging** - All NDA actions are logged with user ID, IP address, and timestamp
3. **Variable Validation** - Variables are validated before substitution
4. **Signature Storage** - Signatures are base64 encoded and stored securely
5. **Document Vault** - Signed NDAs are stored in S3 with proper access controls

## Future Enhancements

1. **Template Versioning** - Track template versions and which version was used for each NDA
2. **Email Notifications** - Notify parties when NDA is ready for signature
3. **E-Signature Integration** - Integrate with DocuSign or similar for legal signatures
4. **Template Approval Workflow** - Require legal review before template activation
5. **Conditional Sections** - Show/hide sections based on variable values
6. **Multi-Language Support** - Support NDAs in multiple languages
7. **Template Analytics** - Track which templates are most used and signing times

## Troubleshooting

### Variables Not Being Substituted
- Check that variable names match exactly (case-sensitive)
- Ensure variables are wrapped in `{{` and `}}`
- Verify variable values are provided in the render call

### Template Upload Fails
- Verify HTML content is valid and well-formed
- Check that all required variables are defined
- Ensure file size is within limits

### Signature Not Saving
- Check that signature data is properly base64 encoded
- Verify database connection is active
- Check audit logs for errors

## Support

For questions or issues with the NDA system, refer to:
- Database schema: `drizzle/schema.ts`
- Backend router: `server/routers/ndaTemplateRouter.ts`
- Frontend component: `client/src/components/AdminNDATemplateManager.tsx`
