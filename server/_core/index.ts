import "dotenv/config";
import { validateEnv } from "./env";
// C5: Validate required environment variables at startup
validateEnv();
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../stripe/webhook";
import { handleIdentityWebhook } from "../stripe/identityWebhook";
import { handleEscrowWebhook } from "../webhooks/escrowWebhook";
import { handleDocuSignWebhook } from "../webhooks/docusignWebhook";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { generateSitemap } from "../sitemap";
import templateDownloadRouter from "../routes/templateDownload";
import uploadImageRouter from "../routes/uploadImage";
import uploadDocumentRouter from "../routes/uploadDocument";
import { startScheduler } from "../jobs/scheduler";
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Trust proxy - required for rate limiting and IP detection behind Manus gateway
  // Trust only the first proxy hop (the Manus gateway)
  app.set('trust proxy', 1);
  
  // Security headers via Helmet
  // Disable CSP in development to avoid blocking Vite HMR
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://www.statcounter.com", "https://cdn.leadster.com.br"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https:"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://*.leadster.com.br"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    } : false, // Disable CSP in dev mode
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny', // X-Frame-Options: DENY
    },
    noSniff: true, // X-Content-Type-Options: nosniff
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    hidePoweredBy: true, // Remove X-Powered-By header
  }));
  
  // Additional security headers not covered by Helmet
  app.use((req, res, next) => {
    // Permissions Policy (formerly Feature-Policy)
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
  
  // Rate limiting for API routes
  // Strict rate limiter for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 login attempts per 15 minutes
    message: { error: "Too many authentication attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
  });
  
  // General API rate limiter (reduced from 200 to 100)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per 15 minutes
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: "Too many requests from this IP, please try again later."
      });
    },
  });
  
  // Stricter limiter for file uploads
  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 uploads per hour
    message: { error: "Too many upload requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Webhook rate limiter (prevent webhook flooding)
  const webhookLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 webhook requests per minute
    message: { error: "Too many webhook requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.error("[Security] Webhook rate limit exceeded from IP:", req.ip);
      res.status(429).json({
        error: "Too many webhook requests, please try again later."
      });
    },
  });
  
  // Apply rate limiting to API routes
  app.use("/api/trpc", apiLimiter);
  app.use("/api/oauth", authLimiter);
  // H7: Apply strict rate limiting to email auth endpoints
  app.use("/api/trpc/emailAuth.login", authLimiter);
  app.use("/api/trpc/emailAuth.register", authLimiter);
  app.use("/api/trpc/emailAuth.forgotPassword", authLimiter);
  app.use("/api/trpc/emailAuth.resetPassword", authLimiter);
  
  // CRITICAL: Stripe webhook must use raw body parser BEFORE express.json()
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Sitemap.xml public route
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const xml = await generateSitemap(baseUrl);
      res.header("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("[Sitemap] Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });
  
  // Escrow.com webhook endpoint (with rate limiting)
  app.post("/api/escrow/webhook", webhookLimiter, handleEscrowWebhook);
  
  // DocuSign webhook endpoint (with rate limiting)
  app.post("/api/docusign/webhook", webhookLimiter, express.json(), handleDocuSignWebhook);
  
  // Template download routes
  app.use("/api/templates", templateDownloadRouter);
  
  // Image upload routes (M10: rate limited)
  app.use("/api/upload/image", uploadLimiter, uploadImageRouter);
  
  // Document upload routes (M10: rate limited)
  app.use("/api/upload/document", uploadLimiter, uploadDocumentRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start background job scheduler
    if (process.env.NODE_ENV === 'production') {
      startScheduler();
    } else {
      console.log('[Scheduler] Skipping scheduler in development mode');
    }
  });
}
startServer().catch(console.error);
