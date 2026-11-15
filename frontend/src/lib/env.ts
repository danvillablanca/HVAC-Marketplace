import type { StyleSpecification } from "maplibre-gl";

/** Los valores de ejemplo de .env.example ("your-...") cuentan como no configurados. */
const real = (value: string | undefined) => (value && !value.startsWith("your-") ? value : "");

/** Configuracion de entorno del frontend. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: real(import.meta.env.VITE_SUPABASE_ANON_KEY),
  mapTilerKey: import.meta.env.VITE_MAPTILER_KEY ?? "",
  demoMode: import.meta.env.VITE_DEMO_MODE === "true",
  /** REQ-AUT-06: mostrar "Continuar con Google" solo si el proveedor OAuth esta configurado. */
  googleAuthEnabled: import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true",
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isDemoMode = env.demoMode;

/** Fuentes para las etiquetas del mapa (contador de clusters). */
export const MAP_GLYPHS = "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf";
export const MAP_FONT = ["Open Sans Regular"];

/**
 * Estilo de mapa para MapLibre (REQ-BUS-04).
 * - Con `VITE_MAPTILER_KEY` usa MapTiler (streets-v2).
 * - Sin key usa teselas raster de OpenStreetMap, con su atribucion.
 */
export function mapStyle(): string | StyleSpecification {
  if (env.mapTilerKey) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${env.mapTilerKey}`;
  }
  return {
    version: 8,
    glyphs: MAP_GLYPHS,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  };
}
