import { describe, it, expect } from "vitest";
import { SERVICE_CATEGORIES, MODALITIES, CHILE_REGIONS, DEFAULT_MAP_CENTER } from "./constants";
import { SERVICE_SEGMENTS } from "../types/index";

describe("utils/constants", () => {
  describe("SERVICE_CATEGORIES", () => {
    it("es un catalogo no vacio", () => {
      expect(SERVICE_CATEGORIES.length).toBeGreaterThan(0);
    });

    it("tiene slugs unicos", () => {
      const slugs = SERVICE_CATEGORIES.map((c) => c.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("usa segmentos validos en cada categoria", () => {
      for (const category of SERVICE_CATEGORIES) {
        expect(SERVICE_SEGMENTS).toContain(category.segment);
        expect(category.slug.length).toBeGreaterThan(0);
        expect(category.name.length).toBeGreaterThan(0);
      }
    });

    it("incluye categorias representativas del negocio", () => {
      const slugs = SERVICE_CATEGORIES.map((c) => c.slug);
      expect(slugs).toContain("instalacion-split");
      expect(slugs).toContain("ventilacion-industrial");
    });
  });

  describe("MODALITIES", () => {
    it("es una lista no vacia de textos", () => {
      expect(MODALITIES.length).toBeGreaterThan(0);
      for (const modality of MODALITIES) {
        expect(typeof modality).toBe("string");
        expect(modality.length).toBeGreaterThan(0);
      }
    });

    it("incluye modalidades esperadas", () => {
      expect(MODALITIES).toContain("Visita a domicilio");
      expect(MODALITIES).toContain("Boleta electronica");
    });
  });

  describe("CHILE_REGIONS", () => {
    it("contiene las 16 regiones del subconjunto", () => {
      expect(CHILE_REGIONS).toHaveLength(16);
    });

    it("incluye regiones clave", () => {
      expect(CHILE_REGIONS).toContain("Arica y Parinacota");
      expect(CHILE_REGIONS).toContain("Metropolitana de Santiago");
      expect(CHILE_REGIONS).toContain("Magallanes");
    });

    it("no tiene valores duplicados", () => {
      expect(new Set(CHILE_REGIONS).size).toBe(CHILE_REGIONS.length);
    });
  });

  describe("DEFAULT_MAP_CENTER", () => {
    it("apunta a Santiago con coordenadas dentro de Chile", () => {
      expect(DEFAULT_MAP_CENTER.lat).toBeGreaterThanOrEqual(-56);
      expect(DEFAULT_MAP_CENTER.lat).toBeLessThanOrEqual(-17);
      expect(DEFAULT_MAP_CENTER.lng).toBeGreaterThanOrEqual(-76);
      expect(DEFAULT_MAP_CENTER.lng).toBeLessThanOrEqual(-66);
    });

    it("usa las coordenadas de Santiago", () => {
      expect(DEFAULT_MAP_CENTER).toEqual({ lat: -33.4489, lng: -70.6693 });
    });
  });
});
