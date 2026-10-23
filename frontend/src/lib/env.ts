/** Configuracion de entorno del frontend. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  mapTilerKey: import.meta.env.VITE_MAPTILER_KEY ?? "",
  /**
   * Modo demo (VITE_DEMO_MODE=true): el frontend no llama al backend y usa solo los
   * datos demo locales. Pensado para publicar una vitrina estatica (p. ej. Render).
   */
  demoMode: import.meta.env.VITE_DEMO_MODE === "true",
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);

/**
 * Estilo de mapa para MapLibre.
 * - Con `VITE_MAPTILER_KEY` usa MapTiler (streets-v2).
 * - Sin key usa OpenFreeMap (tiles vectoriales reales, gratis y sin API key).
 */
export function mapStyleUrl(): string {
  if (env.mapTilerKey) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${env.mapTilerKey}`;
  }
  return "https://tiles.openfreemap.org/styles/positron";
}
