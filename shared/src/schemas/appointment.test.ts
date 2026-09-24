import { describe, it, expect } from "vitest";
import { appointmentCreateSchema, appointmentUpdateSchema } from "./appointment";

const uuid = "00000000-0000-4000-8000-000000000000";

describe("schemas/appointment", () => {
  describe("appointmentCreateSchema", () => {
    const base = {
      leadId: uuid,
      startsAt: "2026-10-01T10:00:00-03:00",
    };

    it("acepta una cita valida y usa duracion por defecto", () => {
      const result = appointmentCreateSchema.safeParse(base);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.durationMinutes).toBe(90);
    });

    it("acepta duraciones limite (30 y 480)", () => {
      expect(appointmentCreateSchema.safeParse({ ...base, durationMinutes: 30 }).success).toBe(
        true,
      );
      expect(appointmentCreateSchema.safeParse({ ...base, durationMinutes: 480 }).success).toBe(
        true,
      );
    });

    it("acepta fecha ISO con zona Z", () => {
      expect(
        appointmentCreateSchema.safeParse({ ...base, startsAt: "2026-10-01T10:00:00Z" }).success,
      ).toBe(true);
    });

    it("rechaza fecha ISO sin offset", () => {
      expect(
        appointmentCreateSchema.safeParse({ ...base, startsAt: "2026-10-01T10:00:00" }).success,
      ).toBe(false);
    });

    it("rechaza fechas invalidas", () => {
      expect(appointmentCreateSchema.safeParse({ ...base, startsAt: "no-es-fecha" }).success).toBe(
        false,
      );
    });

    it("rechaza duracion fuera de rango o no entera", () => {
      expect(appointmentCreateSchema.safeParse({ ...base, durationMinutes: 29 }).success).toBe(
        false,
      );
      expect(appointmentCreateSchema.safeParse({ ...base, durationMinutes: 481 }).success).toBe(
        false,
      );
      expect(appointmentCreateSchema.safeParse({ ...base, durationMinutes: 60.5 }).success).toBe(
        false,
      );
    });

    it("rechaza leadId no UUID", () => {
      expect(appointmentCreateSchema.safeParse({ ...base, leadId: "abc" }).success).toBe(false);
    });
  });

  describe("appointmentUpdateSchema", () => {
    it("acepta cada estado permitido", () => {
      for (const status of ["propuesta", "confirmada", "realizada", "cancelada"] as const) {
        expect(appointmentUpdateSchema.safeParse({ status }).success).toBe(true);
      }
    });

    it("rechaza un estado fuera del enum", () => {
      expect(appointmentUpdateSchema.safeParse({ status: "reprogramada" }).success).toBe(false);
    });
  });
});
