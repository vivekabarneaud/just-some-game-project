/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  // Unit tests (Vitest). Reuses the resolve alias + workspace package below.
  // Pure logic runs in `node`; add a jsdom env later if we test components.
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  // Workspace package — don't pre-bundle it, otherwise edits in shared/src
  // serve stale code from .vite/deps/ until the cache is manually cleared.
  optimizeDeps: {
    exclude: ["@medieval-realm/shared"],
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
      },
      "/ws": {
        target: "http://localhost:4000",
        ws: true, // forward WebSocket upgrade requests to the backend
      },
    },
  },
});
