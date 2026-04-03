import type { Request, Response, NextFunction } from "express";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { siteSettings } from "../../drizzle/schema";

const BYPASS_COOKIE = "am_preview";
const BYPASS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Simple in-memory cache so we don't hit the DB on every request
let settingsCache: { launchModeEnabled: boolean; previewSecret: string } | null = null;
let settingsCacheExpiry = 0;
const CACHE_TTL_MS = 10_000; // refresh from DB every 10 seconds

async function getLaunchSettings(): Promise<{ launchModeEnabled: boolean; previewSecret: string }> {
  const now = Date.now();
  if (settingsCache && now < settingsCacheExpiry) {
    return settingsCache;
  }
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    const rows = await db.select({
      launchModeEnabled: siteSettings.launchModeEnabled,
      previewSecret: siteSettings.previewSecret,
    }).from(siteSettings).limit(1);

    const row = rows[0];
    settingsCache = {
      launchModeEnabled: row ? !!row.launchModeEnabled : false,
      previewSecret: row?.previewSecret ?? "",
    };
    settingsCacheExpiry = now + CACHE_TTL_MS;
    return settingsCache;
  } catch {
    // If DB is unavailable, default to NOT blocking (fail open)
    return { launchModeEnabled: false, previewSecret: "" };
  }
}

/** Call this after saving siteSettings to immediately reflect changes */
export function invalidateLaunchModeCache(): void {
  settingsCache = null;
  settingsCacheExpiry = 0;
}

// Routes that always pass through regardless of launch mode
const ALWAYS_ALLOWED_PREFIXES = [
  "/api/",
  "/assets/",
  "/coming-soon",
  "/@vite",
  "/@fs",
  "/node_modules",
  "/__vite",
];

const ALWAYS_ALLOWED_EXACT = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function isAlwaysAllowed(path: string): boolean {
  if (ALWAYS_ALLOWED_EXACT.includes(path)) return true;
  return ALWAYS_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Launch mode middleware.
 *
 * When launchModeEnabled=true in siteSettings DB:
 *   - All traffic redirected to /coming-soon
 *   - Exceptions:
 *     1. Path is always-allowed (API, assets, /coming-soon itself)
 *     2. Request has valid am_preview bypass cookie matching previewSecret
 *     3. User is authenticated as admin
 *
 * Bypass via secret URL param:
 *   - Visiting /?preview=<previewSecret> sets the bypass cookie for 7 days
 */
export async function launchModeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { launchModeEnabled, previewSecret } = await getLaunchSettings();

  // Handle secret bypass param — always, so the admin can set their cookie
  if (previewSecret && req.query.preview === previewSecret) {
    res.cookie(BYPASS_COOKIE, previewSecret, {
      maxAge: BYPASS_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    const redirectTo = req.path === "/" ? "/" : req.path;
    res.redirect(302, redirectTo);
    return;
  }

  // If launch mode is off, pass through
  if (!launchModeEnabled) {
    next();
    return;
  }

  // Always-allowed paths pass through
  if (isAlwaysAllowed(req.path)) {
    next();
    return;
  }

  // Check bypass cookie
  const cookies = parseCookies(req.headers.cookie);
  if (previewSecret && cookies[BYPASS_COOKIE] === previewSecret) {
    next();
    return;
  }

  // Check if user is admin
  try {
    const user = await sdk.authenticateRequest(req);
    if (user && user.role === "admin") {
      next();
      return;
    }
  } catch {
    // Not authenticated — fall through to redirect
  }

  // Redirect to coming-soon
  res.redirect(302, "/coming-soon");
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key.trim(), decodeURIComponent(val.join("="))];
    })
  );
}
