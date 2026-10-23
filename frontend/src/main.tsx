import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { setWorkerUrl } from "maplibre-gl";
// Worker de MapLibre empaquetado por Vite (en el build de produccion maplibre no
// encuentra su worker relativo y el mapa queda sin tiles).
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth";
import { App } from "@/App";
import { queryClient } from "@/lib/query";
import { ThemeProvider } from "@/lib/theme";
import "./index.css";

// En desarrollo Vite sirve el worker original desde node_modules; solo hace falta en el build.
if (import.meta.env.PROD) setWorkerUrl(maplibreWorkerUrl);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("No se encontro #root");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={200}>
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </MotionConfig>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
