import { describe, it, expect, afterEach } from "vitest";
import { env, hasSupabaseConfig, mapStyle } from "./env";

const originalMapTilerKey = env.mapTilerKey;

afterEach(() => {
  env.mapTilerKey = originalMapTilerKey;
});

describe("lib/env", () => {
  describe("env", () => {
    it("expone apiBaseUrl como string", () => {
      expect(typeof env.apiBaseUrl).toBe("string");
      expect(env.apiBaseUrl.length).toBeGreaterThan(0);
    });

    it("expone las claves de Supabase y MapTiler", () => {
      expect(env).toHaveProperty("supabaseUrl");
      expect(env).toHaveProperty("supabaseAnonKey");
      expect(env).toHaveProperty("mapTilerKey");
    });
  });

  describe("hasSupabaseConfig", () => {
    it("es un booleano coherente con las claves", () => {
      expect(typeof hasSupabaseConfig).toBe("boolean");
      expect(hasSupabaseConfig).toBe(Boolean(env.supabaseUrl && env.supabaseAnonKey));
    });
  });

  describe("mapStyle", () => {
    it("PR-019 usa teselas raster de OpenStreetMap cuando no hay key de MapTiler", () => {
      env.mapTilerKey = "";
      const style = mapStyle();
      expect(typeof style).toBe("object");
      const source = (style as { sources: Record<string, { type: string; tiles: string[] }> })
        .sources.osm;
      expect(source.type).toBe("raster");
      expect(source.tiles[0]).toContain("tile.openstreetmap.org");
    });

    it("usa MapTiler streets-v2 cuando hay key", () => {
      env.mapTilerKey = "abc123";
      const url = mapStyle();
      expect(url).toContain("api.maptiler.com/maps/streets-v2/style.json");
      expect(url).toContain("key=abc123");
    });
  });
});
