import type { Request, Response, NextFunction } from "express";
import { sdk } from "./sdk";

const BYPASS_COOKIE = "am_preview";
const BYPASS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

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
 * When LAUNCH_MODE=true:
 *   - All traffic is redirected to /coming-soon
 *   - Exceptions:
 *     1. Path is always-allowed (API, assets, /coming-soon itself)
 *     2. Request has valid am_preview bypass cookie
 *     3. User is authenticated as admin
 *
 * Bypass via secret URL param:
 *   - Visiting /?preview=<PREVIEW_SECRET> sets the bypass cookie and redirects to /
 *   - Cookie lasts 7 days
 */
export async function launchModeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const launchMode = process.env.LAUNCH_MODE === "true";
  const previewSecret = process.env.PREVIEW_SECRET;

  // Handle secret bypass param — always, regardless of LAUNCH_MODE
  // This lets you set the cookie even before LAUNCH_MODE is enabled
  if (previewSecret && req.query.preview === previewSecret) {
    res.cookie(BYPASS_COOKIE, previewSecret, {
      maxAge: BYPASS_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    // Redirect to the path without the preview param
    const redirectTo = req.path === "/" ? "/" : req.path;
    res.redirect(302, redirectTo);
    return;
  }

  // If launch mode is not active, pass through
  if (!launchMode) {
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

  // Check if user is admin (authenticated)
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
