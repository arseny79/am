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

// ---------------------------------------------------------------------------
// Broad asset category taxonomy — used by the new multi-vertical marketplace.
// Stored as varchar(100) in listings.assetCategory.
// Groups are for UI display only; the keys are stored in the DB.
// ---------------------------------------------------------------------------

export const ASSET_CATEGORIES = {
  // — Technology / MSP —
  msp_managed_services:     'MSP / Managed Services',
  saas_platform:            'SaaS Platform',
  software_development:     'Software Development',

  // — Online iGaming —
  igaming_online_casino:    'Online Casino (B2C)',
  igaming_sports_betting:   'Sports Betting',
  igaming_crypto_casino:    'Crypto Casino',
  igaming_crash_game:       'Crash Game Platform',
  igaming_poker:            'Poker Platform',
  igaming_affiliate_media:  'iGaming Affiliate / Media',
  igaming_whitelabel:       'Casino White-Label Platform',
  igaming_payment_rails:    'iGaming Payment Rails',
  igaming_kol_streamer:     'KOL / Streamer Traffic Asset',
  igaming_telegram_mini_app:'Telegram Mini-App (iGaming)',

  // — Land-Based Gaming (expanded as research completes) —
  landbased_casino:         'Land-Based Casino',
  landbased_gaming_venue:   'Gaming Venue / Arcade',
  landbased_amusement:      'Amusement & Redemption',
  landbased_betting_shop:   'Betting Shop / OTC',
  landbased_lotteries:      'Lottery / Scratch Card Operation',

  // — Esports —
  esports_team:             'Esports Team / Org',
  esports_tournament:       'Esports Tournament Platform',
  esports_media:            'Esports Media / Content',
  esports_wagering:         'Esports Wagering Platform',
  esports_training:         'Esports Training / Academy',
  esports_analytics:        'Esports Analytics / Data',

  // — Prediction Markets —
  prediction_market_platform:'Prediction Market Platform',
  prediction_market_crypto:  'Crypto Prediction Market',
  prediction_market_sports:  'Sports Prediction Market',
  prediction_market_political:'Political / Events Prediction',

  // — Web3 / Crypto (non-casino) —
  web3_gaming_protocol:     'Web3 Gaming / Gambling Protocol',
  crypto_defi:              'DeFi Protocol',
  crypto_nft_gaming:        'NFT / Web3 Gaming',
  crypto_tokenized_loyalty: 'Tokenized Loyalty System',
  crypto_affiliate_media:   'Crypto Affiliate / Media',
  crypto_whitelabel:        'Crypto White-Label Platform',
  licensed_entity_crypto:   'Licensed Entity (Crypto-friendly)',
  traffic_arbitrage_crypto: 'Traffic Arbitrage (Crypto)',

  // — Strategic Assets —
  strategic_telegram:       'Telegram Community',
  strategic_twitter:        'X / Twitter Account',
  strategic_discord:        'Discord Server',
  strategic_domain:         'Domain(s)',
  strategic_traffic:        'Traffic / Affiliate Asset',
  strategic_whitelabel_code:'White-Label Source Code',
  strategic_token_contract: 'Token Contract',
  strategic_legal_entity:   'Geo-Specific Legal Entity / Shell',
} as const;

export type AssetCategory = keyof typeof ASSET_CATEGORIES;

// Asset categories that display a crypto/web3 badge on listing cards
export const CRYPTO_ASSET_CATEGORY_KEYS: ReadonlySet<string> = new Set([
  'igaming_crypto_casino',
  'igaming_crash_game',
  'igaming_payment_rails',
  'igaming_telegram_mini_app',
  'web3_gaming_protocol',
  'crypto_defi',
  'crypto_nft_gaming',
  'crypto_tokenized_loyalty',
  'crypto_affiliate_media',
  'crypto_whitelabel',
  'licensed_entity_crypto',
  'traffic_arbitrage_crypto',
  'prediction_market_crypto',
  'strategic_token_contract',
]);

// Supported chains (for the chain multi-select filter)
export const SUPPORTED_CHAINS = {
  ethereum: 'Ethereum',
  polygon:  'Polygon',
  ton:      'TON',
  solana:   'Solana',
  bnb:      'BNB Chain',
  base:     'Base',
  arbitrum: 'Arbitrum',
  other:    'Other',
} as const;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

// Group definitions for the category filter dropdown (display only)
export const ASSET_CATEGORY_GROUPS: { label: string; keys: (keyof typeof ASSET_CATEGORIES)[] }[] = [
  {
    label: 'Technology / MSP',
    keys: ['msp_managed_services', 'saas_platform', 'software_development'],
  },
  {
    label: 'Online iGaming',
    keys: [
      'igaming_online_casino', 'igaming_sports_betting', 'igaming_crypto_casino',
      'igaming_crash_game', 'igaming_poker', 'igaming_affiliate_media',
      'igaming_whitelabel', 'igaming_payment_rails', 'igaming_kol_streamer',
      'igaming_telegram_mini_app',
    ],
  },
  {
    label: 'Land-Based Gaming',
    keys: [
      'landbased_casino', 'landbased_gaming_venue', 'landbased_amusement',
      'landbased_betting_shop', 'landbased_lotteries',
    ],
  },
  {
    label: 'Esports',
    keys: [
      'esports_team', 'esports_tournament', 'esports_media',
      'esports_wagering', 'esports_training', 'esports_analytics',
    ],
  },
  {
    label: 'Prediction Markets',
    keys: [
      'prediction_market_platform', 'prediction_market_crypto',
      'prediction_market_sports', 'prediction_market_political',
    ],
  },
  {
    label: 'Web3 / Crypto',
    keys: [
      'web3_gaming_protocol', 'crypto_defi', 'crypto_nft_gaming',
      'crypto_tokenized_loyalty', 'crypto_affiliate_media', 'crypto_whitelabel',
      'licensed_entity_crypto', 'traffic_arbitrage_crypto',
    ],
  },
  {
    label: 'Strategic Assets',
    keys: [
      'strategic_telegram', 'strategic_twitter', 'strategic_discord',
      'strategic_domain', 'strategic_traffic', 'strategic_whitelabel_code',
      'strategic_token_contract', 'strategic_legal_entity',
    ],
  },
];
