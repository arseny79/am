import type { Request, Response, NextFunction, RequestHandler } from "express";

const COOKIE_NAME = "am_preview_access";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

const COMING_SOON_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Launching Soon — AM Marketplace</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #0a0f1e;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 2rem;
      overflow: hidden;
    }

    /* Subtle grid background */
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.06) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
    }

    /* Radial glow */
    body::after {
      content: "";
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -60%);
      width: 800px;
      height: 600px;
      background: radial-gradient(ellipse, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .container {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 600px;
      animation: fadeUp 0.8s ease both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .logo-ring {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      margin-bottom: 2rem;
      box-shadow: 0 0 40px rgba(99, 102, 241, 0.4);
    }

    .logo-ring svg {
      width: 36px;
      height: 36px;
      fill: none;
      stroke: #fff;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.4);
      border-radius: 999px;
      padding: 0.3rem 0.9rem;
      margin-bottom: 1.5rem;
      background: rgba(99, 102, 241, 0.08);
    }

    h1 {
      font-size: clamp(2rem, 5vw, 3.25rem);
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: #f1f5f9;
      margin-bottom: 1.25rem;
    }

    h1 span {
      background: linear-gradient(135deg, #6366f1, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    p {
      font-size: 1.05rem;
      line-height: 1.7;
      color: #94a3b8;
      margin-bottom: 2.5rem;
    }

    .notify-form {
      display: flex;
      gap: 0.5rem;
      max-width: 420px;
      margin: 0 auto 2.5rem;
    }

    .notify-form input {
      flex: 1;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      color: #f1f5f9;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .notify-form input::placeholder { color: #475569; }
    .notify-form input:focus { border-color: #6366f1; }

    .notify-form button {
      padding: 0.75rem 1.4rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s, transform 0.1s;
    }

    .notify-form button:hover { opacity: 0.9; transform: translateY(-1px); }
    .notify-form button:active { transform: translateY(0); }

    .divider {
      width: 40px;
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin: 0 auto 2rem;
    }

    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }

    .feature-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.78rem;
      color: #64748b;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 999px;
      padding: 0.3rem 0.85rem;
    }

    .feature-pill::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6366f1;
      flex-shrink: 0;
    }

    .footer-note {
      margin-top: 3rem;
      font-size: 0.75rem;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-ring">
      <!-- building/marketplace icon -->
      <svg viewBox="0 0 24 24">
        <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V12h6v9"/>
      </svg>
    </div>

    <div class="badge">Coming Soon</div>

    <h1>The <span>M&amp;A Marketplace</span><br/>is almost ready.</h1>

    <p>
      We're putting the finishing touches on a smarter way to buy and sell businesses.
      Leave your email and we'll let you know the moment we go live.
    </p>

    <form class="notify-form" onsubmit="handleSubmit(event)">
      <input type="email" id="emailInput" placeholder="you@company.com" autocomplete="email" required />
      <button type="submit">Notify me</button>
    </form>

    <div class="divider"></div>

    <div class="features">
      <span class="feature-pill">Verified listings</span>
      <span class="feature-pill">NDA-protected deal rooms</span>
      <span class="feature-pill">Escrow-secured transactions</span>
      <span class="feature-pill">KYC &amp; identity checks</span>
      <span class="feature-pill">DocuSign integration</span>
    </div>

    <p class="footer-note">© 2026 AM Marketplace. All rights reserved.</p>
  </div>

  <script>
    function handleSubmit(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.textContent = "You're on the list!";
      btn.disabled = true;
      e.target.querySelector('input').disabled = true;
    }
  </script>
</body>
</html>`;

/**
 * Coming-soon gate middleware.
 *
 * Activated only when the COMING_SOON_KEY environment variable is set.
 *
 * - Bypass route: GET /?preview=<COMING_SOON_KEY>
 *   Sets a 30-day bypass cookie and redirects to /
 *
 * - Requests with valid bypass cookie pass straight through.
 *
 * - All /api/* routes are always allowed through so the app keeps
 *   functioning for authenticated internal users.
 *
 * - Everyone else sees the polished "launching soon" page.
 */
export function comingSoonMiddleware(): RequestHandler {
  const key = process.env.COMING_SOON_KEY;

  // Feature disabled — passthrough
  if (!key) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  console.log("[ComingSoon] Mode active — public visitors will see the launch page.");

  return (req: Request, res: Response, next: NextFunction) => {
    // Always let API / webhook / asset routes through
    if (
      req.path.startsWith("/api/") ||
      req.path.startsWith("/assets/") ||
      req.path === "/sitemap.xml" ||
      req.path === "/robots.txt" ||
      req.path === "/favicon.ico"
    ) {
      return next();
    }

    // Unlock route: /?preview=<key>
    // Visiting this URL once sets the bypass cookie and redirects to /
    if (req.query.preview === key) {
      res.cookie(COOKIE_NAME, key, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });
      // Redirect to the path they were heading to (minus the query param)
      const destination = req.path === "/" ? "/" : req.path;
      return res.redirect(302, destination);
    }

    // Check for valid bypass cookie
    const cookieHeader = req.headers.cookie || "";
    const hasBypass = cookieHeader
      .split(";")
      .some((c) => c.trim() === `${COOKIE_NAME}=${key}`);

    if (hasBypass) {
      return next();
    }

    // Public visitor — show coming soon page
    res.status(200).type("html").send(COMING_SOON_HTML);
  };
}
