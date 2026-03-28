/**
 * iGaming Seed Categories for Acquisitions.market
 *
 * These are the initial categories seeded into the DB.
 * Admins can add/edit/reorder via the admin panel.
 * The source of truth at runtime is the `listingCategories` table.
 */

export const IGAMING_BUSINESS_CATEGORIES = {
  // B2C businesses
  online_casino: 'Online Casino',
  sportsbook: 'Sportsbook',
  poker_room: 'Poker Room',
  bingo_lottery: 'Bingo & Lottery',
  crypto_casino: 'Crypto Casino',
  fantasy_sports: 'Fantasy Sports',
  esports_betting: 'Esports Betting',

  // B2B businesses
  igaming_platform: 'iGaming Platform / Software',
  white_label_provider: 'White Label Provider',
  affiliate_network: 'Affiliate Network',
  payment_provider: 'Payment Provider',
  game_studio: 'Game Studio / Content Provider',
  marketing_agency: 'iGaming Marketing Agency',
  compliance_consulting: 'Compliance & Consulting',
} as const;

export const IGAMING_ASSET_CATEGORIES = {
  gaming_license: 'Gaming License',
  domain_brand: 'Domain & Brand',
  player_database: 'Player Database',
  software_platform: 'Software / Platform',
  game_portfolio: 'Game Portfolio',
  white_label_solution: 'White Label Solution',
  payment_integration: 'Payment Integration',
  affiliate_program: 'Affiliate Program',
  seo_content: 'SEO & Content Assets',
} as const;

export const IGAMING_JURISDICTIONS = {
  malta: 'Malta (MGA)',
  uk: 'United Kingdom (UKGC)',
  gibraltar: 'Gibraltar',
  isle_of_man: 'Isle of Man',
  curacao: 'Curaçao',
  kahnawake: 'Kahnawake',
  estonia: 'Estonia',
  sweden: 'Sweden',
  denmark: 'Denmark',
  alderney: 'Alderney',
  antigua: 'Antigua & Barbuda',
  other: 'Other',
} as const;

export type IgamingBusinessCategory = keyof typeof IGAMING_BUSINESS_CATEGORIES;
export type IgamingAssetCategory = keyof typeof IGAMING_ASSET_CATEGORIES;
export type IgamingJurisdiction = keyof typeof IGAMING_JURISDICTIONS;

/**
 * Seed data for the listingCategories table.
 * Run once on initial setup. Admins can then add/edit via admin panel.
 */
export const SEED_CATEGORIES = [
  // ── Businesses ─────────────────────────────────────────────────────────
  { name: 'Businesses', slug: 'businesses', type: 'root' as const, parentSlug: null, businessType: null, displayOrder: 0 },

  // B2C
  { name: 'B2C Businesses', slug: 'businesses-b2c', type: 'business' as const, parentSlug: 'businesses', businessType: 'b2c' as const, displayOrder: 0 },
  { name: 'Online Casino', slug: 'online-casino', type: 'business' as const, parentSlug: 'businesses-b2c', businessType: 'b2c' as const, displayOrder: 0 },
  { name: 'Sportsbook', slug: 'sportsbook', type: 'business' as const, parentSlug: 'businesses-b2c', businessType: 'b2c' as const, displayOrder: 1 },
  { name: 'Poker Room', slug: 'poker-room', type: 'business' as const, parentSlug: 'businesses-b2c', businessType: 'b2c' as const, displayOrder: 2 },
  { name: 'Bingo & Lottery', slug: 'bingo-lottery', type: 'business' as const, parentSlug: 'businesses-b2c', businessType: 'b2c' as const, displayOrder: 3 },
  { name: 'Crypto Casino', slug: 'crypto-casino', type: 'business' as const, parentSlug: 'businesses-b2c', businessType: 'b2c' as const, displayOrder: 4 },
  { name: 'Fantasy Sports', slug: 'fantasy-sports', type: 'business' as const, parentSlug: 'businesses-b2c', businessType: 'b2c' as const, displayOrder: 5 },
  { name: 'Esports Betting', slug: 'esports-betting', type: 'business' as const, parentSlug: 'businesses-b2c', businessType: 'b2c' as const, displayOrder: 6 },

  // B2B
  { name: 'B2B Businesses', slug: 'businesses-b2b', type: 'business' as const, parentSlug: 'businesses', businessType: 'b2b' as const, displayOrder: 1 },
  { name: 'iGaming Platform / Software', slug: 'igaming-platform', type: 'business' as const, parentSlug: 'businesses-b2b', businessType: 'b2b' as const, displayOrder: 0 },
  { name: 'White Label Provider', slug: 'white-label-provider', type: 'business' as const, parentSlug: 'businesses-b2b', businessType: 'b2b' as const, displayOrder: 1 },
  { name: 'Affiliate Network', slug: 'affiliate-network', type: 'business' as const, parentSlug: 'businesses-b2b', businessType: 'b2b' as const, displayOrder: 2 },
  { name: 'Payment Provider', slug: 'payment-provider', type: 'business' as const, parentSlug: 'businesses-b2b', businessType: 'b2b' as const, displayOrder: 3 },
  { name: 'Game Studio / Content Provider', slug: 'game-studio', type: 'business' as const, parentSlug: 'businesses-b2b', businessType: 'b2b' as const, displayOrder: 4 },
  { name: 'iGaming Marketing Agency', slug: 'igaming-marketing', type: 'business' as const, parentSlug: 'businesses-b2b', businessType: 'b2b' as const, displayOrder: 5 },
  { name: 'Compliance & Consulting', slug: 'igaming-compliance', type: 'business' as const, parentSlug: 'businesses-b2b', businessType: 'b2b' as const, displayOrder: 6 },

  // ── Assets ─────────────────────────────────────────────────────────────
  { name: 'Assets', slug: 'assets', type: 'root' as const, parentSlug: null, businessType: null, displayOrder: 1 },
  { name: 'Gaming License', slug: 'gaming-license', type: 'asset' as const, parentSlug: 'assets', businessType: null, displayOrder: 0 },
  { name: 'Domain & Brand', slug: 'domain-brand', type: 'asset' as const, parentSlug: 'assets', businessType: null, displayOrder: 1 },
  { name: 'Player Database', slug: 'player-database', type: 'asset' as const, parentSlug: 'assets', businessType: null, displayOrder: 2 },
  { name: 'Software / Platform', slug: 'software-platform', type: 'asset' as const, parentSlug: 'assets', businessType: null, displayOrder: 3 },
  { name: 'Game Portfolio', slug: 'game-portfolio', type: 'asset' as const, parentSlug: 'assets', businessType: null, displayOrder: 4 },
  { name: 'White Label Solution', slug: 'white-label-solution', type: 'asset' as const, parentSlug: 'assets', businessType: null, displayOrder: 5 },
  { name: 'Payment Integration', slug: 'payment-integration', type: 'asset' as const, parentSlug: 'assets', businessType: null, displayOrder: 6 },
  { name: 'Affiliate Program', slug: 'affiliate-program', type: 'asset' as const, parentSlug: 'assets', businessType: null, displayOrder: 7 },
  { name: 'SEO & Content Assets', slug: 'seo-content', type: 'asset' as const, parentSlug: 'assets', businessType: null, displayOrder: 8 },
];
