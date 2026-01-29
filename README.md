# MSP M&A Marketplace

[![CI Pipeline](https://github.com/YOUR_USERNAME/msp-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/msp-marketplace/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A specialized marketplace platform connecting MSP (Managed Service Provider) buyers and sellers, facilitating business acquisitions through standardized listings, valuation tools, and secure transaction workflows.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite |
| Backend | Express.js, tRPC |
| Database | MySQL with Drizzle ORM |
| Authentication | OAuth via Manus platform |
| File Storage | S3-compatible storage |
| Payments | Stripe |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL database (provided by Manus platform)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The development server will start at `http://localhost:3000`.

## Database Management

This project uses **Drizzle ORM** for database schema management and migrations. The schema is defined in TypeScript files under the `drizzle/` directory.

### Schema Files

| File | Description |
|------|-------------|
| `drizzle/schema.ts` | Main application schema (users, listings, deals, KYC, etc.) |
| `drizzle/brokerSchema.ts` | Broker-specific tables |

### Migration Commands

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate SQL migration files from schema changes |
| `pnpm db:migrate` | Apply pending migrations to the database |
| `pnpm db:push` | Generate and apply migrations in one step |
| `pnpm db:check` | Check schema consistency |
| `pnpm db:studio` | Open Drizzle Studio for visual database management |
| `pnpm db:introspect` | Generate schema from existing database |

### Migration Workflow

When making database schema changes, follow this workflow:

**Step 1: Modify the Schema**

Edit the schema files in `drizzle/schema.ts` or `drizzle/brokerSchema.ts`:

```typescript
// Example: Adding a new table
export const myNewTable = mysqlTable("myNewTable", {
  id: int().autoincrement().notNull().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});
```

**Step 2: Generate Migration**

```bash
pnpm db:generate
```

This creates a new SQL migration file in `drizzle/` with a sequential number (e.g., `0071_new_migration.sql`).

**Step 3: Review the Migration**

Always review the generated SQL file before applying:

```bash
cat drizzle/0071_*.sql
```

**Step 4: Apply Migration**

```bash
pnpm db:migrate
```

**Step 5: Verify**

Check that the migration was applied successfully:

```bash
pnpm db:check
```

### Best Practices

1. **Always generate migrations** before deploying schema changes. Never modify the database directly in production.

2. **Review generated SQL** before applying. Drizzle generates migrations automatically, but you should verify they match your intentions.

3. **Test migrations locally** before applying to production. Use a staging environment if available.

4. **Keep migrations small** and focused. One migration per feature or fix makes rollbacks easier.

5. **Never edit existing migrations** that have been applied. Create new migrations to fix issues.

6. **Commit migration files** to version control. This ensures all environments can reproduce the database state.

### Troubleshooting

**Missing Table Error**

If you encounter "Table doesn't exist" errors, the migration may not have been applied:

```bash
# Check current migration state
pnpm db:check

# Apply any pending migrations
pnpm db:migrate
```

**Schema Drift**

If the database schema doesn't match the code:

```bash
# Introspect current database state
pnpm db:introspect

# Compare with schema files and resolve differences
```

## CI/CD Pipeline

This project includes a comprehensive CI/CD pipeline using GitHub Actions that runs on every push and pull request to `main` and `develop` branches.

### Pipeline Jobs

| Job | Description |
|-----|-------------|
| TypeScript Check | Validates all TypeScript types with `tsc --noEmit` |
| ESLint | Runs code quality checks and enforces coding standards |
| Unit Tests | Executes the full Vitest test suite |
| Build Validation | Ensures the application builds successfully |
| Schema Validation | Checks Drizzle ORM schema consistency |
| Security Audit | Scans dependencies for known vulnerabilities |

### Running Locally

You can run the same checks locally before pushing:

```bash
# TypeScript check
pnpm check

# Linting
pnpm lint

# Tests
pnpm test

# Build
pnpm build
```

## Development Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm check` | Run TypeScript type checking |
| `pnpm test` | Run test suite |
| `pnpm format` | Format code with Prettier |

## Project Structure

```
msp-marketplace/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities and hooks
├── server/           # Express backend
│   ├── _core/        # Core server setup
│   ├── routers/      # tRPC routers
│   ├── lib/          # Server utilities
│   └── jobs/         # Background jobs
├── drizzle/          # Database schema and migrations
│   ├── schema.ts     # Main schema
│   ├── brokerSchema.ts
│   └── *.sql         # Migration files
└── package.json
```

## Environment Variables

The following environment variables are required (managed by Manus platform):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Secret for JWT token signing |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `SENDGRID_API_KEY` | SendGrid API key for emails |

## License

MIT
