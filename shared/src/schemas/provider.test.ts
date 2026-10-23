import { describe, it, expect } from "vitest";
import {
  providerUpsertSchema,
  providerServiceSchema,
  verificationDecisionSchema,
} from "./provider";

const uuid = "00000000-0000-4000-8000-000000000000";
const uuid2 = "11111111-1111-4111-8111-111111111111";

const validProvider = {
  legalName: "Clima Total SpA",
  rut: "12.345.678-5",
  email: "contacto@clima.cl",
  phone: "912345678",
  segment: "residencial" as const,
  address: "Av. Siempre Viva 123",
  commune: "Providencia",
  region: "Metropolitana de Santiago",
  lat: -33.4489,
  lng: -70.6693,
};

describe("schemas/provider", () => {
  describe("providerServiceSchema", () => {
    it("acepta un servicio valido", () => {
      const result = providerServiceSchema.safeParse({ serviceId: uuid });
      expect(result.success).toBe(true);
    });

    it("acepta precio, unidad y nulos", () => {
      const result = providerServiceSchema.safeParse({
        serviceId: uuid,
        priceFrom: 25000,
        unit: "por equipo",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.priceFrom).toBe(25000);
    });

    it("rechaza un serviceId no UUID", () => {
      expect(providerServiceSchema.safeParse({ serviceId: "abc" }).success).toBe(false);
    });

    it("rechaza un precio negativo o decimal", () => {
      expect(providerServiceSchema.safeParse({ serviceId: uuid, priceFrom: -1 }).success).toBe(
        false,
      );
      expect(providerServiceSchema.safeParse({ serviceId: uuid, priceFrom: 10.5 }).success).toBe(
        false,
      );
    });

    it("rechaza una unidad demasiado larga", () => {
      expect(
        providerServiceSchema.safeParse({ serviceId: uuid, unit: "x".repeat(41) }).success,
      ).toBe(false);
    });
  });

  describe("providerUpsertSchema", () => {
    it("acepta un proveedor valido con defaults", () => {
      const result = providerUpsertSchema.safeParse(validProvider);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.modalities).toEqual([]);
        expect(result.data.services).toEqual([]);
        expect(result.data.rut).toBe("123456785");
        expect(result.data.phone).toBe("+56912345678");
      }
    });

    it("acepta modulos y servicios con datos completos", () => {
      const result = providerUpsertSchema.safeParse({
        ...validProvider,
        segment: "industrial",
        modalities: ["Visita a domicilio", "Boleta electronica"],
        services: [{ serviceId: uuid, priceFrom: 1000, unit: "hora" }],
      });
      expect(result.success).toBe(true);
    });

    it("rechaza razon social demasiado corta", () => {
      expect(providerUpsertSchema.safeParse({ ...validProvider, legalName: "ab" }).success).toBe(
        false,
      );
    });

    it("rechaza RUT invalido", () => {
      expect(providerUpsertSchema.safeParse({ ...validProvider, rut: "12345678-9" }).success).toBe(
        false,
      );
    });

    it("rechaza email y telefono invalidos", () => {
      expect(providerUpsertSchema.safeParse({ ...validProvider, email: "nope" }).success).toBe(
        false,
      );
      expect(providerUpsertSchema.safeParse({ ...validProvider, phone: "123" }).success).toBe(
        false,
      );
    });

    it("rechaza un segmento fuera del enum", () => {
      expect(providerUpsertSchema.safeParse({ ...validProvider, segment: "otro" }).success).toBe(
        false,
      );
    });

    it("rechaza lat fuera de Chile", () => {
      expect(providerUpsertSchema.safeParse({ ...validProvider, lat: -16 }).success).toBe(false);
      expect(providerUpsertSchema.safeParse({ ...validProvider, lat: -57 }).success).toBe(false);
    });

    it("rechaza lng fuera de Chile", () => {
      expect(providerUpsertSchema.safeParse({ ...validProvider, lng: -65 }).success).toBe(false);
      expect(providerUpsertSchema.safeParse({ ...validProvider, lng: -77 }).success).toBe(false);
    });

    it("rechaza comunas/direcciones demasiado cortas", () => {
      expect(providerUpsertSchema.safeParse({ ...validProvider, commune: "a" }).success).toBe(
        false,
      );
      expect(providerUpsertSchema.safeParse({ ...validProvider, address: "abc" }).success).toBe(
        false,
      );
    });

    it("rechaza servicios con serviceId no UUID", () => {
      expect(
        providerUpsertSchema.safeParse({
          ...validProvider,
          services: [{ serviceId: "no-uuid" }],
        }).success,
      ).toBe(false);
    });

    it("rechaza mas de 10 modalidades", () => {
      expect(
        providerUpsertSchema.safeParse({
          ...validProvider,
          modalities: Array.from({ length: 11 }, () => "modalidad valida"),
        }).success,
      ).toBe(false);
    });
  });

  describe("verificationDecisionSchema", () => {
    it("acepta cada decision permitida", () => {
      for (const decision of ["verificado", "rechazado", "en_revision"] as const) {
        expect(verificationDecisionSchema.safeParse({ providerId: uuid, decision }).success).toBe(
          true,
        );
      }
    });

    it("acepta una nota opcional y la recorta", () => {
      const result = verificationDecisionSchema.safeParse({
        providerId: uuid2,
        decision: "verificado",
        note: "  todo ok  ",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.note).toBe("todo ok");
    });

    it("rechaza una decision desconocida", () => {
      expect(
        verificationDecisionSchema.safeParse({ providerId: uuid, decision: "pendiente" }).success,
      ).toBe(false);
    });

    it("rechaza providerId no UUID", () => {
      expect(
        verificationDecisionSchema.safeParse({ providerId: "x", decision: "verificado" }).success,
      ).toBe(false);
    });

    it("rechaza una nota mayor a 500 caracteres", () => {
      expect(
        verificationDecisionSchema.safeParse({
          providerId: uuid,
          decision: "rechazado",
          note: "x".repeat(501),
        }).success,
      ).toBe(false);
    });
  });
});
