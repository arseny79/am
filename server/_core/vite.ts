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
    title: "acquisition.market | Buy & Sell Businesses and Digital Assets",
    description: "Confidentiality-first acquisition marketplace for businesses and digital assets. Curated listings, verified buyers, and a structured path from intro to close.",
  },
  "/marketplace": {
    title: "Browse Businesses & Assets for Sale | acquisition.market",
    description: "Browse verified businesses and assets for sale. Filter by revenue, location, and type. Confidential listings with structured deal flow.",
  },
  "/browse": {
    title: "Browse Businesses & Assets for Sale | acquisition.market",
    description: "Browse verified businesses and assets for sale. Filter by revenue, location, and type. Confidential listings with structured deal flow.",
  },
  "/valuation-tool": {
    title: "Free Business Valuation Calculator | acquisition.market",
    description: "Get an instant estimate of your business value. Based on real M&A transaction data.",
  },
  "/valuate": {
    title: "Free Business Valuation Calculator | acquisition.market",
    description: "Get an instant estimate of your business value. Based on real M&A transaction data.",
  },
  "/how-it-works": {
    title: "How It Works | acquisition.market",
    description: "Learn how to buy or sell a business or asset on our confidential marketplace. Step-by-step from listing to closing.",
  },
  "/pricing": {
    title: "Pricing | acquisition.market",
    description: "Simple, transparent pricing for sellers and buyers. No upfront fees to list your business.",
  },
  "/faq": {
    title: "FAQ | acquisition.market",
    description: "Frequently asked questions about buying and selling businesses and assets on acquisition.market.",
  },
  "/contact": {
    title: "Contact Us | acquisition.market",
    description: "Get in touch with the acquisition.market team. We help business owners and buyers navigate the acquisition process.",
  },
  "/create-listing": {
    title: "List Your Business or Asset | acquisition.market",
    description: "List your business or asset for sale. Reach verified, qualified buyers confidentially.",
  },
  "/buy-asset": {
    title: "Buy a Business or Asset | acquisition.market",
    description: "Submit a buyer request and get matched with businesses and assets that fit your criteria.",
  },
  "/broker": {
    title: "Broker Program | acquisition.market",
    description: "Partner with acquisition.market as a broker. List client businesses and earn commissions on successful deals.",
  },
  "/broker/how-it-works": {
    title: "Broker Program — How It Works | acquisition.market",
    description: "Learn how the acquisition.market broker program works. List clients, manage deals, earn commissions.",
  },
  "/broker/faq": {
    title: "Broker FAQ | acquisition.market",
    description: "Frequently asked questions about the acquisition.market broker partner program.",
  },
  "/professionals": {
    title: "M&A Professional Directory | acquisition.market",
    description: "Find M&A advisors, lawyers, and accountants specializing in business acquisition transactions.",
  },
  "/affiliate": {
    title: "Affiliate Program | acquisition.market",
    description: "Earn commissions by referring buyers and sellers to acquisition.market.",
  },
};

const DEFAULT_META = {
  title: "acquisition.market | Buy & Sell Businesses and Digital Assets",
  description: "Confidentiality-first acquisition marketplace for businesses and digital assets. Curated listings, verified buyers, and a structured path from intro to close.",
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
            title: `${l.businessName} | For Sale | acquisition.market`,
            description: `${l.businessName} — Business for sale in ${l.location}. ${price}${revenue}View details on acquisition.market.`.slice(0, 160),
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
  const canonical = `https://acquisition.market${urlPath}`;
  const image = "https://acquisition.market/og-image.png";

  const tags = [
    `<title>${meta.title}</title>`,
    `<meta name="description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:title" content="${meta.title.replace(/"/g, "&quot;")}">`,
    `<meta property="og:description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="acquisition.market">`,
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
