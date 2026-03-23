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
    title: "MSP M&A Marketplace | Buy & Sell Managed Service Provider Businesses",
    description: "Confidentiality-first M&A marketplace for managed service providers. Curated listings, verified buyers, and a structured path from intro to LOI.",
  },
  "/marketplace": {
    title: "Browse MSP Businesses for Sale | MSP Investments",
    description: "Browse verified MSP businesses for sale. Filter by revenue, location, and service type. Confidential listings with structured deal flow.",
  },
  "/browse": {
    title: "Browse MSP Businesses for Sale | MSP Investments",
    description: "Browse verified MSP businesses for sale. Filter by revenue, location, and service type. Confidential listings with structured deal flow.",
  },
  "/valuation-tool": {
    title: "Free MSP Valuation Calculator | MSP Investments",
    description: "Get an instant estimate of your MSP's value. Based on real M&A data from managed service provider transactions.",
  },
  "/valuate": {
    title: "Free MSP Valuation Calculator | MSP Investments",
    description: "Get an instant estimate of your MSP's value. Based on real M&A data from managed service provider transactions.",
  },
  "/how-it-works": {
    title: "How It Works | MSP Investments",
    description: "Learn how to buy or sell an MSP business through our confidential marketplace. Step-by-step from listing to closing.",
  },
  "/pricing": {
    title: "Pricing | MSP Investments",
    description: "Simple, transparent pricing for MSP sellers and buyers. No upfront fees to list your business.",
  },
  "/faq": {
    title: "FAQ | MSP Investments",
    description: "Frequently asked questions about buying and selling MSP businesses on MSP Investments.",
  },
  "/contact": {
    title: "Contact Us | MSP Investments",
    description: "Get in touch with the MSP Investments team. We help MSP owners and buyers navigate the M&A process.",
  },
  "/create-listing": {
    title: "List Your MSP Business | MSP Investments",
    description: "List your managed service provider business for sale. Reach verified, qualified buyers confidentially.",
  },
  "/buy-asset": {
    title: "Buy an MSP Business | MSP Investments",
    description: "Submit a buyer request and get matched with MSP businesses that fit your criteria.",
  },
  "/broker": {
    title: "MSP Broker Program | MSP Investments",
    description: "Partner with MSP Investments as a broker. List client businesses and earn commissions on successful deals.",
  },
  "/broker/how-it-works": {
    title: "Broker Program — How It Works | MSP Investments",
    description: "Learn how the MSP Investments broker program works. List clients, manage deals, earn commissions.",
  },
  "/broker/faq": {
    title: "Broker FAQ | MSP Investments",
    description: "Frequently asked questions about the MSP Investments broker partner program.",
  },
  "/professionals": {
    title: "MSP M&A Professional Directory | MSP Investments",
    description: "Find M&A advisors, lawyers, and accountants specializing in MSP transactions.",
  },
  "/affiliate": {
    title: "Affiliate Program | MSP Investments",
    description: "Earn commissions by referring MSP buyers and sellers to MSP Investments.",
  },
};

const DEFAULT_META = {
  title: "MSP M&A Marketplace | Buy & Sell Managed Service Provider Businesses",
  description: "Confidentiality-first M&A marketplace for managed service providers. Curated listings, verified buyers, and a structured path from intro to LOI.",
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
            title: `${l.businessName} | MSP for Sale | MSP Investments`,
            description: `${l.businessName} — MSP business for sale in ${l.location}. ${price}${revenue}View details on MSP Investments.`.slice(0, 160),
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
  const canonical = `https://msp.investments${urlPath}`;
  const image = "https://msp.investments/og-image.png";

  const tags = [
    `<title>${meta.title}</title>`,
    `<meta name="description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:title" content="${meta.title.replace(/"/g, "&quot;")}">`,
    `<meta property="og:description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="MSP Investments">`,
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
