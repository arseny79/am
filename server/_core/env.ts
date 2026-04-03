export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  frontendUrl: process.env.VITE_FRONTEND_URL ?? "http://localhost:3000",
  // Launch mode gate
  launchMode: process.env.LAUNCH_MODE === "true",
  previewSecret: process.env.PREVIEW_SECRET ?? "",
};

// C5: Validate critical environment variables at startup
const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "DATABASE_URL",
  "OAUTH_SERVER_URL",
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[ENV] FATAL: Missing required environment variables: ${missing.join(", ")}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}
