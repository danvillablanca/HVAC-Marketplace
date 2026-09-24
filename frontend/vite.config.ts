import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // .env vive en la raiz del monorepo; Vite solo expone las VITE_*.
  envDir: fileURLToPath(new URL("..", import.meta.url)),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    // MapLibre crea su worker de forma dinamica; el optimizador de Vite 8
    // rompe la ruta del worker (maplibre-gl-worker.mjs) y no cargan los tiles.
    exclude: ["maplibre-gl"],
  },
  worker: {
    format: "es",
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
