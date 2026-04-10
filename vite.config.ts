import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

const isDev = process.env.NODE_ENV !== "production";

// Manus runtime plugin is only needed in the Manus dev environment
const devOnlyPlugins = isDev
  ? [await import("vite-plugin-manus-runtime").then((m) => m.vitePluginManusRuntime())]
  : [];

export default defineConfig({
  plugins: [react(), tailwindcss(), jsxLocPlugin(), ...devOnlyPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      // Manus dev environments
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      // Railway preview deployments
      ".railway.app",
      ".up.railway.app",
      // Production domain
      "acquisitions.market",
      "www.acquisitions.market",
      // Local
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    hmr: {
      protocol: "wss",
      clientPort: 443,
    },
  },
});
