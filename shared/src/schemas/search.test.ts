import { describe, it, expect } from "vitest";
import { nearbySearchSchema, chatSchema } from "./search";

const uuid = "00000000-0000-4000-8000-000000000000";

describe("schemas/search", () => {
  describe("nearbySearchSchema", () => {
    it("convierte strings a numeros con z.coerce", () => {
      const result = nearbySearchSchema.safeParse({
        lat: "-33.4489",
        lng: "-70.6693",
        radiusKm: "30",
        limit: "5",
        offset: "2",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lat).toBeCloseTo(-33.4489);
        expect(result.data.lng).toBeCloseTo(-70.6693);
        expect(result.data.radiusKm).toBe(30);
        expect(result.data.limit).toBe(5);
        expect(result.data.offset).toBe(2);
      }
    });

    it("aplica defaults de radiusKm, limit y offset", () => {
      const result = nearbySearchSchema.safeParse({ lat: -33.4489, lng: -70.6693 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.radiusKm).toBe(15);
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it("acepta segmento, serviceId y query opcionales", () => {
      const result = nearbySearchSchema.safeParse({
        lat: -33.4489,
        lng: -70.6693,
        segment: "comercial",
        serviceId: uuid,
        query: "split",
      });
      expect(result.success).toBe(true);
    });

    it("rechaza coordenadas fuera de Chile", () => {
      expect(nearbySearchSchema.safeParse({ lat: -16, lng: -70 }).success).toBe(false);
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -65 }).success).toBe(false);
    });

    it("rechaza coordenadas no numericas", () => {
      expect(nearbySearchSchema.safeParse({ lat: "abc", lng: -70 }).success).toBe(false);
    });

    it("aplica limites de radiusKm (1..100)", () => {
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -70, radiusKm: 0 }).success).toBe(false);
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -70, radiusKm: 1 }).success).toBe(true);
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -70, radiusKm: 100 }).success).toBe(
        true,
      );
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -70, radiusKm: 101 }).success).toBe(
        false,
      );
    });

    it("aplica limites de limit (1..50) y offset (>=0)", () => {
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -70, limit: 0 }).success).toBe(false);
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -70, limit: 51 }).success).toBe(false);
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -70, offset: -1 }).success).toBe(false);
    });

    it("rechaza un segmento fuera del enum", () => {
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -70, segment: "otro" }).success).toBe(
        false,
      );
    });

    it("rechaza un serviceId no UUID", () => {
      expect(nearbySearchSchema.safeParse({ lat: -33, lng: -70, serviceId: "abc" }).success).toBe(
        false,
      );
    });

    it("rechaza query mayor a 120 caracteres", () => {
      expect(
        nearbySearchSchema.safeParse({ lat: -33, lng: -70, query: "x".repeat(121) }).success,
      ).toBe(false);
    });
  });

  describe("chatSchema", () => {
    it("acepta un mensaje valido y recorta espacios", () => {
      const result = chatSchema.safeParse({ message: "  hola  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("hola");
        expect(result.data.sessionId).toBeUndefined();
      }
    });

    it("acepta un sessionId opcional", () => {
      const result = chatSchema.safeParse({ sessionId: "abc-123", message: "hola" });
      expect(result.success).toBe(true);
    });

    it("rechaza mensaje vacio", () => {
      expect(chatSchema.safeParse({ message: "" }).success).toBe(false);
      expect(chatSchema.safeParse({ message: "   " }).success).toBe(false);
    });

    it("rechaza mensaje mayor a 2000 caracteres", () => {
      expect(chatSchema.safeParse({ message: "x".repeat(2001) }).success).toBe(false);
    });

    it("rechaza sessionId mayor a 80 caracteres", () => {
      expect(chatSchema.safeParse({ sessionId: "x".repeat(81), message: "hola" }).success).toBe(
        false,
      );
    });
  });
});
