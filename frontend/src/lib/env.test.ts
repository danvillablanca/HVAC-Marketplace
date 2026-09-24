import { describe, it, expect, afterEach } from "vitest";
import { env, hasSupabaseConfig, mapStyleUrl } from "./env";

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

  describe("mapStyleUrl", () => {
    it("usa OpenFreeMap cuando no hay key de MapTiler", () => {
      env.mapTilerKey = "";
      expect(mapStyleUrl()).toBe("https://tiles.openfreemap.org/styles/positron");
    });

    it("usa MapTiler streets-v2 cuando hay key", () => {
      env.mapTilerKey = "abc123";
      const url = mapStyleUrl();
      expect(url).toContain("api.maptiler.com/maps/streets-v2/style.json");
      expect(url).toContain("key=abc123");
    });
  });
});
