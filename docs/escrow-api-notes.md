# Escrow.com API Integration Notes

## API Basics

- **Base URL**: `https://api.escrow.com/2017-09-01/`
- **Authentication**: HTTP Basic Auth (email:password)
- **Sandbox**: Available for testing before production

## Key Endpoints

### Create Transaction
- **POST** `/transaction`
- Creates an escrow transaction with buyer, seller, and item details
- Required fields:
  - `parties`: Array with buyer and seller info (role, customer email)
  - `currency`: e.g., "usd"
  - `description`: Transaction description
  - `items`: Array of items being transacted (title, description, type, inspection_period, quantity, schedule)

### Get Transaction
- **GET** `/transaction/{id}`
- Retrieves current status and details of a transaction

### Transaction Lifecycle
1. Create transaction
2. Agree to transaction (both parties)
3. Fund transaction (buyer pays)
4. Ship items (seller)
5. Receive items (buyer)
6. Accept items (buyer)
7. Disburse funds (automatic to seller)

## Integration Plan for MSP M&A Marketplace

### When to Create Escrow Transaction
- **Trigger**: When offer is accepted and deal moves to "escrow" stage
- **Location**: `server/routers/offerHistoryRouter.ts` - `acceptOffer` mutation

### Required Data
- Buyer email and name
- Seller email and name
- Transaction amount (accepted offer amount)
- Business name (listing title)
- Success fee percentage (3%)

### API Credentials Needed
- ESCROW_API_EMAIL (partner account email)
- ESCROW_API_PASSWORD (partner account password)
- ESCROW_SANDBOX_MODE (true/false for testing)

### Database Schema Addition
Add to `deals` table:
- `escrowTransactionId` (varchar) - Escrow.com transaction ID
- `escrowStatus` (enum) - Current escrow status
- `escrowCreatedAt` (timestamp)
- `escrowFundedAt` (timestamp)
- `escrowCompletedAt` (timestamp)

## Next Steps
1. Create Escrow.com partner account
2. Get sandbox credentials
3. Implement escrow service helper
4. Add escrow transaction creation to deal flow
5. Add escrow status tracking to admin panel
6. Add escrow payment link to deal room
