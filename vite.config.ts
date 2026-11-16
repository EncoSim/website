import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    svgr({ svgrOptions: { dimensions: false } }), // without width/height so CSS sizes it
  ],
  server:
    mode === "staging"
      ? {
          // Running on Uberspace, behind its proxy — /api never reaches
          // Vite at all (Caddy routes it to 8002 directly), so no proxy
          // config is needed here, only what HMR needs to work publicly.
          host: true,
          port: 5174,
          allowedHosts: ["dev.encosim.com"],
          hmr: { protocol: "wss", host: "dev.encosim.com", clientPort: 443 },
        }
      : {
          // Local dev — nothing public is routing /api anywhere,
          // so Vite's own proxy has to forward it to your local backend.
          proxy: {
            "/api": { target: "http://localhost:8000", changeOrigin: true },
          },
        },
}));
