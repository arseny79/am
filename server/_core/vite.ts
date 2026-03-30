import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getDb } from "../db";
import { listings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Meta tags for every static page
const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "AM | iGaming M&A Marketplace — Buy & Sell iGaming Businesses",
    description: "The confidentiality-first marketplace for iGaming M&A. Operators, affiliates, tech platforms and more — curated listings, verified buyers, structured deal flow.",
  },
  "/marketplace": {
    title: "Browse iGaming Businesses for Sale | AM",
    description: "Browse verified iGaming businesses for sale. Filter by category, revenue, and location. Confidential listings with structured deal flow.",
  },
  "/browse": {
    title: "Browse iGaming Businesses for Sale | AM",
    description: "Browse verified iGaming businesses for sale. Filter by category, revenue, and location. Confidential listings with structured deal flow.",
  },
  "/valuation-tool": {
    title: "iGaming Business Valuation Calculator | AM",
    description: "Get an instant estimate of your iGaming business value. Based on real M&A transaction data from the iGaming industry.",
  },
  "/valuate": {
    title: "iGaming Business Valuation Calculator | AM",
    description: "Get an instant estimate of your iGaming business value. Based on real M&A transaction data from the iGaming industry.",
  },
  "/how-it-works": {
    title: "How It Works | AM",
    description: "Learn how to buy or sell an iGaming business through our confidential marketplace. Step-by-step from listing to closing.",
  },
  "/pricing": {
    title: "Pricing | AM",
    description: "Simple, transparent pricing for iGaming sellers and buyers. No upfront fees to list your business.",
  },
  "/faq": {
    title: "FAQ | AM",
    description: "Frequently asked questions about buying and selling iGaming businesses on AM.",
  },
  "/contact": {
    title: "Contact Us | AM",
    description: "Get in touch with the AM team. We help iGaming business owners and buyers navigate the M&A process.",
  },
  "/create-listing": {
    title: "List Your iGaming Business | AM",
    description: "List your iGaming business for sale or raise investment. Reach verified, qualified buyers and investors confidentially.",
  },
  "/buy-asset": {
    title: "Buy an iGaming Business | AM",
    description: "Submit a buyer request and get matched with iGaming businesses that fit your acquisition criteria.",
  },
  "/broker": {
    title: "Broker Program | AM",
    description: "Partner with AM as a broker. List client iGaming businesses and earn commissions on successful deals.",
  },
  "/broker/how-it-works": {
    title: "Broker Program — How It Works | AM",
    description: "Learn how the AM broker program works. List iGaming clients, manage deals, earn commissions.",
  },
  "/broker/faq": {
    title: "Broker FAQ | AM",
    description: "Frequently asked questions about the AM broker partner program.",
  },
  "/professionals": {
    title: "iGaming M&A Professional Directory | AM",
    description: "Find M&A advisors, lawyers, and accountants specializing in iGaming transactions.",
  },
  "/affiliate": {
    title: "Affiliate Program | AM",
    description: "Earn commissions by referring iGaming buyers and sellers to AM.",
  },
};

const DEFAULT_META = {
  title: "AM | iGaming M&A Marketplace — Buy & Sell iGaming Businesses",
  description: "The confidentiality-first marketplace for iGaming M&A. Operators, affiliates, tech platforms and more — curated listings, verified buyers, structured deal flow.",
};

async function getMetaForUrl(url: string): Promise<{ title: string; description: string }> {
  const urlPath = url.split("?")[0].split("#")[0];

  // Static page lookup
  if (PAGE_META[urlPath]) {
    return PAGE_META[urlPath];
  }

  // Dynamic listing pages: /listing/:id
  const listingMatch = urlPath.match(/^\/listing\/(\d+)/);
  if (listingMatch) {
    const listingId = parseInt(listingMatch[1]);
    try {
      const db = await getDb();
      if (db) {
        const result = await db
          .select({
            businessName: listings.businessName,
            description: listings.description,
            location: listings.location,
            annualRevenue: listings.annualRevenue,
            askingPrice: listings.askingPrice,
          })
          .from(listings)
          .where(eq(listings.id, listingId))
          .limit(1);

        if (result[0]) {
          const l = result[0];
          const price = l.askingPrice
            ? `Asking $${(l.askingPrice / 1000).toFixed(0)}K. `
            : "";
          const revenue = l.annualRevenue
            ? `$${(l.annualRevenue / 1000).toFixed(0)}K annual revenue. `
            : "";
          return {
            title: `${l.businessName} | iGaming Business for Sale | AM iGaming`,
            description: `${l.businessName} — iGaming business for sale in ${l.location}. ${price}${revenue}View details on AM iGaming Marketplace.`.slice(0, 160),
          };
        }
      }
    } catch {
      // Fall through to default
    }
  }

  return DEFAULT_META;
}

function injectMetaTags(
  html: string,
  meta: { title: string; description: string },
  urlPath: string
): string {
  const canonical = `https://acq.market${urlPath}`;
  const image = "https://acq.market/og-image.png";

  const tags = [
    `<title>${meta.title}</title>`,
    `<meta name="description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:title" content="${meta.title.replace(/"/g, "&quot;")}">`,
    `<meta property="og:description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="AM iGaming Marketplace">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${meta.title.replace(/"/g, "&quot;")}">`,
    `<meta name="twitter:description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<meta name="twitter:image" content="${image}">`,
  ].join("\n    ");

  // Replace existing <title> tag and inject all meta before </head>
  return html
    .replace(/<title>[^<]*<\/title>/, "")
    .replace("</head>", `  ${tags}\n  </head>`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      let page = await vite.transformIndexHtml(url, template);
      const meta = await getMetaForUrl(url);
      page = injectMetaTags(page, meta, url.split("?")[0]);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // For all routes, inject server-side meta tags before serving index.html
  app.use("*", async (req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      let html = await fs.promises.readFile(indexPath, "utf-8");
      const meta = await getMetaForUrl(req.originalUrl);
      html = injectMetaTags(html, meta, req.originalUrl.split("?")[0]);
      res.set("Content-Type", "text/html").send(html);
    } catch {
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
