import { describe, it, expect } from "vitest";
import { distanceMeters, toKm } from "./geo";

const SANTIAGO = { lat: -33.4489, lng: -70.6693 };
const VALPARAISO = { lat: -33.0472, lng: -71.6127 };

describe("lib/geo", () => {
  describe("distanceMeters", () => {
    it("devuelve 0 para el mismo punto", () => {
      expect(distanceMeters(SANTIAGO, SANTIAGO)).toBe(0);
    });

    it("calcula Santiago -> Valparaíso en ~100 km (±15)", () => {
      const km = toKm(distanceMeters(SANTIAGO, VALPARAISO));
      expect(km).toBeGreaterThan(85);
      expect(km).toBeLessThan(115);
    });

    it("es simétrica", () => {
      const a = distanceMeters(SANTIAGO, VALPARAISO);
      const b = distanceMeters(VALPARAISO, SANTIAGO);
      expect(a).toBeCloseTo(b, 6);
    });

    it("nunca devuelve negativos", () => {
      expect(distanceMeters(VALPARAISO, SANTIAGO)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("toKm", () => {
    it("convierte metros a kilómetros", () => {
      expect(toKm(1000)).toBe(1);
      expect(toKm(2500)).toBe(2.5);
    });

    it("convierte 0 en 0", () => {
      expect(toKm(0)).toBe(0);
    });
  });
});
