import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { appointmentCreateSchema, appointmentUpdateSchema } from "@hvac/shared";
import { HttpError } from "../lib/http";
import { createAppointment, updateAppointment } from "./appointments";

function makeInput() {
  return appointmentCreateSchema.parse({
    leadId: randomUUID(),
    startsAt: "2026-10-01T10:00:00-04:00",
    durationMinutes: 90,
  });
}

describe("createAppointment (fallback demo)", () => {
  it("crea una cita en estado propuesta", async () => {
    const input = makeInput();
    const appointment = await createAppointment(input);

    expect(appointment.leadId).toBe(input.leadId);
    expect(appointment.startsAt).toBe(input.startsAt);
    expect(appointment.status).toBe("propuesta");
    expect(appointment.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("aplica la duración por defecto del schema", () => {
    const input = appointmentCreateSchema.parse({
      leadId: randomUUID(),
      startsAt: "2026-10-01T10:00:00-04:00",
    });
    expect(input.durationMinutes).toBe(90);
  });
});

describe("updateAppointment (fallback demo)", () => {
  it("actualiza el estado de una cita existente", async () => {
    const appointment = await createAppointment(makeInput());
    const input = appointmentUpdateSchema.parse({ status: "confirmada" });

    const updated = await updateAppointment(appointment.id, input);

    expect(updated.id).toBe(appointment.id);
    expect(updated.status).toBe("confirmada");
    expect(updated.leadId).toBe(appointment.leadId);
  });

  it("lanza HttpError 404 si la cita no existe", async () => {
    const input = appointmentUpdateSchema.parse({ status: "cancelada" });

    const error = await updateAppointment(randomUUID(), input).catch((err) => err);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(404);
    expect(error.code).toBe("not_found");
  });
});
