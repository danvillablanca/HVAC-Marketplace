import { describe, it, expect } from "vitest";
import { leadCreateSchema, leadUpdateSchema } from "./lead";

const uuid = "00000000-0000-4000-8000-000000000000";
const uuid2 = "11111111-1111-4111-8111-111111111111";

describe("schemas/lead", () => {
  describe("leadCreateSchema", () => {
    const base = {
      providerId: uuid,
      description: "Necesito instalar un equipo split en la oficina",
    };

    it("acepta una solicitud valida con defaults", () => {
      const result = leadCreateSchema.safeParse(base);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.urgency).toBe("media");
        expect(result.data.preferredContact).toBe("whatsapp");
        expect(result.data.serviceId).toBeUndefined();
      }
    });

    it("acepta serviceId UUID y valores de enum", () => {
      const result = leadCreateSchema.safeParse({
        ...base,
        serviceId: uuid2,
        urgency: "alta",
        preferredContact: "telefono",
      });
      expect(result.success).toBe(true);
    });

    it("acepta serviceId null", () => {
      expect(leadCreateSchema.safeParse({ ...base, serviceId: null }).success).toBe(true);
    });

    it("rechaza descripcion demasiado corta", () => {
      expect(leadCreateSchema.safeParse({ ...base, description: "corto" }).success).toBe(false);
    });

    it("rechaza providerId no UUID", () => {
      expect(leadCreateSchema.safeParse({ ...base, providerId: "abc" }).success).toBe(false);
    });

    it("rechaza serviceId no UUID", () => {
      expect(leadCreateSchema.safeParse({ ...base, serviceId: "abc" }).success).toBe(false);
    });

    it("rechaza urgencia fuera del enum", () => {
      expect(leadCreateSchema.safeParse({ ...base, urgency: "urgente" }).success).toBe(false);
    });

    it("rechaza contacto fuera del enum", () => {
      expect(leadCreateSchema.safeParse({ ...base, preferredContact: "sms" }).success).toBe(false);
    });
  });

  describe("leadUpdateSchema", () => {
    it("acepta cada estado permitido", () => {
      for (const status of ["nuevo", "contactado", "cotizado", "cerrado", "perdido"] as const) {
        expect(leadUpdateSchema.safeParse({ status }).success).toBe(true);
      }
    });

    it("acepta una nota opcional y la recorta", () => {
      const result = leadUpdateSchema.safeParse({ status: "cerrado", note: "  listo  " });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.note).toBe("listo");
    });

    it("rechaza un estado fuera del enum", () => {
      expect(leadUpdateSchema.safeParse({ status: "abierto" }).success).toBe(false);
    });

    it("rechaza una nota mayor a 500 caracteres", () => {
      expect(leadUpdateSchema.safeParse({ status: "nuevo", note: "x".repeat(501) }).success).toBe(
        false,
      );
    });
  });
});
